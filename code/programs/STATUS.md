# Статус разработки экосистемы TECH-HY

## Общий прогресс

| Компонент | Статус | Прогресс | Зависимости | Следующие шаги |
|-----------|--------|----------|-------------|----------------|
| [VC Token](#vc-token) | ✅ Завершён (Требует финальной проверки отзыва mint_authority) | 100% | - | Документация и аудит |
| [VG Token](#vg-token) | 🔄 В доработке (Приведение в соответствие с PRD) | 100% | - | Документация и аудит |
| [Burn and Earn](#burn-and-earn) | 🔄 В разработке | 0% | VC Token, VG Token, Raydium API | Начало разработки |
| [VC Staking](#vc-staking) | 📅 Запланирован | 0% | VC Token | - |
| [NFT Investor's Hand](#nft-investors-hand) | 📅 Запланирован | 0% | VC Staking | - |
| [VG Staking](#vg-staking) | 📅 Запланирован | 0% | VG Token | - |
| [NFT Fee Key](#nft-fee-key) | 📅 Запланирован | 0% | VG Token, Burn and Earn | - |
| [Governance (DAO)](#governance-dao) | 📅 Запланирован | 0% | VC Token, VG Token | - |

## Детали по компонентам

### VC Token

**Статус**: ✅ Завершён (Требует финальной проверки отзыва mint_authority)  
**Описание**: Базовый SPL токен без налога на транзакции.

**Реализованные функции**:
- [x] Основная структура токена с PDA архитектурой
- [x] Полная эмиссия 5 млрд токенов при инициализации
- [x] Интеграция с Metaplex для метаданных
- [x] Отсутствие freeze authority для безопасности пользователей
- [x] Тесты всех основных функций

**Технический долг**:
- [ ] Проверить и убедиться, что mint_authority для VC токена корректно отзывается и не может быть восстановлен.
- [x] Добавить дополнительные тесты для крайних случаев
- [x] Оптимизировать использование вычислительных единиц

### VG Token

**Статус**: 🔄 В доработке (Приведение в соответствие с PRD)  
**Описание**: Governance SPL токен с налогом 10%.

**Реализованные функции (до правок)**:
- [x] Модификация SPL токена для взимания 10% налога на транзакции (через кастомную инструкцию transfer)
- [x] Механизм распределения налога (50% NFT Fee Key, 50% казна DAO)
- [x] Интеграция с Metaplex для метаданных
- [-] Установка freeze authority для мультисиг DAO (УДАЛЕНО)
- [x] Тесты всех основных функций

**Внесенные изменения**:
- [x] Реализована полная эмиссия 1 млрд. токенов при инициализации на специальный эскроу-счет.
- [x] Mint authority теперь отзывается сразу после начальной полной эмиссии.
- [x] Freeze authority теперь отсутствует (не устанавливается и не может быть установлен).
- [x] Удалена возможность дополнительного минтинга токенов после инициализации.

**Технический долг**:
- [ ] Рассмотреть переход на Token-2022 Transfer Hook для реализации механизма налога (вместо текущей кастомной инструкции `transfer`).
- [ ] Убедиться, что `update_authority` метаданных VG токена контролируется DAO.
- [x] Добавить интеграционные тесты с имитацией NFT Fee Key
- [x] Оптимизировать расчеты налогов для снижения вычислительных затрат
- [x] Расширить защиту от переполнения при расчетах налога

### Burn and Earn

**Статус**: 🔄 В разработке  
**Описание**: Механизм конвертации VC в LP и распределения VG.

**Требования**:
- [ ] Исследование интеграции с Raydium API
- [ ] Реализация конвертации VC в LP токены
- [ ] Постоянная блокировка LP токенов
- [ ] Формула распределения VG на основе заблокированных LP
- [ ] CPI для перевода VG токенов с эскроу-счета (вместо минтинга)
- [ ] Создание NFT Fee Key

**Формула эмиссии VG**:
```
VG = LP * C * (1 + B * log10(LP/LP_min))
```
где:
- `LP` - количество заблокированных LP токенов
- `C` - базовый коэффициент (C = 10)
- `B` - бонусный коэффициент (B = 0.2)
- `LP_min` - минимальное количество LP (LP_min = 1)

### VC Staking

**Статус**: 📅 Запланирован  
**Описание**: Система стейкинга VC с созданием NFT-бустеров.

**Требования**:
- [ ] Блокировка 1 млн VC на 90 дней
- [ ] Механизм создания NFT-бустеров разных уровней
- [ ] Функционал вывода токенов по истечении периода

### NFT Investor's Hand

**Статус**: 📅 Запланирован  
**Описание**: Коллекция NFT бустеров для увеличения доходности.

**Требования**:
- [ ] Интеграция с Metaplex NFT Standard
- [ ] Создание NFT разных уровней с метаданными
- [ ] Логика проверки NFT для получения бустов

### VG Staking

**Статус**: 📅 Запланирован  
**Описание**: Система стейкинга VG с многоуровневой структурой.

**Требования**:
- [ ] Многоуровневая система стейкинга
- [ ] Механизм применения NFT-бустеров
- [ ] Автоматическое реинвестирование
- [ ] Интеграция с системой DAO для уровней доступа

### NFT Fee Key

**Статус**: 📅 Запланирован  
**Описание**: NFT для получения доли комиссий с транзакций VG.

**Требования**:
- [ ] Создание NFT четырех уровней
- [ ] Механизм распределения комиссий между держателями
- [ ] Интеграция с VG токеном для получения налога
- [ ] Интеграция с Burn and Earn для создания NFT

### Governance (DAO)

**Статус**: 📅 Запланирован  
**Описание**: Система децентрализованного управления экосистемой.

**Требования**:
- [ ] Интеграция с Realms
- [ ] Уровни доступа в зависимости от стейкинга
- [ ] Механизмы создания предложений и голосования
- [ ] Управление казной DAO
- [ ] Аварийное управление с мультисигнатурой

## Текущие приоритеты

1. **Разработка Burn and Earn**
   - Исследование интеграции с Raydium API
   - Определение структуры данных для хранения заблокированных LP
   - Реализация формулы эмиссии VG

2. **Подготовка к интеграции с Raydium**
   - Создание тестового пула ликвидности
   - Изучение API для взаимодействия с пулом

3. **Улучшение существующих компонентов**
   - ✅ Расширение тестового покрытия для VC и VG токенов
   - ✅ Оптимизация расчетов налога VG токена

## Дорожная карта


- [x] Разработка VC Token
- [x] Разработка VG Token
- [ ] Разработка Burn and Earn
- [ ] Начало разработки VC Staking


- [ ] Завершение VC Staking
- [ ] Разработка NFT Investor's Hand
- [ ] Начало разработки NFT Fee Key


- [ ] Завершение NFT Fee Key
- [ ] Разработка VG Staking
- [ ] Начало разработки Governance (DAO)


- [ ] Завершение Governance (DAO)
- [ ] Комплексное тестирование всей экосистемы
- [ ] Аудит безопасности
- [ ] Запуск в тестовой сети

### Q4 2025
- [ ] Запуск в основной сети
- [ ] Развёртывание полной экосистемы
- [ ] Маркетинг и привлечение пользователей 