# TECH-HY Ecosystem and VC/VG Tokens on Solana — Documentation

<div align="center">
  <h3>Complete Technical Documentation of the Ecosystem</h3>
  <p>Version 1.2</p>
</div>

## 📋 Contents

- [Project Overview](#project-overview)
  - [Project Goal](#project-goal)
  - [Key Features](#key-features)
  - [Component Interaction Diagram](#component-interaction-diagram)
- [Core Ecosystem Components](#core-ecosystem-components)
  - [Tokens](#tokens)
  - [NFT Collections](#nft-collections)
  - [Key Mechanisms](#key-mechanisms)
- [Documentation Guide](#documentation-guide)
  - [Main Documents](#main-documents)
  - [Technical Specifications](#technical-specifications)
  - [Recommended Reading Order](#recommended-reading-order)
- [Technical Implementation](#technical-implementation)
  - [Technical Requirements](#technical-requirements)
  - [Tech Stack](#tech-stack)
  - [Smart Contracts](#smart-contracts)
  - [Security](#security)
- [Quick Start](#quick-start)
- [Development Plan](#development-plan)
- [Glossary](#glossary)

## 📝 Project Overview

### Project Goal

The VC/VG token ecosystem is a comprehensive solution on the Solana blockchain aimed at creating sustainable tokenomics with long-term participant incentives, decentralized governance, and a system for distributing fee income.

### Key Features

- **Dual-token system** (VC/VG) with different functions and economic models
- **Automatic token burning** via the "Burn and Earn" mechanism
- **Multi-level staking system** with NFT boosters
- **Decentralized governance** via DAO based on Realms
- **Fee income system** via NFT Fee Key
- **Scalability** thanks to Solana

### Component Interaction Diagram

*(Diagram omitted for brevity, but can be translated if needed)*

## 🧩 Core Ecosystem Components

### Tokens

1. **VC Token**
   - SPL token with no tax
   - Main ecosystem token
   - Emission: 5,000,000,000 tokens
   - Distribution: 30% public sale, 20% team, 15% marketing, 15% development, 10% liquidity, 10% reserve
   - Used for LP creation and staking

2. **VG Token**
   - SPL token with 10% tax
   - Governance token for DAO
   - Emission: 1,000,000,000 tokens
   - Tax distribution:
     - NFT Fee Key holders (50%)
     - DAO treasury (50%)

3. **LP Tokens**
   - Liquidity tokens for VC/SOL pair
   - Permanently locked in "Burn and Earn"
   - Generate VG tokens and NFT Fee Key

### NFT Collections

1. **"Investor's Hand" NFT Collection**
   - Five main booster levels with different multipliers:
     | NFT Level      | Multiplier | Staking Period Reduction |
     |---------------|------------|-------------------------|
     | Paper Hand    | 1.1x       | 10%                     |
     | Wooden Hand   | 1.25x      | 25%                     |
     | Steel Hand    | 1.5x       | 50%                     |
     | Titanium Hand | 1.75x      | 75%                     |
     | Diamond Hand  | 2.0x       | 100%                    |
   - Special type: Angel Investor NFT (unlimited period)
   - Access to higher DAO levels (Steel, Titanium, Diamond)
   - Obtained via VC staking or special distribution

2. **NFT Fee Key**
   - Four NFT levels: Common, Rare, Epic, Legendary
   - Obtained via "Burn and Earn"
   - Entitles holder to a share of VG token transaction fees

### Key Mechanisms

1. **"Burn and Earn" Mechanism**
   - User provides both assets (VC and SOL) to create a liquidity pair
   - LP tokens formed via Raydium liquidity addition
   - LP tokens are permanently locked
   - VG tokens issued by formula: `VG = LP * C * (1 + B * log10(LP/LP_min))`
   - NFT Fee Key is created, entitling to fee income

2. **VC Token Staking**
   - Lock 1M VC tokens for 90 days
   - Receive NFT booster from "Investor's Hand" (default: Wooden Hand)
   - Special distribution for higher-level NFTs (Titanium, Diamond, Angel)

3. **VG Token Staking**
   - Multi-level DAO status system: from Starter to Partner
   - Staking period: 7–365 days depending on level
   - Staking period reduction via NFT boosters (10–100%)
   - Auto-compounding for >10,000 VG staked
   - 100% tokens are auto-compounded

4. **Decentralized Governance (DAO)**
   - VG token holder voting
   - Progressive 9-level participation structure
   - Ecosystem parameter management
   - Higher levels require corresponding NFT

## 📚 Documentation Guide

### Main Documents

1. [**System Architecture**](./docs/01-system-architecture.md)
2. [**Ecosystem Tokens**](./docs/02-tokens.md)
3. [**Burn and Earn Mechanism**](./docs/03-burn-and-earn.md)
4. [**VC Staking and NFT Boosters**](./docs/04-vc-staking.md)
5. [**VG Staking**](./docs/05-vg-staking.md)
6. [**NFT Fee Key**](./docs/06-nft-fee-key.md)
7. [**"Investor's Hand" NFT Collection**](./docs/investors-hand-nft.md)
8. [**Governance and DAO**](./docs/07-governance.md)
9. [**API and Interfaces**](./docs/08-api.md)
10. [**Security and Audit**](./docs/09-security.md)
11. [**Implementation Plan**](./docs/10-implementation-plan.md)

### Technical Specifications

- [**Data Structures**](./docs/specs/data-structures.md)
- [**VG Token Calculation Formula**](./docs/specs/vg-calculation-formula.md)
- [**VG Staking Period Formula**](./docs/specs/vg-staking-formula.md)
- [**"Investor's Hand" NFT Integration**](./docs/specs/investors-hand-integration.md)
- [**Raydium Integration**](./docs/specs/raydium-integration.md)
- [**Metaplex Integration**](./docs/specs/metaplex-integration.md)
- [**Realms Integration**](./docs/specs/realms-integration.md)

### Recommended Reading Order

**For general understanding:**
1. System Architecture
2. Ecosystem Tokens
3. Burn and Earn Mechanism
4. VC Staking and NFT Boosters
5. VG Staking
6. "Investor's Hand" NFT Collection
7. Governance and DAO

**For developers:**
1. System Architecture
2. Data Structures
3. API and Interfaces

**For auditors and security specialists:**
1. Security and Audit
2. System Architecture
3. Data Structures
4. "Investor's Hand" NFT Integration

## 💻 Technical Implementation

### Technical Requirements

- **OS**: Linux, MacOS, or Windows (WSL2)
- **Rust**: 1.86.0+
- **Solana CLI**: 2.1.22+
- **Anchor**: 0.29.0+
- **Node.js**: 18.x+
- **pnpm**: 8.x+
- **TypeScript**: 5.x+

### Tech Stack

- **Blockchain**: Solana
- **Language**: Rust
- **Framework**: Anchor
- **Token Standard**: SPL Token
- **NFT Standard**: Metaplex NFT Standard
- **AMM**: Raydium
- **Governance**: Realms DAO

### Smart Contracts

The ecosystem consists of:

1. **Token Contracts**
   - VC Token Contract
   - VG Token Contract
   - LP Token Integration

2. **Program Contracts**
   - LP Formation Program (Burn and Earn)
   - VC Staking Program
   - VG Staking Program
   - NFT Fee Key Program
   - Investor's Hand NFT Program
   - Governance Program

3. **External Integrations**
   - Raydium Integration
   - Metaplex Integration
   - Realms Integration

### Security

Security is ensured by:

- Careful design and testing
- Multi-level checks and validation
- Independent smart contract audits
- Gradual and controlled feature rollout
- Emergency stop and recovery mechanisms

See [security document](./docs/09-security.md) for details.

## 🚀 Quick Start

1. **Setup development environment**
   ```bash
   git clone https://github.com/TheMacroeconomicDao/tech-hy-contracts.git
   cd tech-hy-contracts
   pnpm install
   ```
2. **Build contracts**
   ```bash
   anchor build
   ```
3. **Run tests**
   ```bash
   pnpm test
   ```
4. **Run local validator**
   ```bash
   solana-test-validator
   ```
5. **Deploy to testnet**
   ```bash
   anchor deploy --provider.cluster devnet
   ```

See [dev guide](./docs/dev-guide.md) for more.

## 🚀 Development Plan

1. **Stages 1-2**: Basic tokens and architecture (6 days)
2. **Stages 3-4**: "Burn and Earn" and VC staking (11 days)
3. **Stages 5-7**: NFT Fee Key, VG staking, DAO (17 days)
4. **Stage 8**: "Investor's Hand" NFT collection (7 days)
5. **Stage 9**: Testing and optimization (5 days)
6. **Stages 10-11**: Testnet and mainnet launch (6 days)

See [implementation plan](./docs/10-implementation-plan.md) for details.

## 📘 Glossary

- **VC** — main ecosystem token, no tax (0%)
- **VG** — governance token, 10% tax, earned for locking LP tokens
- **LP token** — liquidity token for VC/SOL pair
- **NFT booster** — non-fungible token from "Investor's Hand" collection, improves VG staking
- **Investor's Hand** — NFT booster collection with five levels: Paper, Wooden, Steel, Titanium, Diamond Hand
- **Angel NFT** — special NFT for early investors, unlimited staking and auto-compounding
- **NFT Fee Key** — NFT entitling to fee income
- **Burn and Earn** — mechanism for permanent LP token lock to receive VG and NFT Fee Key
- **Permanent lock** — irreversible LP token lock
- **DAO** — decentralized autonomous organization
- **DAO tiers** — participation levels from Starter to Partner, define rights and staking periods
- **SPL Token** — Solana Program Library Token standard
- **AMM** — Automated Market Maker (Raydium)
- **PDA** — Program Derived Address

---

## 📅 Changelog

### Version 1.2 (Current)
- Added technical requirements and version info
- Updated token info: emission, distribution, taxes
- Fixed "Burn and Earn" description
- Added "Quick Start" section
- Updated Burn and Earn diagram

### Version 1.1
- Added detailed "Investor's Hand" NFT documentation
- Updated DAO and VG staking info for NFT boosters
- Added NFT booster integration spec
- Updated development plan for NFT collection
- Improved VG staking period formula

### Version 1.0 (Initial)
- Developed basic VC/VG token architecture
- Described "Burn and Earn", staking, DAO
- Created data structure and formula specs
- Formed project development plan

# TECH HY Smart Contracts

The TECH HY project is a set of Solana smart contracts, including VC and VG tokens and a staking system.

## Main Components

1. **VC Token** — standard SPL token, 5B emission at init
2. **VG Token** — Token-2022 with 10% tax on transactions
3. **Staking** — contract for VG staking with levels and rewards

## Docker Launch

Project is Docker-ready for isolated development.

### Requirements

- Docker
- Docker Compose

### Launch

1. Clone repo and cd:
   ```bash
   git clone <repo-url>
   cd tech-hy-contracts
   ```
2. Start container with tests:
   ```bash
   docker-compose up anchor
   ```
3. For interactive shell:
   ```bash
   docker-compose run anchor-shell
   ```

### npm Scripts

- `npm start` — run container with tests
- `npm run shell` — interactive shell
- `npm run build` — build programs
- `npm run test` — run tests
- `npm run deploy` — deploy to network

## Project Structure

```
tech-hy-contracts/
├── programs/
│   ├── vc-token/        # VC SPL token
│   ├── vg-token/        # Token-2022 with Transfer Hook
│   └── staking/         # VG staking
├── tests/               # Tests
├── Anchor.toml          # Anchor config
├── Dockerfile           # Docker image config
└── docker-compose.yml   # Container config
```

## Development

### Main Docker Commands

- Build:
  ```bash
  anchor build
  ```
- Test:
  ```bash
  anchor test
  ```
- Deploy to localnet:
  ```bash
  anchor deploy
  ```
- Deploy to devnet:
  ```bash
  anchor deploy --provider.cluster devnet
  ```

## Further Development

- Full Transfer Hook for VG token
- Add DAO to staking system
- Develop Burn & Earn component 