# Стейкинг VC токенов и NFT-бустеры

## Обзор стейкинга VC токенов

Стейкинг VC токенов - это процесс блокировки (заморозки) фиксированной суммы VC токенов на определенный период времени, в результате которого пользователь получает NFT-бустер из коллекции "Investor's Hand". Эти NFT обеспечивают множество преимуществ в экосистеме, включая улучшение условий стейкинга VG токенов и доступ к высшим уровням DAO.

## NFT-коллекция "Investor's Hand"

NFT-бустеры представлены коллекцией "Investor's Hand", которая включает пять уровней "рук", представляющие различную степень приверженности проекту:

| Уровень NFT    | Описание                             | Бонус к стейкингу VG | Доступ к DAO         |
|----------------|--------------------------------------|----------------------|----------------------|
| Paper Hand     | Базовый уровень                      | 10% (множитель 1.1x) | -                    |
| Wooden Hand    | Начальный уровень                    | 25% (множитель 1.25x)| -                    |
| Steel Hand     | Средний уровень                      | 50% (множитель 1.5x) | Investor             |
| Titanium Hand  | Продвинутый уровень                  | 75% (множитель 1.75x)| Launchpad Master     |
| Diamond Hand   | Высший уровень                       | 100% (множитель 2.0x)| Partner              |

Специальный статус в экосистеме имеет **Angel Investor NFT**, который предоставляется участникам пресейла с вкладом от 50 SOL и дает особые привилегии, включая неограниченный период стейкинга и ежедневный автокомпаундинг.

Titanium и Diamond Hand являются наиболее редкими и ценными, они выпускаются вручную по специальным запросам и требуют значительных вложений в экосистему.

> Подробное описание всех аспектов NFT-коллекции "Investor's Hand" представлено в отдельном документе [NFT-коллекция "Investor's Hand"](./investors-hand-nft.md).

## Программа заморозки VC (VC Freezing Program)

Программа заморозки VC является основным механизмом для получения NFT из коллекции "Investor's Hand" и предоставляет следующие возможности:

- Временное снижение циркулирующего предложения VC токенов
- Получение NFT-бустеров с различными преимуществами
- Обеспечение доступа к высшим уровням DAO
- Получение повышенных доходов от стейкинга
- Создание вторичного рынка NFT через возможность продажи

## Основные характеристики стейкинга VC

- **Сумма стейкинга**: 1,000,000 VC токенов (стандартная)
- **Период стейкинга**: 90 дней (стандартный)
- **Вознаграждение**: NFT-бустер из коллекции "Investor's Hand"
- **Назначение**: Улучшение условий стейкинга VG и доступ к высшим уровням DAO

## Способы получения NFT-бустеров

NFT-бустеры можно получить двумя способами:
1. **Минтинг через заморозку (стейкинг) VC токенов** - основной способ для Paper, Wooden и Steel Hand
2. **Приобретение на маркетплейсе** - покупка у других участников экосистемы
3. **Специальное распределение от администрации** - для Titanium, Diamond и Angel Hand

## Взаимосвязь с DAO

NFT-бустеры играют ключевую роль в системе управления и стейкинга:

- **Доступ к высшим уровням DAO**:
  - Steel Hand NFT + 25,000-50,000 VG → уровень Investor (365 дней стейкинга)
  - Titanium Hand NFT + 50,000-70,000 VG → уровень Launchpad Master (365 дней стейкинга)
  - Diamond Hand NFT + более 70,000 VG → уровень Partner (365 дней стейкинга)
  - Angel NFT → безлимитный период стейкинга с ежедневным автокомпаундингом

- **Умножение доходности стейкинга**:
  - Сокращение периода стейкинга VG на 10-100% в зависимости от уровня NFT
  - Доступ к автокомпаундингу (еженедельному для высших уровней, ежедневному для Angel)
  - Доступ к особым привилегиям экосистемы

## Процесс стейкинга VC токенов и минтинга NFT

### Шаги процесса

1. **Инициирование стейкинга**:
   - Пользователь вызывает функцию `stakeVC()` с указанием суммы в 1 млн VC
   - Проверяется достаточность баланса VC токенов

2. **Блокировка токенов**:
   - VC токены переводятся в специальное хранилище (VC Staking Vault)
   - Токены блокируются на период стейкинга (90 дней)

3. **Создание NFT-бустера**:
   - Автоматически генерируется NFT-бустер через Metaplex
   - Базовый уровень - Wooden Hand (множитель 1.25x)
   - NFT передается в кошелек пользователя

4. **Завершение периода стейкинга**:
   - По истечении периода стейкинга пользователь может вывести свои VC токены
   - NFT-бустер остается у пользователя навсегда и может использоваться для стейкинга VG

## Характеристики NFT-бустера

### Метаданные NFT-бустера

- **Название**: [Уровень] Hand NFT #{id}
- **Символ**: VCIH (VC Investor's Hand)
- **Описание**: NFT для доступа к расширенным возможностям экосистемы VC/VG
- **Изображение**: Уникальное изображение, соответствующее уровню NFT
- **Атрибуты**:
  - `hand_tier`: Уровень руки (Paper, Wooden, Steel, Titanium, Diamond)
  - `staked_vc_amount`: Количество застейканных VC токенов
  - `stake_timestamp`: Время начала стейкинга (Unix timestamp)
  - `boost_multiplier`: Множитель бустера (от 1.1x до 2.0x в зависимости от уровня)
  - `dao_tier_access`: Минимальный уровень доступа в DAO

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
```

### Функция стейкинга VC токенов и создания NFT-бустера

```rust
pub fn stake_vc(
    ctx: Context<StakeVC>,
) -> Result<()> {
    let vc_staking_account = &mut ctx.accounts.vc_staking_account;
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
    
    // Cross-program инструкция для создания NFT через Investor's Hand программу
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
```

### Функция вывода VC токенов после окончания периода стейкинга

```rust
pub fn unstake_vc(
    ctx: Context<UnstakeVC>,
) -> Result<()> {
    let vc_staking_account = &mut ctx.accounts.vc_staking_account;
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
    
    Ok(())
}
```

## Экономическое обоснование

NFT-коллекция "Investor's Hand" создает экономическую ценность для экосистемы через:

1. **Временное сокращение предложения VC токенов**:
   - Блокировка значительных объемов VC токенов снижает циркулирующее предложение
   - Создает дополнительный спрос на VC токены

2. **Стимулирование долгосрочного стейкинга**:
   - NFT-бустеры необходимы для доступа к высшим уровням DAO
   - Использование NFT требует длительного стейкинга VG токенов (до 365 дней)

3. **Создание прогрессивной системы управления**:
   - Система меритократии, основанная на вкладе в экосистему
   - Защита от спекулянтов через требования долгосрочного стейкинга

4. **Развитие вторичного рынка NFT**:
   - Передаваемые NFT создают рыночные возможности для трейдеров
   - Возможность монетизации статуса в экосистеме

## Интерфейс пользователя

Для удобства пользователей реализуется веб-интерфейс, который позволяет:

1. Стейкать VC токены и получать NFT-бустеры
2. Отслеживать статус стейкинга и оставшееся время до разблокировки
3. Выводить VC токены после окончания периода стейкинга
4. Просматривать информацию о своих NFT-бустерах и их статусе
5. Покупать и продавать NFT на интегрированном маркетплейсе

## Обработка ошибок и граничных случаев

### Недостаточное количество VC токенов

Если у пользователя недостаточно VC токенов для стейкинга (менее 1 млн), транзакция будет отменена с соответствующей ошибкой. Пользователю будет предложено приобрести необходимое количество VC токенов или уменьшить сумму стейкинга.

### Преждевременный вывод токенов

Невозможен вывод VC токенов до истечения периода стейкинга (90 дней). При попытке вывода токенов раньше времени транзакция будет отменена с соответствующей ошибкой.

## Дальнейшие материалы

- [NFT-коллекция "Investor's Hand"](./investors-hand-nft.md)
- [Стейкинг VG токенов](./05-vg-staking.md)
- [Governance и DAO](./07-governance.md)
- [Интеграция NFT-коллекции "Investor's Hand"](./specs/investors-hand-integration.md) 