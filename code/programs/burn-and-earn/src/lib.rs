use anchor_lang::prelude::*;
use anchor_spl::{
    token_interface::{Mint, TokenAccount, TokenInterface},
    associated_token::AssociatedToken,
};
use libm::log10;
use solana_program::clock::Clock;

// Импортируем программы VC и VG токенов для CPI вызовов

// Импорт ID программ VC и VG токенов
use vc_token::ID as VC_TOKEN_ID;
use vg_token::ID as VG_TOKEN_ID;

declare_id!("BAEpWRJiqZrZkmyzGbcBAvQYpRKbRq5L3D5WwA1dvYf5");

// Константы для формулы эмиссии VG
pub const BASE_COEFFICIENT: f64 = 10.0; // C = 10
pub const BONUS_COEFFICIENT: f64 = 0.2; // B = 0.2
pub const MIN_LP_AMOUNT: f64 = 1.0; // LP_min = 1
pub const DECIMALS: u8 = 9; // Десятичные знаки для токенов

// Константы для уровней NFT Fee Key
pub const BRONZE_LEVEL_THRESHOLD: u64 = 1_000 * 10u64.pow(DECIMALS as u32); // 1,000 LP
pub const SILVER_LEVEL_THRESHOLD: u64 = 10_000 * 10u64.pow(DECIMALS as u32); // 10,000 LP
pub const GOLD_LEVEL_THRESHOLD: u64 = 100_000 * 10u64.pow(DECIMALS as u32); // 100,000 LP
pub const PLATINUM_LEVEL_THRESHOLD: u64 = 1_000_000 * 10u64.pow(DECIMALS as u32); // 1,000,000 LP

#[program]
pub mod burn_and_earn {
    use super::*;

    /// Инициализирует программу Burn and Earn
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let burn_and_earn_state = &mut ctx.accounts.burn_and_earn_state;
        burn_and_earn_state.authority = ctx.accounts.authority.key();
        burn_and_earn_state.vc_mint = ctx.accounts.vc_mint.key();
        burn_and_earn_state.vg_mint = ctx.accounts.vg_mint.key();
        burn_and_earn_state.total_locked_lp = 0;
        burn_and_earn_state.total_vg_minted = 0;
        burn_and_earn_state.total_vc_burned = 0;
        burn_and_earn_state.bump = ctx.bumps.burn_and_earn_state;
        
        msg!("Burn and Earn программа инициализирована");
        Ok(())
    }

    /// Блокирует VC токены, конвертирует их в LP и эмитирует VG токены
    /// в соответствии с формулой VG = LP * C * (1 + B * log10(LP/LP_min))
    pub fn burn_and_lock(
        ctx: Context<BurnAndLock>,
        vc_amount: u64,
    ) -> Result<()> {
        // Проверка параметров
        if vc_amount == 0 {
            return err!(BurnAndEarnError::InvalidAmount);
        }

        msg!("Начало конвертации {} VC токенов", vc_amount);

        // 1. Получаем VC токены от пользователя
        // TODO: Реализовать получение токенов

        // 2. Конвертируем VC в LP токены (временно имитируем)
        // В реальной реализации здесь будет вызов к Raydium API
        let lp_amount = simulate_vc_to_lp_conversion(vc_amount)?;
        msg!("Сконвертировано в {} LP токенов", lp_amount);

        // 3. Блокируем LP токены
        // TODO: Реализовать блокировку в пуле

        // 4. Создаем или обновляем запись о заблокированных LP для пользователя
        let user_record = &mut ctx.accounts.user_lp_record;
        if !user_record.is_initialized {
            user_record.owner = ctx.accounts.user.key();
            user_record.is_initialized = true;
            user_record.locked_lp = 0;
            user_record.vg_minted = 0;
            user_record.vc_burned = 0;
            user_record.nft_level = 0; // 0 = нет NFT
            user_record.last_update = Clock::get()?.unix_timestamp;
        }

        // Обновляем запись для пользователя
        let previous_lp = user_record.locked_lp;
        user_record.locked_lp = user_record.locked_lp.checked_add(lp_amount).ok_or(BurnAndEarnError::MathOverflow)?;
        user_record.vc_burned = user_record.vc_burned.checked_add(vc_amount).ok_or(BurnAndEarnError::MathOverflow)?;
        user_record.last_update = Clock::get()?.unix_timestamp;

        // Обновляем глобальную статистику
        let burn_and_earn_state = &mut ctx.accounts.burn_and_earn_state;
        burn_and_earn_state.total_locked_lp = burn_and_earn_state.total_locked_lp.checked_add(lp_amount).ok_or(BurnAndEarnError::MathOverflow)?;
        burn_and_earn_state.total_vc_burned = burn_and_earn_state.total_vc_burned.checked_add(vc_amount).ok_or(BurnAndEarnError::MathOverflow)?;

        // 5. Рассчитываем количество VG токенов для эмиссии по формуле
        let new_vg_amount = calculate_vg_emission(user_record.locked_lp, previous_lp)?;
        msg!("Эмиссия {} VG токенов", new_vg_amount);

        // 6. Эмитируем VG токены для пользователя через CPI
        // TODO: Реализовать эмиссию VG токенов

        // 7. Обновляем статистику эмиссии
        user_record.vg_minted = user_record.vg_minted.checked_add(new_vg_amount).ok_or(BurnAndEarnError::MathOverflow)?;
        burn_and_earn_state.total_vg_minted = burn_and_earn_state.total_vg_minted.checked_add(new_vg_amount).ok_or(BurnAndEarnError::MathOverflow)?;

        // 8. Проверяем нужно ли создавать/обновлять NFT Fee Key
        let nft_level = determine_nft_level(user_record.locked_lp);
        if nft_level > user_record.nft_level {
            user_record.nft_level = nft_level;
            msg!("Пользователь получает NFT Fee Key уровня {}", nft_level);
            // TODO: Создаем NFT Fee Key соответствующего уровня
        }

        msg!("Успешное завершение операции Burn and Earn");
        Ok(())
    }

    /// Возвращает статистику по заблокированным LP и эмитированным VG токенам
    pub fn get_statistics(ctx: Context<GetStatistics>) -> Result<()> {
        let state = &ctx.accounts.burn_and_earn_state;
        let user_record = &ctx.accounts.user_lp_record;

        msg!("Burn and Earn Statistics:");
        msg!("Total Locked LP: {}", state.total_locked_lp);
        msg!("Total VG Minted: {}", state.total_vg_minted);
        msg!("Total VC Burned: {}", state.total_vc_burned);
        
        if user_record.is_initialized {
            msg!("User Statistics:");
            msg!("User Locked LP: {}", user_record.locked_lp);
            msg!("User VG Minted: {}", user_record.vg_minted);
            msg!("User VC Burned: {}", user_record.vc_burned);
            msg!("User NFT Level: {}", user_record.nft_level);
            msg!("Last Update: {}", user_record.last_update);
        } else {
            msg!("User has no locked LP tokens");
        }

        Ok(())
    }

    /// Создает NFT Fee Key заданного уровня
    pub fn create_nft_fee_key(ctx: Context<CreateNftFeeKey>) -> Result<()> {
        let user_record = &ctx.accounts.user_lp_record;
        
        // Проверяем, что пользователь имеет право на NFT
        if !user_record.is_initialized || user_record.nft_level == 0 {
            return err!(BurnAndEarnError::NoEligibleNft);
        }
        
        // TODO: Реализовать создание NFT Fee Key через Metaplex
        
        msg!("NFT Fee Key уровня {} успешно создан", user_record.nft_level);
        Ok(())
    }
}

/// Симулирует конвертацию VC токенов в LP токены
/// В реальной реализации здесь будет вызов Raydium API
fn simulate_vc_to_lp_conversion(vc_amount: u64) -> Result<u64> {
    // Простая формула для тестирования: LP = VC * 0.5
    // В реальности будет зависеть от ликвидности пула и курса токенов
    let lp_amount = vc_amount
        .checked_mul(50)
        .ok_or(BurnAndEarnError::MathOverflow)?
        .checked_div(100)
        .ok_or(BurnAndEarnError::MathOverflow)?;
    
    Ok(lp_amount)
}

/// Рассчитывает количество VG токенов для эмиссии по формуле:
/// VG = LP * C * (1 + B * log10(LP/LP_min))
fn calculate_vg_emission(new_locked_lp: u64, previous_locked_lp: u64) -> Result<u64> {
    // Преобразуем в f64 для расчетов
    let new_lp_f64 = new_locked_lp as f64 / 10u64.pow(DECIMALS as u32) as f64;
    let prev_lp_f64 = previous_locked_lp as f64 / 10u64.pow(DECIMALS as u32) as f64;

    // Рассчитываем эмиссию для обоих значений LP
    let new_emission = if new_lp_f64 >= MIN_LP_AMOUNT {
        let log_term = log10(new_lp_f64 / MIN_LP_AMOUNT);
        new_lp_f64 * BASE_COEFFICIENT * (1.0 + BONUS_COEFFICIENT * log_term)
    } else {
        new_lp_f64 * BASE_COEFFICIENT // Если LP < LP_min, не применяем бонус
    };

    let prev_emission = if prev_lp_f64 >= MIN_LP_AMOUNT {
        let log_term = log10(prev_lp_f64 / MIN_LP_AMOUNT);
        prev_lp_f64 * BASE_COEFFICIENT * (1.0 + BONUS_COEFFICIENT * log_term)
    } else {
        prev_lp_f64 * BASE_COEFFICIENT
    };

    // Вычисляем разницу - это количество новых VG токенов
    let vg_difference = new_emission - prev_emission;
    
    // Преобразуем обратно в u64 с учетом десятичных знаков
    let vg_amount = (vg_difference * 10u64.pow(DECIMALS as u32) as f64) as u64;
    
    Ok(vg_amount)
}

/// Определяет уровень NFT Fee Key на основе количества заблокированных LP
fn determine_nft_level(locked_lp: u64) -> u8 {
    if locked_lp >= PLATINUM_LEVEL_THRESHOLD {
        4 // Platinum
    } else if locked_lp >= GOLD_LEVEL_THRESHOLD {
        3 // Gold
    } else if locked_lp >= SILVER_LEVEL_THRESHOLD {
        2 // Silver
    } else if locked_lp >= BRONZE_LEVEL_THRESHOLD {
        1 // Bronze
    } else {
        0 // No NFT
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + BurnAndEarnState::SPACE,
        seeds = [b"burn_and_earn_state"],
        bump
    )]
    pub burn_and_earn_state: Account<'info, BurnAndEarnState>,

    /// Минт VC токена
    pub vc_mint: InterfaceAccount<'info, Mint>,
    
    /// Минт VG токена
    pub vg_mint: InterfaceAccount<'info, Mint>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BurnAndLock<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"burn_and_earn_state"],
        bump = burn_and_earn_state.bump
    )]
    pub burn_and_earn_state: Account<'info, BurnAndEarnState>,
    
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserLpRecord::SPACE,
        seeds = [b"user_lp_record", user.key().as_ref()],
        bump
    )]
    pub user_lp_record: Account<'info, UserLpRecord>,
    
    /// Минт VC токена
    pub vc_mint: InterfaceAccount<'info, Mint>,
    
    /// Токен-аккаунт пользователя для VC
    #[account(
        mut,
        token::mint = vc_mint,
        token::authority = user,
    )]
    pub user_vc_token_account: InterfaceAccount<'info, TokenAccount>,
    
    /// Минт VG токена
    pub vg_mint: InterfaceAccount<'info, Mint>,
    
    /// Токен-аккаунт пользователя для VG
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = vg_mint,
        associated_token::authority = user,
    )]
    pub user_vg_token_account: InterfaceAccount<'info, TokenAccount>,
    
    /// Программа VC токена
    /// CHECK: Проверяется через ограничения и CPI
    #[account(address = VC_TOKEN_ID)]
    pub vc_token_program: AccountInfo<'info>,
    
    /// Программа VG токена
    /// CHECK: Проверяется через ограничения и CPI
    #[account(address = VG_TOKEN_ID)]
    pub vg_token_program: AccountInfo<'info>,
    
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    /// CHECK: Для получения времени
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct GetStatistics<'info> {
    pub user: Signer<'info>,
    
    #[account(
        seeds = [b"burn_and_earn_state"],
        bump = burn_and_earn_state.bump
    )]
    pub burn_and_earn_state: Account<'info, BurnAndEarnState>,
    
    #[account(
        seeds = [b"user_lp_record", user.key().as_ref()],
        bump,
        constraint = user_lp_record.owner == user.key() @ BurnAndEarnError::Unauthorized
    )]
    pub user_lp_record: Account<'info, UserLpRecord>,
}

#[derive(Accounts)]
pub struct CreateNftFeeKey<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        seeds = [b"user_lp_record", user.key().as_ref()],
        bump,
        constraint = user_lp_record.owner == user.key() @ BurnAndEarnError::Unauthorized,
        constraint = user_lp_record.nft_level > 0 @ BurnAndEarnError::NoEligibleNft
    )]
    pub user_lp_record: Account<'info, UserLpRecord>,
    
    // TODO: Добавить аккаунты, необходимые для создания NFT через Metaplex
    
    pub system_program: Program<'info, System>,
}

#[account]
pub struct BurnAndEarnState {
    /// Администратор программы
    pub authority: Pubkey,
    /// Минт VC токена
    pub vc_mint: Pubkey,
    /// Минт VG токена
    pub vg_mint: Pubkey,
    /// Общее количество заблокированных LP токенов
    pub total_locked_lp: u64,
    /// Общее количество эмитированных VG токенов
    pub total_vg_minted: u64,
    /// Общее количество сожженных VC токенов
    pub total_vc_burned: u64,
    /// Bump для PDA
    pub bump: u8,
}

impl BurnAndEarnState {
    pub const SPACE: usize = 32 + // authority
                            32 + // vc_mint
                            32 + // vg_mint
                            8 + // total_locked_lp
                            8 + // total_vg_minted
                            8 + // total_vc_burned
                            1 + // bump
                            64; // padding
}

#[account]
pub struct UserLpRecord {
    /// Владелец записи
    pub owner: Pubkey,
    /// Флаг инициализации
    pub is_initialized: bool,
    /// Количество заблокированных LP токенов
    pub locked_lp: u64,
    /// Количество эмитированных VG токенов для пользователя
    pub vg_minted: u64,
    /// Количество сожженных VC токенов пользователем
    pub vc_burned: u64,
    /// Уровень NFT Fee Key (0 = нет NFT, 1 = Bronze, 2 = Silver, 3 = Gold, 4 = Platinum)
    pub nft_level: u8,
    /// Временная метка последнего обновления
    pub last_update: i64,
}

impl UserLpRecord {
    pub const SPACE: usize = 32 + // owner
                            1 + // is_initialized
                            8 + // locked_lp
                            8 + // vg_minted
                            8 + // vc_burned
                            1 + // nft_level
                            8 + // last_update
                            64; // padding
}

#[error_code]
pub enum BurnAndEarnError {
    #[msg("Операция не авторизована")]
    Unauthorized,
    
    #[msg("Недопустимая сумма")]
    InvalidAmount,
    
    #[msg("Математическое переполнение")]
    MathOverflow,
    
    #[msg("Нет права на получение NFT")]
    NoEligibleNft,
    
    #[msg("Ошибка интеграции с Raydium")]
    RaydiumError,
    
    #[msg("Ошибка минтинга VG токенов")]
    VgMintError,
    
    #[msg("Ошибка создания NFT")]
    NftCreationError,
} 