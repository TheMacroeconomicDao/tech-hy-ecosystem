# Формула расчета периода стейкинга VG токенов

## Обзор

Данный документ описывает математическую модель и алгоритм расчета периода стейкинга для VG токенов в зависимости от количества токенов и наличия NFT-бустера из коллекции "Investor's Hand".

## Система тиров и периодов стейкинга

В соответствии со структурой DAO, периоды стейкинга зависят от уровня (тира) пользователя:

| Уровень         | Требования VG              | Базовый период | Доп. требования |
|-----------------|----------------------------|----------------|-----------------|
| Starter         | до 100 VG                  | 7 дней         | -               |
| Community Member| 100-500 VG                 | 14 дней        | -               |
| Contributor     | 500-1500 VG                | 30 дней        | -               |
| Founder         | 1500-4000 VG               | 60 дней        | -               |
| Expert          | 4000-25000 VG              | 90 дней        | -               |
| Investor        | 25000-50000 VG             | 365 дней       | Steel Hand+     |
| Launchpad Master| 50000-70000 VG             | 365 дней       | Titanium Hand+  |
| Partner         | более 70000 VG             | 365 дней       | Diamond Hand    |
| Angel           | любое количество           | Безлимитный    | Angel NFT       |

## Применение NFT-бустеров для сокращения периода

NFT-бустеры из коллекции "Investor's Hand" применяются для сокращения базового периода стейкинга:

| Уровень NFT    | Множитель | Формула сокращения          | Пример (90 дней)         |
|----------------|-----------|-----------------------------|-----------------------------|
| Paper Hand     | 1.1x      | `период * (1 - 0.1)`        | 90 * 0.9 = 81 день          |
| Wooden Hand    | 1.25x     | `период * (1 - 0.25)`       | 90 * 0.75 = 67.5 ≈ 68 дней  |
| Steel Hand     | 1.5x      | `период * (1 - 0.5)`        | 90 * 0.5 = 45 дней          |
| Titanium Hand  | 1.75x     | `период * (1 - 0.75)`       | 90 * 0.25 = 22.5 ≈ 23 дня   |
| Diamond Hand   | 2.0x      | `период * (1 - 1.0)`        | 90 * 0 = 0 дней (мин. 1 день)|
| Angel NFT      | -         | Безлимитный период          | Безлимитно                  |

## Базовый алгоритм расчета в понятном виде

Процесс определения периода стейкинга для VG токенов можно описать в несколько простых шагов:

1. **Шаг 1: Определение базового периода по количеству VG**
   - До 100 VG → 7 дней (Starter)
   - 100-500 VG → 14 дней (Community Member)
   - 500-1500 VG → 30 дней (Contributor)
   - 1500-4000 VG → 60 дней (Founder)
   - 4000-25000 VG → 90 дней (Expert)
   - Более 25000 VG → 365 дней (Investor, Launchpad Master, Partner)

2. **Шаг 2: Проверка особых условий**
   - Если у пользователя есть Angel NFT → период стейкинга безлимитный, расчет завершен
   - Если уровень 25000-50000 VG (Investor), требуется NFT Steel Hand или выше
   - Если уровень 50000-70000 VG (Launchpad Master), требуется NFT Titanium Hand или выше
   - Если уровень более 70000 VG (Partner), требуется NFT Diamond Hand

3. **Шаг 3: Применение множителя от NFT-бустера**
   - Paper Hand (1.1x) → базовый период уменьшается на 10%
   - Wooden Hand (1.25x) → базовый период уменьшается на 25%
   - Steel Hand (1.5x) → базовый период уменьшается на 50%
   - Titanium Hand (1.75x) → базовый период уменьшается на 75%
   - Diamond Hand (2.0x) → базовый период уменьшается на 100% (но не менее 1 дня)

4. **Шаг 4: Проверка минимального периода**
   - Если рассчитанный период меньше 1 дня → установить период в 1 день

5. **Шаг 5: Проверка на автоматическое реинвестирование**
   - Если количество VG больше 10,000 → активируется автореинвестирование
   - 70% токенов автоматически реинвестируются по окончании периода
   - 30% токенов становятся доступны для вывода

**Пример:**
Пользователь хочет застейкать 6,000 VG и имеет NFT Steel Hand:
- По количеству токенов: 6,000 VG → 90 дней (уровень Expert)
- Множитель Steel Hand: 1.5x → уменьшение на 50%
- Расчет: 90 дней * 0.5 = 45 дней
- Итоговый период стейкинга: 45 дней

## Базовый алгоритм расчета

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

## Автоматическое реинвестирование

При стейкинге более 10,000 VG токенов активируется механизм автоматического реинвестирования:

```rust
pub fn is_auto_reinvestment(amount: u64) -> bool {
    amount >= 10_000 * 10u64.pow(9) // 10,000 VG с учетом десятичных знаков
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

После окончания периода стейкинга:
- 70% токенов автоматически реинвестируются на новый период
- 30% токенов доступны для вывода

## Особенности стейкинга различных уровней

### Уровни Starter и Community Member
- Автоматический анстейкинг после завершения периода
- Недоступен ранний анстейкинг
- Базовые функции:

```rust
pub fn can_early_unstake(vg_amount: u64) -> bool {
    vg_amount > 1_500 * 10u64.pow(9) // Founder tier и выше
}

pub fn can_increase_stake(vg_amount: u64) -> bool {
    vg_amount > 500 * 10u64.pow(9) // Contributor tier и выше
}
```

### Уровни Investor, Launchpad Master, Partner
- Требуется соответствующий уровень NFT-бустера
- Еженедельный автокомпаундинг

```rust
pub fn get_compounding_type(amount: u64, has_angel_nft: bool) -> u8 {
    if has_angel_nft {
        return 1; // Ежедневный компаундинг
    }
    
    if amount > 25_000 * 10u64.pow(9) {
        return 2; // Еженедельный компаундинг
    }
    
    return 0; // Отсутствие автокомпаундинга
}
```

## Примеры расчета

### Пример 1: Уровень Expert (4000-25000 VG) с Wooden Hand NFT

```
Входные данные:
- Количество VG: 5,000
- NFT-бустер: Wooden Hand (множитель 1.25x)

Расчет:
1. Базовый период для 5,000 VG = 90 дней (уровень Expert)
2. Применение множителя Wooden Hand: 90 * (1 - 0.25) = 90 * 0.75 = 67.5
3. Округление: 68 дней
```

### Пример 2: Уровень Investor (25000-50000 VG) с Steel Hand NFT

```
Входные данные:
- Количество VG: 30,000
- NFT-бустер: Steel Hand (множитель 1.5x)

Расчет:
1. Базовый период для 30,000 VG = 365 дней (уровень Investor)
2. Применение множителя Steel Hand: 365 * (1 - 0.5) = 365 * 0.5 = 182.5
3. Округление: 183 дня
```

### Пример 3: Уровень Partner (более 70000 VG) с Diamond Hand NFT

```
Входные данные:
- Количество VG: 80,000
- NFT-бустер: Diamond Hand (множитель 2.0x)

Расчет:
1. Базовый период для 80,000 VG = 365 дней (уровень Partner)
2. Применение множителя Diamond Hand: 365 * (1 - 1.0) = 365 * 0 = 0
3. Применение минимального ограничения: 1 день
```

### Пример 4: Любой уровень с Angel NFT

```
Входные данные:
- Количество VG: любое
- NFT-бустер: Angel NFT

Расчет:
- Безлимитный период стейкинга
- Ежедневный автокомпаундинг
```

## Ограничения и правила

1. **Минимальный период стейкинга**: 1 день
2. **Максимальный период стейкинга**: 365 дней (для высших уровней без NFT)
3. **Округление**: все периоды округляются до целых дней
4. **Правило приоритета**: Angel NFT имеет высший приоритет и всегда обеспечивает безлимитный период

## Особые случаи

### Недостаточный уровень NFT для высших тиров DAO

Если пользователь пытается застейкать количество VG, соответствующее высшему уровню DAO (Investor, Launchpad Master, Partner), но не имеет NFT требуемого уровня, транзакция будет отклонена с соответствующей ошибкой:

```rust
pub fn validate_dao_tier_requirements(
    vg_amount: u64,
    nft_tier: Option<u8>
) -> Result<()> {
    if vg_amount > 25_000 * 10u64.pow(9) && vg_amount <= 50_000 * 10u64.pow(9) {
        // Уровень Investor требует Steel Hand+ (уровень 3+)
        require!(
            nft_tier.is_some() && nft_tier.unwrap() >= 3,
            ErrorCode::InsufficientNftTier
        );
    } else if vg_amount > 50_000 * 10u64.pow(9) && vg_amount <= 70_000 * 10u64.pow(9) {
        // Уровень Launchpad Master требует Titanium Hand+ (уровень 4+)
        require!(
            nft_tier.is_some() && nft_tier.unwrap() >= 4,
            ErrorCode::InsufficientNftTier
        );
    } else if vg_amount > 70_000 * 10u64.pow(9) {
        // Уровень Partner требует Diamond Hand (уровень 5)
        require!(
            nft_tier.is_some() && nft_tier.unwrap() == 5,
            ErrorCode::InsufficientNftTier
        );
    }
    
    Ok(())
}
```

## Управление параметрами формулы через DAO

Параметры формулы и структура тиров могут быть изменены через DAO. Для этого используется следующая структура:

```rust
#[account]
pub struct StakingParameters {
    // Базовые периоды для каждого тира
    pub starter_period: u64,        // Базовый период для Starter
    pub community_period: u64,      // Базовый период для Community Member
    pub contributor_period: u64,    // Базовый период для Contributor
    pub founder_period: u64,        // Базовый период для Founder
    pub expert_period: u64,         // Базовый период для Expert
    pub investor_period: u64,       // Базовый период для Investor+
    
    // Границы тиров (в VG токенах)
    pub community_min: u64,         // Минимум для Community Member
    pub contributor_min: u64,       // Минимум для Contributor
    pub founder_min: u64,           // Минимум для Founder
    pub expert_min: u64,            // Минимум для Expert
    pub investor_min: u64,          // Минимум для Investor
    pub launchpad_min: u64,         // Минимум для Launchpad Master
    pub partner_min: u64,           // Минимум для Partner
    
    // Параметры автоматического реинвестирования
    pub reinvestment_threshold: u64, // Порог для автореинвестирования
    pub reinvestment_percent: u8,    // Процент реинвестирования (1-100)
    
    // Служебные поля
    pub authority: Pubkey,           // Адрес управляющего (DAO)
    pub last_update: i64,            // Время последнего обновления
    pub bump: u8,
}
```

Предложение DAO для изменения параметров стейкинга имеет следующий формат:

```rust
pub struct UpdateStakingParametersProposal {
    pub parameter_name: String,   // Название изменяемого параметра
    pub new_value: u64,          // Новое значение параметра
    pub explanation: String,     // Обоснование изменения
}
```

## Связь с другими компонентами экосистемы

Формула расчета периода стейкинга VG интегрирована с:

1. **NFT-коллекцией "Investor's Hand"** - для применения множителей к периоду стейкинга
2. **DAO и Governance** - для управления параметрами формулы
3. **Стейкингом VG токенов** - для определения периода блокировки

## Заключение

Система расчета периода стейкинга VG токенов предоставляет гибкий механизм, позволяющий:
- Создать многоуровневую структуру DAO с различными привилегиями
- Интегрировать NFT-бустеры для улучшения условий стейкинга
- Стимулировать долгосрочное участие в экосистеме
- Обеспечить прозрачную и предсказуемую систему расчетов для пользователей

## Связанные документы

- [Стейкинг VG токенов](../05-vg-staking.md)
- [Стейкинг VC токенов и NFT-бустеры](../04-vc-staking.md)
- [NFT-коллекция "Investor's Hand"](../investors-hand-nft.md)
- [Governance и DAO](../07-governance.md) 