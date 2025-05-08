# Governance и DAO

## Обзор

Система управления экосистемой VC/VG токенов построена на базе децентрализованной автономной организации (DAO), которая позволяет держателям VG токенов участвовать в процессе принятия решений по развитию экосистемы. DAO использует Realms - протокол управления на Solana, который обеспечивает безопасное и эффективное голосование по предложениям.

## Основные характеристики

- **Токен управления**: VG токен
- **Протокол DAO**: Realms на Solana
- **Минимальное количество для голосования**: 100 VG
- **Минимальное количество для создания предложения**: 10,000 VG
- **Период голосования**: 7 дней
- **Кворум**: 30% от циркулирующего предложения VG токенов

## Параметры, управляемые через DAO

Через DAO держатели VG токенов могут голосовать за изменение следующих параметров экосистемы:

### Параметры токенов

1. **Налоговая ставка VG токена**:
   - Текущее значение: 10%
   - Диапазон изменения: 5-15%

2. **Распределение налога**:
   - Доля для держателей NFT Fee Key (текущее значение: 50%)
   - Доля для обратного выкупа и сжигания VC (текущее значение: 30%)
   - Доля для казны DAO (текущее значение: 20%)

### Параметры механизма "Burn and Earn"

1. **Формула конверсии LP в VG**:
   - Базовый коэффициент конверсии (текущее значение: 10)
   - Бонусный коэффициент (текущее значение: 0.2)

2. **Уровни NFT Fee Key**:
   - Пороговые значения для каждого уровня
   - Множители дохода для каждого уровня

### Параметры стейкинга

1. **Стейкинг VC токенов**:
   - Фиксированная сумма для стейкинга (текущее значение: 1 млн VC)
   - Период стейкинга (текущее значение: 90 дней)

2. **Стейкинг VG токенов**:
   - Базовый период стейкинга (текущее значение: 180 дней)
   - Коэффициент влияния размера стейка (текущее значение: 0.15)
   - Коэффициент влияния NFT-бустера (текущее значение: 0.25)
   - Порог для автоматического реинвестирования (текущее значение: 10,000 VG)
   - Процент реинвестирования (текущее значение: 70%)

## Процесс управления

### Создание предложения

Держатели VG токенов, имеющие не менее 10,000 VG, могут создавать предложения для голосования:

1. **Типы предложений**:
   - Изменение параметров экосистемы
   - Обновление смарт-контрактов
   - Выделение средств из казны DAO для развития экосистемы
   - Аварийные меры в случае кризисных ситуаций

2. **Процесс создания предложения**:
   - Подготовка описания предложения
   - Указание конкретных параметров, которые предлагается изменить
   - Обоснование необходимости изменений
   - Внесение депозита в VG токенах (возвращается, если предложение собирает кворум)

### Голосование

Держатели VG токенов, имеющие не менее 100 VG, могут голосовать за или против предложений:

1. **Процесс голосования**:
   - Блокировка VG токенов на период голосования (7 дней)
   - Вес голоса пропорционален количеству заблокированных токенов
   - Возможность делегирования своего голоса другому участнику

2. **Условия принятия предложения**:
   - Кворум: 30% от циркулирующего предложения VG токенов
   - Простое большинство (>50%) для обычных предложений
   - Квалифицированное большинство (>75%) для критических изменений

### Выполнение принятых предложений

После успешного голосования предложение выполняется через специальную программу DAO Executor:

1. **Обычные предложения**:
   - Автоматическое выполнение через смарт-контракт DAO Executor
   - Обновление соответствующих параметров в смарт-контрактах экосистемы

2. **Критические предложения**:
   - Двухэтапное выполнение с задержкой 48 часов (время охлаждения)
   - Возможность отмены в случае обнаружения ошибок или новых обстоятельств

## Техническая реализация

### Интеграция с Realms

```rust
pub fn create_dao_realm(
    ctx: Context<CreateDaoRealm>,
    name: String,
    min_voting_tokens: u64,
    min_proposal_tokens: u64,
) -> Result<()> {
    // Создание DAO через Realms
    let create_realm_ix = governance::instruction::create_realm(
        &governance::ID,
        &ctx.accounts.governance_program_id.key(),
        &ctx.accounts.vg_mint.key(),
        &ctx.accounts.realm_authority.key(),
        None,
        name,
        min_voting_tokens,
        min_proposal_tokens,
    );
    
    // Выполнение инструкции
    solana_program::program::invoke_signed(
        &create_realm_ix,
        &[
            ctx.accounts.governance_program.to_account_info(),
            ctx.accounts.realm.to_account_info(),
            ctx.accounts.vg_mint.to_account_info(),
            ctx.accounts.realm_authority.to_account_info(),
            ctx.accounts.voting_token_mint.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ],
        &[],
    )?;
    
    // Инициализация параметров DAO
    let dao_parameters = &mut ctx.accounts.dao_parameters;
    dao_parameters.realm = ctx.accounts.realm.key();
    dao_parameters.governance_program_id = ctx.accounts.governance_program_id.key();
    dao_parameters.min_voting_tokens = min_voting_tokens;
    dao_parameters.min_proposal_tokens = min_proposal_tokens;
    dao_parameters.voting_period = 7 * 24 * 60 * 60; // 7 дней в секундах
    dao_parameters.quorum_percentage = 30;
    dao_parameters.authority = ctx.accounts.realm_authority.key();
    
    Ok(())
}
```

### Структура параметров DAO

```rust
#[account]
pub struct DaoParameters {
    pub realm: Pubkey,
    pub governance_program_id: Pubkey,
    pub min_voting_tokens: u64,
    pub min_proposal_tokens: u64,
    pub voting_period: i64,
    pub quorum_percentage: u8,
    pub authority: Pubkey,
    pub bump: u8,
}
```

### Создание предложения

```rust
pub fn create_proposal(
    ctx: Context<CreateProposal>,
    name: String,
    description: String,
    proposal_type: u8,
    parameters: Vec<ProposalParameter>,
) -> Result<()> {
    // Проверка баланса VG токенов
    require!(
        ctx.accounts.user_vg_token_account.amount >= ctx.accounts.dao_parameters.min_proposal_tokens,
        ErrorCode::InsufficientVgBalance
    );
    
    // Создание предложения через Realms
    let create_proposal_ix = governance::instruction::create_proposal(
        &governance::ID,
        &ctx.accounts.governance_program_id.key(),
        &ctx.accounts.realm.key(),
        &ctx.accounts.governance.key(),
        &ctx.accounts.proposer.key(),
        &ctx.accounts.vg_mint.key(),
        &ctx.accounts.proposal.key(),
        name,
        description,
        &ctx.accounts.governance_token_holding.key(),
        ctx.accounts.dao_parameters.voting_period,
        0, // Vote threshold percentage (0 for majority)
        ctx.accounts.dao_parameters.quorum_percentage,
    );
    
    // Выполнение инструкции
    solana_program::program::invoke_signed(
        &create_proposal_ix,
        &[
            ctx.accounts.governance_program.to_account_info(),
            ctx.accounts.realm.to_account_info(),
            ctx.accounts.governance.to_account_info(),
            ctx.accounts.proposer.to_account_info(),
            ctx.accounts.vg_mint.to_account_info(),
            ctx.accounts.proposal.to_account_info(),
            ctx.accounts.governance_token_holding.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ],
        &[],
    )?;
    
    // Сохранение параметров предложения
    let proposal_parameters = &mut ctx.accounts.proposal_parameters;
    proposal_parameters.proposal = ctx.accounts.proposal.key();
    proposal_parameters.proposal_type = proposal_type;
    proposal_parameters.parameters = parameters;
    proposal_parameters.created_at = Clock::get()?.unix_timestamp;
    proposal_parameters.executed = false;
    
    Ok(())
}
```

### Голосование по предложению

```rust
pub fn cast_vote(
    ctx: Context<CastVote>,
    vote: u8, // 0 - Against, 1 - For
) -> Result<()> {
    // Проверка баланса VG токенов
    require!(
        ctx.accounts.user_vg_token_account.amount >= ctx.accounts.dao_parameters.min_voting_tokens,
        ErrorCode::InsufficientVgBalance
    );
    
    // Голосование через Realms
    let cast_vote_ix = governance::instruction::cast_vote(
        &governance::ID,
        &ctx.accounts.governance_program_id.key(),
        &ctx.accounts.realm.key(),
        &ctx.accounts.governance.key(),
        &ctx.accounts.proposal.key(),
        &ctx.accounts.proposal_owner.key(),
        &ctx.accounts.voter.key(),
        &ctx.accounts.vg_mint.key(),
        &ctx.accounts.vote_record.key(),
        &ctx.accounts.governance_token_holding.key(),
        vote,
    );
    
    // Выполнение инструкции
    solana_program::program::invoke_signed(
        &cast_vote_ix,
        &[
            ctx.accounts.governance_program.to_account_info(),
            ctx.accounts.realm.to_account_info(),
            ctx.accounts.governance.to_account_info(),
            ctx.accounts.proposal.to_account_info(),
            ctx.accounts.proposal_owner.to_account_info(),
            ctx.accounts.voter.to_account_info(),
            ctx.accounts.vg_mint.to_account_info(),
            ctx.accounts.vote_record.to_account_info(),
            ctx.accounts.governance_token_holding.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ],
        &[],
    )?;
    
    Ok(())
}
```

### Выполнение принятого предложения

```rust
pub fn execute_proposal(
    ctx: Context<ExecuteProposal>,
) -> Result<()> {
    // Проверка статуса предложения
    let proposal_status = get_proposal_status(ctx.accounts.proposal.to_account_info())?;
    require!(
        proposal_status == ProposalStatus::Succeeded,
        ErrorCode::ProposalNotSucceeded
    );
    
    // Проверка, что предложение еще не выполнено
    let proposal_parameters = &mut ctx.accounts.proposal_parameters;
    require!(
        !proposal_parameters.executed,
        ErrorCode::ProposalAlreadyExecuted
    );
    
    // Выполнение предложения в зависимости от типа
    match proposal_parameters.proposal_type {
        // Изменение параметров токенов
        1 => execute_token_parameters_update(
            ctx.accounts.clone(),
            &proposal_parameters.parameters,
        )?,
        
        // Изменение параметров механизма "Burn and Earn"
        2 => execute_burn_and_earn_parameters_update(
            ctx.accounts.clone(),
            &proposal_parameters.parameters,
        )?,
        
        // Изменение параметров стейкинга
        3 => execute_staking_parameters_update(
            ctx.accounts.clone(),
            &proposal_parameters.parameters,
        )?,
        
        // Выделение средств из казны DAO
        4 => execute_treasury_fund_allocation(
            ctx.accounts.clone(),
            &proposal_parameters.parameters,
        )?,
        
        // Неизвестный тип предложения
        _ => return Err(ErrorCode::UnknownProposalType.into()),
    }
    
    // Отметка предложения как выполненного
    proposal_parameters.executed = true;
    proposal_parameters.executed_at = Clock::get()?.unix_timestamp;
    
    Ok(())
}
```

## Казна DAO

### Структура казны

```rust
#[account]
pub struct DaoTreasury {
    pub authority: Pubkey,
    pub token_account: Pubkey,
    pub total_received: u64,
    pub total_spent: u64,
    pub bump: u8,
}
```

### Пополнение казны

Казна DAO пополняется за счет следующих источников:

1. 20% от налога на транзакции VG токенов
2. Добровольные пожертвования от участников экосистемы
3. Доходы от деятельности DAO

```rust
pub fn fund_treasury(
    ctx: Context<FundTreasury>,
    amount: u64,
) -> Result<()> {
    // Перевод VG токенов в казну DAO
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.user_vg_token_account.to_account_info(),
            to: ctx.accounts.treasury_token_account.to_account_info(),
            authority: ctx.accounts.user_authority.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, amount)?;
    
    // Обновление статистики казны
    let treasury = &mut ctx.accounts.dao_treasury;
    treasury.total_received += amount;
    
    Ok(())
}
```

### Использование средств казны

Средства казны могут быть использованы на основании принятых предложений DAO для:

1. Развития экосистемы VC/VG токенов
2. Финансирования разработки новых функций
3. Маркетинга и продвижения экосистемы
4. Аудита безопасности смарт-контрактов
5. Выплаты вознаграждений участникам, вносящим вклад в развитие экосистемы

```rust
pub fn spend_treasury_funds(
    ctx: Context<SpendTreasuryFunds>,
    amount: u64,
    recipient: Pubkey,
    purpose: String,
) -> Result<()> {
    // Проверка, что инструкция вызвана из предложения DAO
    require!(
        ctx.accounts.instruction_program.key() == governance::ID,
        ErrorCode::NotAuthorized
    );
    
    // Перевод VG токенов из казны DAO получателю
    let seeds = &[
        b"dao_treasury".as_ref(),
        &[ctx.accounts.dao_treasury.bump],
    ];
    let signer = &[&seeds[..]];
    
    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.treasury_token_account.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx.accounts.dao_treasury.to_account_info(),
        },
        signer,
    );
    token::transfer(transfer_ctx, amount)?;
    
    // Обновление статистики казны
    let treasury = &mut ctx.accounts.dao_treasury;
    treasury.total_spent += amount;
    
    Ok(())
}
```

## Механизм аварийного управления

### Мультисигнатура для экстренных случаев

В случае критических ситуаций, требующих немедленного вмешательства, используется механизм мультисигнатуры:

1. **Состав мультисигнатуры**:
   - 5-7 ключевых участников экосистемы
   - Требуется подпись 2/3 участников для принятия экстренных мер

2. **Экстренные меры**:
   - Приостановка определенных функций смарт-контрактов
   - Обновление смарт-контрактов для устранения уязвимостей
   - Защита средств пользователей в случае атаки

```rust
pub fn emergency_action(
    ctx: Context<EmergencyAction>,
    action_type: u8,
    parameters: Vec<EmergencyActionParameter>,
) -> Result<()> {
    // Проверка подписей участников мультисигнатуры
    require!(
        ctx.accounts.multisig_account.confirmed_signers >= ctx.accounts.multisig_account.required_signatures,
        ErrorCode::InsufficientSignatures
    );
    
    // Выполнение экстренного действия в зависимости от типа
    match action_type {
        // Приостановка функций смарт-контрактов
        1 => pause_contract_functions(
            ctx.accounts.clone(),
            &parameters,
        )?,
        
        // Обновление смарт-контрактов
        2 => update_program(
            ctx.accounts.clone(),
            &parameters,
        )?,
        
        // Защита средств пользователей
        3 => protect_user_funds(
            ctx.accounts.clone(),
            &parameters,
        )?,
        
        // Неизвестный тип действия
        _ => return Err(ErrorCode::UnknownActionType.into()),
    }
    
    // Логирование экстренного действия
    let emergency_log = &mut ctx.accounts.emergency_action_log;
    emergency_log.action_type = action_type;
    emergency_log.parameters = parameters;
    emergency_log.executed_at = Clock::get()?.unix_timestamp;
    emergency_log.executor = ctx.accounts.executor.key();
    
    Ok(())
}
```

## Интерфейс пользователя

Для удобства пользователей реализуется веб-интерфейс, который позволяет:

1. Просматривать активные предложения DAO
2. Создавать новые предложения
3. Голосовать за или против предложений
4. Отслеживать результаты голосования
5. Просматривать историю предложений и решений DAO
6. Отслеживать состояние казны DAO и использование средств

## Интеграция с экосистемой VC/VG токенов

DAO интегрируется со всеми компонентами экосистемы VC/VG токенов:

1. **Токены**: Управление параметрами токенов через DAO
2. **Механизм "Burn and Earn"**: Настройка формулы конверсии и уровней NFT
3. **Стейкинг**: Управление параметрами стейкинга VC и VG токенов
4. **NFT Fee Key**: Управление уровнями и распределением комиссий

Эта интеграция обеспечивает децентрализованное управление всей экосистемой и позволяет ей развиваться в соответствии с решениями сообщества держателей VG токенов.

## Заключение

Governance и DAO являются фундаментальными компонентами экосистемы VC/VG токенов, обеспечивающими децентрализованное управление и долгосрочное развитие проекта. Благодаря интеграции с Realms на Solana, система управления предоставляет безопасный и эффективный механизм для принятия решений сообществом держателей VG токенов. 