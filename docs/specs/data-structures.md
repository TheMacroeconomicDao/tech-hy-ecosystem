# Структуры данных

В этом документе описаны основные структуры данных, используемые в смарт-контрактах экосистемы VC/VG токенов.

## Токены

### Метаданные токена

```rust
#[account]
pub struct TokenMetadata {
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub mint: Pubkey,
    pub authority: Pubkey,
    pub freeze_authority: Pubkey,
    pub tax_rate: u8, // Только для VG токена
}
```

### Параметры налогообложения

```rust
#[account]
pub struct TaxParameters {
    pub tax_rate: u8,
    pub fee_distribution_percentage: u8,
    pub buyback_percentage: u8,
    pub dao_percentage: u8,
    pub authority: Pubkey,
    pub bump: u8,
}
```

### Статистика распределения налога

```rust
#[account]
pub struct TaxDistributionState {
    pub total_tax_collected: u64,
    pub total_fee_distribution: u64,
    pub total_buyback: u64,
    pub total_dao: u64,
    pub bump: u8,
}
```

## Механизм "Burn and Earn"

### Хранилище с постоянной блокировкой LP токенов

```rust
#[account]
pub struct PermanentLockVault {
    pub authority: Pubkey,
    pub lp_mint: Pubkey,
    pub lp_token_account: Pubkey,
    pub total_locked_amount: u64,
    pub lock_count: u64,
    pub bump: u8,
}
```

### Информация о блокировке LP токенов пользователем

```rust
#[account]
pub struct UserLockInfo {
    pub user: Pubkey,
    pub locked_amount: u64,
    pub lock_timestamp: i64,
    pub vg_received: u64,
    pub fee_key_mint: Pubkey,
    pub bump: u8,
}
```

### Статистика механизма "Burn and Earn"

```rust
#[account]
pub struct BurnAndEarnStats {
    pub total_vc_converted: u64,
    pub total_lp_locked: u64,
    pub total_vg_minted: u64,
    pub total_fee_keys_created: u64,
    pub total_transactions: u64,
    pub bump: u8,
}
```

## NFT Fee Key

### Аккаунт NFT Fee Key

```rust
#[account]
pub struct FeeKeyAccount {
    pub owner: Pubkey,
    pub locked_lp_amount: u64,
    pub lock_timestamp: i64,
    pub fee_share_percentage: f64,
    pub tier: u8,  // 1 - Common, 2 - Rare, 3 - Epic, 4 - Legendary
    pub last_claim_timestamp: i64,
    pub total_claimed_amount: u64,
    pub bump: u8,
}
```

### Хранилище для распределения комиссий

```rust
#[account]
pub struct FeeDistributionVault {
    pub authority: Pubkey,
    pub token_account: Pubkey,
    pub total_fees_collected: u64,
    pub total_fees_distributed: u64,
    pub last_distribution_timestamp: i64,
    pub bump: u8,
}
```

## Стейкинг VC токенов

### Аккаунт стейкинга VC токенов

```rust
#[account]
pub struct VcStakingAccount {
    pub owner: Pubkey,
    pub staked_amount: u64,
    pub stake_timestamp: i64,
    pub unlock_timestamp: i64,
    pub nft_mint: Pubkey,
    pub is_unstaked: bool,
    pub bump: u8,
}
```

### Аккаунт NFT-бустера

```rust
#[account]
pub struct NftBoosterAccount {
    pub owner: Pubkey,
    pub vc_staking_account: Pubkey,
    pub boost_multiplier: f64,
    pub status: u8,  // 1 - Active, 2 - Used, 3 - Expired
    pub vg_staking_account: Option<Pubkey>,
    pub bump: u8,
}
```

### Хранилище для стейкинга VC токенов

```rust
#[account]
pub struct VcStakingVault {
    pub authority: Pubkey,
    pub token_account: Pubkey,
    pub total_staked: u64,
    pub total_stakers: u64,
    pub bump: u8,
}
```

## Стейкинг VG токенов

### Аккаунт стейкинга VG токенов

```rust
#[account]
pub struct VgStakingAccount {
    pub owner: Pubkey,
    pub staked_amount: u64,
    pub stake_timestamp: i64,
    pub unlock_timestamp: i64,
    pub has_nft_booster: bool,
    pub nft_booster: Option<Pubkey>,
    pub is_auto_reinvestment: bool,
    pub reinvest_amount: u64,
    pub withdraw_amount: u64,
    pub is_unstaked: bool,
    pub bump: u8,
}
```

### Статистика стейкинга VG токенов

```rust
#[account]
pub struct VgStakingState {
    pub total_staked: u64,
    pub total_stakers: u64,
    pub total_with_boosters: u64,
    pub total_auto_reinvestments: u64,
    pub bump: u8,
}
```

### Хранилище для стейкинга VG токенов

```rust
#[account]
pub struct VgStakingVault {
    pub authority: Pubkey,
    pub token_account: Pubkey,
    pub total_staked: u64,
    pub bump: u8,
}
```

## Governance и DAO

### Параметры управления через DAO

```rust
#[account]
pub struct GovernanceParameters {
    pub realm: Pubkey,
    pub governance: Pubkey,
    
    // Параметры стейкинга
    pub min_staking_amount: u64,
    pub base_staking_period: u64,
    pub auto_reinvestment_threshold: u64,
    pub reinvestment_percentage: u8,
    
    // Параметры налогообложения
    pub tax_rate: u8,
    pub fee_distribution_percentage: u8,
    pub buyback_percentage: u8,
    pub dao_percentage: u8,
    
    // Параметры механизма "Burn and Earn"
    pub lp_to_vg_conversion_rate: u64,
    pub bonus_coefficient: u64,
    
    pub authority: Pubkey,
    pub bump: u8,
}
```

### Хранилище для казны DAO

```rust
#[account]
pub struct DaoTreasury {
    pub authority: Pubkey,
    pub token_account: Pubkey,
    pub total_received: u64,
    pub total_spent: u64,
    pub bump: u8,
}
```

## Аккаунты для интеграции с внешними сервисами

### Интеграция с Raydium

```rust
#[account]
pub struct RaydiumIntegrationState {
    pub amm_id: Pubkey,
    pub pool_coin_token_account: Pubkey,
    pub pool_pc_token_account: Pubkey,
    pub lp_mint: Pubkey,
    pub authority: Pubkey,
    pub bump: u8,
}
```

### Интеграция с Metaplex

```rust
#[account]
pub struct MetaplexIntegrationState {
    pub metadata_program: Pubkey,
    pub token_metadata_program: Pubkey,
    pub mint_authority: Pubkey,
    pub authority: Pubkey,
    pub bump: u8,
}
```

### Интеграция с Realms

```rust
#[account]
pub struct RealmsIntegrationState {
    pub realm: Pubkey,
    pub governance: Pubkey,
    pub governance_program: Pubkey,
    pub authority: Pubkey,
    pub bump: u8,
}
```

## Контекстные структуры для функций

### Контекст для функции конвертации VC в LP

```rust
#[derive(Accounts)]
pub struct ConvertVcToLpAndLock<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_vc_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_vg_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_lp_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub swap_vc_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub liquidity_vc_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub permanent_lock_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vg_mint: Account<'info, Mint>,
    #[account(
        seeds = [b"vg_mint_authority"],
        bump,
    )]
    pub vg_mint_authority: AccountInfo<'info>,
    #[account(mut)]
    pub burn_and_earn_stats: Account<'info, BurnAndEarnStats>,
    #[account(mut)]
    pub fee_key_mint: Account<'info, Mint>,
    #[account(mut)]
    pub fee_key_account: Account<'info, FeeKeyAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub swap_context: SwapVcToSol<'info>,
    pub liquidity_context: AddLiquidity<'info>,
    pub fee_key_context: CreateFeeKey<'info>,
}
```

### Контекст для функции стейкинга VC токенов

```rust
#[derive(Accounts)]
pub struct StakeVC<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub user_vc_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vc_vault: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = owner,
        space = VcStakingAccount::LEN,
        seeds = [b"vc_staking", owner.key().as_ref()],
        bump,
    )]
    pub vc_staking_account: Account<'info, VcStakingAccount>,
    #[account(
        init,
        payer = owner,
        space = NftBoosterAccount::LEN,
        seeds = [b"nft_booster", owner.key().as_ref()],
        bump,
    )]
    pub nft_booster_account: Account<'info, NftBoosterAccount>,
    #[account(mut)]
    pub nft_mint: Account<'info, Mint>,
    #[account(mut)]
    pub nft_token_account: Account<'info, TokenAccount>,
    #[account(
        seeds = [b"mint_authority"],
        bump,
    )]
    pub mint_authority: AccountInfo<'info>,
    #[account(mut)]
    pub metadata_account: AccountInfo<'info>,
    #[account(mut)]
    pub edition_account: AccountInfo<'info>,
    pub metaplex_program: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
}
```

### Контекст для функции стейкинга VG токенов

```rust
#[derive(Accounts)]
pub struct StakeVG<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub user_vg_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vg_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub tax_vault: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = owner,
        space = VgStakingAccount::LEN,
        seeds = [b"vg_staking", owner.key().as_ref()],
        bump,
    )]
    pub vg_staking_account: Account<'info, VgStakingAccount>,
    #[account(mut)]
    pub vg_staking_state: Account<'info, VgStakingState>,
    #[account(mut)]
    pub nft_booster_account: Option<Account<'info, NftBoosterAccount>>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub apply_booster_context: ApplyNftBooster<'info>,
    pub distribute_tax_context: DistributeTax<'info>,
}
```

## Примеры использования структур

### Пример: Создание аккаунта стейкинга VG токенов

```rust
// Инициализация аккаунта стейкинга VG
vg_staking_account.owner = owner;
vg_staking_account.staked_amount = amount;
vg_staking_account.stake_timestamp = current_timestamp;
vg_staking_account.unlock_timestamp = unlock_timestamp;
vg_staking_account.has_nft_booster = has_nft_booster;
vg_staking_account.nft_booster = nft_booster;
vg_staking_account.is_auto_reinvestment = is_auto_reinvestment;
vg_staking_account.reinvest_amount = reinvest_amount;
vg_staking_account.withdraw_amount = withdraw_amount;
vg_staking_account.is_unstaked = false;
vg_staking_account.bump = *ctx.bumps.get("vg_staking_account").unwrap();
```

### Пример: Обновление статистики распределения налога

```rust
// Обновление статистики распределения налога
let tax_distribution_state = &mut ctx.accounts.tax_distribution_state;
tax_distribution_state.total_tax_collected += tax_amount;
tax_distribution_state.total_fee_distribution += fee_distribution_amount;
tax_distribution_state.total_buyback += buyback_amount;
tax_distribution_state.total_dao += dao_amount;
```

### Пример: Проверка владения NFT-бустером

```rust
// Проверка владельца NFT-бустера
require_keys_eq!(
    nft_booster_account.owner,
    ctx.accounts.owner.key(),
    ErrorCode::NotAuthorized
);

// Проверка статуса NFT-бустера
require!(
    nft_booster_account.status == 1, // Active
    ErrorCode::BoosterNotActive
);

// Проверка, что NFT-бустер еще не используется для стейкинга VG
require!(
    nft_booster_account.vg_staking_account.is_none(),
    ErrorCode::BoosterAlreadyUsed
);
``` 