# VG Staking Formula

## Overview

This document describes the formula for calculating rewards for staking VG tokens, including the use of NFT boosters. The formula is designed to incentivize long-term staking and the use of boosters.

## Base Formula

The reward for staking VG tokens is calculated as follows:

```
Reward = VG_staked * R * D * (1 + B * NFT_booster)
```

Where:
- `Reward` — total reward for the staking period
- `VG_staked` — amount of VG tokens staked
- `R` — base reward rate per day
- `D` — number of staking days
- `B` — booster coefficient
- `NFT_booster` — booster multiplier from NFT (if any)

## Explanation of Formula Components

### Base Reward Rate (R)

The base reward rate determines the daily reward for staking VG tokens. By default, it is set to 0.01 (1% per day).

### Booster Coefficient (B)

The booster coefficient determines the effect of NFT boosters on the reward. By default, it is set to 0.5, providing a significant bonus for using boosters.

### NFT Booster Multiplier

The NFT booster multiplier is determined by the rarity and type of the NFT used as a booster. For example:
- Common NFT: 0.1
- Rare NFT: 0.2
- Epic NFT: 0.3
- Legendary NFT: 0.5

## Calculation Examples

### Example 1: Staking Without Booster

```
Input:
- VG_staked: 1,000
- R: 0.01
- D: 30
- B: 0.5
- NFT_booster: 0

Calculation:
Reward = 1,000 * 0.01 * 30 * (1 + 0.5 * 0)
Reward = 1,000 * 0.01 * 30 * 1
Reward = 1,000 * 0.3
Reward = 300
```

### Example 2: Staking With Rare NFT Booster

```
Input:
- VG_staked: 1,000
- R: 0.01
- D: 30
- B: 0.5
- NFT_booster: 0.2

Calculation:
Reward = 1,000 * 0.01 * 30 * (1 + 0.5 * 0.2)
Reward = 1,000 * 0.01 * 30 * (1 + 0.1)
Reward = 1,000 * 0.01 * 30 * 1.1
Reward = 1,000 * 0.33
Reward = 330
```

### Example 3: Staking With Legendary NFT Booster

```
Input:
- VG_staked: 1,000
- R: 0.01
- D: 30
- B: 0.5
- NFT_booster: 0.5

Calculation:
Reward = 1,000 * 0.01 * 30 * (1 + 0.5 * 0.5)
Reward = 1,000 * 0.01 * 30 * (1 + 0.25)
Reward = 1,000 * 0.01 * 30 * 1.25
Reward = 1,000 * 0.375
Reward = 375
```

## Parameter Management via DAO

The parameters of the formula (base reward rate, booster coefficient) can be changed via DAO voting, allowing the community to adjust staking incentives.

## Security and Efficiency Considerations

1. **Overflow Handling**:
   - The calculation function must handle overflow and return an error if it occurs
2. **Rounding**:
   - The result is rounded to the nearest integer using the `round()` method
3. **Manipulation Prevention**:
   - Only the DAO can change formula parameters
4. **NFT Booster Validation**:
   - Only valid NFTs from the approved collection can be used as boosters

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

## Применение NFT-бустеров для увеличения стейкинг-мультипликатора

NFT-бустеры из коллекции "Investor's Hand" применяются для увеличения стейкинг-мультипликатора:

| Уровень NFT    | Множитель | Эффект на стейкинг-мультипликатор | Преимущества               |
|----------------|-----------|----------------------------------|-----------------------------|
| Paper Hand     | 1.1x      | Увеличение на 10%                | Повышенная доходность на 10%  |
| Wooden Hand    | 1.25x     | Увеличение на 25%                | Повышенная доходность на 25%  |
| Steel Hand     | 1.5x      | Увеличение на 50%                | Повышенная доходность на 50%  |
| Titanium Hand  | 1.75x     | Увеличение на 75%                | Повышенная доходность на 75%  |
| Diamond Hand   | 2.0x      | Увеличение на 100%               | Двойная доходность            |
| Angel NFT      | -         | Безлимитный период                | Безлимитно                   |

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
   - Paper Hand (1.1x) → увеличение стейкинг-мультипликатора на 10%
   - Wooden Hand (1.25x) → увеличение стейкинг-мультипликатора на 25%
   - Steel Hand (1.5x) → увеличение стейкинг-мультипликатора на 50%
   - Titanium Hand (1.75x) → увеличение стейкинг-мультипликатора на 75%
   - Diamond Hand (2.0x) → увеличение стейкинг-мультипликатора на 100%

4. **Шаг 4: Проверка на автоматическое реинвестирование**
   - Если количество VG больше 10,000 → активируется автореинвестирование
   - 100% токенов автоматически реинвестируются по окончании периода
   - При этом доступно досрочное снятие всего депозита или его части

**Пример:**
Пользователь хочет застейкать 6,000 VG и имеет NFT Steel Hand:
- По количеству токенов: 6,000 VG → 90 дней (уровень Expert)
- Множитель Steel Hand: 1.5x → увеличение стейкинг-мультипликатора на 50%
- Базовый период стейкинга: 90 дней
- Итоговая доходность: базовая ставка * 1.5

## Автоматическое реинвестирование

При стейкинге более 10,000 VG токенов активируется механизм автоматического реинвестирования:

После окончания периода стейкинга:
- 100% токенов автоматически реинвестируются на новый период
- Доступно досрочное снятие всего депозита или его части при необходимости

## Особенности стейкинга различных уровней

### Уровни Starter и Community Member
- Автоматический анстейкинг после завершения периода
- Недоступен ранний анстейкинг
- Минимальный период стейкинга: 7 дней
- Базовые функции

### Уровни Investor, Launchpad Master, Partner
- Требуется соответствующий уровень NFT-бустера
- Еженедельный автокомпаундинг

## Примеры расчета

### Пример 1: Уровень Expert (4000-25000 VG) с Wooden Hand NFT

```
Входные данные:
- Количество VG: 5,000
- NFT-бустер: Wooden Hand (множитель 1.25x)

Расчет:
1. Базовый период для 5,000 VG = 90 дней (уровень Expert)
2. Применение множителя Wooden Hand: базовая доходность * 1.25 = +25% к доходности
3. Итоговый период стейкинга: 90 дней
4. Итоговый множитель доходности: 1.25x
```

### Пример 2: Уровень Investor (25000-50000 VG) с Steel Hand NFT

```
Входные данные:
- Количество VG: 30,000
- NFT-бустер: Steel Hand (множитель 1.5x)

Расчет:
1. Базовый период для 30,000 VG = 365 дней (уровень Investor)
2. Применение множителя Steel Hand: базовая доходность * 1.5 = +50% к доходности
3. Итоговый период стейкинга: 365 дней
4. Итоговый множитель доходности: 1.5x
```

### Пример 3: Уровень Partner (более 70000 VG) с Diamond Hand NFT

```
Входные данные:
- Количество VG: 80,000
- NFT-бустер: Diamond Hand (множитель 2.0x)

Расчет:
1. Базовый период для 80,000 VG = 365 дней (уровень Partner)
2. Применение множителя Diamond Hand: базовая доходность * 2.0 = +100% к доходности
3. Итоговый период стейкинга: 365 дней
4. Итоговый множитель доходности: 2.0x
```

### Пример 4: Любой уровень с Angel NFT

```
Входные данные:
- Количество VG: любое
- NFT-бустер: Angel NFT

Расчет:
- Безлимитный период стейкинга
- Ежедневный автокомпаундинг
- Итоговый множитель доходности: 2.5x
```

## Ограничения и правила

1. **Минимальный период стейкинга**: 7 дней
2. **Максимальный период стейкинга**: 365 дней (для высших уровней без NFT)
3. **Округление**: все периоды округляются до целых дней
4. **Правило приоритета**: Angel NFT имеет высший приоритет и всегда обеспечивает безлимитный период

## Особые случаи

### Недостаточный уровень NFT для высших тиров DAO

Если пользователь пытается застейкать количество VG, соответствующее высшему уровню DAO (Investor, Launchpad Master, Partner), но не имеет NFT требуемого уровня, транзакция будет отклонена с соответствующей ошибкой.

## Управление параметрами формулы через DAO

Параметры формулы и структура тиров могут быть изменены через DAO. Для этого используется соответствующая структура, которая включает:

- Базовые периоды для каждого тира
- Границы тиров (в VG токенах)
- Параметры NFT-бустеров 
- Параметры автоматического реинвестирования
- Служебные поля

## Связь с другими компонентами экосистемы

Формула расчета периода стейкинга VG интегрирована с:

1. **NFT-коллекцией "Investor's Hand"** - для применения множителей к периоду стейкинга
2. **DAO и Governance** - для управления параметрами формулы
3. **Стейкингом VG токенов** - для определения периода блокировки

## Заключение

Система стейкинга VG токенов предоставляет гибкий механизм, позволяющий:
- Создать многоуровневую структуру DAO с различными привилегиями
- Интегрировать NFT-бустеры для увеличения стейкинг-мультипликатора
- Стимулировать долгосрочное участие в экосистеме
- Обеспечить прозрачную и предсказуемую систему для пользователей

## Связанные документы

- [Стейкинг VG токенов](../05-vg-staking.md)
- [Стейкинг VC токенов и NFT-бустеры](../04-vc-staking.md)
- [NFT-коллекция "Investor's Hand"](../investors-hand-nft.md)
- [Governance и DAO](../07-governance.md) 