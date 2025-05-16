# Ecosystem Tokens

## Token Overview

The VC/VG ecosystem consists of three main types of tokens:

1. **VC Token** – the main ecosystem token with zero tax (0%)
2. **VG Token** – governance token with a 10% tax
3. **LP Token** – liquidity token for the VC/SOL pair

Each token has its unique role in the ecosystem and provides specific functionality. This document details the characteristics, emission, distribution, and usage of each token.

## VC Token

VC Token is the main token of the ecosystem, used for creating LP tokens, staking to receive NFT boosters, and paying for services in the TECH HY ecosystem.

### Characteristics

- **Ticker**: VC
- **Type**: SPL Token
- **Blockchain**: Solana
- **Decimals**: 9
- **Tax**: 0%
- **Total Supply**: 5,000,000,000 VC

### Technical Parameters

- **No Mint**
- **Freeze authority**: None after initialization
- **Token metadata**:
  - **Name**: TECH HY Venture Club Token
  - **Symbol**: VC
  - **Metadata URI**: https://techhy.me/metadata/vc-token.json
  - **Image**: https://techhy.me/images/vc-logo.png

### Usage

1. **Creating LP tokens**:
   - Adding VC/SOL liquidity via the "Burn and Earn" mechanism
   - Staking 1M tokens for 90 days to receive an NFT booster

2. **Financial instruments**:
   - Nominal value 1 VC = $1 for paying for services in the ecosystem
   - Pay up to 50% of TECH HY services with VC (percentage depends on DAO level)
   - Used as collateral for TECH HY Venture Club Fund
   - Used as collateral for Success Fee Deposit

3. **Access to exclusive features**:
   - Spend 1,000,000 VC to get lifetime access to TECH HY Investors Private Club
   - Receive cashback in VC for purchasing services in the B2B Marketplace
   - Participate in LP SOL-VC farming on DEX platforms

### Implementation

VC Token is implemented as a standard SPL token with no modifications to transaction logic. Main functions include:

- Token initialization with specified parameters
- Standard transfer operations with no additional fees
- Interaction with other ecosystem components via CPI (Cross-Program Invocation)

#### Program Interface (API)

```rust
// Main instructions
pub enum VCTokenInstruction {
    /// Token initialization
    Initialize,
    /// Transfer tokens from one account to another
    Transfer { amount: u64 },
}

pub enum AdminOperationType {
    UpdateMetadata { new_uri: String },
    TransferAuthority { new_authority: Pubkey },
}
```

## VG Token

VG Token is a governance token with a 10% transaction tax, used for ecosystem governance via DAO. VG cannot be bought directly; it can only be obtained through ecosystem mechanisms.

### Characteristics

- **Ticker**: VG
- **Type**: Modified SPL Token (SPL22)
- **Blockchain**: Solana
- **Decimals**: 9
- **Tax**: 10% of transaction amount
- **Total Supply**: 1,000,000,000 VG
- **Tokens for sale**: 0% (cannot be bought directly)
- **Tax distribution**:
  - 50% to NFT Fee Key holders
  - 50% to DAO treasury

### Technical Parameters

- **Mint authority**: None (tokens are pre-minted at initialization, minting is disabled)
- **Not for sale or purchase, only obtainable via permanent lock of VC/SOL LP tokens and distributed by the Burn and Earn program from the initial pool via permanent lock of VC/SOL LP tokens**
- **Freeze authority**: None (freezing tokens or accounts is disabled)
- **Token metadata**:
  - **Name**: TECH HY Venture Gift Token
  - **Symbol**: VG
  - **Metadata URI**: https://techhy.me/metadata/vg-token.json
  - **Image**: https://techhy.me/images/vg-logo.png

### Tax Account Structure

To manage the tax, the following accounts are used:

1. **TaxConfigAccount (PDA)** – stores tax parameters:
   ```rust
   pub struct TaxConfig {
       pub tax_rate: u16,          // 10% = 1000 (base 10000)
       pub dao_share: u16,         // 50% = 5000 (base 10000)
       pub nft_holders_share: u16, // 50% = 5000 (base 10000)
       pub dao_treasury: Pubkey,   // DAO treasury address
       pub authority: Pubkey,      // DAO multisig address
   }
   ```

2. **NFTHoldersPool (PDA)** – temporary storage for taxes for NFT holders:
   ```rust
   pub struct NFTHoldersPool {
       pub total_collected: u64,     // Total tax collected
       pub last_distribution: i64,   // Last distribution time
       pub distribution_period: i64, // Distribution period (in seconds)
   }
   ```

3. **NFTHolderInfo (PDA for each NFT)** – stores info about NFT share:
   ```rust
   pub struct NFTHolderInfo {
       pub nft_mint: Pubkey,         // NFT mint address
       pub owner: Pubkey,            // NFT owner
       pub tier_multiplier: u16,     // NFT tier multiplier (base 1000)
       pub locked_lp_amount: u64,    // Amount of locked LP
       pub share_percentage: u16,    // Share of total pool (base 10000)
       pub last_claimed: i64,        // Last reward claim time
   }
   ```

### Tax Implementation

VG token transaction tax is implemented by intercepting standard SPL instructions:

1. **Implementation method**: Custom program wrapper (CPI to SPL Token Program)

2. **Tax collection process**:
   ```rust
   // Pseudocode
   fn process_transfer(source, destination, amount) {
       // Calculate tax
       let tax_amount = amount * tax_rate / 10000;
       let user_amount = amount - tax_amount;
       
       // Calculate shares
       let dao_amount = tax_amount * dao_share / 10000;
       let nft_amount = tax_amount - dao_amount;
       
       // Transfer main amount
       token_program::transfer(source, destination, user_amount);
       
       // Transfer tax
       token_program::transfer(source, dao_treasury, dao_amount);
       token_program::transfer(source, nft_holders_pool, nft_amount);
       
       // Update tax pool data
       update_nft_holders_pool(nft_amount);
   }
   ```

### Program Interface (API)

```rust
// Main instructions
pub enum VGTokenInstruction {
    /// Initialize tax config
    InitializeTaxConfig {
        tax_rate: u16,
        dao_share: u16,
        nft_holders_share: u16,
    },
    /// Update tax parameters (DAO only)
    UpdateTaxConfig {
        tax_rate: u16,
        dao_share: u16,
        nft_holders_share: u16,
    },
    /// Transfer tokens with tax
    Transfer { amount: u64 },
    /// Distribute tax among NFT holders
    DistributeNFTHoldersRewards,
    /// Claim NFT holder reward
    ClaimNFTHolderReward { nft_mint: Pubkey },
}
```

### Usage

1. **VG token staking**:
   - Lock for a period depending on token amount
   - Apply NFT boosters to improve staking conditions
   - Automatic reinvestment for large stakes
   - Receive passive income from:
     - 50% of DAO income
     - 10% fee from every VG transaction
     - VC staking reward pool
     - Trading fees from Raydium (Burn & Earn program)

2. **Ecosystem governance (DAO)**:
   - Vote on proposals
   - Make decisions on ecosystem development
   - Manage smart contract parameters
   - Participate in investment committee (for certain levels)

3. **Access to privileges**:
   - Access to special DAO levels from Starter to Partner (depending on amount)
   - Receive additional drops and boosters
   - Access to exclusive community events

### Implementation

VG Token is implemented as a modified SPL token with additional logic for tax collection and distribution. Key aspects:

- Initialization with tax rate and distribution parameters
- Modified transfer function that collects tax
- Mechanism for distributing tax among recipients
- Integration with DAO treasury and buyback system

## LP Token

LP Token is the liquidity token for the VC/SOL pair, created via Raydium and used in the "Burn and Earn" mechanism.

### Characteristics

- **Type**: Standard Raydium LP token
- **Pair**: VC/SOL
- **Usage**: Permanent lock, no withdrawal possible

### Technical Implementation

- **PermanentLockVault (PDA)** – account for storing locked LP tokens:
  ```rust
  pub struct PermanentLockVault {
      pub total_locked_lp: u64,            // Total locked LP
      pub total_weighted_locked_lp: u64,   // Weighted LP sum (with NFT multipliers)
      pub lp_mint: Pubkey,                 // LP token mint address
      pub authority: Pubkey,               // Program authority (PDA)
  }
  ```

- **UserLockInfo (PDA for each user)** – stores lock info:
  ```rust
  pub struct UserLockInfo {
      pub user: Pubkey,              // User address
      pub locked_lp_amount: u64,     // Amount of locked LP
      pub lock_timestamp: i64,       // Lock time
      pub vg_received: u64,          // Amount of VG received
      pub nft_mint: Option<Pubkey>,  // Mint address of issued NFT (if any)
  }
  ```

### Implementation

LP tokens are created via Raydium integration and locked in a special vault. The process includes:

- Creation via Raydium integration
- Locking in PermanentLockVault (PDA)
- Minting VG tokens proportional to locked LP
- Creating NFT Fee Key for receiving part of tax revenue

### Program Interface (API)

```rust
// Main instructions
pub enum LPTokenInstruction {
    /// Initialize vault for locking LP tokens
    InitializeLockVault { 
        lp_mint: Pubkey 
    },
    /// Lock LP tokens and receive VG + NFT
    LockLPTokens { 
        amount: u64 
    },
    /// Get lock info
    GetUserLockInfo { 
        user: Pubkey 
    },
}
```

## Token Interactions in the Ecosystem

### VC Token Circulation

1. **VC tokens**:
   - Free transfer with no tax
   - Add liquidity to create LP tokens (Burn and Earn mechanism)
   - Stake for NFT boosters

### VG Token Circulation

1. **VG tokens**:
   - Created when locking LP
   - Staked for ecosystem governance
   - 10% tax on all transactions

### LP Token Circulation

1. **LP tokens**:
   - Created from VC/SOL pair
   - Permanently locked
   - Generate VG and NFT Fee Key

## Further Materials

- [System Architecture](./01-system-architecture.md)
- ["Burn and Earn" Mechanism](./03-burn-and-earn.md)
- [VG Token Calculation Formula](./specs/vg-calculation-formula.md) 