# VC Token Staking and NFT Boosters

## Overview of VC Token Staking

VC token staking (VC Freezing Program) is the process of locking (freezing) a fixed amount of VC tokens for a certain period, after which the user receives an NFT booster from the "Investor's Hand" collection. These NFTs provide multiple benefits in the ecosystem, including improved VG staking conditions and access to higher DAO levels.

Users can spend 1,000,000 VC tokens to get lifetime access to the TECH HY Investors Private Club via the staking mechanism.

## "Investor's Hand" NFT Collection

NFT boosters are represented by the "Investor's Hand" collection, which includes five hand levels, each representing a different degree of commitment to the project:

| NFT Level      | Description                | VG Staking Bonus | DAO Access         |
|----------------|---------------------------|------------------|--------------------|
| Paper Hand     | Basic level                | 10% (1.1x)       | -                  |
| Wooden Hand    | Entry level                | 25% (1.25x)      | -                  |
| Steel Hand     | Middle level               | 50% (1.5x)       | Investor           |
| Titanium Hand  | Advanced level             | 75% (1.75x)      | Launchpad Master   |
| Diamond Hand   | Top level                  | 100% (2.0x)      | Partner            |

**Angel Investor NFT** has a special status in the ecosystem, granted to presale participants with a contribution of 50 SOL or more, and provides unique privileges, including unlimited staking period and daily autocompounding.

Titanium and Diamond Hand are the rarest and most valuable, issued manually by special request and require significant ecosystem commitment.

> Detailed description of all aspects of the "Investor's Hand" NFT collection is provided in a separate document [Investor's Hand NFT Collection](./investors-hand-nft.md).

## VC Freezing Program

The VC freezing program is the main mechanism for obtaining NFTs from the "Investor's Hand" collection and provides the following opportunities:

- Temporary reduction of circulating VC token supply
- Receiving NFT boosters with various benefits
- Access to higher DAO levels
- Increased staking returns
- Creation of a secondary NFT market via transferability

## Main Characteristics of VC Staking

- **Staking amount**: 1,000,000 VC tokens (standard)
- **Staking period**: 90 days (standard)
- **Reward**: NFT booster from the "Investor's Hand" collection
- **Purpose**: Improve VG staking conditions and access to higher DAO levels

## Ways to Obtain NFT Boosters

NFT boosters can be obtained in two ways:
1. **Minting via VC token freezing (staking)** – main way for Paper, Wooden, and Steel Hand
2. **Purchase on the marketplace** – buy from other ecosystem participants
3. **Special distribution by the administration** – for Titanium, Diamond, and Angel Hand

## DAO Relationship

NFT boosters play a key role in the governance and staking system:

- **Access to higher DAO levels**:
  - Steel Hand NFT + 25,000-50,000 VG → Investor level (365 days staking)
  - Titanium Hand NFT + 50,000-70,000 VG → Launchpad Master level (365 days staking)
  - Diamond Hand NFT + more than 70,000 VG → Partner level (365 days staking)
  - Angel NFT → unlimited staking period with daily autocompounding

- **Staking yield multiplier**:
  - Increase VG staking yield by 10-100% depending on NFT level
  - Access to autocompounding (weekly for higher levels, daily for Angel)
  - Access to special ecosystem privileges

## VC Token Staking and NFT Minting Process

### Process Steps

1. **Staking initiation**:
   - User initiates staking with 1M VC amount
   - VC token balance is checked

2. **Token locking**:
   - VC tokens are transferred to a special vault (VC Staking Vault)
   - Tokens are locked for the staking period (90 days)

3. **NFT booster creation**:
   - NFT booster is automatically generated via Metaplex
   - Base level – Wooden Hand (1.25x multiplier)
   - NFT is sent to the user's wallet

4. **End of staking period**:
   - After the staking period, the user can withdraw their VC tokens
   - NFT booster remains with the user forever and can be used for VG staking

## NFT Booster Characteristics

### NFT Booster Metadata

- **Name**: [Level] Hand NFT #{id}
- **Symbol**: VCIH (VC Investor's Hand)
- **Description**: NFT for access to advanced VC/VG ecosystem features
- **Image**: Unique image corresponding to NFT level
- **Attributes**:
  - `hand_tier`: Hand level (Paper, Wooden, Steel, Titanium, Diamond)
  - `staked_vc_amount`: Amount of staked VC tokens
  - `stake_timestamp`: Staking start time (Unix timestamp)
  - `boost_multiplier`: Booster multiplier (from 1.1x to 2.0x depending on level)
  - `dao_tier_access`: Minimum DAO access level

## Technical Implementation

### Data Structures

The system uses the following main data structures:

#### VC Token Staking Account
Stores info about a specific staking, including:
- Owner
- Locked amount
- Staking start timestamp
- Lock end timestamp
- NFT mint address
- Unlock flag
- PDA bump

### VC Token Staking and NFT Booster Creation Function

Main process steps:
- Check VC token amount (1M VC)
- Calculate unlock time (90 days)
- Transfer VC tokens to vault
- Initialize VC staking account
- Create NFT via "Investor's Hand" program

### VC Token Withdrawal Function after Staking Period

Main process steps:
- Check staking account owner
- Check staking period end
- Check tokens not yet withdrawn
- Transfer VC tokens back to user
- Update staking account status

## Economic Rationale

The "Investor's Hand" NFT collection creates economic value for the ecosystem by:

1. **Temporarily reducing VC token supply**:
   - Locking significant VC token volumes reduces circulating supply
   - Creates additional demand for VC tokens

2. **Incentivizing long-term staking**:
   - NFT boosters are required for access to higher DAO levels
   - Using NFTs requires long-term VG staking (up to 365 days)

3. **Creating a progressive governance system**:
   - Meritocracy based on ecosystem contribution
   - Protection from speculators via long-term staking requirements

4. **Developing a secondary NFT market**:
   - Transferable NFTs create market opportunities for traders
   - Ability to monetize status in the ecosystem

## User Interface

A web interface is implemented for user convenience, allowing:

1. Stake VC tokens and receive NFT boosters
2. Track staking status and remaining unlock time
3. Withdraw VC tokens after staking period ends
4. View info about their NFT boosters and status
5. Buy and sell NFTs on the integrated marketplace

## Error Handling and Edge Cases

### Insufficient VC Token Amount

If the user has insufficient VC tokens for staking (<1M), the transaction will be canceled with an appropriate error. The user will be prompted to acquire more VC tokens or reduce the staking amount.

### Early Token Withdrawal

It is not possible to withdraw VC tokens before the staking period (90 days) ends. Attempting to do so will result in a transaction error.

## Further Materials

- [Investor's Hand NFT Collection](./investors-hand-nft.md)
- [VG Token Staking](./05-vg-staking.md)
- [Governance and DAO](./07-governance.md)
- [Investor's Hand NFT Collection Integration](./specs/investors-hand-integration.md) 