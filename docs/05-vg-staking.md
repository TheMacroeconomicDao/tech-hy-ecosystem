# Стейкинг VG токенов

## Обзор стейкинга VG токенов

Стейкинг VG токенов - это процесс блокировки VG токенов на период, зависящий от количества токенов и наличия NFT-бустера. При большом размере стейка активируется механизм автоматического реинвестирования, который позволяет частично выводить токены, а частично автоматически реинвестировать их на новый период.

## Основные характеристики

- **Минимальное количество токенов для стейкинга**: 100 VG
- **Минимальный период стейкинга**: 30 дней
- **Максимальный период стейкинга**: 180 дней
- **Базовый период стейкинга**: 180 дней (90 дней при автоматическом реинвестировании)
- **Порог для автоматического реинвестирования**: 10,000 VG
- **Процент реинвестирования**: 70%
- **Процент для вывода при автореинвестировании**: 30%

## Процесс стейкинга VG токенов

### Шаги процесса

1. **Инициирование стейкинга**:
   - Пользователь вызывает функцию `stakeVG(amount, nftBooster?)`
   - Проверяется наличие указанного количества VG токенов на балансе пользователя
   - Если указан NFT-бустер, проверяется его владение и статус

2. **Расчет периода стейкинга**:
   - Период стейкинга рассчитывается на основе количества токенов и наличия NFT-бустера
   - Формула расчета описана ниже

3. **Блокировка токенов**:
   - VG токены переводятся в специальное хранилище (VG Staking Vault)
   - Токены блокируются на рассчитанный период
   - При переводе взимается налог 10%, который распределяется согласно правилам VG токена

4. **Завершение периода стейкинга**:
   - По истечении периода стейкинга пользователь может вывести свои VG токены
   - Если активировано автоматическое реинвестирование, 70% токенов реинвестируются, а 30% доступны для вывода

## Формула расчета периода стейкинга

Период стейкинга (в днях) рассчитывается по следующей формуле:

```
P = Pbase * (1 - log(A/Amin) * K1) * (1 - B * K2)
```

Где:
- `P` - итоговый период стейкинга в днях
- `Pbase` - базовый период стейкинга (180 дней, 90 дней при автореинвестировании)
- `A` - количество стейкаемых VG токенов
- `Amin` - минимальное количество токенов для стейкинга (100 VG)
- `K1` - коэффициент влияния размера стейка (0.15)
- `B` - бустер-фактор от NFT (0 - без NFT, 1 - с NFT)
- `K2` - коэффициент влияния NFT-бустера (0.25)

### Примеры расчета

#### Пример 1: Стейкинг без NFT-бустера

```
Входные данные:
- Количество VG: 1,000
- NFT-бустер: отсутствует

Расчет:
P = 180 * (1 - log(1000/100) * 0.15) * (1 - 0 * 0.25)
P = 180 * (1 - log(10) * 0.15) * 1
P = 180 * (1 - 1 * 0.15) * 1
P = 180 * 0.85 * 1
P = 153 дня
```

#### Пример 2: Стейкинг с NFT-бустером

```
Входные данные:
- Количество VG: 5,000
- NFT-бустер: присутствует

Расчет:
P = 180 * (1 - log(5000/100) * 0.15) * (1 - 1 * 0.25)
P = 180 * (1 - log(50) * 0.15) * 0.75
P = 180 * (1 - 1.699 * 0.15) * 0.75
P = 180 * (1 - 0.255) * 0.75
P = 180 * 0.745 * 0.75
P = 100.6 дней ≈ 101 день
```

#### Пример 3: Автоматическое реинвестирование

```
Входные данные:
- Количество VG: 15,000
- NFT-бустер: присутствует

Расчет:
P = 90 * (1 - log(15000/100) * 0.15) * (1 - 1 * 0.25)
P = 90 * (1 - log(150) * 0.15) * 0.75
P = 90 * (1 - 2.176 * 0.15) * 0.75
P = 90 * (1 - 0.326) * 0.75
P = 90 * 0.674 * 0.75
P = 45.5 дней ≈ 46 дней

Автоматическое реинвестирование:
- Реинвестируется: 10,500 VG (70%)
- Доступно для вывода: 4,500 VG (30%)
```

## Автоматическое реинвестирование

При стейкинге более 10,000 VG токенов активируется механизм автоматического реинвестирования:

1. **Активация механизма**:
   - Проверка, что количество стейкаемых VG токенов >= 10,000
   - Установка параметра `is_auto_reinvestment = true`

2. **Изменение базового периода**:
   - Базовый период стейкинга сокращается до 90 дней вместо 180 дней
   - Дальнейший расчет периода происходит по той же формуле

3. **После окончания периода стейкинга**:
   - 70% токенов автоматически реинвестируются на новый период
   - 30% токенов доступны для вывода
   - Для реинвестируемых токенов создается новый аккаунт стейкинга с новым периодом

## Применение NFT-бустера

При стейкинге VG токенов может быть применен NFT-бустер, полученный от стейкинга VC токенов:

1. **Указание NFT-бустера**:
   - При вызове функции `stakeVG` пользователь указывает адрес NFT-бустера
   - Проверяется владение NFT-бустером и его статус (должен быть "Active")

2. **Эффект от NFT-бустера**:
   - Период стейкинга сокращается на 25% (коэффициент K2 = 0.25)
   - Один NFT-бустер может быть использован только для одного стейкинга VG

3. **Обновление статуса NFT-бустера**:
   - После применения статус NFT-бустера меняется на "Used"
   - Бустер привязывается к аккаунту стейкинга VG

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

### Функции расчета периода стейкинга и реинвестирования

```rust
pub fn calculate_staking_period(amount: u64, has_nft_booster: bool) -> u64 {
    let base_period: u64;
    let min_amount: u64 = 100;
    let k1: f64 = 0.15;
    let k2: f64 = 0.25;
    
    // Проверка на автоматическое реинвестирование
    if amount >= 10_000 {
        base_period = 90;
    } else {
        base_period = 180;
    }
    
    // Расчет влияния размера стейка
    let amount_factor = 1.0 - (amount as f64 / min_amount as f64).log10() * k1;
    
    // Расчет влияния NFT-бустера
    let booster_factor = if has_nft_booster { 1.0 - k2 } else { 1.0 };
    
    // Расчет итогового периода
    let period = (base_period as f64 * amount_factor * booster_factor).round() as u64;
    
    // Применение ограничений
    if period < 30 {
        return 30;
    } else if period > 180 {
        return 180;
    }
    
    period
}

pub fn is_auto_reinvestment(amount: u64) -> bool {
    amount >= 10_000
}

pub fn get_reinvestment_amounts(total_amount: u64) -> (u64, u64) {
    if !is_auto_reinvestment(total_amount) {
        return (0, total_amount);
    }
    
    let reinvest_amount = (total_amount as f64 * 0.7).round() as u64;
    let withdraw_amount = total_amount - reinvest_amount;
    
    (reinvest_amount, withdraw_amount)
}
```

### Функция стейкинга VG токенов

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
    let has_nft_booster = false;
    if let Some(booster_key) = nft_booster {
        let nft_booster_account = ctx.accounts.nft_booster_account.as_ref()
            .ok_or(ErrorCode::BoosterAccountNotProvided)?;
        
        // Проверка, что указанный бустер соответствует переданному аккаунту
        require_keys_eq!(
            nft_booster_account.key(),
            booster_key,
            ErrorCode::InvalidBoosterAccount
        );
        
        // Проверка владельца NFT-бустера
        require_keys_eq!(
            nft_booster_account.owner,
            owner,
            ErrorCode::NotAuthorized
        );
        
        // Проверка статуса NFT-бустера
        require!(
            nft_booster_account.status == 1, // Active
            ErrorCode::BoosterNotActive
        );
        
        // Применение бустера
        apply_nft_booster(
            ctx.accounts.apply_booster_context.clone(),
            ctx.accounts.vg_staking_account.key(),
        )?;
        
        has_nft_booster = true;
    }
    
    // Расчет периода стейкинга
    let staking_period = calculate_staking_period(amount, has_nft_booster);
    let unlock_timestamp = current_timestamp + staking_period * 24 * 60 * 60;
    
    // Проверка на автоматическое реинвестирование
    let is_auto_reinvestment = is_auto_reinvestment(amount);
    let (reinvest_amount, withdraw_amount) = if is_auto_reinvestment {
        get_reinvestment_amounts(amount)
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

### Функция вывода VG токенов

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

1. Рассчитывать ожидаемый период стейкинга для указанного количества VG токенов
2. Стейкать VG токены с опциональным применением NFT-бустера
3. Отслеживать статус стейкинга и оставшееся время до разблокировки
4. Выводить VG токены после окончания периода стейкинга
5. Просматривать информацию о реинвестировании при автоматическом реинвестировании

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
   - Блокировка VG токенов на период от 30 до 180 дней снижает циркулирующее предложение
   - Создает стабильность цены VG токенов

2. **Стимулирование долгосрочного участия**:
   - Расчет периода стейкинга в зависимости от количества токенов поощряет крупных держателей
   - Механизм автоматического реинвестирования создает долгосрочную заинтересованность

3. **Синергия с экосистемой VC токенов**:
   - Применение NFT-бустеров, полученных от стейкинга VC токенов
   - Распределение части налога на обратный выкуп и сжигание VC токенов

## Дальнейшие материалы

- [Архитектура системы](./01-system-architecture.md)
- [Стейкинг VC токенов и NFT-бустеры](./04-vc-staking.md)
- [Формула расчета периода стейкинга VG](./specs/vg-staking-formula.md) 