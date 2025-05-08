# Токены экосистемы

## Обзор токенов

Экосистема VC/VG состоит из трех основных типов токенов:

1. **VC Token** - основной токен экосистемы без налога (0%)
2. **VG Token** - governance токен с налогом 10%
3. **LP Token** - токен ликвидности для пары VC/SOL

Каждый токен имеет свою уникальную роль в экосистеме и обеспечивает определенную функциональность. В этом документе детально описаны характеристики каждого токена, их эмиссия, распределение и использование.

## VC Token

VC Token - основной токен экосистемы, который используется для создания LP токенов и стейкинга для получения NFT-бустеров.

### Характеристики

- **Тип**: SPL Token (Solana Program Library)
- **Десятичные знаки**: 9 (стандарт для SPL токенов)
- **Налог на транзакции**: 0% (отсутствует)
- **Максимальная эмиссия**: Определяется при инициализации токена

### Использование

1. **Создание LP токенов**:
   - Конвертация в LP токены через механизм "Burn and Earn"
   - Блокировка LP токенов для получения VG токенов и NFT Fee Key

2. **Стейкинг для получения NFT-бустеров**:
   - Стейкинг 1 млн VC токенов на фиксированный период (90 дней)
   - Получение NFT-бустера для улучшения условий стейкинга VG токенов

### Реализация

VC Token реализован как стандартный SPL токен без модификаций логики транзакций:

```rust
#[program]
pub mod vc_token {
    use anchor_lang::prelude::*;
    use anchor_spl::token::{self, Token, MintTo, Transfer};

    pub fn initialize(
        ctx: Context<Initialize>,
        name: String,
        symbol: String,
        decimals: u8,
    ) -> Result<()> {
        // Инициализация токена VC без налога
        let mint_info = &ctx.accounts.mint;
        let mint_authority_info = &ctx.accounts.mint_authority;
        let rent = &ctx.accounts.rent;
        
        // Инициализация минта
        let token_program = &ctx.accounts.token_program;
        token::initialize_mint(
            CpiContext::new(token_program.to_account_info(), token::InitializeMint {
                mint: mint_info.to_account_info(),
                rent: rent.to_account_info(),
            }),
            decimals,
            mint_authority_info.key,
            Some(mint_authority_info.key),
        )?;
        
        // Инициализация метаданных токена
        let token_metadata = &mut ctx.accounts.token_metadata;
        token_metadata.name = name;
        token_metadata.symbol = symbol;
        token_metadata.decimals = decimals;
        token_metadata.mint = mint_info.key();
        token_metadata.authority = mint_authority_info.key();
        token_metadata.freeze_authority = mint_authority_info.key();
        
        Ok(())
    }

    pub fn transfer(
        ctx: Context<TransferTokens>,
        amount: u64,
    ) -> Result<()> {
        // Перевод VC токенов без налога (стандартная функция transfer)
        let from_info = &ctx.accounts.from;
        let to_info = &ctx.accounts.to;
        let authority_info = &ctx.accounts.authority;
        
        let token_program = &ctx.accounts.token_program;
        token::transfer(
            CpiContext::new(
                token_program.to_account_info(),
                Transfer {
                    from: from_info.to_account_info(),
                    to: to_info.to_account_info(),
                    authority: authority_info.to_account_info(),
                },
            ),
            amount,
        )?;
        
        Ok(())
    }
}
```

## VG Token

VG Token - governance токен с налогом 10% на транзакции, который используется для управления экосистемой через DAO.

### Характеристики

- **Тип**: Модифицированный SPL Token
- **Десятичные знаки**: 9 (стандарт для SPL токенов)
- **Налог на транзакции**: 10% от суммы транзакции
- **Дистрибуция налога**:
  - 50% для держателей NFT Fee Key
  - 30% для обратного выкупа и сжигания VC
  - 20% для казны DAO
- **Получение**: Пропорционально заблокированным LP токенам в механизме "Burn and Earn"

### Использование

1. **Стейкинг VG токенов**:
   - Блокировка на период, зависящий от количества токенов
   - Применение NFT-бустеров для улучшения условий стейкинга
   - Автоматическое реинвестирование при большом размере стейка

2. **Управление экосистемой (DAO)**:
   - Голосование по предложениям
   - Принятие решений о развитии экосистемы
   - Управление параметрами смарт-контрактов

### Реализация

VG Token реализован как модифицированный SPL токен с дополнительной логикой для взимания и распределения налога:

```rust
#[program]
pub mod vg_token {
    use anchor_lang::prelude::*;
    use anchor_spl::token::{self, Token, MintTo, Transfer};

    pub fn initialize(
        ctx: Context<Initialize>,
        name: String,
        symbol: String,
        decimals: u8,
        tax_rate: u8,
    ) -> Result<()> {
        // Инициализация токена VG с налогом
        let mint_info = &ctx.accounts.mint;
        let mint_authority_info = &ctx.accounts.mint_authority;
        let rent = &ctx.accounts.rent;
        
        // Проверка налоговой ставки
        require!(tax_rate <= 20, ErrorCode::TaxRateTooHigh); // Максимальный налог 20%
        
        // Инициализация минта
        let token_program = &ctx.accounts.token_program;
        token::initialize_mint(
            CpiContext::new(token_program.to_account_info(), token::InitializeMint {
                mint: mint_info.to_account_info(),
                rent: rent.to_account_info(),
            }),
            decimals,
            mint_authority_info.key,
            Some(mint_authority_info.key),
        )?;
        
        // Инициализация метаданных токена
        let token_metadata = &mut ctx.accounts.token_metadata;
        token_metadata.name = name;
        token_metadata.symbol = symbol;
        token_metadata.decimals = decimals;
        token_metadata.mint = mint_info.key();
        token_metadata.authority = mint_authority_info.key();
        token_metadata.freeze_authority = mint_authority_info.key();
        token_metadata.tax_rate = tax_rate;
        
        // Инициализация налоговых параметров
        let tax_parameters = &mut ctx.accounts.tax_parameters;
        tax_parameters.tax_rate = tax_rate;
        tax_parameters.fee_distribution_percentage = 50; // 50% для держателей NFT Fee Key
        tax_parameters.buyback_percentage = 30; // 30% для обратного выкупа и сжигания VC
        tax_parameters.dao_percentage = 20; // 20% для казны DAO
        tax_parameters.authority = mint_authority_info.key();
        
        Ok(())
    }

    pub fn transfer(
        ctx: Context<TransferTokens>,
        amount: u64,
    ) -> Result<()> {
        // Перевод VG токенов с учетом налога
        let from_info = &ctx.accounts.from;
        let to_info = &ctx.accounts.to;
        let authority_info = &ctx.accounts.authority;
        let tax_vault_info = &ctx.accounts.tax_vault;
        let tax_parameters = &ctx.accounts.tax_parameters;
        
        // Расчет налога
        let tax_rate = tax_parameters.tax_rate as u64;
        let tax_amount = amount * tax_rate / 100;
        let net_amount = amount - tax_amount;
        
        let token_program = &ctx.accounts.token_program;
        
        // Перевод основной суммы получателю
        token::transfer(
            CpiContext::new(
                token_program.to_account_info(),
                Transfer {
                    from: from_info.to_account_info(),
                    to: to_info.to_account_info(),
                    authority: authority_info.to_account_info(),
                },
            ),
            net_amount,
        )?;
        
        // Перевод налога в налоговое хранилище
        token::transfer(
            CpiContext::new(
                token_program.to_account_info(),
                Transfer {
                    from: from_info.to_account_info(),
                    to: tax_vault_info.to_account_info(),
                    authority: authority_info.to_account_info(),
                },
            ),
            tax_amount,
        )?;
        
        // Распределение налога
        distribute_tax(ctx.accounts.distribute_tax_context.clone(), tax_amount)?;
        
        Ok(())
    }
}
```

## LP Token

LP Token - токен ликвидности для пары VC/SOL, создаваемый через Raydium и используемый в механизме "Burn and Earn".

### Характеристики

- **Тип**: Стандартный LP токен Raydium
- **Пара**: VC/SOL
- **Использование**: Постоянная блокировка в механизме "Burn and Earn"

### Получение и использование

1. **Получение LP токенов**:
   - Через механизм "Burn and Earn"
   - Разделение VC токенов на две части
   - Обмен части VC на SOL
   - Добавление ликвидности в пул VC/SOL

2. **Постоянная блокировка**:
   - LP токены блокируются навсегда в специальном хранилище (permanent lock vault)
   - Невозможность вывода или использования заблокированных LP токенов

3. **Вознаграждение за блокировку**:
   - Получение VG токенов пропорционально заблокированным LP токенам
   - Получение NFT Fee Key, дающего право на доход от комиссий

### Реализация

LP токены создаются через Raydium и блокируются через LP Formation Program:

```rust
pub fn convert_vc_to_lp_and_lock(
    ctx: Context<ConvertVcToLpAndLock>,
    vc_amount: u64,
) -> Result<()> {
    // Разделение VC токенов на две равные части
    let half_vc_amount = vc_amount / 2;
    
    // Обмен первой половины VC на SOL через Raydium
    let sol_amount = swap_vc_to_sol(
        ctx.accounts.swap_context.clone(),
        half_vc_amount,
    )?;
    
    // Добавление второй половины VC и полученных SOL в пул ликвидности
    let lp_amount = add_liquidity(
        ctx.accounts.liquidity_context.clone(),
        half_vc_amount,
        sol_amount,
    )?;
    
    // Блокировка LP токенов в специальном хранилище
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
    
    Ok(())
}
```

## Взаимодействие токенов в экосистеме

### Циркуляция VC токенов

1. Пользователь может свободно передавать VC токены без налога
2. VC токены используются для создания LP токенов
3. VC токены блокируются в стейкинге для получения NFT-бустеров
4. Часть налога с VG токенов идет на обратный выкуп и сжигание VC токенов

### Циркуляция VG токенов

1. VG токены создаются при блокировке LP токенов
2. VG токены используются для стейкинга и управления экосистемой
3. На все транзакции с VG токенами взимается налог 10%
4. Налог распределяется между держателями NFT Fee Key, обратным выкупом VC и казной DAO

### Циркуляция LP токенов

1. LP токены создаются из пары VC/SOL
2. LP токены блокируются навсегда в механизме "Burn and Earn"
3. Блокировка LP токенов дает право на получение VG токенов и NFT Fee Key

## Дальнейшие материалы

- [Архитектура системы](./01-system-architecture.md)
- [Механизм "Burn and Earn"](./03-burn-and-earn.md)
- [Формула расчета VG токенов](./specs/vg-calculation-formula.md) 