# Механизм "Burn and Earn"

## Обзор механизма

Механизм "Burn and Earn" представляет собой процесс конвертации VC токенов в LP токены с последующей постоянной блокировкой (permanent lock) и получением VG токенов и NFT Fee Key. Этот механизм является ключевым элементом экосистемы VC/VG токенов, обеспечивающим ликвидность и стимулирующим долгосрочное участие пользователей.

## Процесс конвертации

### Шаги процесса

1. **Разделение VC токенов**:
   - Пользователь отправляет X количество VC токенов в смарт-контракт
   - Смарт-контракт разделяет X на две равные части: X/2 и X/2

2. **Обмен на SOL**:
   - Первая часть (X/2) VC токенов обменивается на SOL через Raydium AMM
   - Обмен происходит по текущему рыночному курсу
   - Полученное количество SOL = Y

3. **Формирование LP токена**:
   - Оставшаяся часть VC токенов (X/2) и полученные SOL (Y) используются для создания LP токена в пуле ликвидности Raydium
   - Количество полученных LP токенов = Z

4. **Постоянная блокировка LP токенов**:
   - LP токены (Z) переводятся на специальный аккаунт с постоянной блокировкой (permanent lock vault)
   - Из этого аккаунта невозможно вывести LP токены никогда

5. **Эмиссия VG токенов**:
   - Пользователю выдается количество VG токенов, пропорциональное заблокированным LP токенам
   - Количество VG = Z * коэффициент_конверсии + бонус

6. **Создание NFT Fee Key**:
   - Пользователю выдается NFT Fee Key, дающий право на получение части комиссий от транзакций с VG токенами

## Формула расчета VG токенов

Количество VG токенов, выдаваемых пользователю, рассчитывается по следующей формуле:

```
VG = LP * C * (1 + B * log10(LP/LP_min))
```

Где:
- `VG` - количество выдаваемых VG токенов
- `LP` - количество заблокированных LP токенов
- `C` - базовый коэффициент конверсии (10)
- `B` - бонусный коэффициент (0.2)
- `LP_min` - минимальное количество LP токенов для получения бонуса (1)

Эта формула обеспечивает нелинейное увеличение количества выдаваемых VG токенов при увеличении количества заблокированных LP токенов, стимулируя пользователей блокировать большие суммы.

## Постоянная блокировка LP токенов (Permanent Lock)

### Особенности постоянной блокировки

1. **Невозможность вывода**: LP токены, переведенные на аккаунт постоянной блокировки, не могут быть выведены никогда и никем, включая владельца программы.

2. **Прозрачность**: Все заблокированные LP токены видны в блокчейне и могут быть проверены любым пользователем.

3. **Учет вкладов**: Для каждого пользователя, заблокировавшего LP токены, сохраняется информация о количестве заблокированных токенов и времени блокировки.

### Реализация постоянной блокировки

Постоянная блокировка LP токенов реализуется через специальный аккаунт PermanentLockVault:

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

Аккаунт PermanentLockVault создается как PDA (Program Derived Address) с известными seed-значениями и без возможности подписи транзакций на вывод токенов. Это обеспечивает невозможность вывода LP токенов из аккаунта.

## NFT Fee Key

При блокировке LP токенов пользователь получает NFT Fee Key, который дает право на получение части комиссий, собираемых с транзакций VG токенов.

### Характеристики NFT Fee Key

1. **Уровни NFT Fee Key**:

   | Уровень | Количество LP токенов | Множитель дохода |
   |---------|------------------------|-------------------|
   | Common  | < 1,000                | 1.0x              |
   | Rare    | 1,000 - 10,000         | 1.2x              |
   | Epic    | 10,000 - 100,000       | 1.5x              |
   | Legendary| > 100,000              | 2.0x              |

2. **Доля в пуле комиссий**:
   - Рассчитывается пропорционально заблокированным LP токенам с учетом множителя уровня
   - Формула: `share_percentage = (user_locked_lp * tier_multiplier) / total_weighted_locked_lp * 100%`

3. **Возможность передачи**:
   - NFT Fee Key может быть передан другому пользователю или продан на маркетплейсе
   - При передаче новый владелец получает право на сбор будущих комиссий

Подробная информация о NFT Fee Key представлена в документе [NFT Fee Key](./06-nft-fee-key.md).

## Интеграция с Raydium

### Использование Raydium SDK

Для интеграции с Raydium используется официальный Raydium SDK, который предоставляет функции для взаимодействия с пулами ликвидности и AMM:

```rust
use raydium_sdk::{amm, liquidity_pool};

// Функция для обмена VC на SOL через Raydium AMM
pub fn swap_vc_to_sol(
    ctx: Context<SwapVcToSol>,
    amount_in: u64,
) -> Result<u64> {
    // Расчет минимального количества SOL, которое должно быть получено
    // Защита от проскальзывания цены
    let minimum_amount_out = calculate_minimum_amount_out(amount_in, 0.005)?; // 0.5% slippage
    
    // Выполнение свопа через Raydium AMM
    let swap_instruction = amm::swap_instruction(
        // Параметры инструкции
    );
    
    // Выполнение инструкции
    solana_program::program::invoke(
        &swap_instruction,
        &account_infos,
    )?;
    
    // Получение фактического количества SOL после свопа
    let sol_amount = ctx.accounts.user_destination_token_account.amount;
    
    Ok(sol_amount)
}

// Функция для создания LP токена через Raydium
pub fn add_liquidity(
    ctx: Context<AddLiquidity>,
    vc_amount: u64,
    sol_amount: u64,
) -> Result<u64> {
    // Создание инструкции для добавления ликвидности
    let add_liquidity_instruction = liquidity_pool::add_liquidity_instruction(
        // Параметры инструкции
    );
    
    // Выполнение инструкции
    solana_program::program::invoke(
        &add_liquidity_instruction,
        &account_infos,
    )?;
    
    // Получение фактического количества LP токенов после добавления ликвидности
    let lp_amount = ctx.accounts.user_lp_token_account.amount;
    
    Ok(lp_amount)
}
```

### Атомарная транзакция

Для обеспечения безопасности и атомарности всего процесса конвертации VC в LP и последующей блокировки, все шаги выполняются в рамках одной транзакции. Это гарантирует, что либо весь процесс будет выполнен успешно, либо транзакция будет отменена без изменения состояния.

## Полная реализация механизма "Burn and Earn"

```rust
pub fn convert_vc_to_lp_and_lock(
    ctx: Context<ConvertVcToLpAndLock>,
    vc_amount: u64,
) -> Result<()> {
    // Проверка баланса VC токенов
    require!(
        ctx.accounts.user_vc_token_account.amount >= vc_amount,
        ErrorCode::InsufficientVcBalance
    );
    
    // Разделение VC токенов на две равные части
    let half_vc_amount = vc_amount / 2;
    
    // Перевод первой половины VC токенов на аккаунт для свопа
    let transfer_to_swap_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.user_vc_token_account.to_account_info(),
            to: ctx.accounts.swap_vc_token_account.to_account_info(),
            authority: ctx.accounts.user_authority.to_account_info(),
        },
    );
    token::transfer(transfer_to_swap_ctx, half_vc_amount)?;
    
    // Обмен VC на SOL через Raydium
    let sol_amount = swap_vc_to_sol(
        ctx.accounts.swap_context.clone(),
        half_vc_amount,
    )?;
    
    // Перевод второй половины VC токенов на аккаунт для добавления ликвидности
    let transfer_to_liquidity_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.user_vc_token_account.to_account_info(),
            to: ctx.accounts.liquidity_vc_token_account.to_account_info(),
            authority: ctx.accounts.user_authority.to_account_info(),
        },
    );
    token::transfer(transfer_to_liquidity_ctx, half_vc_amount)?;
    
    // Добавление ликвидности и получение LP токенов
    let lp_amount = add_liquidity(
        ctx.accounts.liquidity_context.clone(),
        half_vc_amount,
        sol_amount,
    )?;
    
    // Перевод LP токенов на аккаунт с постоянной блокировкой
    let transfer_to_lock_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.user_lp_token_account.to_account_info(),
            to: ctx.accounts.permanent_lock_vault.to_account_info(),
            authority: ctx.accounts.user_authority.to_account_info(),
        },
    );
    token::transfer(transfer_to_lock_ctx, lp_amount)?;
    
    // Расчет количества VG токенов для выдачи
    let vg_amount = calculate_vg_amount(lp_amount)?;
    
    // Минтинг VG токенов пользователю
    let mint_vg_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.vg_mint.to_account_info(),
            to: ctx.accounts.user_vg_token_account.to_account_info(),
            authority: ctx.accounts.vg_mint_authority.to_account_info(),
        },
        &[&[
            b"vg_mint_authority".as_ref(),
            &[ctx.accounts.vg_mint_authority_bump],
        ]],
    );
    token::mint_to(mint_vg_ctx, vg_amount)?;
    
    // Создание NFT Fee Key
    create_fee_key(
        ctx.accounts.fee_key_context.clone(),
        lp_amount,
    )?;
    
    // Обновление статистики
    let stats = &mut ctx.accounts.burn_and_earn_stats;
    stats.total_vc_converted += vc_amount;
    stats.total_lp_locked += lp_amount;
    stats.total_vg_minted += vg_amount;
    stats.total_transactions += 1;
    
    Ok(())
}
```

## Обработка ошибок и граничных случаев

### Недостаточная ликвидность

В случае недостаточной ликвидности в пуле Raydium для обмена VC на SOL, транзакция будет отменена с соответствующей ошибкой. Пользователю будет предложено уменьшить сумму конвертации или попробовать позже.

### Проскальзывание цены

Для защиты от проскальзывания цены при обмене VC на SOL используется параметр `minimum_amount_out`, который рассчитывается на основе текущего курса с учетом допустимого проскальзывания (например, 0.5%). Если фактическое проскальзывание превышает допустимое, транзакция отменяется.

### Ограничение размера транзакции

Для предотвращения манипуляций с ценой и обеспечения стабильности пула ликвидности, может быть введено ограничение на максимальный размер одной транзакции конвертации VC в LP.

## Интерфейс пользователя

Для удобства пользователей реализуется веб-интерфейс, который позволяет:

1. Просматривать текущий курс обмена VC на SOL
2. Рассчитывать ожидаемое количество VG токенов за указанное количество VC
3. Выполнять конвертацию VC в LP с последующей блокировкой и получением VG токенов и NFT Fee Key
4. Просматривать информацию о своих заблокированных LP токенах и полученных NFT Fee Key

## Экономическое обоснование

Механизм "Burn and Earn" создает экономическую ценность для участников экосистемы через:

1. **Увеличение ликвидности VC токенов**:
   - Создание и поддержание пула ликвидности VC/SOL
   - Стабилизация цены VC токенов

2. **Стимулирование долгосрочного участия**:
   - Постоянная блокировка LP токенов сокращает циркулирующее предложение
   - Получение VG токенов и NFT Fee Key создает долгосрочную заинтересованность

3. **Создание устойчивой экономики токенов**:
   - Налог на транзакции VG токенов создает постоянный доход для держателей NFT Fee Key
   - Часть налога используется для обратного выкупа и сжигания VC токенов, что создает дефляционный механизм

## Дальнейшие материалы

- [Архитектура системы](./01-system-architecture.md)
- [Токены экосистемы](./02-tokens.md)
- [NFT Fee Key](./06-nft-fee-key.md)
- [Формула расчета VG токенов](./specs/vg-calculation-formula.md) 