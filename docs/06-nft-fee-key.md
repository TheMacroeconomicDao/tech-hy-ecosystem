# NFT Fee Key

## Обзор

NFT Fee Key - это невзаимозаменяемый токен (NFT), который выдается пользователю при конвертации VC токенов в LP токены с последующей постоянной блокировкой в механизме "Burn and Earn". NFT Fee Key дает право на получение части комиссий, собираемых с транзакций VG токенов.

## Основные характеристики

- **Получение**: При блокировке LP токенов в механизме "Burn and Earn"
- **Назначение**: Получение дохода от комиссий, взимаемых с транзакций VG токенов
- **Возможность передачи**: Может быть передан другому пользователю или продан на маркетплейсе NFT
- **Ценность**: Определяется количеством заблокированных LP токенов и уровнем NFT

## Уровни NFT Fee Key

NFT Fee Key имеет четыре уровня в зависимости от количества заблокированных LP токенов:

| Уровень | Количество LP токенов | Множитель дохода |
|---------|------------------------|-------------------|
| Common  | < 1,000                | 1.0x              |
| Rare    | 1,000 - 10,000         | 1.2x              |
| Epic    | 10,000 - 100,000       | 1.5x              |
| Legendary| > 100,000              | 2.0x              |

Чем выше уровень NFT Fee Key, тем больший множитель применяется при расчете доли в пуле комиссий, что увеличивает доход владельца NFT.

## Метаданные NFT Fee Key

Каждый NFT Fee Key содержит следующие метаданные:

- **Название**: VC/VG Fee Key #{id}
- **Символ**: VCFK
- **Описание**: Этот NFT дает право на получение части комиссий, генерируемых в экосистеме VC/VG. Процент дохода пропорционален количеству заблокированных LP токенов.
- **Изображение**: Уникальное изображение, генерируемое на основе количества заблокированных LP токенов и времени блокировки
- **Атрибуты**:
  - `locked_lp_amount`: Количество заблокированных LP токенов
  - `lock_timestamp`: Время блокировки (Unix timestamp)
  - `fee_share_percentage`: Процент от общего пула комиссий
  - `tier`: Уровень NFT (Common, Rare, Epic, Legendary)

## Распределение комиссий

Комиссии, собираемые с транзакций VG токенов (10% от суммы), распределяются следующим образом:

1. 50% направляется в пул для держателей NFT Fee Key
2. 30% используется для обратного выкупа и сжигания VC токенов
3. 20% направляется в казну DAO для развития экосистемы

Доля каждого держателя NFT Fee Key в пуле комиссий рассчитывается по формуле:

```
share_percentage = (user_locked_lp * tier_multiplier) / total_weighted_locked_lp * 100%
```

Где:
- `user_locked_lp` - количество LP токенов, заблокированных пользователем
- `tier_multiplier` - множитель в зависимости от уровня NFT
- `total_weighted_locked_lp` - сумма всех заблокированных LP токенов с учетом множителей

## Процесс сбора вознаграждения

Держатели NFT Fee Key могут собирать накопленное вознаграждение в любое время, выполнив следующие шаги:

1. Вызов функции `claimFeeRewards()`
2. Проверка владения NFT Fee Key
3. Расчет накопленного вознаграждения на основе доли в пуле комиссий
4. Перевод вознаграждения в SOL на кошелек пользователя
5. Обновление статистики сбора вознаграждения

## Техническая реализация

### Структуры данных

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

### Создание NFT Fee Key

```rust
pub fn create_fee_key(
    ctx: Context<CreateFeeKey>,
    locked_lp_amount: u64,
) -> Result<()> {
    let fee_key_account = &mut ctx.accounts.fee_key_account;
    let owner = ctx.accounts.owner.key();
    let current_timestamp = Clock::get()?.unix_timestamp;
    
    // Определение уровня NFT
    let tier = if locked_lp_amount < 1_000 {
        1 // Common
    } else if locked_lp_amount < 10_000 {
        2 // Rare
    } else if locked_lp_amount < 100_000 {
        3 // Epic
    } else {
        4 // Legendary
    };
    
    // Расчет множителя в зависимости от уровня
    let tier_multiplier = match tier {
        1 => 1.0,
        2 => 1.2,
        3 => 1.5,
        4 => 2.0,
        _ => 1.0,
    };
    
    // Получение общего количества взвешенных LP токенов
    let total_weighted_locked_lp = get_total_weighted_locked_lp(ctx.accounts.fee_distribution_state.to_account_info())?;
    
    // Расчет доли в пуле комиссий
    let weighted_amount = locked_lp_amount as f64 * tier_multiplier;
    let fee_share_percentage = weighted_amount / total_weighted_locked_lp * 100.0;
    
    // Инициализация аккаунта NFT Fee Key
    fee_key_account.owner = owner;
    fee_key_account.locked_lp_amount = locked_lp_amount;
    fee_key_account.lock_timestamp = current_timestamp;
    fee_key_account.fee_share_percentage = fee_share_percentage;
    fee_key_account.tier = tier;
    fee_key_account.last_claim_timestamp = current_timestamp;
    fee_key_account.total_claimed_amount = 0;
    
    // Создание NFT с использованием Metaplex
    create_nft(
        ctx.accounts.metaplex_program.to_account_info(),
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.token_account.to_account_info(),
        ctx.accounts.mint_authority.to_account_info(),
        ctx.accounts.rent.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.metadata_account.to_account_info(),
        ctx.accounts.edition_account.to_account_info(),
        format!("VC/VG Fee Key #{}", fee_key_account.key()),
        "VCFK",
        format!("Этот NFT дает право на получение {}% комиссий, генерируемых в экосистеме VC/VG.", fee_share_percentage),
        generate_nft_uri(locked_lp_amount, tier),
        vec![
            ("locked_lp_amount".to_string(), locked_lp_amount.to_string()),
            ("lock_timestamp".to_string(), current_timestamp.to_string()),
            ("fee_share_percentage".to_string(), fee_share_percentage.to_string()),
            ("tier".to_string(), get_tier_name(tier)),
        ],
    )?
    
    Ok(())
}
```

### Сбор вознаграждения

```rust
pub fn claim_fee_rewards(
    ctx: Context<ClaimFeeRewards>,
) -> Result<()> {
    let fee_key_account = &mut ctx.accounts.fee_key_account;
    let fee_distribution_state = &mut ctx.accounts.fee_distribution_state;
    let current_timestamp = Clock::get()?.unix_timestamp;
    
    // Проверка владельца NFT
    require_keys_eq!(
        fee_key_account.owner,
        ctx.accounts.owner.key(),
        ErrorCode::NotAuthorized
    );
    
    // Расчет накопленного вознаграждения
    let accumulated_fees = fee_distribution_state.total_fees_collected_since_last_distribution;
    let user_share = accumulated_fees as f64 * fee_key_account.fee_share_percentage / 100.0;
    let reward_amount = user_share as u64;
    
    // Перевод вознаграждения пользователю
    let seeds = &[
        b"fee_distribution".as_ref(),
        &[fee_distribution_state.bump],
    ];
    let signer = &[&seeds[..]]; 
    
    let cpi_accounts = Transfer {
        from: ctx.accounts.fee_vault.to_account_info(),
        to: ctx.accounts.user_sol_account.to_account_info(),
        authority: ctx.accounts.fee_distribution_state.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.system_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    
    transfer(cpi_ctx, reward_amount)?;
    
    // Обновление состояния
    fee_key_account.last_claim_timestamp = current_timestamp;
    fee_key_account.total_claimed_amount += reward_amount;
    fee_distribution_state.total_fees_distributed += reward_amount;
    
    Ok(())
}
```

### Обновление доли в пуле комиссий

При изменении общего количества заблокированных LP токенов (например, когда кто-то блокирует новые LP токены), необходимо пересчитать доли всех держателей NFT Fee Key. Это делается через механизм периодического обновления.

```rust
pub fn update_fee_shares(
    ctx: Context<UpdateFeeShares>,
) -> Result<()> {
    let fee_distribution_state = &mut ctx.accounts.fee_distribution_state;
    let current_timestamp = Clock::get()?.unix_timestamp;
    
    // Вычисление общего количества взвешенных LP токенов
    let total_weighted_locked_lp = calculate_total_weighted_locked_lp(ctx.accounts.fee_keys_iterator.to_account_info())?;
    
    // Обновление общего количества взвешенных LP токенов
    fee_distribution_state.total_weighted_locked_lp = total_weighted_locked_lp;
    fee_distribution_state.last_update_timestamp = current_timestamp;
    
    // Обновление долей для каждого NFT Fee Key
    let fee_keys = get_all_fee_keys(ctx.accounts.fee_keys_iterator.to_account_info())?;
    
    for fee_key in fee_keys {
        let tier_multiplier = match fee_key.tier {
            1 => 1.0,
            2 => 1.2,
            3 => 1.5,
            4 => 2.0,
            _ => 1.0,
        };
        
        let weighted_amount = fee_key.locked_lp_amount as f64 * tier_multiplier;
        let fee_share_percentage = weighted_amount / total_weighted_locked_lp * 100.0;
        
        update_fee_key_share(fee_key.key(), fee_share_percentage)?;
    }
    
    Ok(())
}
```

## Экономический механизм

NFT Fee Key создает экономическую ценность для участников экосистемы через:

1. **Постоянный доход**: Держатели NFT Fee Key получают постоянный доход от комиссий с транзакций VG токенов, что стимулирует долгосрочное участие.

2. **Ценность NFT**: NFT Fee Key имеет внутреннюю ценность, определяемую его долей в пуле комиссий, что создает вторичный рынок для этих NFT.

3. **Стимулирование блокировки LP токенов**: Система уровней и множителей стимулирует пользователей блокировать большие объемы LP токенов для получения NFT Fee Key высокого уровня.

4. **Циркуляция VC токенов**: Часть комиссий используется для обратного выкупа и сжигания VC токенов, что создает дополнительный спрос на VC токены и поддерживает их ценность.

## Интерфейс пользователя

Для удобства пользователей реализуется веб-интерфейс, который позволяет:

1. Просматривать информацию о своих NFT Fee Key
2. Видеть текущий уровень и долю в пуле комиссий
3. Отслеживать накопленное вознаграждение
4. Собирать вознаграждение
5. Просматривать историю полученных вознаграждений

## Заключение

NFT Fee Key является ключевым элементом экосистемы VC/VG токенов, обеспечивающим долгосрочную заинтересованность пользователей и создающим устойчивую экономическую модель. Через систему уровней и распределение комиссий NFT Fee Key стимулирует блокировку LP токенов и участие в развитии экосистемы. 