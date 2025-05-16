# Investor's Hand NFT Integration

## Overview

This document describes the integration of the "Investor's Hand" NFT collection into the TECH HY ecosystem, including its use as a booster in staking and other mechanisms.

## NFT Collection Description

- The "Investor's Hand" collection consists of unique NFTs with different rarity levels (Common, Rare, Epic, Legendary).
- Each NFT has metadata including:
  - Unique identifier
  - Rarity
  - Image/animation
  - Owner address
  - Booster multiplier value

## Use Cases in the Ecosystem

### 1. Staking Booster
- NFTs from the collection can be used as boosters when staking VG tokens.
- The booster multiplier depends on the NFT's rarity:
  - Common: 0.1
  - Rare: 0.2
  - Epic: 0.3
  - Legendary: 0.5
- Only one NFT can be used as a booster per staking position.
- The NFT must be owned by the user and locked for the staking period.

### 2. DAO Voting Power
- Holding an NFT increases the user's voting power in the DAO.
- The increase is proportional to the NFT's rarity.

### 3. Additional Ecosystem Benefits
- Access to exclusive features, airdrops, or events for NFT holders.
- Priority participation in ecosystem launches.

## Integration Process

1. **NFT Ownership Verification**:
   - The system checks that the user owns the NFT and that it is not used in another staking position.
2. **NFT Locking**:
   - The NFT is locked for the duration of the staking or until the user withdraws their position.
3. **Booster Application**:
   - The booster multiplier is applied to the staking reward formula.
4. **Unlocking**:
   - After the staking period ends, the NFT is unlocked and returned to the user.

## Security and Fairness Considerations

- Only NFTs from the official "Investor's Hand" collection are eligible.
- The system prevents double use of the same NFT in multiple positions.
- All operations are transparent and verifiable on-chain.

## Smart Contract Requirements

- NFT ownership and locking logic must be implemented in the staking contract.
- Booster multipliers must be read from NFT metadata.
- The contract must support unlocking and returning NFTs after staking ends.

## Example Workflow

1. User selects an NFT from their wallet to use as a booster.
2. The system verifies ownership and locks the NFT.
3. The user stakes VG tokens, and the booster is applied.
4. After the staking period, the user withdraws their tokens and the NFT is unlocked.

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

- VC Staking Program вызывает функцию mint_nft в Investor's Hand NFT Program
- Передаются данные о пользователе и стейкинге VC
- NFT создается с соответствующим уровнем в зависимости от стейкинга

### 2. Обработка создания NFT в Investor's Hand NFT Program

- Проверка авторизации вызова от VC Staking Program
- Инициализация аккаунта NFT с соответствующими параметрами
- Установка множителя бустера в зависимости от уровня NFT
- Создание метаданных NFT через Metaplex

## Технические детали интеграции с VG Staking Program

### 1. Применение NFT-бустера при стейкинге VG

- Проверка владельца NFT
- Проверка, что NFT не используется в другом стейкинге
- Применение NFT-бустера через вызов Investor's Hand NFT Program
- Проверка требований для высших уровней DAO
- Определение периода стейкинга с учетом NFT-бустера

### 2. Обработка применения NFT в Investor's Hand NFT Program

- Проверка владельца NFT
- Проверка статуса NFT (не используется)
- Обновление статуса NFT как используемого для стейкинга VG
- Сохранение связи с аккаунтом стейкинга VG

### 3. Деактивация NFT-бустера после завершения стейкинга VG

- При анстейкинге VG, проверка наличия NFT-бустера
- Вызов функции деактивации NFT в Investor's Hand NFT Program
- Передача необходимых данных для деактивации

### 4. Обработка деактивации NFT в Investor's Hand NFT Program

- Проверка авторизации (владелец или VG Staking Program)
- Проверка, что NFT используется
- Обновление статуса NFT и удаление связи с аккаунтом стейкинга VG

## Технические детали интеграции с DAO

### 1. Проверка NFT при определении уровня DAO

- Получение информации о стейкинге VG
- Определение базового уровня DAO на основе количества VG
- Проверка NFT для высших уровней DAO:
  - Angel NFT: специальный уровень Angel
  - Diamond Hand + >70k VG: Partner
  - Titanium Hand+ + 50k-70k VG: Launchpad Master
  - Steel Hand+ + 25k-50k VG: Investor
- Создание/обновление аккаунта члена DAO с соответствующим уровнем

## Алгоритм расчета периода стейкинга с учетом NFT-бустера

- Определение базового периода стейкинга на основе количества VG
- Проверка на Angel NFT (безлимитный период)
- Применение множителя NFT-бустера для расчета итогового периода
- Обеспечение минимального периода стейкинга в 1 день

## Обработка ошибок и граничных случаев

### Коды ошибок для Investor's Hand NFT Program

- NotAuthorized - операция не авторизована
- InvalidNftLevel - невалидный уровень NFT
- NftAlreadyInUse - NFT уже используется для стейкинга
- NftNotInUse - NFT не используется для стейкинга
- NftAccountNotProvided - аккаунт NFT не предоставлен
- VgStakingAccountNotFound - аккаунт стейкинга VG не найден
- InsufficientNftTier - недостаточный уровень NFT для требуемого уровня DAO
- NftRequiredForHighTier - для высшего уровня DAO требуется NFT

### Защитные проверки при создании NFT

- Проверка, что вызов произошел от VC Staking Program или авторизованной администрации
- Ограничение на создание высших уровней NFT

### Защитные проверки при применении NFT

- Проверка соответствия уровня NFT для высших уровней DAO:
  - Для стейкинга 25k-50k VG требуется NFT уровня Steel Hand или выше
  - Для стейкинга 50k-70k VG требуется NFT уровня Titanium Hand или выше
  - Для стейкинга >70k VG требуется NFT уровня Diamond Hand

## Заключение

Интеграция NFT-коллекции "Investor's Hand" с другими компонентами экосистемы VC/VG обеспечивает:

1. **Бесшовный пользовательский опыт** - получение NFT при стейкинге VC и автоматическое применение бонусов при стейкинге VG
2. **Улучшенную безопасность** - строгие проверки на всех этапах интеграции защищают от несанкционированного использования
3. **Гибкую систему стимулов** - различные уровни NFT обеспечивают разные преимущества и доступ к разным уровням DAO
4. **Техническую надежность** - чётко определенные интерфейсы между программами и строгий контроль авторизации

Данная интеграция создаёт единую экосистему, в которой действия пользователей в одной части системы влияют на их возможности в других частях, что способствует долгосрочной вовлеченности и устойчивости проекта. 