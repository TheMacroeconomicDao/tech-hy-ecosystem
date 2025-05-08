# Стейкинг VG токенов

## Обзор стейкинга VG токенов

Стейкинг VG токенов - это ключевой механизм участия в управлении экосистемой TECH HY, обеспечивающий доступ к различным уровням DAO. Период и условия стейкинга зависят от количества VG токенов и наличия NFT-бустеров из коллекции "Investor's Hand".

## Уровни стейкинга и DAO (тиры)

Экосистема TECH HY предусматривает прогрессивную, многоуровневую структуру участия в DAO, основанную на количестве застейканных VG токенов и длительности стейкинга:

| Уровень         | Требования                       | Период стейкинга |
|-----------------|----------------------------------|------------------|
| Starter         | до 100 VG                        | 7 дней           |
| Community Member| 100-500 VG                       | 14 дней          |
| Contributor     | 500-1500 VG                      | 30 дней          |
| Founder         | 1500-4000 VG                     | 60 дней          |
| Expert          | 4000-25000 VG                    | 90 дней          |
| Angel           | обладатель Angel Investor NFT    | Безлимитный      |
| Investor        | 25000-50000 VG + Steel Hand NFT  | 365 дней         |
| Launchpad Master| 50000-70000 VG + Titanium Hand   | 365 дней         |
| Partner         | более 70000 VG + Diamond Hand    | 365 дней         |

> Подробная информация о NFT-бустерах содержится в документах [NFT-коллекция "Investor's Hand"](./investors-hand-nft.md) и [Стейкинг VC токенов и NFT-бустеры](./04-vc-staking.md).

### Особенности стейкинга различных уровней

#### Starter и Community Member
- Автоматический анстейкинг после завершения периода
- Недоступен ранний анстейкинг
- Базовые права в экосистеме

#### Contributor
- Автоматический анстейкинг после 30 дней
- Возможность увеличивать размер стейка во время стейкинга
- Дополнительные бонусы: право на аирдропы и вознаграждения за активность
- Требования: верифицированный аккаунт X.com, подписка на @TECHHYVC, выполнение задач

#### Founder
- Период стейкинга: 60 дней
- Доступен ранний анстейкинг
- Право номинировать проекты для рассмотрения Инвестиционным комитетом

#### Expert
- Период стейкинга: 90 дней
- Ранний анстейкинг и повышение стейка
- Возможность минтить NFT для TECH HY Expert Marketplace

#### Высшие уровни (Investor, Launchpad Master, Partner)
- Длительный период стейкинга (365 дней)
- Необходимость владения соответствующими NFT из коллекции "Investor's Hand"
- Автокомпаундинг (еженедельный)
- Доступ к особым привилегиям и доходам экосистемы

#### Angel Investor
- Эксклюзивный статус с безлимитным периодом стейкинга
- Ежедневный автокомпаундинг
- Доступны все привилегии высших уровней

## Влияние NFT-бустеров на стейкинг VG

NFT-бустеры из коллекции "Investor's Hand" оказывают следующее влияние на стейкинг VG токенов:

| Уровень NFT    | Бонус к стейкингу VG    | Особые преимущества                      |
|----------------|-------------------------|------------------------------------------|
| Paper Hand     | -10% к периоду (1.1x)   | -                                        |
| Wooden Hand    | -25% к периоду (1.25x)  | -                                        |
| Steel Hand     | -50% к периоду (1.5x)   | Доступ к уровню Investor DAO             |
| Titanium Hand  | -75% к периоду (1.75x)  | Доступ к уровню Launchpad Master DAO     |
| Diamond Hand   | -100% к периоду (2.0x)  | Доступ к уровню Partner DAO              |
| Angel NFT      | Безлимитный период      | Ежедневный автокомпаундинг               |

При применении NFT-бустера к стейкингу VG:
1. NFT-бустер привязывается к аккаунту стейкинга VG
2. NFT отмечается как "используемый" и не может применяться к другим стейкингам
3. После завершения стейкинга NFT автоматически деактивируется и может использоваться повторно

## Основные характеристики стейкинга VG

- **Минимальное количество токенов для стейкинга**: 100 VG
- **Налог на транзакции VG**: 10%
- **Перераспределение налога**:
  - 50% для держателей NFT Fee Key
  - 30% для обратного выкупа и сжигания VC
  - 20% для казны DAO

## Процесс стейкинга VG токенов

### Шаги процесса

1. **Инициирование стейкинга**:
   - Пользователь вызывает функцию `stakeVG(amount, nftBooster?)`
   - Проверяется наличие указанного количества VG токенов
   - При наличии NFT-бустера проверяется его владение и статус

2. **Определение периода стейкинга**:
   - Базовый период определяется согласно таблице уровней DAO
   - При наличии NFT-бустера период сокращается в зависимости от множителя
   - Необходимые NFT проверяются для высших уровней

3. **Блокировка токенов**:
   - VG токены переводятся в хранилище (VG Staking Vault)
   - Токены блокируются на определенный период
   - Взимается налог 10%, который распределяется согласно правилам

4. **Определение условий анстейкинга**:
   - Для низших уровней настраивается автоматический анстейкинг
   - Для высших уровней (Founder и выше) доступен ранний анстейкинг
   - Для уровней Investor и выше настраивается автокомпаундинг

## Автоматическое реинвестирование

При стейкинге более 10,000 VG токенов активируется механизм автоматического реинвестирования:

1. **Активация механизма**:
   - Проверка, что количество стейкаемых VG токенов >= 10,000
   - Установка параметра `is_auto_reinvestment = true`

2. **После окончания периода стейкинга**:
   - 70% токенов автоматически реинвестируются на новый период
   - 30% токенов доступны для вывода
   - Создается новый аккаунт стейкинга с новым периодом

## Техническая реализация

### Структуры данных

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

#[account]
pub struct VgStakingState {
    pub total_staked: u64,
    pub total_stakers: u64,
    pub total_with_boosters: u64,
    pub total_auto_reinvestments: u64,
    pub bump: u8,
}
```

### Определение периода стейкинга по тиру с учетом NFT-бустера

```rust
pub fn get_staking_period_by_tier(
    amount: u64, 
    nft_tier: Option<u8>, 
    nft_boost_multiplier: Option<u8>
) -> u64 {
    // Базовый период стейкинга на основании суммы VG (тира DAO)
    let base_period = if amount <= 100 {
        7 // Starter
    } else if amount <= 500 {
        14 // Community Member
    } else if amount <= 1500 {
        30 // Contributor
    } else if amount <= 4000 {
        60 // Founder
    } else if amount <= 25000 {
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

### Функция стейкинга VG токенов с применением NFT-бустера

```rust
pub fn stake_vg(
    ctx: Context<StakeVG>,
    amount: u64,
    nft_booster: Option<Pubkey>,
) -> Result<()> {
    let vg_staking_account = &mut ctx.accounts.vg_staking_account;
    let vg_staking_state = &mut ctx.accounts.vg_staking_state;
    let owner = ctx.accounts.owner.key();
    let current_timestamp = Clock::get()?.unix_timestamp;
    
    // Проверка минимального количества токенов
    require!(
        amount >= 100 * 10u64.pow(9), // 100 VG с учетом десятичных знаков
        ErrorCode::InsufficientVgAmount
    );
    
    // Проверка баланса VG токенов с учетом налога
    let tax_amount = amount / 10; // 10% налог
    let total_amount = amount + tax_amount;
    require!(
        ctx.accounts.user_vg_token_account.amount >= total_amount,
        ErrorCode::InsufficientVgBalance
    );
    
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
    
    // Определение периода стейкинга с учетом NFT-бустера
    let staking_period = get_staking_period_by_tier(
        amount, 
        if has_nft_booster { Some(nft_tier) } else { None },
        if has_nft_booster { Some(nft_boost_multiplier) } else { None }
    );
    
    let unlock_timestamp = if staking_period == u64::MAX {
        i64::MAX // Для безлимитного периода (Angel NFT)
    } else {
        current_timestamp + (staking_period as i64) * 24 * 60 * 60
    };
    
    // Проверка на автоматическое реинвестирование
    let is_auto_reinvestment = amount >= 10_000 * 10u64.pow(9);
    let (reinvest_amount, withdraw_amount) = if is_auto_reinvestment {
        let reinvest_amount = (amount as f64 * 0.7).round() as u64;
        let withdraw_amount = amount - reinvest_amount;
        (reinvest_amount, withdraw_amount)
    } else {
        (0, amount)
    };
    
    // Перевод VG токенов в хранилище с учетом налога
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.user_vg_token_account.to_account_info(),
            to: ctx.accounts.vg_vault.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, amount)?;
    
    // Перевод налога в распределительный аккаунт
    let tax_transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.user_vg_token_account.to_account_info(),
            to: ctx.accounts.tax_vault.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        },
    );
    token::transfer(tax_transfer_ctx, tax_amount)?;
    
    // Распределение налога
    distribute_tax(ctx.accounts.distribute_tax_context.clone(), tax_amount)?;
    
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
    
    // Обновление статистики
    vg_staking_state.total_staked += amount;
    vg_staking_state.total_stakers += 1;
    if has_nft_booster {
        vg_staking_state.total_with_boosters += 1;
    }
    if is_auto_reinvestment {
        vg_staking_state.total_auto_reinvestments += 1;
    }
    
    Ok(())
}
```

### Функция вывода VG токенов и деактивации NFT-бустера

```rust
pub fn unstake_vg(
    ctx: Context<UnstakeVG>,
) -> Result<()> {
    let vg_staking_account = &mut ctx.accounts.vg_staking_account;
    let vg_staking_state = &mut ctx.accounts.vg_staking_state;
    let current_timestamp = Clock::get()?.unix_timestamp;
    
    // Проверка владельца аккаунта стейкинга
    require_keys_eq!(
        vg_staking_account.owner,
        ctx.accounts.owner.key(),
        ErrorCode::NotAuthorized
    );
    
    // Проверка, что период стейкинга закончился
    require!(
        current_timestamp >= vg_staking_account.unlock_timestamp,
        ErrorCode::StakingPeriodNotEnded
    );
    
    // Проверка, что токены еще не выведены
    require!(
        !vg_staking_account.is_unstaked,
        ErrorCode::AlreadyUnstaked
    );
    
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
    
    // Определение суммы для вывода и реинвестирования
    let withdraw_amount = if vg_staking_account.is_auto_reinvestment {
        vg_staking_account.withdraw_amount
    } else {
        vg_staking_account.staked_amount
    };
    
    // Перевод VG токенов обратно пользователю с учетом налога
    let tax_amount = withdraw_amount / 10; // 10% налог
    let net_withdraw_amount = withdraw_amount - tax_amount;
    
    let seeds = &[
        b"vg_vault".as_ref(),
        &[ctx.accounts.vg_vault_state.bump],
    ];
    let signer = &[&seeds[..]];
    
    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.vg_vault.to_account_info(),
            to: ctx.accounts.user_vg_token_account.to_account_info(),
            authority: ctx.accounts.vg_vault_state.to_account_info(),
        },
        signer,
    );
    token::transfer(transfer_ctx, net_withdraw_amount)?;
    
    // Перевод налога в распределительный аккаунт
    let tax_transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.vg_vault.to_account_info(),
            to: ctx.accounts.tax_vault.to_account_info(),
            authority: ctx.accounts.vg_vault_state.to_account_info(),
        },
        signer,
    );
    token::transfer(tax_transfer_ctx, tax_amount)?;
    
    // Распределение налога
    distribute_tax(ctx.accounts.distribute_tax_context.clone(), tax_amount)?;
    
    // Автоматическое реинвестирование, если активировано
    if vg_staking_account.is_auto_reinvestment {
        let reinvest_amount = vg_staking_account.reinvest_amount;
        
        // Создание нового аккаунта стейкинга для реинвестированной суммы
        let reinvest_ctx = ctx.accounts.reinvest_context.clone();
        reinvest_vg(reinvest_ctx, reinvest_amount, vg_staking_account.nft_booster)?;
    }
    
    // Обновление статуса аккаунта стейкинга
    vg_staking_account.is_unstaked = true;
    
    // Обновление статистики
    vg_staking_state.total_staked -= withdraw_amount;
    if !vg_staking_account.is_auto_reinvestment {
        vg_staking_state.total_stakers -= 1;
        if vg_staking_account.has_nft_booster {
            vg_staking_state.total_with_boosters -= 1;
        }
    }
    
    Ok(())
}
```

## Распределение налога

Налог в размере 10%, взимаемый при операциях с VG токенами, распределяется следующим образом:

```rust
pub fn distribute_tax(
    ctx: Context<DistributeTax>,
    tax_amount: u64,
) -> Result<()> {
    let fee_distribution_amount = tax_amount / 2; // 50% для держателей NFT Fee Key
    let buyback_amount = tax_amount * 3 / 10; // 30% для обратного выкупа и сжигания VC
    let dao_amount = tax_amount / 5; // 20% для казны DAO
    
    let seeds = &[
        b"tax_vault".as_ref(),
        &[ctx.accounts.tax_vault_state.bump],
    ];
    let signer = &[&seeds[..]];
    
    // Перевод в пул для держателей NFT Fee Key
    let fee_transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.tax_vault.to_account_info(),
            to: ctx.accounts.fee_distribution_vault.to_account_info(),
            authority: ctx.accounts.tax_vault_state.to_account_info(),
        },
        signer,
    );
    token::transfer(fee_transfer_ctx, fee_distribution_amount)?;
    
    // Перевод для обратного выкупа и сжигания VC
    let buyback_transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.tax_vault.to_account_info(),
            to: ctx.accounts.buyback_vault.to_account_info(),
            authority: ctx.accounts.tax_vault_state.to_account_info(),
        },
        signer,
    );
    token::transfer(buyback_transfer_ctx, buyback_amount)?;
    
    // Перевод в казну DAO
    let dao_transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.tax_vault.to_account_info(),
            to: ctx.accounts.dao_vault.to_account_info(),
            authority: ctx.accounts.tax_vault_state.to_account_info(),
        },
        signer,
    );
    token::transfer(dao_transfer_ctx, dao_amount)?;
    
    // Обновление статистики распределения налога
    let tax_distribution_state = &mut ctx.accounts.tax_distribution_state;
    tax_distribution_state.total_tax_collected += tax_amount;
    tax_distribution_state.total_fee_distribution += fee_distribution_amount;
    tax_distribution_state.total_buyback += buyback_amount;
    tax_distribution_state.total_dao += dao_amount;
    
    Ok(())
}
```

## Интерфейс пользователя

Для удобства пользователей реализуется веб-интерфейс, который позволяет:

1. Выбрать уровень участия в DAO (тир)
2. Рассчитать требуемую сумму VG и необходимые NFT
3. Выполнить стейкинг с подключением подходящих NFT
4. Отслеживать статус стейкинга и права в DAO
5. Производить анстейкинг или реинвестирование
6. Просматривать доходы и вознаграждения

## Обработка ошибок и граничных случаев

### Недостаточное количество VG токенов

Если у пользователя недостаточно VG токенов для стейкинга (менее 100 VG или меньше указанной суммы с учетом налога), транзакция будет отменена с соответствующей ошибкой.

### Преждевременный вывод токенов

Невозможен вывод VG токенов до истечения периода стейкинга. При попытке вывода токенов раньше времени транзакция будет отменена с соответствующей ошибкой.

### Использование неактивного NFT-бустера

Если указанный NFT-бустер не является активным (уже использован или истек), транзакция будет отменена с соответствующей ошибкой.

## Экономическое обоснование

Стейкинг VG токенов создает экономическую ценность для экосистемы через:

1. **Временное сокращение предложения VG токенов**:
   - Блокировка VG токенов на период от 7 до 365 дней снижает циркулирующее предложение
   - Создает стабильность цены VG токенов

2. **Стимулирование долгосрочного участия**:
   - Прогрессивная структура уровней DAO поощряет долгосрочное участие
   - Механизм автоматического реинвестирования создает долгосрочную заинтересованность

3. **Синергия с экосистемой VC токенов**:
   - Применение NFT-бустеров, полученных от стейкинга VC токенов
   - Распределение части налога на обратный выкуп и сжигание VC токенов

## Связь с другими компонентами экосистемы

Стейкинг VG токенов тесно интегрирован с:

1. **DAO и Governance**:
   - Определение прав голосования и создания предложений
   - Распределение вознаграждений от деятельности DAO

2. **Коллекция NFT "Investor's Hand"**:
   - Требование определенных NFT для высших уровней
   - Улучшение условий стейкинга через бустеры

3. **Система NFT Fee Key**:
   - Перераспределение 50% налога с VG-транзакций держателям NFT Fee Key
   - Создание долгосрочной экономической ценности

## Дальнейшие материалы

- [NFT-коллекция "Investor's Hand"](./investors-hand-nft.md)
- [Стейкинг VC токенов и NFT-бустеры](./04-vc-staking.md)
- [Формула расчета периода стейкинга VG](./specs/vg-staking-formula.md)
- [Governance и DAO](./07-governance.md)
- [Интеграция NFT-коллекции "Investor's Hand"](./specs/investors-hand-integration.md) 