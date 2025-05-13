use anchor_lang::prelude::*;
use anchor_spl::{
    token_interface::{self, Mint, MintTo, TokenAccount, TokenInterface, TransferChecked},
    associated_token::AssociatedToken,
    metadata::{mpl_token_metadata},
};
use anchor_spl::token_interface::spl_token_2022::instruction::AuthorityType;
use anchor_spl::token_2022::{self, InitializeMint2, InitializeTransferHook};
use spl_token_2022::{
    extension::{BaseStateWithExtensions, ExtensionType, StateWithExtensions, transfer_hook::TransferHook},
    state::Mint as Token2022Mint,
};

declare_id!("VGnHJHKr2NwxSdQQoYrJY9TBZ9YHS5cCwBPEr68mEPG");

// Константы токена
pub const VG_TOKEN_MINT_SEED: &[u8] = b"vg_token_mint";
pub const TOKEN_DECIMALS: u8 = 9;
pub const TOTAL_SUPPLY: u64 = 1_000_000_000 * 10u64.pow(TOKEN_DECIMALS as u32); // 1 миллиард токенов с 9 десятичными знаками
pub const TAX_RATE_BPS: u16 = 1000; // 10% налог (basis points: 10% = 1000 из 10000)
pub const DAO_SHARE_BPS: u16 = 500; // 50% от налога идет в казну DAO
pub const NFT_HOLDERS_SHARE_BPS: u16 = 500; // 50% от налога идет держателям NFT Fee Key

/// Placeholder для ID программы, которая будет реализовывать логику Transfer Hook.
/// Этот ID нужно будет заменить на реальный ID скомпилированной программы-хука.
declare_id!("HOOKpGhpY123456789abcdefghijklmnopqrstuvw"); 
pub use HOOKpGhpY123456789abcdefghijklmnopqrstuvw as vg_transfer_hook_program_id;

#[program]
pub mod vg_token {
    use super::*;

    /// Инициализирует новый VG токен.
    /// Выпускает все токены в размере 1 миллиарда и передает их на эскроу-счет,
    /// контролируемый программой Burn and Earn.
    /// Отзывает mint authority и не устанавливает freeze authority.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Инициализация VG токена...");

        let mint_seeds = &[
            VG_TOKEN_MINT_SEED,
            &[ctx.bumps.mint_account]
        ];
        let signer_seeds = &[&mint_seeds[..]];

        // 1. Минтинг полной эмиссии на эскроу-счет
        token_interface::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint_account.to_account_info(),
                    to: ctx.accounts.escrow_vault_token_account.to_account_info(),
                    authority: ctx.accounts.mint_account.to_account_info(), // PDA mint_account как временный authority
                },
                signer_seeds
            ),
            TOTAL_SUPPLY
        )?;
        msg!("Полная эмиссия {} VG токенов произведена на эскроу-счет.", TOTAL_SUPPLY);

        // 2. Отзыв mint_authority у PDA mint_account
        token_interface::set_authority(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token_interface::SetAuthority {
                    current_authority: ctx.accounts.mint_account.to_account_info(),
                    account_or_mint: ctx.accounts.mint_account.to_account_info(),
                },
                signer_seeds
            ),
            AuthorityType::MintTokens, // Используем тип из spl_token_2022, но он совместим
            None // Устанавливаем нового mint authority в None
        )?;
        msg!("Mint authority для VG токена отозвана.");
        
        // Freeze authority по умолчанию None, так как не указан в #[account(init ... mint::freeze_authority = ...)]
        msg!("VG токен успешно инициализирован.");
        Ok(())
    }
    
    /// Кастомная инструкция для перевода VG токенов с взиманием 10% налога.
    pub fn transfer_with_tax(ctx: Context<TransferWithTax>, amount: u64) -> Result<()> {
        msg!("Выполняется transfer_with_tax для {} VG токенов...", amount);
        if amount == 0 {
            return err!(VgTokenError::InvalidAmount);
        }

        let tax_config = &ctx.accounts.tax_config; // Загружаем конфигурацию налога

        // Проверка, должен ли этот трансфер облагаться налогом
        // Например, если отправитель - это эскроу счет программы Burn and Earn, налог не взимается.
        // Этот адрес должен быть известен программе vg-token или передан в TaxConfig.
        // Для примера, предположим, что burn_and_earn_escrow_pda_address хранится в tax_config.
        // Либо, если sender_token_account.owner == tax_config.burn_and_earn_program_pda ...
        // Сейчас упростим: если отправитель - это payer из TransferWithTax (что неверно для общего случая, но для примера)
        // или если это специальный адрес из tax_config.
        // Для более корректной логики, нужно знать PDA эскроу Burn & Earn здесь.

        let mut tax_amount = 0;
        let mut transfer_to_recipient_amount = amount;

        // Если отправитель НЕ является специальным (например, эскроу Burn & Earn), то взимаем налог
        // if ctx.accounts.sender_authority.key() != tax_config.burn_and_earn_escrow_authority { // Пример условия
        // Предположим, что все переводы через эту функцию облагаются налогом, если не указано иное
        // Для простоты, пока всегда взимаем налог. Логику исключений можно добавить позже.

        let (calculated_tax, overflow) = amount.overflowing_mul(tax_config.tax_rate_bps as u64);
        if overflow { return err!(VgTokenError::MathOverflow); }
        
        let (final_tax, overflow) = calculated_tax.overflowing_div(10000);
        if overflow { return err!(VgTokenError::MathOverflow); }
        tax_amount = final_tax;

        let (calculated_transfer, overflow) = amount.overflowing_sub(tax_amount);
        if overflow { return err!(VgTokenError::MathOverflow); }
        transfer_to_recipient_amount = calculated_transfer;
        
        if tax_amount > 0 && transfer_to_recipient_amount == 0 && amount > 0 {
             return err!(VgTokenError::InvalidTaxCalculation); 
        }
        if amount > 0 && transfer_to_recipient_amount == 0 && tax_amount == 0 {
            return err!(VgTokenError::InvalidTaxCalculation);
        }
        
        let dao_tax_share = tax_amount.checked_mul(tax_config.dao_share_bps as u64).unwrap_or(0) / 10000;
        let nft_holders_tax_share = tax_amount.saturating_sub(dao_tax_share);

        msg!(
            "Перевод {} VG: {} получателю. Налог: {} (DAO: {}, NFT holders: {})",
            amount,
            transfer_to_recipient_amount,
            tax_amount,
            dao_tax_share,
            nft_holders_tax_share
        );

        let token_program_info = ctx.accounts.token_program.to_account_info();
        let sender_token_account_info = ctx.accounts.sender_token_account.to_account_info();
        let sender_authority_info = ctx.accounts.sender_authority.to_account_info();
        let mint_info = ctx.accounts.mint_account.to_account_info();

        // 1. Переводим основную сумму получателю
        if transfer_to_recipient_amount > 0 {
            token_interface::transfer_checked(
                CpiContext::new(
                    token_program_info.clone(),
                    TransferChecked {
                        from: sender_token_account_info.clone(),
                        to: ctx.accounts.recipient_token_account.to_account_info(),
                        authority: sender_authority_info.clone(),
                        mint: mint_info.clone(),
                    },
                ),
                transfer_to_recipient_amount,
                TOKEN_DECIMALS,
            )?;
        }
        
        // 2. Переводим налог в казну DAO
        if dao_tax_share > 0 {
            token_interface::transfer_checked(
                CpiContext::new(
                    token_program_info.clone(),
                    TransferChecked {
                        from: sender_token_account_info.clone(),
                        to: ctx.accounts.dao_treasury_token_account.to_account_info(),
                        authority: sender_authority_info.clone(),
                        mint: mint_info.clone(),
                    },
                ),
                dao_tax_share,
                TOKEN_DECIMALS,
            )?;
        }
        
        // 3. Переводим налог в пул для держателей NFT Fee Key
        if nft_holders_tax_share > 0 {
            token_interface::transfer_checked(
                CpiContext::new(
                    token_program_info,
                    TransferChecked {
                        from: sender_token_account_info,
                        to: ctx.accounts.fee_collector_token_account.to_account_info(),
                        authority: sender_authority_info,
                        mint: mint_info,
                    },
                ),
                nft_holders_tax_share,
                TOKEN_DECIMALS,
            )?;
        }
        
        msg!("Кастомный перевод VG токенов с налогом успешно выполнен.");
        Ok(())
    }
    
    /// Установка или обновление конфигурации налога.
    /// Только авторитет DAO может вызывать эту функцию.
    pub fn upsert_tax_config(
        ctx: Context<UpsertTaxConfig>, 
        tax_rate_bps: u16, 
        dao_share_bps: u16,
        nft_holders_share_bps: u16,
        dao_treasury_pubkey: Pubkey,
        fee_collector_pubkey: Pubkey
    ) -> Result<()> {
        let tax_config = &mut ctx.accounts.tax_config;
        tax_config.authority = ctx.accounts.authority.key();
        tax_config.tax_rate_bps = tax_rate_bps;
        tax_config.dao_share_bps = dao_share_bps;
        tax_config.nft_holders_share_bps = nft_holders_share_bps;
        tax_config.dao_treasury_pubkey = dao_treasury_pubkey;
        tax_config.fee_collector_pubkey = fee_collector_pubkey;
        // tax_config.burn_and_earn_escrow_authority = burn_and_earn_escrow_authority; // Если нужно для исключений

        msg!("Конфигурация налога обновлена: Ставка {} BPS, Доля DAO {} BPS, Доля NFT {} BPS", tax_rate_bps, dao_share_bps, nft_holders_share_bps);
        Ok(())
    }

    /// Держатель NFT Fee Key вызывает для получения своей доли из пула налогов.
    /// (Логика клейма здесь не реализована полностью, требует NFTHolderInfo и NFTHoldersPool)
    pub fn claim_nft_holder_reward(_ctx: Context<ClaimNFTReward>) -> Result<()> {
        // TODO: Реализовать логику клейма наград для держателей NFT Fee Key.
        // 1. Загрузить NFTHolderInfo для данного NFT.
        // 2. Рассчитать доступную сумму на основе его доли и средств в NFTHoldersPool (fee_collector_token_account).
        // 3. Перевести средства.
        // 4. Обновить last_claimed в NFTHolderInfo.
        msg!("Функция claim_nft_holder_reward еще не реализована полностью.");
        err!(VgTokenError::NotImplemented)
    }
    
    /// Установка метаданных токена с использованием Metaplex.
    /// Mint authority - PDA этого контракта (до отзыва). Update authority - DAO.
    pub fn set_metadata(
        ctx: Context<SetMetadata>, 
        name: String, 
        symbol: String, 
        uri: String
    ) -> Result<()> {
        msg!("Установка метаданных для VG токена: {}, {}, {}", name, symbol, uri);

        let mint_seeds = &[
            VG_TOKEN_MINT_SEED, 
            &[ctx.bumps.mint_account]
        ];

        let data_v2 = mpl_token_metadata::types::DataV2 {
            name,
            symbol,
            uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        };

        let ix = mpl_token_metadata::instructions::CreateMetadataAccountV3 {
            metadata: ctx.accounts.metadata_account.key(),
            mint: ctx.accounts.mint_account.key(),
            mint_authority: ctx.accounts.mint_account.key(), // PDA mint_account как временный mint_authority
            payer: ctx.accounts.payer.key(),
            update_authority: (ctx.accounts.dao_authority.key(), true), // DAO как update_authority
            system_program: ctx.accounts.system_program.key(),
            rent: Some(ctx.accounts.rent.key()),
        }
        .instruction(mpl_token_metadata::instructions::CreateMetadataAccountV3InstructionArgs {
            data: data_v2,
            is_mutable: true, // Метаданные VG могут быть изменены DAO
            collection_details: None,
        });
        
        anchor_lang::solana_program::program::invoke_signed(
            &ix,
            &[
                ctx.accounts.metadata_account.to_account_info(),
                ctx.accounts.mint_account.to_account_info(), // mint
                ctx.accounts.payer.to_account_info(),      // payer
                ctx.accounts.mint_account.to_account_info(), // mint_authority signer
                ctx.accounts.dao_authority.to_account_info(), // update_authority (должен быть signer если не PDA)
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.rent.to_account_info(),
            ],
            &[&mint_seeds[..]], // Подпись от имени PDA mint_account
        )?;

        msg!("Метаданные VG токена успешно установлены/обновлены.");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(
        init,
        payer = payer,
        seeds = [VG_TOKEN_MINT_SEED], // PDA для минта VG токена
        bump,
        mint::decimals = TOKEN_DECIMALS,
        mint::authority = mint_account, // PDA mint_account будет временным mint_authority
        // mint::freeze_authority не указываем, будет None по умолчанию
    )]
    pub mint_account: InterfaceAccount<'info, Mint>, // Обычный SPL Mint

    /// Эскроу-аккаунт (PDA программы Burn and Earn), который будет авторитетом для токен-аккаунта,
    /// хранящего все выпущенные VG токены для дальнейшего распределения программой Burn and Earn.
    /// CHECK: Адрес этого PDA должен быть корректно вычислен клиентом и принадлежать программе Burn and Earn.
    pub burn_and_earn_escrow_pda: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint_account,
        associated_token::authority = burn_and_earn_escrow_pda,
    )]
    pub escrow_vault_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>, // Стандартная SPL Token программа
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct TransferWithTax<'info> {
    #[account(mut)]
    pub sender_authority: Signer<'info>, // Кто инициирует перевод
    
    // PDA аккаунт с конфигурацией налога
    #[account(
        seeds = [b"tax_config_seed"], // Пример сида, нужно определить свой
        bump,
        // constraint = tax_config.authority == ... // Возможно, проверка авторитета tax_config
    )]
    pub tax_config: Account<'info, TaxConfig>,
    
    #[account(
        mut,
        // constraint = mint_account.is_initialized @ VgTokenError::MintError,
        // constraint = mint_account.mint_authority.is_none() @ VgTokenError::MintError, // Проверка, что минт больше невозможен
        // constraint = mint_account.freeze_authority.is_none() @ VgTokenError::MintError, // Проверка, что заморозка невозможна
    )]
    pub mint_account: InterfaceAccount<'info, Mint>, // Минт VG токена
    
    #[account(
        mut,
        associated_token::mint = mint_account,
        associated_token::authority = sender_authority,
    )]
    pub sender_token_account: InterfaceAccount<'info, TokenAccount>,
    
    /// CHECK: Получатель токенов, может быть любым аккаунтом.
    #[account(mut)]
    pub recipient_authority: UncheckedAccount<'info>, // Авторитет (владелец) ATA получателя

    #[account(
        init_if_needed,
        payer = sender_authority, // Отправитель платит за создание ATA получателя, если его нет
        associated_token::mint = mint_account,
        associated_token::authority = recipient_authority,
    )]
    pub recipient_token_account: InterfaceAccount<'info, TokenAccount>,
    
    /// CHECK: Авторитет (владелец) токен-аккаунта казны DAO.
    #[account(address = tax_config.dao_treasury_pubkey @ VgTokenError::InvalidTaxCalculation)] // Проверка, что это правильный адрес из конфига
    pub dao_treasury_authority: UncheckedAccount<'info>, 

    #[account(
        init_if_needed,
        payer = sender_authority,
        associated_token::mint = mint_account,
        associated_token::authority = dao_treasury_authority,
    )]
    pub dao_treasury_token_account: InterfaceAccount<'info, TokenAccount>,
    
    /// CHECK: Авторитет (владелец) токен-аккаунта для сбора налога для NFT холдеров.
    #[account(address = tax_config.fee_collector_pubkey @ VgTokenError::InvalidTaxCalculation)] // Проверка из конфига
    pub fee_collector_authority: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = sender_authority,
        associated_token::mint = mint_account,
        associated_token::authority = fee_collector_authority,
    )]
    pub fee_collector_token_account: InterfaceAccount<'info, TokenAccount>,
    
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(Default)]
pub struct TaxConfig {
    pub authority: Pubkey, // Авторитет, который может обновлять эту конфигурацию (DAO)
    pub tax_rate_bps: u16, // Ставка налога в базисных пунктах (1000 = 10%)
    pub dao_share_bps: u16, // Доля DAO от налога в базисных пунктах (5000 = 50%)
    pub nft_holders_share_bps: u16, // Доля NFT холдеров от налога (5000 = 50%)
    pub dao_treasury_pubkey: Pubkey, // Адрес ТОКЕН-АККАУНТА казны DAO
    pub fee_collector_pubkey: Pubkey, // Адрес ТОКЕН-АККАУНТА для сбора налога для NFT холдеров
    // pub burn_and_earn_escrow_authority: Pubkey, // Опционально, для исключения из налога
}

#[derive(Accounts)]
pub struct UpsertTaxConfig<'info> {
    #[account(mut)]
    pub payer: Signer<'info>, // Кто платит за создание/обновление аккаунта

    #[account(
        init_if_needed, // Создаем, если нет, или загружаем существующий
        payer = payer,
        space = 8 + std::mem::size_of::<TaxConfig>(), // 8 байт дискриминатор + размер структуры
        seeds = [b"tax_config_seed"], // Определяем уникальный сид для PDA
        bump
    )]
    pub tax_config: Account<'info, TaxConfig>,

    // Авторитет, который имеет право изменять конфигурацию (например, мультисиг DAO или PDA DAO Executor)
    // Если tax_config.authority еще не установлен (первая инициализация), то payer становится authority.
    // Иначе, authority должен быть Signer и совпадать с tax_config.authority.
    #[account(
        mut,
        constraint = tax_config.authority == Pubkey::default() || tax_config.authority == authority.key() @ VgTokenError::Unauthorized
    )]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct ClaimNFTReward<'info> {
    // TODO: Определить аккаунты для клейма наград
    // pub nft_owner: Signer<'info>,
    // pub nft_fee_key_mint: InterfaceAccount<'info, Mint>, // Минт NFT Fee Key
    // #[account(mut, seeds = [b"nft_holder_info", nft_fee_key_mint.key().as_ref()], bump)]
    // pub nft_holder_info: Account<'info, NFTHolderInfo>, // PDA с информацией о доле NFT
    // #[account(mut, token::mint = vg_token_mint, token::authority = fee_collector_authority_pda)]
    // pub fee_collector_token_account: InterfaceAccount<'info, TokenAccount>, // Пул налогов
    // pub fee_collector_authority_pda: UncheckedAccount<'info>, // PDA, контролирующий fee_collector_token_account
    // #[account(mut, associated_token::mint = vg_token_mint, associated_token::authority = nft_owner)]
    // pub owner_token_account: InterfaceAccount<'info, TokenAccount>, // Куда переводить награду
    // pub vg_token_mint: InterfaceAccount<'info, Mint>,
    // pub token_program: Interface<'info, TokenInterface>,
}

// #[account] // Эта структура описывалась в PRD для хранения информации о доле каждого NFT Fee Key
// pub struct NFTHolderInfo {
//     pub nft_mint: Pubkey,
//     pub owner: Pubkey,
//     pub tier_multiplier: u16,
//     pub locked_lp_amount: u64,
//     pub share_percentage: u16,
//     pub last_claimed: i64,
// }


#[derive(Accounts)]
pub struct SetMetadata<'info> {
    #[account(mut)]
    pub payer: Signer<'info>, 
    
    /// Авторитет DAO, который будет установлен как update_authority для метаданных.
    /// CHECK: Должен быть реальным авторитетом DAO (мультисиг или PDA).
    pub dao_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [VG_TOKEN_MINT_SEED], // PDA минта VG
        bump,
    )]
    pub mint_account: InterfaceAccount<'info, Mint>, // Обычный SPL Mint
    
    #[account(
        init_if_needed,
        payer = payer,
        seeds = [
            b"metadata",
            mpl_token_metadata::ID.as_ref(),
            mint_account.key().as_ref(),
        ],
        bump,
        space = 8 + mpl_token_metadata::state::MAX_METADATA_LEN,
        seeds::program = mpl_token_metadata::ID
    )]
    pub metadata_account: UncheckedAccount<'info>,
    
    #[account(address = mpl_token_metadata::ID)]
    pub metadata_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// Ошибки программы
#[error_code]
pub enum VgTokenError {
    #[msg("Операция не авторизована")]
    Unauthorized,
    #[msg("Ошибка при создании или доступе к минту токена")]
    MintError,
    #[msg("Недостаточный баланс для выполнения перевода")]
    InsufficientBalance,
    #[msg("Неверно рассчитан налог")]
    InvalidTaxCalculation,
    #[msg("Сумма перевода не может быть нулевой")]
    InvalidAmount,
    #[msg("Произошло переполнение при математических операциях")]
    MathOverflow,
    #[msg("Функция еще не реализована")]
    NotImplemented,
} 