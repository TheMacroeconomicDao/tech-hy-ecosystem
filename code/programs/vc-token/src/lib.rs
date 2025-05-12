use anchor_lang::prelude::*;
use anchor_spl::{
    token_interface::{self, Mint, MintTo, TokenAccount, TokenInterface},
    associated_token::AssociatedToken,
    metadata::{mpl_token_metadata},
};

declare_id!("VCzfGwp5qVL8pmta1GHqGrSQqzMa5qsY4M1jbjsdaYJ");

// Константы токена
pub const VC_TOKEN_MINT_SEED: &[u8] = b"vc_token_mint";
pub const TOKEN_DECIMALS: u8 = 9;
pub const TOTAL_SUPPLY: u64 = 5_000_000_000 * 10u64.pow(TOKEN_DECIMALS as u32); // 5 миллиардов токенов с 9 десятичными знаками

#[program]
pub mod vc_token {
    use super::*;

    /// Инициализирует новый VC токен с заданными параметрами
    /// Выпускает все токены в размере 5 миллиардов и передает их на кошелек казны DAO
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Инициализация VC токена...");

        // Создание минта и выпуск всех токенов - оптимизированная версия
        let seeds = &[
            VC_TOKEN_MINT_SEED, 
            &[ctx.bumps.mint]
        ];
        let _signer_seeds = &[&seeds[..]];  // Префикс _ для неиспользуемых переменных
        
        // Оптимизация: создаем CPI контекст только один раз
        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.treasury_token_account.to_account_info(),
                authority: ctx.accounts.mint.to_account_info(),
            },
            _signer_seeds
        );
        
        // Выполняем минтинг всех токенов
        token_interface::mint_to(cpi_context, TOTAL_SUPPLY)?;
        
        msg!("VC токен успешно инициализирован с полной эмиссией {} токенов", TOTAL_SUPPLY);
        
        Ok(())
    }
    
    /// Установка метаданных токена с использованием Metaplex
    pub fn set_metadata(
        ctx: Context<SetMetadata>, 
        name: String, 
        symbol: String, 
        uri: String
    ) -> Result<()> {
        msg!("Установка метаданных токена: {}, {}, {}", name, symbol, uri);

        // Оптимизированная версия установки метаданных
        let seeds = &[
            VC_TOKEN_MINT_SEED, 
            &[ctx.bumps.mint]
        ];
        let _signer_seeds = &[&seeds[..]];  // Префикс _ для неиспользуемых переменных

        // Оптимизация: минимизируем создание векторов в горячем пути
        let metadata = ctx.accounts.metadata.to_account_info();
        let mint = ctx.accounts.mint.to_account_info();
        let payer = ctx.accounts.payer.to_account_info();
        let system_program = ctx.accounts.system_program.to_account_info();
        let rent = ctx.accounts.rent.to_account_info();

        // Создание структуры с данными для метаданных (нет оптимизации здесь, т.к. это происходит один раз)
        let data = mpl_token_metadata::types::DataV2 {
            name,
            symbol,
            uri,
            seller_fee_basis_points: 0, // 0% комиссии
            creators: None,
            collection: None,
            uses: None,
        };

        // Создаем инструкцию
        let ix = mpl_token_metadata::instructions::CreateMetadataAccountV3 {
            metadata: ctx.accounts.metadata.key(),
            mint: ctx.accounts.mint.key(),
            mint_authority: ctx.accounts.mint.key(),
            payer: ctx.accounts.payer.key(),
            update_authority: (ctx.accounts.payer.key(), true),
            system_program: ctx.accounts.system_program.key(),
            rent: Some(ctx.accounts.rent.key()),
        }
        .instruction(mpl_token_metadata::instructions::CreateMetadataAccountV3InstructionArgs {
            data,
            is_mutable: false, // Неизменяемые метаданные
            collection_details: None,
        });

        // Вызываем инструкцию создания метаданных с оптимизированным списком аккаунтов
        let account_infos = &[
            metadata,
            mint.clone(),
            payer.clone(),
            mint, // mint authority
            payer, // update authority
            system_program,
            rent,
        ];

        anchor_lang::solana_program::program::invoke_signed(
            &ix,
            account_infos,
            &[&seeds[..]],
        )?;

        msg!("Метаданные токена успешно установлены");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(mut)]
    /// Адрес казначейства DAO, которое получит все выпущенные токены
    pub treasury: SystemAccount<'info>,

    #[account(
        init,
        payer = payer,
        mint::decimals = TOKEN_DECIMALS,
        mint::authority = mint,
        // Важно: отсутствие freeze_authority не позволит замораживать кошельки
        seeds = [VC_TOKEN_MINT_SEED],
        bump
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = treasury,
    )]
    pub treasury_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetMetadata<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [VC_TOKEN_MINT_SEED],
        bump,
    )]
    pub mint: InterfaceAccount<'info, Mint>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(
        mut,
        seeds = [
            b"metadata",
            metadata_program.key().as_ref(),
            mint.key().as_ref(),
        ],
        bump,
        seeds::program = metadata_program.key()
    )]
    /// CHECK: Валидируется программой Metaplex
    pub metadata: UncheckedAccount<'info>,
    
    /// CHECK: Это известная программа Metaplex Token Metadata
    #[account(address = mpl_token_metadata::ID)]
    pub metadata_program: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
    
    /// CHECK: Это известный sysvarcall
    #[account(address = anchor_lang::solana_program::sysvar::rent::ID)]
    pub rent: UncheckedAccount<'info>,
}

// Ошибки программы
#[error_code]
pub enum VcTokenError {
    #[msg("Операция не авторизована")]
    Unauthorized,
    #[msg("Ошибка при создании или доступе к минту токена")]
    MintError,
} 