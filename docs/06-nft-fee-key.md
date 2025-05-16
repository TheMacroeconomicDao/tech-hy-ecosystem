# NFT Fee Key

## Overview

The NFT Fee Key is a special non-fungible token (NFT) that provides its holders with a share of the VG token transaction tax collected in the TECH HY ecosystem. This mechanism is designed to incentivize early supporters, key contributors, and ecosystem partners.

## Key Features

- **Limited supply**: Only 100 NFT Fee Keys will be issued
- **Share in VG tax**: Holders receive 50% of all VG transaction taxes
- **Tradable**: NFT Fee Keys can be freely traded on the secondary market
- **On-chain distribution**: All rewards are distributed automatically via smart contracts

## Distribution of NFT Fee Keys

NFT Fee Keys are distributed as follows:
- 50 to early investors and partners
- 30 to the project team and advisors
- 20 reserved for future ecosystem development and community rewards

## VG Tax Distribution Mechanism

- Every VG token transaction is subject to a 10% tax
- 50% of the collected tax is distributed among all NFT Fee Key holders
- 50% goes to the DAO treasury
- Distribution is performed automatically by the smart contract

## Reward Calculation Example

Suppose 1,000,000 VG tokens are transacted in a day:
- Tax collected: 100,000 VG (10%)
- Amount distributed to NFT Fee Key holders: 50,000 VG (50%)
- Each NFT Fee Key holder receives: 50,000 VG / 100 = 500 VG

## Technical Implementation

### Data Structures

- **NFT Fee Key Account**: Stores information about the NFT, including owner, mint address, and reward history
- **Reward Pool Account**: Accumulates VG tax for distribution

### Instructions

1. **Claim rewards**
   - Holder calls the claim function
   - Smart contract calculates the share and transfers VG tokens to the holder
2. **Transfer NFT Fee Key**
   - NFT can be transferred or sold on the secondary market
   - New owner receives future rewards

## Security Considerations

- Only the NFT owner can claim rewards
- Double claiming is prevented by tracking reward history
- All calculations and distributions are performed on-chain

## Benefits for the Ecosystem

- Incentivizes early supporters and key contributors
- Ensures fair and transparent distribution of VG tax
- Creates a new class of valuable, tradable NFTs

## Related Documents

- [VG Token Staking](./05-vg-staking.md)
- [Investor's Hand NFT Collection](./04.5-investors-hand-nft.md.md)
- [Governance and DAO](./07-governance.md)

## Характеристики
- **Получение**: При блокировке LP токенов в "Burn and Earn"
- **Назначение**: Получение части налога с транзакций VG (10%)
- **Передаваемость**: Может быть продан или передан другому пользователю

## Уровни NFT
| Уровень   | LP токены | Множитель |
|-----------|-----------|-----------|
| Common    | < 1,000   | 1.0x      |
| Rare      | 1K - 10K  | 1.2x      |
| Epic      | 10K - 100K| 1.5x      |
| Legendary | > 100K    | 2.0x      |

## Метаданные NFT
- **Название**: VC/VG Fee Key #{id}
- **Символ**: VCFK
- **Атрибуты**:
  - `locked_lp_amount`: Количество заблокированных LP
  - `lock_timestamp`: Время блокировки (Unix timestamp)
  - `fee_share_percentage`: Процент от общего пула комиссий
  - `tier`: Уровень NFT (Common, Rare, Epic, Legendary)

## Расчет доли в комиссиях
```
share_percentage = (user_locked_lp * tier_multiplier) / total_weighted_locked_lp * 100%
```

## Технические аспекты реализации

### Структуры данных
1. **Аккаунт NFT Fee Key**:
   - Владелец
   - Количество заблокированных LP
   - Временная метка блокировки
   - Процент доли в пуле комиссий
   - Уровень NFT (1-4)
   - Временная метка последнего сбора вознаграждения
   - Общая сумма собранного вознаграждения
   - Бамп для PDA

2. **Хранилище распределения комиссий**:
   - Адрес управляющего
   - Адрес токен-аккаунта
   - Общая сумма собранных комиссий
   - Общая сумма распределенных комиссий
   - Временная метка последнего распределения
   - Бамп для PDA

### Ключевые функции
1. **Создание NFT Fee Key**:
   - Определение уровня NFT
   - Расчет доли в пуле комиссий
   - Инициализация аккаунта
   - Создание NFT через Metaplex

2. **Сбор вознаграждения**:
   - Проверка владения NFT
   - Расчет накопленного вознаграждения
   - Перевод на кошелек пользователя
   - Обновление состояния

3. **Обновление долей в пуле**:
   - Пересчет при изменении общего количества заблокированных LP токенов
   - Обновление `total_weighted_locked_lp`
   - Актуализация долей для каждого NFT 