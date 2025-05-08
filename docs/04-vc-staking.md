# Стейкинг VC токенов и NFT-бустеры

## Обзор стейкинга VC токенов

Стейкинг VC токенов - это процесс блокировки фиксированной суммы VC токенов (1 млн) на определенный период времени без вознаграждения, в результате которого пользователь получает NFT-бустер. Этот NFT-бустер может быть использован для улучшения условий стейкинга VG токенов.

## Основные характеристики

- **Сумма стейкинга**: 1 млн VC токенов (фиксированная)
- **Период стейкинга**: 90 дней (фиксированный)
- **Вознаграждение**: Только NFT-бустер (без дополнительных токенов)
- **Назначение**: Получение NFT-бустера для использования в стейкинге VG токенов

## Процесс стейкинга VC токенов

### Шаги процесса

1. **Инициирование стейкинга**:
   - Пользователь вызывает функцию `stakeVC()`
   - Проверяется наличие 1 млн VC токенов на балансе пользователя

2. **Блокировка токенов**:
   - 1 млн VC токенов переводятся в специальное хранилище (VC Staking Vault)
   - Токены блокируются на фиксированный период 90 дней

3. **Создание NFT-бустера**:
   - Автоматически генерируется NFT-бустер через Metaplex
   - NFT-бустер передается пользователю

4. **Завершение периода стейкинга**:
   - По истечении 90 дней пользователь может вывести свои VC токены
   - NFT-бустер остается у пользователя и может быть использован для стейкинга VG токенов

## Характеристики NFT-бустера

### Метаданные NFT-бустера

- **Название**: VC Staking Booster #{id}
- **Символ**: VCSB
- **Описание**: Этот NFT увеличивает мультипликатор вознаграждения при стейкинге VG токенов. Создан путем стейкинга 1 млн VC токенов.
- **Изображение**: Уникальное изображение, генерируемое на основе времени стейкинга и адреса пользователя
- **Атрибуты**:
  - `staked_vc_amount`: Количество застейканных VC токенов (всегда 1 млн)
  - `stake_timestamp`: Время начала стейкинга (Unix timestamp)
  - `unlock_timestamp`: Время окончания периода стейкинга (Unix timestamp)
  - `boost_multiplier`: Множитель бустера (1.25x)
  - `status`: Статус NFT (Active, Used, Expired)

### Функциональность NFT-бустера

- **Улучшение стейкинга VG токенов**:
  - Сокращение периода стейкинга VG токенов на 25% (применяется множитель 0.75)
  - Один NFT-бустер может быть использован только для одного стейкинга VG токенов
  - После применения статус NFT-бустера меняется на "Used"

- **Возможность передачи**:
  - NFT-бустер может быть передан другому пользователю или продан на маркетплейсе NFT
  - При передаче новый владелец получает все преимущества бустера

## Техническая реализация

### Структуры данных

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

### Функция стейкинга VC токенов и создания NFT-бустера

```rust
pub fn stake_vc(
    ctx: Context<StakeVC>,
) -> Result<()> {
    let vc_staking_account = &mut ctx.accounts.vc_staking_account;
    let nft_booster_account = &mut ctx.accounts.nft_booster_account;
    let owner = ctx.accounts.owner.key();
    let current_timestamp = Clock::get()?.unix_timestamp;
    
    // Проверка количества VC токенов
    let required_amount: u64 = 1_000_000 * 10u64.pow(9); // 1 млн VC с учетом десятичных знаков
    require!(
        ctx.accounts.user_vc_token_account.amount >= required_amount,
        ErrorCode::InsufficientVcBalance
    );
    
    // Расчет времени разблокировки (90 дней)
    let unlock_timestamp = current_timestamp + 90 * 24 * 60 * 60;
    
    // Перевод VC токенов в хранилище
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.user_vc_token_account.to_account_info(),
            to: ctx.accounts.vc_vault.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, required_amount)?;
    
    // Инициализация аккаунта стейкинга VC
    vc_staking_account.owner = owner;
    vc_staking_account.staked_amount = required_amount;
    vc_staking_account.stake_timestamp = current_timestamp;
    vc_staking_account.unlock_timestamp = unlock_timestamp;
    vc_staking_account.nft_mint = ctx.accounts.nft_mint.key();
    vc_staking_account.is_unstaked = false;
    vc_staking_account.bump = *ctx.bumps.get("vc_staking_account").unwrap();
    
    // Инициализация аккаунта NFT-бустера
    nft_booster_account.owner = owner;
    nft_booster_account.vc_staking_account = vc_staking_account.key();
    nft_booster_account.boost_multiplier = 1.25;
    nft_booster_account.status = 1; // Active
    nft_booster_account.vg_staking_account = None;
    nft_booster_account.bump = *ctx.bumps.get("nft_booster_account").unwrap();
    
    // Создание NFT с использованием Metaplex
    create_nft(
        ctx.accounts.metaplex_program.to_account_info(),
        ctx.accounts.nft_mint.to_account_info(),
        ctx.accounts.nft_token_account.to_account_info(),
        ctx.accounts.mint_authority.to_account_info(),
        ctx.accounts.rent.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.metadata_account.to_account_info(),
        ctx.accounts.edition_account.to_account_info(),
        format!("VC Staking Booster #{}", vc_staking_account.key()),
        "VCSB",
        "Этот NFT увеличивает мультипликатор вознаграждения при стейкинге VG токенов на 25%. Создан путем стейкинга 1 млн VC токенов.",
        generate_nft_uri(owner, current_timestamp),
        vec![
            ("staked_vc_amount".to_string(), required_amount.to_string()),
            ("stake_timestamp".to_string(), current_timestamp.to_string()),
            ("unlock_timestamp".to_string(), unlock_timestamp.to_string()),
            ("boost_multiplier".to_string(), "1.25".to_string()),
            ("status".to_string(), "Active".to_string()),
        ],
    )?
    
    Ok(())
}
```

### Функция вывода VC токенов после окончания периода стейкинга

```rust
pub fn unstake_vc(
    ctx: Context<UnstakeVC>,
) -> Result<()> {
    let vc_staking_account = &mut ctx.accounts.vc_staking_account;
    let nft_booster_account = &ctx.accounts.nft_booster_account;
    let current_timestamp = Clock::get()?.unix_timestamp;
    
    // Проверка владельца аккаунта стейкинга
    require_keys_eq!(
        vc_staking_account.owner,
        ctx.accounts.owner.key(),
        ErrorCode::NotAuthorized
    );
    
    // Проверка, что период стейкинга закончился
    require!(
        current_timestamp >= vc_staking_account.unlock_timestamp,
        ErrorCode::StakingPeriodNotEnded
    );
    
    // Проверка, что токены еще не выведены
    require!(
        !vc_staking_account.is_unstaked,
        ErrorCode::AlreadyUnstaked
    );
    
    // Перевод VC токенов обратно пользователю
    let seeds = &[
        b"vc_vault".as_ref(),
        &[ctx.accounts.vc_vault_state.bump],
    ];
    let signer = &[&seeds[..]];
    
    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.vc_vault.to_account_info(),
            to: ctx.accounts.user_vc_token_account.to_account_info(),
            authority: ctx.accounts.vc_vault_state.to_account_info(),
        },
        signer,
    );
    token::transfer(transfer_ctx, vc_staking_account.staked_amount)?;
    
    // Обновление статуса аккаунта стейкинга
    vc_staking_account.is_unstaked = true;
    
    // Обновление статуса NFT-бустера, если он не используется для стейкинга VG
    if nft_booster_account.status == 1 && nft_booster_account.vg_staking_account.is_none() {
        // Обновление метаданных NFT для отражения нового статуса
        update_nft_metadata(
            ctx.accounts.metaplex_program.to_account_info(),
            ctx.accounts.metadata_account.to_account_info(),
            ctx.accounts.edition_account.to_account_info(),
            ctx.accounts.nft_mint.to_account_info(),
            ctx.accounts.mint_authority.to_account_info(),
            vec![
                ("status".to_string(), "Expired".to_string()),
            ],
        )?
    }
    
    Ok(())
}
```

### Применение NFT-бустера при стейкинге VG токенов

```rust
pub fn apply_nft_booster(
    ctx: Context<ApplyNftBooster>,
    vg_staking_account: Pubkey,
) -> Result<()> {
    let nft_booster_account = &mut ctx.accounts.nft_booster_account;
    
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
    
    // Обновление статуса NFT-бустера
    nft_booster_account.status = 2; // Used
    nft_booster_account.vg_staking_account = Some(vg_staking_account);
    
    // Обновление метаданных NFT для отражения нового статуса
    update_nft_metadata(
        ctx.accounts.metaplex_program.to_account_info(),
        ctx.accounts.metadata_account.to_account_info(),
        ctx.accounts.edition_account.to_account_info(),
        ctx.accounts.nft_mint.to_account_info(),
        ctx.accounts.mint_authority.to_account_info(),
        vec![
            ("status".to_string(), "Used".to_string()),
        ],
    )?
    
    Ok(())
}
```

## Интеграция с Metaplex для создания NFT

Для создания NFT-бустера используется интеграция с Metaplex, которая позволяет создавать и управлять NFT на Solana. Процесс создания NFT включает следующие шаги:

1. **Создание минтера NFT**:
   - Генерация новой keypair для минта NFT
   - Инициализация минта с Metaplex

2. **Создание метаданных NFT**:
   - Определение атрибутов NFT (название, символ, описание, изображение)
   - Добавление специальных атрибутов для хранения информации о стейкинге и бустере

3. **Минтинг NFT**:
   - Создание токен-аккаунта для NFT
   - Минтинг NFT и привязка метаданных

4. **Обновление метаданных**:
   - При изменении статуса NFT-бустера (Active -> Used -> Expired)
   - При использовании NFT-бустера для стейкинга VG токенов

## Влияние NFT-бустера на стейкинг VG токенов

NFT-бустер оказывает следующее влияние на стейкинг VG токенов:

1. **Сокращение периода стейкинга**:
   - Период стейкинга VG токенов сокращается на 25% при применении NFT-бустера
   - Например, если базовый период стейкинга составляет 100 дней, то с NFT-бустером он составит 75 дней

2. **Однократное использование**:
   - Один NFT-бустер может быть использован только для одного стейкинга VG токенов
   - После использования статус NFT-бустера меняется на "Used"

3. **Независимость от основного стейкинга VC**:
   - NFT-бустер можно использовать даже после вывода VC токенов из стейкинга
   - Можно передать NFT-бустер другому пользователю или продать на маркетплейсе

## Экономическое обоснование

Стейкинг VC токенов и использование NFT-бустеров создает экономическую ценность для экосистемы через:

1. **Временное сокращение предложения VC токенов**:
   - Блокировка 1 млн VC токенов на 90 дней снижает циркулирующее предложение
   - Создает дополнительный спрос на VC токены

2. **Стимулирование стейкинга VG токенов**:
   - Улучшение условий стейкинга VG токенов через NFT-бустеры
   - Создание синергии между VC и VG токенами

3. **Создание вторичного рынка NFT-бустеров**:
   - Возможность торговли NFT-бустерами на маркетплейсах
   - Дополнительная ценность для держателей VC токенов

## Интерфейс пользователя

Для удобства пользователей реализуется веб-интерфейс, который позволяет:

1. Стейкать VC токены и получать NFT-бустеры
2. Отслеживать статус стейкинга и оставшееся время до разблокировки
3. Выводить VC токены после окончания периода стейкинга
4. Применять NFT-бустеры при стейкинге VG токенов
5. Просматривать информацию о своих NFT-бустерах и их статусе

## Обработка ошибок и граничных случаев

### Недостаточное количество VC токенов

Если у пользователя недостаточно VC токенов для стейкинга (менее 1 млн), транзакция будет отменена с соответствующей ошибкой. Пользователю будет предложено приобрести необходимое количество VC токенов или уменьшить сумму стейкинга.

### Преждевременный вывод токенов

Невозможен вывод VC токенов до истечения периода стейкинга (90 дней). При попытке вывода токенов раньше времени транзакция будет отменена с соответствующей ошибкой.

### Использование уже примененного NFT-бустера

Если NFT-бустер уже был использован для стейкинга VG токенов, попытка использовать его повторно приведет к ошибке. Статус NFT-бустера изменяется на "Used" после первого применения.

## Дальнейшие материалы

- [Архитектура системы](./01-system-architecture.md)
- [Токены экосистемы](./02-tokens.md)
- [Стейкинг VG токенов](./05-vg-staking.md) 