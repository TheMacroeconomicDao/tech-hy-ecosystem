use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use anchor_lang::solana_program::program_option::COption;

declare_id!("11111111111111111111111111111111"); // Будет заменено на реальный программный ID

#[program]
pub mod vc_token {
    use super::*;

    // Инициализация нового VC токена
    pub fn initialize(
        ctx: Context<Initialize>,
        name: String,
        symbol: String,
        decimals: u8,
    ) -> Result<()> {
        let token_info = &mut ctx.accounts.token_info;
        token_info.name = name;
        token_info.symbol = symbol;
        token_info.decimals = decimals;
        token_info.mint = ctx.accounts.mint.key();
        token_info.authority = ctx.accounts.authority.key();
        token_info.total_supply = 0;

        msg!("VC Token успешно инициализирован: {}", token_info.name);
        Ok(())
    }

    // Чеканка новых токенов
    pub fn mint(ctx: Context<MintToken>, amount: u64) -> Result<()> {
        // Проверяем, что отправитель имеет права на чеканку
        require!(
            ctx.accounts.token_info.authority == ctx.accounts.authority.key(),
            VcTokenError::Unauthorized
        );

        // Чеканим токены
        let cpi_accounts = token::MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::mint_to(cpi_ctx, amount)?;

        // Обновляем общую эмиссию
        let token_info = &mut ctx.accounts.token_info;
        token_info.total_supply = token_info.total_supply.checked_add(amount).unwrap();

        msg!("Отчеканено {} VC токенов", amount);
        Ok(())
    }

    // Сжигание токенов
    pub fn burn(ctx: Context<BurnToken>, amount: u64) -> Result<()> {
        // Сжигаем токены
        let cpi_accounts = token::Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::burn(cpi_ctx, amount)?;

        // Обновляем общую эмиссию
        let token_info = &mut ctx.accounts.token_info;
        token_info.total_supply = token_info.total_supply.checked_sub(amount).unwrap();

        msg!("Сожжено {} VC токенов", amount);
        Ok(())
    }
}

// Структура для хранения информации о токене
#[account]
pub struct TokenInfo {
    pub name: String,         // Название токена
    pub symbol: String,       // Символ токена
    pub decimals: u8,         // Количество десятичных знаков
    pub mint: Pubkey,         // Адрес минта
    pub authority: Pubkey,    // Адрес управляющего
    pub total_supply: u64,    // Общая эмиссия
}

// Ошибки программы
#[error_code]
pub enum VcTokenError {
    #[msg("Пользователь не имеет необходимых прав")]
    Unauthorized,
    #[msg("Арифметическая ошибка")]
    ArithmeticError,
}

// Контекст для инициализации токена
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 1 + 32 + 32 + 8 + 200
    )]
    pub token_info: Account<'info, TokenInfo>,
    
    // Минт токена, должен быть предварительно создан
    #[account(
        constraint = mint.mint_authority == COption::Some(authority.key()) @ VcTokenError::Unauthorized
    )]
    pub mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

// Контекст для чеканки токенов
#[derive(Accounts)]
pub struct MintToken<'info> {
    #[account(mut)]
    pub token_info: Account<'info, TokenInfo>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        constraint = token_account.mint == mint.key(),
        constraint = token_account.owner == token_account_owner.key()
    )]
    pub token_account: Account<'info, TokenAccount>,
    
    pub token_account_owner: AccountInfo<'info>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

// Контекст для сжигания токенов
#[derive(Accounts)]
pub struct BurnToken<'info> {
    #[account(mut)]
    pub token_info: Account<'info, TokenInfo>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        constraint = token_account.mint == mint.key(),
        constraint = token_account.owner == authority.key()
    )]
    pub token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
} 