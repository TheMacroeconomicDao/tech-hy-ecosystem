# TECH-HY Smart Contracts

Смарт-контракты для экосистемы TECH-HY на блокчейне Solana.

## Структура проекта

```
code/
├── programs/              # Программы Solana
│   ├── vc-token/          # Программа для VC токена
│   ├── vg-token/          # Программа для VG токена
│   ├── burn-and-earn/     # Механизм Burn and Earn
│   ├── vc-staking/        # Стейкинг VC токенов
│   ├── vg-staking/        # Стейкинг VG токенов
│   ├── nft-fee-key/       # NFT Fee Key
│   ├── governance/        # DAO/Governance
│   └── nft-investors-hand/ # NFT-коллекция Investor's Hand
├── app/                   # Клиентская часть
│   ├── frontend/          # UI
│   └── sdk/               # SDK для работы с контрактами
├── tests/                 # Тесты
│   ├── unit/              # Модульные тесты
│   └── integration/       # Интеграционные тесты
├── scripts/               # Скрипты для настройки и запуска
├── Anchor.toml            # Конфигурация Anchor
└── target/                # Сборка программ
    └── deploy/            # Собранные программы для деплоя
```

## Требования

- Операционная система: macOS, Linux или WSL для Windows
- Node.js (версия 14 или выше)
- Rust (последняя стабильная версия)
- Solana CLI (версия 1.18.1 или выше)
- Anchor Framework (последняя версия)

## Настройка среды разработки

```bash
# Установка и настройка среды
./scripts/setup-environment.sh

# Запуск тестовой среды
./scripts/run-test-environment.sh
```

## Разработка

```bash
# Сборка программ
npm run build

# Запуск тестов
npm run test

# Запуск тестового валидатора
npm run start:validator

# Деплой в тестовую сеть
npm run deploy:dev

# Деплой в основную сеть
npm run deploy:main
```

## Программы

### VC Token

Базовый SPL токен без налога:

- Функции mint, transfer, burn
- Централизованная эмиссия
- Стандартный SPL токен

### VG Token

SPL токен с налогом 10%:

- Налогообложение при передаче
- Распределение комиссий согласно модели
- Интеграция с механизмом Burn and Earn

### Burn and Earn

Механизм обмена VC на VG:

- Обмен VC на SOL через Raydium
- Блокировка LP токенов
- Эмиссия VG токенов по формуле

### Staking VC

Стейкинг VC токенов:

- Блокировка на 90 дней
- Интеграция с NFT-бустерами
- Возможность досрочного вывода с комиссией

### NFT Fee Key

Ключи для получения комиссий:

- Уровни: Common, Rare, Epic, Legendary
- Распределение комиссий по типам
- Интеграция с VG токеном

### Staking VG

Стейкинг VG токенов:

- Различные периоды блокировки
- Автокомпаундинг
- Интеграция с DAO уровнями

## План разработки

Полный план разработки смотрите в файле `/PRD/development-plan.md` 