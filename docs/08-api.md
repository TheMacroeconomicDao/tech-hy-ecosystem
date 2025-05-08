# API и интерфейсы

## Обзор

Данный документ описывает API и интерфейсы смарт-контрактов экосистемы VC/VG токенов на Solana. API предоставляет набор функций для взаимодействия с различными компонентами экосистемы, включая токены, механизм "Burn and Earn", стейкинг, NFT Fee Key и DAO.

## API основных контрактов

### VC Token API

```rust
pub fn initialize(ctx: Context<Initialize>, name: String, symbol: String, decimals: u8) -> Result<()>
pub fn mint_to(ctx: Context<MintTo>, amount: u64) -> Result<()>
pub fn transfer(ctx: Context<Transfer>, amount: u64) -> Result<()>
pub fn burn(ctx: Context<Burn>, amount: u64) -> Result<()>
pub fn approve(ctx: Context<Approve>, amount: u64) -> Result<()>
pub fn revoke(ctx: Context<Revoke>) -> Result<()>
```

#### Инструкции

| Функция | Описание | Параметры |
|---------|----------|-----------|
| `initialize` | Инициализация токена VC | `name`: Название токена<br>`symbol`: Символ токена<br>`decimals`: Количество десятичных знаков |
| `mint_to` | Выпуск новых VC токенов | `amount`: Количество токенов для выпуска |
| `transfer` | Перевод VC токенов без налога | `amount`: Количество токенов для перевода |
| `burn` | Сжигание VC токенов | `amount`: Количество токенов для сжигания |
| `approve` | Авторизация третьей стороны для использования токенов | `amount`: Количество токенов для авторизации |
| `revoke` | Отзыв авторизации | - |

### VG Token API

```rust
pub fn initialize(ctx: Context<Initialize>, name: String, symbol: String, decimals: u8, tax_rate: u8) -> Result<()>
pub fn mint_to(ctx: Context<MintTo>, amount: u64) -> Result<()>
pub fn transfer(ctx: Context<Transfer>, amount: u64) -> Result<()>
pub fn update_tax_parameters(ctx: Context<UpdateTaxParameters>, new_parameters: TaxParametersArgs) -> Result<()>
pub fn distribute_tax(ctx: Context<DistributeTax>, tax_amount: u64) -> Result<()>
```

#### Инструкции

| Функция | Описание | Параметры |
|---------|----------|-----------|
| `initialize` | Инициализация токена VG с налогом | `name`: Название токена<br>`symbol`: Символ токена<br>`decimals`: Количество десятичных знаков<br>`tax_rate`: Налоговая ставка (в %) |
| `mint_to` | Выпуск новых VG токенов | `amount`: Количество токенов для выпуска |
| `transfer` | Перевод VG токенов с учетом налога | `amount`: Количество токенов для перевода |
| `update_tax_parameters` | Обновление параметров налогообложения | `new_parameters`: Новые параметры налога |
| `distribute_tax` | Распределение собранного налога | `tax_amount`: Количество токенов для распределения |

### Burn and Earn API

```rust
pub fn convert_vc_to_lp_and_lock(ctx: Context<ConvertVcToLpAndLock>, vc_amount: u64) -> Result<()>
pub fn calculate_expected_vg(ctx: Context<CalculateVG>, vc_amount: u64) -> Result<u64>
```

#### Инструкции

| Функция | Описание | Параметры |
|---------|----------|-----------|
| `convert_vc_to_lp_and_lock` | Конвертация VC в LP токены с постоянной блокировкой | `vc_amount`: Количество VC токенов для конвертации |
| `calculate_expected_vg` | Расчет ожидаемого количества VG токенов | `vc_amount`: Количество VC токенов |

### VC Staking API

```rust
pub fn stake_vc(ctx: Context<StakeVC>) -> Result<()>
pub fn unstake_vc(ctx: Context<UnstakeVC>) -> Result<()>
pub fn get_nft_booster_info(ctx: Context<GetNFTBoosterInfo>, nft_mint: Pubkey) -> Result<NFTBoosterInfo>
```

#### Инструкции

| Функция | Описание | Параметры |
|---------|----------|-----------|
| `stake_vc` | Стейкинг 1 млн VC токенов и создание NFT-бустера | - |
| `unstake_vc` | Вывод VC токенов после окончания периода стейкинга | - |
| `get_nft_booster_info` | Получение информации о NFT-бустере | `nft_mint`: Адрес NFT |

### VG Staking API

```rust
pub fn stake_vg(ctx: Context<StakeVG>, amount: u64, nft_booster: Option<Pubkey>) -> Result<()>
pub fn unstake_vg(ctx: Context<UnstakeVG>) -> Result<()>
pub fn calculate_staking_period(ctx: Context<CalculateStakingPeriod>, amount: u64, has_nft_booster: bool) -> Result<u64>
pub fn apply_nft_booster(ctx: Context<ApplyNftBooster>, vg_staking_account: Pubkey) -> Result<()>
```

#### Инструкции

| Функция | Описание | Параметры |
|---------|----------|-----------|
| `stake_vg` | Стейкинг VG токенов с опциональным NFT-бустером | `amount`: Количество VG токенов<br>`nft_booster`: Опциональный адрес NFT-бустера |
| `unstake_vg` | Вывод VG токенов после окончания периода стейкинга | - |
| `calculate_staking_period` | Расчет периода стейкинга | `amount`: Количество VG токенов<br>`has_nft_booster`: Наличие NFT-бустера |
| `apply_nft_booster` | Применение NFT-бустера к существующему стейкингу | `vg_staking_account`: Адрес аккаунта стейкинга VG |

### NFT Fee Key API

```rust
pub fn create_fee_key(ctx: Context<CreateFeeKey>, locked_lp_amount: u64) -> Result<()>
pub fn claim_fee_rewards(ctx: Context<ClaimFeeRewards>) -> Result<()>
pub fn update_fee_shares(ctx: Context<UpdateFeeShares>) -> Result<()>
```

#### Инструкции

| Функция | Описание | Параметры |
|---------|----------|-----------|
| `create_fee_key` | Создание NFT Fee Key | `locked_lp_amount`: Количество заблокированных LP токенов |
| `claim_fee_rewards` | Сбор накопленного вознаграждения | - |
| `update_fee_shares` | Обновление долей в пуле комиссий | - |

### DAO API

```rust
pub fn create_dao_realm(ctx: Context<CreateDaoRealm>, name: String, min_voting_tokens: u64, min_proposal_tokens: u64) -> Result<()>
pub fn create_proposal(ctx: Context<CreateProposal>, name: String, description: String, proposal_type: u8, parameters: Vec<ProposalParameter>) -> Result<()>
pub fn cast_vote(ctx: Context<CastVote>, vote: u8) -> Result<()>
pub fn execute_proposal(ctx: Context<ExecuteProposal>) -> Result<()>
pub fn fund_treasury(ctx: Context<FundTreasury>, amount: u64) -> Result<()>
pub fn spend_treasury_funds(ctx: Context<SpendTreasuryFunds>, amount: u64, recipient: Pubkey, purpose: String) -> Result<()>
```

#### Инструкции

| Функция | Описание | Параметры |
|---------|----------|-----------|
| `create_dao_realm` | Создание DAO через Realms | `name`: Название DAO<br>`min_voting_tokens`: Минимальное количество токенов для голосования<br>`min_proposal_tokens`: Минимальное количество токенов для создания предложения |
| `create_proposal` | Создание предложения для голосования | `name`: Название предложения<br>`description`: Описание предложения<br>`proposal_type`: Тип предложения<br>`parameters`: Параметры предложения |
| `cast_vote` | Голосование за или против предложения | `vote`: Голос (0 - против, 1 - за) |
| `execute_proposal` | Выполнение принятого предложения | - |
| `fund_treasury` | Пополнение казны DAO | `amount`: Количество токенов |
| `spend_treasury_funds` | Использование средств казны | `amount`: Количество токенов<br>`recipient`: Получатель<br>`purpose`: Цель расходования |

## Типы данных API

### Основные типы

```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
pub enum ProposalStatus {
    Draft,
    Voting,
    Succeeded,
    Failed,
    Executing,
    Executed,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct ProposalParameter {
    pub name: String,
    pub value_type: u8,  // 1 - u64, 2 - String, 3 - bool, 4 - Pubkey
    pub value: Vec<u8>,  // Serialized value
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct NFTBoosterInfo {
    pub owner: Pubkey,
    pub boost_multiplier: f64,
    pub status: u8,       // 1 - Active, 2 - Used, 3 - Expired
    pub vg_staking_account: Option<Pubkey>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct TaxParametersArgs {
    pub tax_rate: Option<u8>,
    pub fee_distribution_percentage: Option<u8>,
    pub buyback_percentage: Option<u8>,
    pub dao_percentage: Option<u8>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct EmergencyActionParameter {
    pub name: String,
    pub value_type: u8,
    pub value: Vec<u8>,
}
```

## API для клиентов (JavaScript/TypeScript)

### Инициализация клиента

```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program } from '@project-serum/anchor';
import { VcVgEcosystem } from './types/vc_vg_ecosystem';

// Инициализация соединения с Solana
const connection = new Connection('https://api.mainnet-beta.solana.com');

// Инициализация провайдера
const provider = new AnchorProvider(connection, wallet, {});

// Инициализация программ
const vcTokenProgram = new Program<VcVgEcosystem>(
  idl, 
  new PublicKey('VC_TOKEN_PROGRAM_ID'),
  provider
);

const vgTokenProgram = new Program<VcVgEcosystem>(
  idl, 
  new PublicKey('VG_TOKEN_PROGRAM_ID'),
  provider
);

const burnAndEarnProgram = new Program<VcVgEcosystem>(
  idl, 
  new PublicKey('BURN_AND_EARN_PROGRAM_ID'),
  provider
);

const vcStakingProgram = new Program<VcVgEcosystem>(
  idl, 
  new PublicKey('VC_STAKING_PROGRAM_ID'),
  provider
);

const vgStakingProgram = new Program<VcVgEcosystem>(
  idl, 
  new PublicKey('VG_STAKING_PROGRAM_ID'),
  provider
);

const nftFeeKeyProgram = new Program<VcVgEcosystem>(
  idl, 
  new PublicKey('NFT_FEE_KEY_PROGRAM_ID'),
  provider
);

const daoProgram = new Program<VcVgEcosystem>(
  idl, 
  new PublicKey('DAO_PROGRAM_ID'),
  provider
);
```

### Примеры использования API

#### Конвертация VC в LP токены

```typescript
// Конвертация VC в LP токены с постоянной блокировкой
async function convertVcToLpAndLock(vcAmount: number) {
  const tx = await burnAndEarnProgram.methods
    .convertVcToLpAndLock(new BN(vcAmount))
    .accounts({
      user: provider.wallet.publicKey,
      userVcTokenAccount: userVcTokenAccountAddress,
      userVgTokenAccount: userVgTokenAccountAddress,
      userLpTokenAccount: userLpTokenAccountAddress,
      swapVcTokenAccount: swapVcTokenAccountAddress,
      liquidityVcTokenAccount: liquidityVcTokenAccountAddress,
      permanentLockVault: permanentLockVaultAddress,
      vgMint: vgMintAddress,
      vgMintAuthority: vgMintAuthorityAddress,
      burnAndEarnStats: burnAndEarnStatsAddress,
      feeKeyMint: feeKeyMintAddress,
      feeKeyAccount: feeKeyAccountAddress,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      // ... другие необходимые аккаунты
    })
    .rpc();
    
  console.log(`Транзакция выполнена: ${tx}`);
  return tx;
}

// Расчет ожидаемого количества VG токенов
async function calculateExpectedVG(vcAmount: number) {
  const result = await burnAndEarnProgram.methods
    .calculateExpectedVg(new BN(vcAmount))
    .accounts({
      // ... необходимые аккаунты
    })
    .view();
    
  console.log(`Ожидаемое количество VG токенов: ${result.toString()}`);
  return result;
}
```

#### Стейкинг VC токенов

```typescript
// Стейкинг VC токенов и создание NFT-бустера
async function stakeVC() {
  const tx = await vcStakingProgram.methods
    .stakeVc()
    .accounts({
      owner: provider.wallet.publicKey,
      userVcTokenAccount: userVcTokenAccountAddress,
      vcVault: vcVaultAddress,
      vcStakingAccount: vcStakingAccountAddress,
      nftBoosterAccount: nftBoosterAccountAddress,
      nftMint: nftMintAddress,
      nftTokenAccount: nftTokenAccountAddress,
      mintAuthority: mintAuthorityAddress,
      metadataAccount: metadataAccountAddress,
      editionAccount: editionAccountAddress,
      metaplexProgram: METAPLEX_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
    })
    .rpc();
    
  console.log(`Транзакция выполнена: ${tx}`);
  return tx;
}

// Вывод VC токенов после окончания периода стейкинга
async function unstakeVC() {
  const tx = await vcStakingProgram.methods
    .unstakeVc()
    .accounts({
      owner: provider.wallet.publicKey,
      userVcTokenAccount: userVcTokenAccountAddress,
      vcVault: vcVaultAddress,
      vcStakingAccount: vcStakingAccountAddress,
      nftBoosterAccount: nftBoosterAccountAddress,
      vcVaultState: vcVaultStateAddress,
      tokenProgram: TOKEN_PROGRAM_ID,
      clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
    })
    .rpc();
    
  console.log(`Транзакция выполнена: ${tx}`);
  return tx;
}
```

#### Стейкинг VG токенов

```typescript
// Стейкинг VG токенов с NFT-бустером
async function stakeVG(amount: number, nftBooster?: PublicKey) {
  const tx = await vgStakingProgram.methods
    .stakeVg(new BN(amount), nftBooster || null)
    .accounts({
      owner: provider.wallet.publicKey,
      userVgTokenAccount: userVgTokenAccountAddress,
      vgVault: vgVaultAddress,
      taxVault: taxVaultAddress,
      vgStakingAccount: vgStakingAccountAddress,
      vgStakingState: vgStakingStateAddress,
      nftBoosterAccount: nftBooster ? nftBoosterAccountAddress : null,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      // ... другие необходимые аккаунты
    })
    .rpc();
    
  console.log(`Транзакция выполнена: ${tx}`);
  return tx;
}

// Расчет периода стейкинга
async function calculateStakingPeriod(amount: number, hasNftBooster: boolean) {
  const result = await vgStakingProgram.methods
    .calculateStakingPeriod(new BN(amount), hasNftBooster)
    .view();
    
  console.log(`Период стейкинга: ${result.toString()} дней`);
  return result;
}
```

## Обработка ошибок

### Коды ошибок

```rust
#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient VC balance")]
    InsufficientVcBalance,
    
    #[msg("Insufficient VG balance")]
    InsufficientVgBalance,
    
    #[msg("Staking period not ended")]
    StakingPeriodNotEnded,
    
    #[msg("Already unstaked")]
    AlreadyUnstaked,
    
    #[msg("Not authorized")]
    NotAuthorized,
    
    #[msg("Booster not active")]
    BoosterNotActive,
    
    #[msg("Booster already used")]
    BoosterAlreadyUsed,
    
    #[msg("Booster account not provided")]
    BoosterAccountNotProvided,
    
    #[msg("Invalid booster account")]
    InvalidBoosterAccount,
    
    #[msg("Proposal not succeeded")]
    ProposalNotSucceeded,
    
    #[msg("Proposal already executed")]
    ProposalAlreadyExecuted,
    
    #[msg("Unknown proposal type")]
    UnknownProposalType,
    
    #[msg("Unknown action type")]
    UnknownActionType,
    
    #[msg("Insufficient signatures")]
    InsufficientSignatures,
    
    #[msg("Tax rate too high")]
    TaxRateTooHigh,
}
```

### Обработка ошибок в клиентском коде

```typescript
try {
  await stakeVG(1000);
  console.log('Стейкинг успешно выполнен');
} catch (error) {
  if (error.message.includes('InsufficientVgBalance')) {
    console.error('Недостаточно VG токенов для стейкинга');
  } else if (error.message.includes('BoosterNotActive')) {
    console.error('NFT-бустер не активен');
  } else {
    console.error(`Произошла ошибка: ${error.message}`);
  }
}
```

## События (Events)

```rust
#[event]
pub struct VcTokenTransferred {
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
}

#[event]
pub struct VgTokenTransferred {
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub tax_amount: u64,
}

#[event]
pub struct LpTokensLocked {
    pub user: Pubkey,
    pub lp_amount: u64,
    pub vg_amount: u64,
    pub fee_key_mint: Pubkey,
}

#[event]
pub struct VcStaked {
    pub user: Pubkey,
    pub amount: u64,
    pub nft_mint: Pubkey,
    pub unlock_timestamp: i64,
}

#[event]
pub struct VgStaked {
    pub user: Pubkey,
    pub amount: u64,
    pub has_nft_booster: bool,
    pub unlock_timestamp: i64,
    pub is_auto_reinvestment: bool,
}

#[event]
pub struct FeeRewardsClaimed {
    pub user: Pubkey,
    pub fee_key_mint: Pubkey,
    pub amount: u64,
}

#[event]
pub struct ProposalCreated {
    pub proposer: Pubkey,
    pub proposal: Pubkey,
    pub name: String,
    pub proposal_type: u8,
}

#[event]
pub struct ProposalExecuted {
    pub proposal: Pubkey,
    pub executor: Pubkey,
    pub executed_at: i64,
}
```

## Мониторинг событий

```typescript
// Подписка на события
const eventListener = vgStakingProgram.addEventListener('VgStaked', (event) => {
  console.log('Новый стейкинг VG токенов:');
  console.log(`Пользователь: ${event.user.toString()}`);
  console.log(`Количество: ${event.amount.toString()}`);
  console.log(`NFT-бустер: ${event.has_nft_booster ? 'Да' : 'Нет'}`);
  console.log(`Дата разблокировки: ${new Date(event.unlock_timestamp * 1000).toLocaleString()}`);
  console.log(`Автореинвестирование: ${event.is_auto_reinvestment ? 'Да' : 'Нет'}`);
});

// Отписка от событий
await vgStakingProgram.removeEventListener(eventListener);
```

## Заключение

API и интерфейсы экосистемы VC/VG токенов предоставляют полный набор функций для взаимодействия со всеми компонентами системы. Разработчики могут использовать эти API для интеграции экосистемы в свои приложения или для разработки новых сервисов на базе экосистемы.

Подробная документация по каждому API, включая структуры данных, параметры и ошибки, а также примеры использования, делает процесс разработки более эффективным и позволяет избежать ошибок. 