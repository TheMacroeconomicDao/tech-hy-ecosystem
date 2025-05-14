# Экосистема TECH HY: Обзор

Экосистема TECH HY —  децентрализованная финансовая система на Solana, построенная на двух токенах (VC и VG) и наборе смарт-контрактов, обеспечивающих их взаимодействие, стейкинг, управление и получение дохода.

**Ключевые Компоненты и Логика:**

1.  **Токены:**
    *   **VC Token (Venture Card Token):**
        *   **Тип:** Стандартный SPL-токен.
        *   **Эмиссия:** 5 миллиардов, полностью созданы при инициализации. Дальнейший минт невозможен. Freeze authority отсутствует.
        *   **Назначение:** Утилитарный токен. Используется для:
            *   Формирования LP-токенов (в паре с SOL) в механизме "Burn and Earn".
            *   Стейкинга для получения NFT-бустеров "Investor's Hand".
            *   Оплаты услуг в экосистеме.
    *   **VG Token (Venture Gift Token):**
        *   **Тип:** Токен стандарта Token-2022 с расширением **Transfer Hook**.
        *   **Эмиссия:** 1 миллиард, полностью созданы при инициализации программы `vg-token` и размещены на **центральном распределительном хаб-счете (`CentralVgHubAccount`)**. `Authority` (владелец) этого `CentralVgHubAccount` является PDA, принадлежащий **программе `vg-token` (`VgHubAuthorityPda`)**. Дальнейший минт VG невозможен. Freeze authority у минта VG отсутствует.
        *   **Назначение:** Токен управления (governance) и для стейкинга.
        *   **Налог на транзакции (по умолчанию 10%, управляемый DAO):** Реализован через **Transfer Hook**. При каждом переводе VG токенов автоматически вызывается отдельная программа-хук (`vg_transfer_hook_program`), которая:
            1.  Загружает `TaxConfig` из программы `vg-token` для получения актуальной ставки налога и адресов назначения.
            2.  Проверяет, является ли отправитель (`source_token_account.owner`) адресом эскроу-счета программы "Burn and Earn" (адрес которого также хранится в `TaxConfig`). Если да, налог не взимается.
            3.  В противном случае, рассчитывает налог согласно текущей ставке из `TaxConfig`.
            4.  Списывает сумму налога с токен-счета отправителя (используя полномочия инициатора трансфера).
            5.  Распределяет этот налог в соответствии с долями, указанными в `TaxConfig`:
                *   50% перечисляется на токен-аккаунт **казны DAO** (адрес из `TaxConfig`).
                *   50% перечисляется на специальный токен-аккаунт **`NFTHoldersTaxPoolAcc`**. Владельцем (authority) этого `NFTHoldersTaxPoolAcc` является PDA, принадлежащий **программе `nft_fee_key_program`** (адрес этого пула также берется из `TaxConfig`).

2.  **Основные Механизмы и Смарт-Контракты:**

    *   **А. Программа `vc-token`:**
        *   **Ответственность:** Инициализация VC токена, его полная эмиссия на начальный распределительный счет (например, казначейство TECH-HY или DAO) и отзыв mint/freeze authority.
        *   **API (Ключевые Инструкции):**
            *   `initialize(ctx)`: Инициализация минта, полная эмиссия, отзыв mint authority.
            *   `set_metadata(ctx, name, symbol, uri)`: Однократная установка метаданных (метаданные VC не предполагаются к обновлению через DAO на данном этапе).

    *   **Б. Программа `vg-token` (основная, для минта, конфигураций налогов и авторизации выплат с центрального хаба VG):**
        *   **Ответственность:** Инициализация VG минта (Token-2022), установка Transfer Hook, размещение всей начальной эмиссии на своем PDA-контролируемом центральном хаб-счете (`CentralVgHubAccount`), управление конфигурацией налога (`TaxConfig`), управление конфигурацией авторизованных программ для выплат с хаба (`AuthorizedCallersConfig`), управление метаданными VG, и обработка авторизованных запросов на прямую выплату с хаба от программ `burn_and_earn` и `vg_staking`.
        *   **Ключевые структуры данных PDA:**
            *   `VgHubAuthorityPda`: PDA программы `vg-token`, являющийся `authority` для `CentralVgHubAccount`.
            *   `CentralVgHubAccount`: Токен-аккаунт, хранящий всю эмиссию VG.
            *   `TaxConfig`: Хранит параметры налога (управляется DAO через `upsert_tax_config`), включая адрес `BurnAndEarnOperationalVault` для исключения из налога.
            *   `AuthorizedCallersConfig`: Хранит авторизованные PDA и флаги для программ, которые могут запрашивать выплаты с хаба:
                *   `dao_authority: Pubkey` (Кто может обновлять этот конфиг, например, DAO Executor).
                *   `authorized_pda_for_burn_and_earn: Pubkey`.
                *   `burn_and_earn_payments_enabled: bool`.
                *   `authorized_pda_for_vg_staking: Pubkey`.
                *   `vg_staking_payments_enabled: bool`.
        *   **Детали Инструкций:**
            *   `initialize(ctx, tax_config_params..., authorized_callers_config_params...)`: Инициализирует VG минт, Transfer Hook. Минтит всю эмиссию на `CentralVgHubAccount`. Инициализирует `TaxConfig` и `AuthorizedCallersConfig` с начальными параметрами (включая авторизованные PDA для B&E и VG Staking, и флаги `payments_enabled` в `true`). Отзывает `mint_authority` у VG минта.
            *   `upsert_tax_config(ctx, params...)`: ( управляется DAO).
            *   `dispense_reward_from_hub(ctx, recipient_token_account: Pubkey, amount: u64)`:
                *   Вызывается CPI от авторизованной программы (`burn_and_earn` или `vg_staking`). Авторизация происходит через проверку `signer`'а, который должен быть одним из `authorized_pda_for_...` из `AuthorizedCallersConfig`.
                *   Проверяет соответствующий флаг `..._payments_enabled` в `AuthorizedCallersConfig`.
                *   Если авторизация и флаг ОК, переводит `amount` с `CentralVgHubAccount` (используя `VgHubAuthorityPda`) на `recipient_token_account`.
            *   `dao_update_authorized_callers(ctx, new_bne_pda: Option<Pubkey>, new_vg_stake_pda: Option<Pubkey>)`: Вызывается `dao_authority` из `AuthorizedCallersConfig` для обновления авторизованных PDA.
            *   `dao_toggle_payments(ctx, target_program_id: u8, enable: bool)`: Вызывается `dao_authority` для включения/выключения выплат для B&E (`target_program_id = 0`) или VG Staking (`target_program_id = 1`).
            *   `set_metadata(ctx, params...)`: (Как ранее, управляется DAO).
        *   **API (Ключевые Инструкции):**
            *   `initialize(ctx, ...)`
            *   `upsert_tax_config(ctx, ...)`
            *   `dispense_reward_from_hub(ctx, recipient_token_account: Pubkey, amount: u64)`
            *   `dao_update_authorized_callers(ctx, new_bne_pda: Option<Pubkey>, new_vg_stake_pda: Option<Pubkey>)`
            *   `dao_toggle_payments(ctx, target_program_id: u8, enable: bool)`
            *   `set_metadata(ctx, ...)`

    *   **В. Программа-хук для VG Token (`vg_transfer_hook_program`) - ОТДЕЛЬНЫЙ КОНТРАКТ:**
        *   1.Ответственность:** Обработка логики налога при каждом стандартном переводе VG токенов (Token-2022).
        *   2.  Получает информацию о трансфере и необходимые 
            аккаунты (включая PDA `TaxConfig` из программы 
            `vg-token`, токен-аккаунт казны DAO, токен-аккаунт 
            `NFTHoldersTaxPoolAcc`) через механизм 
            `extra_account_metas`.
            3.  Загружает актуальные параметры из `TaxConfig`.
            4.  Проверяет, является ли отправитель 
            (`source_token_account.owner`) адресом 
            `burn_and_earn_escrow_pda_pubkey` из `TaxConfig`. Если 
            да, завершает работу без взимания налога.
            5.  В противном случае, рассчитывает налог на основе 
            `tax_rate_bps`.
            6.  Выполняет CPI-переводы рассчитанной суммы налога 
            (списанной с токен-счета отправителя, используя 
            полномочия инициатора транзафера) на счета, указанные в 
            `TaxConfig`: `dao_treasury_token_account_pubkey` и 
            `nft_pool_token_account_pubkey`, согласно долям 
            `dao_share_bps` и `nft_holders_share_bps`.
        *   **Важно:** Программа-хук должна быть тщательно 
        спроектирована для корректной работы с полномочиями и 
        `extra_account_metas` и быть максимально легковесной и 
        безопасной.
        *   **API (Ключевые Инструкции):**
            *   `execute_hook(ctx, amount: u64)`: Основная инструкция, вызываемая Token-2022. Принимает стандартные аккаунты трансфера и `extra_account_metas` (включая `TaxConfig`, `dao_treasury_token_account`, `NFTHoldersTaxPoolAcc`).

        
    *   **Г. Программа "Burn and Earn" (`burn_and_earn_program`):**
        *   **Ответственность:** Конвертация предоставленных пользователем VC и SOL в LP-токены, их перманентная блокировка, распределение VG токенов и инициация создания NFT Fee Key.
        *   **Детали:**
            *   Пользователь предоставляет VC и SOL в пропорции, соответствующей текущему соотношению цен в целевом пуле ликвидности Raydium. 
            *   Константы формулы расчета VG (`C`, `B`, `LP_min`) хранятся в конфигурационном PDA этой программы и управляются через DAO.
        *   **API (Ключевые Инструкции):**
            *   `initialize_burn_and_earn_config(ctx, c_numerator: u64, c_denominator: u64, b_numerator: u64, b_denominator: u64, lp_min: u64)`: Инициализация/обновление параметров формулы через DAO.
            *   `process_burn_and_earn(ctx, vc_amount: u64, sol_amount: u64)`: Основная пользовательская функция. Включает создание LP, блокировку, расчет VG, перевод VG с эскроу-счета, вызов `CreateNftFeeKeyAndInfo`.

    *   **Д. Программа "NFT Fee Key" (`nft_fee_key_program`):**
        *   **Ответственность:** Полное управление жизненным циклом NFT Fee Key, включая их создание, а также справедливое распределение и клейм вознаграждений держателями из управляемого ею пула налогов.
        *   **Ключевые структуры данных:**
            1.  **`FeeDistributionState` (Глобальный PDA программы):**
                *   `total_weighted_locked_lp: u64` (Сумма всех `locked_lp_amount * tier_multiplier`)
                *   `cumulative_rewards_per_token_point: u128` (Общее количество VG, начисленное на одну "взвешенную единицу LP" за все время. Использует `u128` и множитель для точности дробных начислений).
                *   `nft_holders_tax_pool_acc: Pubkey` (Адрес токен-аккаунта `NFTHoldersTaxPoolAcc`, где хранятся налоги для держателей).
                *   `pool_authority_pda_bump: u8` (Bump для PDA, являющегося authority для `NFTHoldersTaxPoolAcc`).
                *   `last_accrue_timestamp: i64` (Время последнего вызова `accrue_rewards`).
            2.  **`NFTHolderInfo` (PDA для каждого NFT Fee Key, ключ - `nft_mint`):**
                *   `owner: Pubkey`
                *   `locked_lp_amount: u64` (Количество LP, заблокированное при создании этого NFT).
                *   `tier_multiplier: u16` (Множитель уровня NFT).
                *   `user_claimed_rewards_per_token_point: u128` (Значение `cumulative_rewards_per_token_point` из `FeeDistributionState` на момент последнего успешного клейма этим NFT).
        *   **Ключевые инструкции:** 
            1.  **`initialize_nft_fee_key_program(ctx, nft_holders_tax_pool_acc_pubkey)`:**
                *   Инициализирует глобальный `FeeDistributionState` (устанавливает начальные значения, сохраняет адрес `NFTHoldersTaxPoolAcc`).
                *   Создает PDA, который будет `authority` для `NFTHoldersTaxPoolAcc` и сохраняет его bump в `FeeDistributionState`.
            2.  **`create_nft_fee_key_and_info(ctx, owner, locked_lp_amount, tier_multiplier)`:**
                *   Вызывается программой "Burn and Earn".
                *   Минтит NFT Fee Key через Metaplex.
                *   Создает `NFTHolderInfo` для нового NFT, инициализируя `user_claimed_rewards_per_token_point` текущим значением `FeeDistributionState.cumulative_rewards_per_token_point` (т.к. новый NFT еще не претендует на прошлые награды).
                *   Обновляет `FeeDistributionState.total_weighted_locked_lp`, добавляя `locked_lp_amount * tier_multiplier` нового NFT.
            3.  **`accrue_rewards(ctx)` (Может вызываться кем угодно, но не чаще определенного интервала, или keeper'ом):**
                *   Загружает `FeeDistributionState`.
                *   Определяет текущий баланс токен-аккаунта `NFTHoldersTaxPoolAcc` (указанного в `FeeDistributionState`).
                *   Рассчитывает, сколько VG поступило в пул (`newly_added_to_pool`) с момента последнего вызова этой функции (или с момента инициализации, если это первый вызов). Это можно сделать, сравнивая текущий баланс пула с суммой, которая *должна* была там быть, исходя из `cumulative_rewards_per_token_point` и `total_weighted_locked_lp` до этого начисления (или храня `last_pool_balance_processed` в `FeeDistributionState`).
                *   Если `newly_added_to_pool > 0` и `FeeDistributionState.total_weighted_locked_lp > 0`:
                    *   `new_reward_points_to_add = (newly_added_to_pool * REWARD_POINT_MULTIPLIER) / FeeDistributionState.total_weighted_locked_lp` (где `REWARD_POINT_MULTIPLIER` - большой множитель для точности, например `10^12`).
                    *   `FeeDistributionState.cumulative_rewards_per_token_point += new_reward_points_to_add`.
                *   Обновляет `FeeDistributionState.last_accrue_timestamp`.
            4.  **`claim_reward(ctx, nft_fee_key_mint)`:**
                *   Вызывается держателем NFT Fee Key.
                *   *Опционально/рекомендовано: проверяет `FeeDistributionState.last_accrue_timestamp`; если прошло много времени, может потребоваться (или предложить пользователю) сначала вызвать `accrue_rewards` для актуализации `cumulative_rewards_per_token_point`.* (Либо `claim_reward` сама может вызывать `accrue_rewards` как первую операцию, если это безопасно и эффективно).
                *   Загружает `FeeDistributionState` и `NFTHolderInfo` для `nft_fee_key_mint`.
                *   Проверяет, что вызывающий является `owner` из `NFTHolderInfo`.
                *   `user_weighted_lp = NFTHolderInfo.locked_lp_amount * NFTHolderInfo.tier_multiplier as u64`.
                *   `outstanding_reward_points_for_user = FeeDistributionState.cumulative_rewards_per_token_point - NFTHolderInfo.user_claimed_rewards_per_token_point`.
                *   `claimable_amount_in_vg = (outstanding_reward_points_for_user * user_weighted_lp) / REWARD_POINT_MULTIPLIER` (деление на тот же множитель).
                *   Если `claimable_amount_in_vg > 0`:
                    *   Используя PDA-authority (bump которого в `FeeDistributionState`), программа переводит `claimable_amount_in_vg` с `NFTHoldersTaxPoolAcc` на токен-аккаунт пользователя.
                    *   Обновляет `NFTHolderInfo.user_claimed_rewards_per_token_point` до текущего `FeeDistributionState.cumulative_rewards_per_token_point`.
        *   **Пул Накопленных Налогов (`NFTHoldersTaxPoolAcc`):** Токен-аккаунт для VG, куда программа-хук VG токена перечисляет долю налогов. `Authority` этого счета - PDA, управляемый `nft_fee_key_program`.

    *   **Е. Программа Стейкинга VC (`vc_staking_program`) и NFT "Investor's Hand":**
        *   **Ответственность:** Стейкинг VC токенов и управление NFT-бустерами "Investor's Hand".
        *   **Детали:**
            *   **Основные Характеристики Стейкинга VC:** Сумма (1,000,000 VC) и период (90 дней) являются стандартными параметрами, управляемыми DAO через конфигурационный PDA этой программы.
            *   **Получение NFT:** При первом стейкинге (стандартные параметры) пользователь получает NFT "Wooden Hand".
            *   **Апгрейд NFT:** Реализует последовательный апгрейд (Paper → Wooden → Steel → Titanium → Diamond) через стейкинг дополнительных VC на определенные сроки (параметры для каждого уровня апгрейда управляются DAO) и сжигание NFT предыдущего уровня.
            *   **Способы Получения (в рамках контракта):** Только через стейкинг/апгрейд VC. Специальное распределение (Angel, ручной минт Titanium/Diamond) на данном этапе в смарт-контракте не реализуется.
        *   **API (Ключевые Инструкции):**
            *   `initialize_vc_staking_config(ctx, params...)`: Инициализация/обновление параметров стейкинга и апгрейда через DAO.
            *   `stake_vc_and_get_nft(ctx)`: Стейкинг VC (стандартная сумма/срок из конфига) и получение/апгрейд NFT.
            *   `unstake_vc(ctx, stake_account_pda: Pubkey)`: Вывод VC по истечении срока.

    *   **Ж. Программа Стейкинга VG (`vg_staking_program`):**
        *   **Ответственность:** Стейкинг VG токенов для участия в DAO и получения наград из "Пула Наград Стейкинга VG".
        *   **Детали:**
            *   **Уровни DAO и Требования:** Реализует 9 уровней DAO (Starter, Community Member, Contributor, Founder, Expert, Angel, Investor, Launchpad Master, Partner) с соответствующими требованиями по количеству застейканных VG, наличию определенных NFT "Investor's Hand" и минимальным периодам стейкинга. Эти параметры хранятся в конфигурационном PDA программы, управляемом DAO.
            *   **Источник Наград:** Награды для стейкеров VG выплачиваются напрямую из центрального хаба VG. Программа `vg_staking_program` (через свой авторизованный PDA) рассчитывает награду и делает CPI-вызов к инструкции `dispense_reward_from_hub` в программе `vg-token` для перевода награды на счет пользователя.
            *   Программа **не управляет** собственным большим пулом наград VG.
            *   **Автокомпаундинг:** Ежедневный для Angel; еженедельный для Investor, Launchpad Master, Partner. Правило "100% автокомпаундинг для стейков >10,000 VG" применяется к уровням Contributor, Founder, Expert, если их стейк превышает порог и для них не определен специфический режим (ежедневный/еженедельный).
            *   **Особые привилегии (off-chain):** Доля комиссий Launchpad и другие нефинансовые привилегии уровней DAO обрабатываются вне контракта.
        *   **API (Ключевые Инструкции):**
            *   `initialize_vg_staking_config(ctx, params...)`: Инициализация/обновление параметров уровней DAO, периодов, логики наград через DAO.
            *   `stake_vg(ctx, amount: u64, investor_hand_nft_mint: Option<Pubkey>)`: Стейкинг VG. Перевод облагается налогом через хук.
            *   `unstake_vg(ctx, stake_account_pda: Pubkey)`: Анстейкинг VG. Перевод облагается налогом через хук.
            *   `claim_vg_staking_rewards(ctx, stake_account_pda: Pubkey)`: Клейм накопленных наград (если не полный автокомпаундинг).
            *   `process_autocompounding(ctx, stake_account_pda: Pubkey)`: (Может быть частью других инструкций или вызываться keeper'ом для соответствующих уровней).

    *   **З. Программа Управления DAO (`governance_program`):**
        *   **Основа:** Интеграция с протоколом Realms.
        *   **Функционал:**
            *   Позволяет держателям застейканных VG токенов создавать предложения и голосовать по ним.
            *   Управляет параметрами других контрактов экосистемы (например, `TaxConfig` в `vg-token`, коэффициенты в "Burn and Earn") 
            *   Управляет казной DAO (куда поступает 50% от налога на VG).
        *   **API (Ключевые Инструкции):** В основном инструкции Realms. Плюс кастомные инструкции в DAO Executor для вызова управляющих функций в других программах экосистемы (например, `upsert_tax_config` в `vg-token`, `initialize_burn_and_earn_config` в `burn_and_earn_program` и т.д.).
        *   **Ответственность:** Управление параметрами экосистемы, включая обновление `AuthorizedCallersConfig` и вызов `dao_toggle_payments` в программе `vg-token`.
        *   **API (Ключевые Инструкции):**
            *   Кастомные инструкции в DAO Executor для вызова `upsert_tax_config`, `dao_update_authorized_callers`, `dao_toggle_payments` в `vg-token`, ...

**Взаимодействие и Потоки:**

*   **Получение VG:** VC + SOL → `burn_and_earn_program` (создание LP, блокировка) → Распределение VG с эскроу + Создание NFT Fee Key (через `nft_fee_key_program`).
*   **Налог на VG:** Любой перевод VG → Token-2022 вызывает `vg_transfer_hook_program` → Налог списывается и распределяется.
*   **Стейкинг и Бусты:** Стейкинг VC в `vc_staking_program` → NFT "Investor's Hand" → Применение NFT в `vg_staking_program` для улучшения условий.
*   **Управление:** Стейкинг VG в `vg_staking_program` → Участие в `governance_program` (Realms) → Изменение параметров экосистемы.

Система стремится к модульности, безопасности (через отзыв ненужных полномочий и использование стандартов) и прозрачности для пользователей (особенно с налогом через Transfer Hook). Ключевым моментом является корректная реализация и аудит программы-хука для VG токена и четкое управление полномочиями между всеми контрактами.

CentralVgHubAccount максимально упрощает управление VG для программ BurnAndEarn и VGStaking, перенося ответственность за фактический перевод средств и базовую авторизацию на `vg-token`. DAO контролирует, кто может запрашивать выплаты и может ли вообще запрашивать.