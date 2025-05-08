# Спецификация интеграции NFT-коллекции "Investor's Hand"

## Обзор интеграции

Данный документ описывает техническую спецификацию интеграции NFT-коллекции "Investor's Hand" с программами стейкинга VC и VG токенов, а также с системой управления DAO. Интеграция обеспечивает единое функционирование всей экосистемы и позволяет реализовать различные преимущества для держателей NFT.

## Схемы взаимодействия программ

### Общая схема интеграции

```
+-------------------+         +----------------------+         +--------------------+
|                   |         |                      |         |                    |
| VC Staking Program| ------> | Investor's Hand NFT  | ------> | VG Staking Program |
|                   |         |      Program         |         |                    |
+-------------------+         +----------------------+         +--------------------+
                                       |
                                       |
                                       v
                              +--------------------+
                              |                    |
                              | Governance Program |
                              |    (DAO)           |
                              +--------------------+
```

### Детальная схема взаимодействия

```
                                  +-- NFT Minting --+
+------------+    Cross-Program   |                |    Metadata     +-----------+
| VC Staking | ----------------> | Investor's Hand | --------------> | Metaplex  |
| Program    |    Invocation     | NFT Program     |    Creation     | Program   |
+------------+                   |                |                  +-----------+
      ^                           +----------------+
      |                                  |
      |              NFT Application     |
      |             +-------------------+|
      |             |                    v
      |       +------------+    Cross-Program    +------------+
      |       |            | <----------------- |            |
      +-------| VC Token   |   Token Transfer   | VG Staking |
              | Program    |                    | Program    |
              +------------+                    +------------+
                                                      |
                                                      |
                        +-------------+               |
                        |             |   Staking     |
                        | Governance  | <-------------+
                        | Program     |   Status
                        +-------------+
```

## Технические детали интеграции с VC Staking Program

### 1. Создание NFT через стейкинг VC токенов

Процесс интеграции VC Staking Program с Investor's Hand NFT Program осуществляется следующим образом:

```rust
// В VC Staking Program
pub fn stake_vc(ctx: Context<StakeVC>) -> Result<()> {
    // ... логика стейкинга VC токенов ...
    
    // Cross-Program инструкция для создания NFT через Investor's Hand программу
    let cpi_accounts = MintNftContext {
        investor_hand_program: ctx.accounts.investor_hand_program.to_account_info(),
        nft_account: ctx.accounts.nft_account.to_account_info(),
        owner: ctx.accounts.owner.to_account_info(),
        vc_staking_account: vc_staking_account.to_account_info(),
        metaplex_program: ctx.accounts.metaplex_program.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
        // ... другие аккаунты
    };
    
    let cpi_ctx = CpiContext::new(
        ctx.accounts.investor_hand_program.to_account_info(),
        cpi_accounts,
    );
    
    // Вызов инструкции mint_nft в программе Investor's Hand
    investors_hand::cpi::mint_nft(cpi_ctx, 2)? // 2 - уровень Wooden Hand
    
    Ok(())
}

// Структура аккаунтов для Cross-Program вызова
#[derive(Accounts)]
pub struct StakeVC<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        init,
        payer = owner,
        seeds = [b"vc_staking", owner.key().as_ref()],
        bump,
        space = 8 + VcStakingAccount::LEN
    )]
    pub vc_staking_account: Account<'info, VcStakingAccount>,
    
    // ... другие аккаунты для стейкинга VC ...
    
    pub investor_hand_program: Program<'info, InvestorsHand>,
    pub metaplex_program: Program<'info, Metaplex>,
    // ... другие аккаунты для создания NFT ...
}
```

### 2. Обработка создания NFT в Investor's Hand NFT Program

```rust
// В Investor's Hand NFT Program
pub fn mint_nft(ctx: Context<MintNft>, level: u8) -> Result<()> {
    // Проверка авторизации вызова
    require!(
        *ctx.program_id == vc_staking_program::ID || ctx.accounts.authority.key() == ctx.accounts.authority.key(),
        ErrorCode::NotAuthorized
    );
    
    // Инициализация аккаунта NFT
    let nft_account = &mut ctx.accounts.nft_account;
    nft_account.owner = ctx.accounts.owner.key();
    nft_account.mint = ctx.accounts.nft_mint.key();
    nft_account.level = level;
    
    // Определение boost_multiplier на основе уровня
    let boost_multiplier = match level {
        1 => 110, // Paper (1.1x)
        2 => 125, // Wooden (1.25x)
        3 => 150, // Steel (1.5x)
        4 => 175, // Titanium (1.75x)
        5 => 200, // Diamond (2.0x)
        6 => 0,   // Angel (безлимитный период)
        _ => return Err(ErrorCode::InvalidNftLevel.into())
    };
    
    nft_account.boost_multiplier = boost_multiplier;
    nft_account.is_used_for_staking = false;
    nft_account.vg_staking_account = None;
    nft_account.created_by_authority = *ctx.program_id != vc_staking_program::ID;
    nft_account.bump = *ctx.bumps.get("nft_account").unwrap();
    
    // ... создание NFT через Metaplex ...
    
    Ok(())
}
```

## Технические детали интеграции с VG Staking Program

### 1. Применение NFT-бустера при стейкинге VG

```rust
// В VG Staking Program
pub fn stake_vg(
    ctx: Context<StakeVG>,
    amount: u64,
    nft_booster: Option<Pubkey>,
) -> Result<()> {
    // ... логика стейкинга VG токенов ...
    
    // Применение NFT-бустера, если он указан
    let mut has_nft_booster = false;
    let mut nft_boost_multiplier: u8 = 0;
    let mut nft_tier: u8 = 0;
    
    if let Some(booster_key) = nft_booster {
        if let Some(nft_account) = &ctx.accounts.nft_account {
            // Проверка владельца NFT
            require_keys_eq!(
                nft_account.owner,
                owner,
                ErrorCode::NotAuthorized
            );
            
            // Проверка, что NFT не используется
            require!(
                !nft_account.is_used_for_staking,
                ErrorCode::NftAlreadyInUse
            );
            
            // Применение NFT-бустера через CPI
            let cpi_accounts = ApplyNftToVgStakingContext {
                investor_hand_program: ctx.accounts.investor_hand_program.to_account_info(),
                nft_account: nft_account.to_account_info(),
                owner: ctx.accounts.owner.to_account_info(),
                vg_staking_account: ctx.accounts.vg_staking_account.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            };
            
            let cpi_ctx = CpiContext::new(
                ctx.accounts.investor_hand_program.to_account_info(),
                cpi_accounts,
            );
            
            investors_hand::cpi::apply_nft_to_vg_staking(cpi_ctx)?;
            
            has_nft_booster = true;
            nft_boost_multiplier = nft_account.boost_multiplier;
            nft_tier = nft_account.level;
        }
    }
    
    // Проверка требований для высших уровней DAO
    if amount > 25_000 * 10u64.pow(9) && amount <= 50_000 * 10u64.pow(9) {
        // Уровень Investor требует Steel Hand+ (уровень 3+)
        require!(
            has_nft_booster && nft_tier >= 3,
            ErrorCode::InsufficientNftTier
        );
    } else if amount > 50_000 * 10u64.pow(9) && amount <= 70_000 * 10u64.pow(9) {
        // Уровень Launchpad Master требует Titanium Hand+ (уровень 4+)
        require!(
            has_nft_booster && nft_tier >= 4,
            ErrorCode::InsufficientNftTier
        );
    } else if amount > 70_000 * 10u64.pow(9) {
        // Уровень Partner требует Diamond Hand (уровень 5)
        require!(
            has_nft_booster && nft_tier == 5,
            ErrorCode::InsufficientNftTier
        );
    }
    
    // Определение периода стейкинга с учетом NFT-бустера
    let staking_period = get_staking_period_by_tier(
        amount, 
        if has_nft_booster { Some(nft_tier) } else { None },
        if has_nft_booster { Some(nft_boost_multiplier) } else { None }
    );
    
    // ... продолжение логики стейкинга VG ...
    
    Ok(())
}
```

### 2. Обработка применения NFT в Investor's Hand NFT Program

```rust
// В Investor's Hand NFT Program
pub fn apply_nft_to_vg_staking(
    ctx: Context<ApplyNftToVgStaking>,
    vg_staking_account: Pubkey,
) -> Result<()> {
    // Проверка владельца NFT
    require_keys_eq!(
        ctx.accounts.nft_account.owner,
        ctx.accounts.owner.key(),
        ErrorCode::NotAuthorized
    );
    
    // Проверка статуса NFT
    require!(
        !ctx.accounts.nft_account.is_used_for_staking,
        ErrorCode::NftAlreadyInUse
    );
    
    // Обновление статуса NFT
    let nft_account = &mut ctx.accounts.nft_account;
    nft_account.is_used_for_staking = true;
    nft_account.vg_staking_account = Some(vg_staking_account);
    
    Ok(())
}
```

### 3. Деактивация NFT-бустера после завершения стейкинга VG

```rust
// В VG Staking Program
pub fn unstake_vg(ctx: Context<UnstakeVG>) -> Result<()> {
    // ... логика анстейкинга VG токенов ...
    
    // Деактивация NFT-бустера, если он был использован
    if vg_staking_account.has_nft_booster {
        if let Some(nft_booster_key) = vg_staking_account.nft_booster {
            let nft_account = &ctx.accounts.nft_account.ok_or(ErrorCode::NftAccountNotProvided)?;
            
            // Деактивация NFT-бустера через CPI
            let cpi_accounts = DeactivateNftContext {
                investor_hand_program: ctx.accounts.investor_hand_program.to_account_info(),
                nft_account: nft_account.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
                owner: ctx.accounts.owner.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            };
            
            let seeds = &[
                b"vg_staking",
                ctx.accounts.owner.key.as_ref(),
                &[vg_staking_account.bump],
            ];
            let signer = &[&seeds[..]];
            
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.investor_hand_program.to_account_info(),
                cpi_accounts,
                signer,
            );
            
            investors_hand::cpi::deactivate_nft(cpi_ctx)?;
        }
    }
    
    // ... продолжение логики анстейкинга VG ...
    
    Ok(())
}
```

### 4. Обработка деактивации NFT в Investor's Hand NFT Program

```rust
// В Investor's Hand NFT Program
pub fn deactivate_nft(ctx: Context<DeactivateNft>) -> Result<()> {
    // Проверка владельца или программы стейкинга VG
    require!(
        ctx.accounts.nft_account.owner == ctx.accounts.owner.key() || 
        *ctx.program_id == vg_staking_program::ID,
        ErrorCode::NotAuthorized
    );
    
    // Проверка, что NFT используется
    require!(
        ctx.accounts.nft_account.is_used_for_staking,
        ErrorCode::NftNotInUse
    );
    
    // Обновление статуса NFT
    let nft_account = &mut ctx.accounts.nft_account;
    nft_account.is_used_for_staking = false;
    nft_account.vg_staking_account = None;
    
    Ok(())
}
```

## Технические детали интеграции с DAO

### 1. Проверка NFT при определении уровня DAO

```rust
// В Governance Program
pub fn register_dao_member(
    ctx: Context<RegisterDaoMember>,
    nft_account: Option<Pubkey>,
) -> Result<()> {
    // Получение информации о стейкинге VG
    let vg_staking_account = &ctx.accounts.vg_staking_account;
    let staked_amount = vg_staking_account.staked_amount;
    
    // Определение базового уровня DAO на основе количества VG
    let mut dao_tier = if staked_amount <= 100 * 10u64.pow(9) {
        1 // Starter
    } else if staked_amount <= 500 * 10u64.pow(9) {
        2 // Community Member
    } else if staked_amount <= 1500 * 10u64.pow(9) {
        3 // Contributor
    } else if staked_amount <= 4000 * 10u64.pow(9) {
        4 // Founder
    } else if staked_amount <= 25000 * 10u64.pow(9) {
        5 // Expert
    } else {
        0 // Требуется проверка NFT
    };
    
    // Проверка NFT для высших уровней DAO
    if dao_tier == 0 {
        if let Some(nft_key) = nft_account {
            let nft_account = &ctx.accounts.nft_account.ok_or(ErrorCode::NftAccountNotProvided)?;
            
            // Проверка владельца NFT
            require_keys_eq!(
                nft_account.owner,
                ctx.accounts.owner.key(),
                ErrorCode::NotAuthorized
            );
            
            if nft_account.level == 6 {
                // Angel NFT - специальный уровень
                dao_tier = 9;
            } else if nft_account.level == 5 && staked_amount > 70000 * 10u64.pow(9) {
                // Diamond Hand + >70k VG = Partner
                dao_tier = 8;
            } else if nft_account.level >= 4 && staked_amount > 50000 * 10u64.pow(9) && staked_amount <= 70000 * 10u64.pow(9) {
                // Titanium Hand+ + 50k-70k VG = Launchpad Master
                dao_tier = 7;
            } else if nft_account.level >= 3 && staked_amount > 25000 * 10u64.pow(9) && staked_amount <= 50000 * 10u64.pow(9) {
                // Steel Hand+ + 25k-50k VG = Investor
                dao_tier = 6;
            } else {
                return Err(ErrorCode::InsufficientNftTier.into());
            }
        } else {
            return Err(ErrorCode::NftRequiredForHighTier.into());
        }
    }
    
    // Создание/обновление аккаунта члена DAO
    let dao_member = &mut ctx.accounts.dao_member;
    dao_member.owner = ctx.accounts.owner.key();
    dao_member.vg_staking_account = ctx.accounts.vg_staking_account.key();
    dao_member.tier = dao_tier;
    dao_member.nft_account = nft_account;
    dao_member.joined_at = Clock::get()?.unix_timestamp;
    
    Ok(())
}
```

## Алгоритм расчета периода стейкинга с учетом NFT-бустера

```rust
pub fn get_staking_period_by_tier(
    amount: u64, 
    nft_tier: Option<u8>, 
    nft_boost_multiplier: Option<u8>
) -> u64 {
    // Базовый период стейкинга на основании суммы VG (тира DAO)
    let base_period = if amount <= 100 * 10u64.pow(9) {
        7 // Starter
    } else if amount <= 500 * 10u64.pow(9) {
        14 // Community Member
    } else if amount <= 1500 * 10u64.pow(9) {
        30 // Contributor
    } else if amount <= 4000 * 10u64.pow(9) {
        60 // Founder
    } else if amount <= 25000 * 10u64.pow(9) {
        90 // Expert
    } else {
        365 // Investor, Launchpad Master, Partner
    };
    
    // Проверка на Angel NFT
    if let Some(tier) = nft_tier {
        if tier == 6 { // Angel Investor
            return u64::MAX; // Безлимитный период
        }
    }
    
    // Применение множителя NFT-бустера
    if let Some(multiplier) = nft_boost_multiplier {
        let boost_factor = multiplier as f64 / 100.0;
        let reduced_period = (base_period as f64 * (1.0 - (boost_factor - 1.0))).round() as u64;
        
        // Минимальный период - 1 день
        if reduced_period < 1 {
            return 1;
        }
        
        return reduced_period;
    }
    
    base_period
}
```

## Обработка ошибок и граничных случаев

### Коды ошибок для Investor's Hand NFT Program

```rust
#[error_code]
pub enum ErrorCode {
    #[msg("Операция не авторизована")]
    NotAuthorized,
    
    #[msg("Невалидный уровень NFT")]
    InvalidNftLevel,
    
    #[msg("NFT уже используется для стейкинга")]
    NftAlreadyInUse,
    
    #[msg("NFT не используется для стейкинга")]
    NftNotInUse,
    
    #[msg("Аккаунт NFT не предоставлен")]
    NftAccountNotProvided,
    
    #[msg("Аккаунт стейкинга VG не найден")]
    VgStakingAccountNotFound,
    
    #[msg("Недостаточный уровень NFT для требуемого уровня DAO")]
    InsufficientNftTier,
    
    #[msg("Для высшего уровня DAO требуется NFT")]
    NftRequiredForHighTier,
}
```

### Защитные проверки при создании NFT

```rust
// Проверка, что вызов произошел от VC Staking Program или авторизованной администрации
require!(
    *ctx.program_id == vc_staking_program::ID || ctx.accounts.authority.key() == ADMIN_KEY,
    ErrorCode::NotAuthorized
);

// Ограничение на создание высших уровней NFT
if level > 2 && ctx.accounts.authority.key() != ADMIN_KEY {
    return Err(ErrorCode::NotAuthorized.into());
}
```

### Защитные проверки при применении NFT

```rust
// Проверка соответствия уровня NFT для высших уровней DAO
if staked_amount > 25_000 * 10u64.pow(9) {
    if staked_amount <= 50_000 * 10u64.pow(9) && nft_tier < 3 {
        return Err(ErrorCode::InsufficientNftTier.into());
    } else if staked_amount <= 70_000 * 10u64.pow(9) && nft_tier < 4 {
        return Err(ErrorCode::InsufficientNftTier.into());
    } else if staked_amount > 70_000 * 10u64.pow(9) && nft_tier != 5 {
        return Err(ErrorCode::InsufficientNftTier.into());
    }
}
```

## Заключение

Интеграция NFT-коллекции "Investor's Hand" с другими компонентами экосистемы VC/VG обеспечивает:

1. **Бесшовный пользовательский опыт** - получение NFT при стейкинге VC и автоматическое применение бонусов при стейкинге VG
2. **Улучшенную безопасность** - строгие проверки на всех этапах интеграции защищают от несанкционированного использования
3. **Гибкую систему стимулов** - различные уровни NFT обеспечивают разные преимущества и доступ к разным уровням DAO
4. **Техническую надежность** - чётко определенные интерфейсы между программами и строгий контроль авторизации

Данная интеграция создаёт единую экосистему, в которой действия пользователей в одной части системы влияют на их возможности в других частях, что способствует долгосрочной вовлеченности и устойчивости проекта. 