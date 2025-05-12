use anchor_lang::prelude::*;
use anchor_spl::{
    token_interface::{self, Mint, MintTo, TokenAccount, TokenInterface, Transfer, TransferChecked},
    associated_token::AssociatedToken,
    metadata::{self, mpl_token_metadata, Metadata, MetadataAccount},
};
use anchor_spl::token_interface::spl_token_2022::instruction::AuthorityType;

declare_id!("VGnHJHKr2NwxSdQQoYrJY9TBZ9YHS5cCwBPEr68mEPG");

// Константы токена
pub const VG_TOKEN_MINT_SEED: &[u8] = b"vg_token_mint";
pub const TOKEN_DECIMALS: u8 = 9;
pub const TOTAL_SUPPLY: u64 = 1_000_000_000 * 10u64.pow(TOKEN_DECIMALS as u32); // 1 миллиард токенов с 9 десятичными знаками
pub const TAX_RATE_BPS: u16 = 1000; // 10% налог (basis points: 10% = 1000 из 10000)
pub const DAO_SHARE_BPS: u16 = 500; // 50% от налога идет в казну DAO
pub const NFT_HOLDERS_SHARE_BPS: u16 = 500; // 50% от налога идет держателям NFT Fee Key

#[program]
pub mod vg_token {
    use super::*;

    /// Инициализирует новый VG токен с заданными параметрами
    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        // Просто возвращаем успешное завершение, так как инициализация происходит через ограничения Anchor
        Ok(())
    }
    
    /// Минтинг токенов - может вызывать только авторизованная программа (Burn and Earn)
    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        // Проверка, что вызывает Burn and Earn программа
        // В реальном коде здесь будет проверка на правильный PDA от Burn and Earn
        // Пока заглушка для разработки
        msg!("Минтинг {} VG токенов...", amount);

        // Создание минта и выпуск токенов
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx.accounts.mint.to_account_info(),
        };
        
        let seeds = &[
            VG_TOKEN_MINT_SEED, 
            &[ctx.bumps.mint]
        ];
        let signer_seeds = &[&seeds[..]];
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        
        token_interface::mint_to(cpi_context, amount)?;
        
        msg!("VG токены успешно выпущены");
        
        Ok(())
    }
    
    /// Передача токенов с налогом 10%
    pub fn transfer(ctx: Context<TransferTokens>, amount: u64) -> Result<()> {
        // Проверка на переполнение и минимальные значения
        if amount == 0 {
            return err!(VgTokenError::InvalidAmount);
        }

        // Используем SafeMath для защиты от переполнения
        // Рассчитываем налог 10% от суммы транзакции
        let (tax_amount, tax_calculation_ok) = amount.overflowing_mul(TAX_RATE_BPS as u64);
        if tax_calculation_ok {
            return err!(VgTokenError::MathOverflow);
        }

        let (tax_amount, tax_division_ok) = tax_amount.overflowing_div(10000);
        if tax_division_ok {
            return err!(VgTokenError::MathOverflow);
        }

        // Проверяем, что у нас остаётся сумма для перевода
        let (transfer_amount, transfer_sub_ok) = amount.overflowing_sub(tax_amount);
        if transfer_sub_ok {
            return err!(VgTokenError::MathOverflow);
        }

        // Проверяем, что tax_amount > 0 и transfer_amount > 0
        if tax_amount == 0 || transfer_amount == 0 {
            return err!(VgTokenError::InvalidTaxCalculation);
        }
        
        // Рассчитываем доли налога для DAO и держателей NFT
        // Оптимизация: избегаем деления, которое может привести к потере точности
        // DAO: 50% от налога, NFT: 50% от налога
        let dao_tax_amount = tax_amount / 2;
        let nft_holders_tax_amount = tax_amount - dao_tax_amount;
        
        msg!(
            "Перевод {} VG: {} получателю, налог: {} (DAO: {}, NFT holders: {})",
            amount,
            transfer_amount,
            tax_amount,
            dao_tax_amount,
            nft_holders_tax_amount
        );

        // Оптимизация: кэшируем AccountInfo для повторного использования
        let token_program_info = ctx.accounts.token_program.to_account_info();
        let sender_token_account_info = ctx.accounts.sender_token_account.to_account_info();
        let sender_info = ctx.accounts.sender.to_account_info();

        // 1. Переводим основную сумму (за вычетом налога) получателю
        token_interface::transfer(
            CpiContext::new(
                token_program_info.clone(),
                Transfer {
                    from: sender_token_account_info.clone(),
                    to: ctx.accounts.recipient_token_account.to_account_info(),
                    authority: sender_info.clone(),
                },
            ),
            transfer_amount,
        )?;
        
        // 2. Переводим налог в казну DAO
        if dao_tax_amount > 0 {
            token_interface::transfer(
                CpiContext::new(
                    token_program_info.clone(),
                    Transfer {
                        from: sender_token_account_info.clone(),
                        to: ctx.accounts.dao_treasury_token_account.to_account_info(),
                        authority: sender_info.clone(),
                    },
                ),
                dao_tax_amount,
            )?;
        }
        
        // 3. Переводим налог на аккаунт NFT Fee Key (в будущем будет распределение)
        if nft_holders_tax_amount > 0 {
            token_interface::transfer(
                CpiContext::new(
                    token_program_info,
                    Transfer {
                        from: sender_token_account_info,
                        to: ctx.accounts.fee_collector_token_account.to_account_info(),
                        authority: sender_info,
                    },
                ),
                nft_holders_tax_amount,
            )?;
        }
        
        msg!("Перевод VG токенов с налогом успешно выполнен");
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

        // Создаем PDA сид для метаданных
        let seeds = &[
            VG_TOKEN_MINT_SEED, 
            &[ctx.bumps.mint]
        ];
        let _signer_seeds = &[&seeds[..]];  // Префикс _ для неиспользуемых переменных

        // Получаем данные для инструкции create_metadata_accounts_v3
        let metadata_infos = vec![
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.mint.to_account_info(), // mint authority
            ctx.accounts.payer.to_account_info(), // update authority
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ];

        // Создание структуры с данными для метаданных
        let data = mpl_token_metadata::types::DataV2 {
            name,
            symbol,
            uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        };

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
            is_mutable: true, // Для VG токена разрешаем изменение метаданных
            collection_details: None,
        });

        // Вызываем инструкцию создания метаданных
        let account_infos = metadata_infos.as_slice();
        anchor_lang::solana_program::program::invoke_signed(
            &ix,
            account_infos,
            &[&seeds[..]],
        )?;

        msg!("Метаданные токена успешно установлены");
        Ok(())
    }
    
    /// Установка авторитета замораживания для токена (только для мультисиг DAO)
    pub fn set_freeze_authority(ctx: Context<SetFreezeAuthority>) -> Result<()> {
        // В будущем здесь будет проверка на мультисиг DAO
        // Пока заглушка для разработки
        msg!("Установка freeze authority для VG токена...");
        
        let seeds = &[
            VG_TOKEN_MINT_SEED, 
            &[ctx.bumps.mint]
        ];
        let signer_seeds = &[&seeds[..]];
        
        // Реализуем функциональность через CPI
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = token_interface::SetAuthority {
            account_or_mint: ctx.accounts.mint.to_account_info(),
            current_authority: ctx.accounts.mint.to_account_info(),
        };
        
        let cpi_context = CpiContext::new_with_signer(
            cpi_program,
            cpi_accounts,
            signer_seeds
        );
        
        token_interface::set_authority(
            cpi_context,
            AuthorityType::FreezeAccount,
            Some(ctx.accounts.dao_authority.key()),
        )?;
        
        msg!("Freeze authority успешно установлен");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(
        init,
        payer = payer,
        mint::decimals = TOKEN_DECIMALS,
        mint::authority = mint,
        mint::freeze_authority = mint, // Временно устанавливаем freeze authority на самого себя
        seeds = [VG_TOKEN_MINT_SEED],
        bump
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(mut)]
    pub recipient: SystemAccount<'info>,
    
    #[account(
        mut,
        seeds = [VG_TOKEN_MINT_SEED],
        bump
    )]
    pub mint: InterfaceAccount<'info, Mint>,
    
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = recipient,
    )]
    pub recipient_token_account: InterfaceAccount<'info, TokenAccount>,
    
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferTokens<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,
    
    /// Аккаунт получателя перевода 
    #[account(mut)]
    pub recipient: SystemAccount<'info>,
    
    /// Аккаунт казны DAO для получения налога
    #[account(mut)]
    pub dao_treasury: SystemAccount<'info>,
    
    /// Аккаунт коллектора комиссий для держателей NFT Fee Key
    #[account(mut)]
    pub fee_collector: SystemAccount<'info>,
    
    #[account(
        mut,
        seeds = [VG_TOKEN_MINT_SEED],
        bump
    )]
    pub mint: InterfaceAccount<'info, Mint>,
    
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = sender,
    )]
    pub sender_token_account: InterfaceAccount<'info, TokenAccount>,
    
    #[account(
        init_if_needed,
        payer = sender,
        associated_token::mint = mint,
        associated_token::authority = recipient,
    )]
    pub recipient_token_account: InterfaceAccount<'info, TokenAccount>,
    
    #[account(
        init_if_needed,
        payer = sender,
        associated_token::mint = mint,
        associated_token::authority = dao_treasury,
    )]
    pub dao_treasury_token_account: InterfaceAccount<'info, TokenAccount>,
    
    #[account(
        init_if_needed,
        payer = sender,
        associated_token::mint = mint,
        associated_token::authority = fee_collector,
    )]
    pub fee_collector_token_account: InterfaceAccount<'info, TokenAccount>,
    
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
        seeds = [VG_TOKEN_MINT_SEED],
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

#[derive(Accounts)]
pub struct SetFreezeAuthority<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(
        mut,
        seeds = [VG_TOKEN_MINT_SEED],
        bump,
    )]
    pub mint: InterfaceAccount<'info, Mint>,
    
    /// CHECK: Адрес мультисиг DAO, который получит права на замораживание
    pub dao_authority: UncheckedAccount<'info>,
    
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

// Ошибки программы
#[error_code]
pub enum VgTokenError {
    #[msg("Операция не авторизована")]
    Unauthorized,
    
    #[msg("Ошибка при создании или доступе к минту токена")]
    MintError,
    
    #[msg("Недостаточный баланс для выполнения перевода")]
    InsufficientBalance,
    
    #[msg("Неверно рассчитан налог")]
    InvalidTaxCalculation,

    #[msg("Сумма перевода не может быть нулевой")]
    InvalidAmount,

    #[msg("Произошло переполнение при математических операциях")]
    MathOverflow,
} 