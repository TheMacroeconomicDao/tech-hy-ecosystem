# System Architecture

## General Architecture

The architecture of the VC/VG token ecosystem on Solana is a set of interconnected programs (smart contracts) that ensure the functioning of all ecosystem components. The system is designed with security, scalability, and Solana compute resource optimization in mind.

## System Components

The system consists of three main groups of components:

1. **Token Contracts** - contracts for token management
2. **Program Contracts** - programs for business logic implementation
3. **External Integrations** - integrations with external services

### 1. Token Contracts

#### 1.1 VC Token (SPL Token without tax)
- Standard SPL token
- Zero tax (0%)
- Used for LP and staking

#### 1.2 VG Token (SPL Token with 10% tax)
- SPL token with modified transaction logic
- 10% tax on all transactions
- Tax distribution:
  - 50% to NFT Fee Key holders
  - 50% to DAO treasury

#### 1.3 LP Token (SPL Token for VC/SOL pair)
- Standard Raydium LP token
- Permanent lock, no withdrawal possible
- Proportional VG token issuance upon lock

### 2. Program Contracts

#### 2.1 LP Formation Program
- Checks and manages the VC/SOL pair in the required proportion
- Adds liquidity to the Raydium pool
- Creates and locks LP tokens
- Issues VG tokens and NFT Fee Key

#### 2.2 VC Staking Program
- Locks 1M VC tokens for 90 days
- Creates NFT booster via Metaplex
- Controls staking period and token withdrawal

#### 2.3 VG Staking Program
- Locks VG tokens for a period depending on amount and NFT booster
- Autocompounding for stakes over 10,000 VG
- Applies NFT boosters to reduce period

#### 2.4 NFT Fee Key Program
- Creates NFT with a certain level (Common, Rare, Epic, Legendary)
- Calculates share in the fee pool by formula
- Withdraws accumulated rewards

#### 2.5 Governance Program
- Integrates with Realms DAO
- Creates and executes proposals
- Voting and updating ecosystem parameters

### 3. External Integrations

#### 3.1 Raydium Integration
- Creates VC/SOL liquidity pools
- Swaps VC for SOL
- Adds liquidity and creates LP tokens

#### 3.2 Metaplex Integration
- Creates NFT boosters
- Creates NFT Fee Key
- Updates NFT metadata

#### 3.3 Realms Integration
- Creates and manages DAO
- Proposals and voting
- Executes approved proposals

## Component Interactions

### "Burn and Earn" Mechanism
```
[User] → [VC tokens] → [LP Formation Program] → [LP tokens] → [Permanent Lock]
                                      ↓
                              [Raydium Exchange] → [VG tokens + NFT Fee Key] → [User]
```

### VC Token Staking
```
[User] → [VC tokens] → [VC Staking Program] → [NFT booster] → [User]
                                      ↓
                               [Metaplex NFT]
```

### VG Token Staking
```
[User] → [VG tokens + NFT booster] → [VG Staking Program]
                                                  ↓
                          [Reinvest 70%] ← + → [Withdraw 30%] → [User]
```

## Tech Stack
- Blockchain: Solana
- Programming language: Rust
- Framework: Anchor
- Token standard: SPL Token
- NFT standard: Metaplex NFT Standard
- AMM: Raydium
- Governance: Realms DAO

## Security Requirements
1. **Secure data storage**:
   - Use PDA for data storage
   - Multi-level transaction signature checks

2. **Attack protection**:
   - Reentrancy attack protection
   - Input and limit validation
   - Token price manipulation protection

3. **Resource optimization**:
   - Minimize number of instructions per transaction
   - Optimize serialization/deserialization
   - Efficient account storage usage

## Further Materials

- [Ecosystem Tokens](./02-tokens.md)
- ["Burn and Earn" Mechanism](./03-burn-and-earn.md)
- [Data Structures](./specs/data-structures.md)
- [Implementation Plan](./10-implementation-plan.md) 
