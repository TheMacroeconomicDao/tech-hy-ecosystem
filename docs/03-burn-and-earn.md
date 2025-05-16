# Burn and Earn Mechanism

The "Burn and Earn" mechanism is a key component for ensuring the constant growth of the SOL-VC liquidity pool and the distribution of VG tokens in the TECH HY ecosystem.

## Conversion Process
1. **Asset Preparation**:
   - The user must have X VC tokens and Y SOL in the required proportion
   - The proportion is determined by the current rate in the Raydium liquidity pool

2. **LP Token Formation**:
   - The user adds both assets (VC and SOL) to the Raydium pool
   - As a result, receives Z LP tokens representing a share in the pool
   - The number of LP tokens depends on the contribution size and current liquidity

3. **LP Token Locking**:
   - LP tokens are transferred to the PermanentLockVault (PDA)
   - The lock is irreversible and permanent
   - 50% of the funds raised from the presale are also locked in LP SOL-VC

4. **VG Token Issuance**:
   - The user receives VG tokens according to the formula below

5. **NFT Fee Key Creation**:
   - An NFT is issued with the right to receive a share of the fees

## VG Token Calculation Formula
```
VG = LP * C * (1 + B * log10(LP/LP_min))
```
Where:
- `LP` – number of locked LP tokens
- `C` – base coefficient (10)
- `B` – bonus coefficient (0.2)
- `LP_min` – minimum LP amount (1)

## PermanentLockVault
- Created as a PDA with known seed values
- No ability to sign withdrawal transactions
- For each user, UserLockInfo is stored with lock data

## NFT Fee Key
| Level     | LP Amount      | Multiplier |
|-----------|---------------|------------|
| Common    | < 1,000       | 1.0x       |
| Rare      | 1,000-10,000  | 1.2x       |
| Epic      | 10,000-100,000| 1.5x       |
| Legendary | > 100,000     | 2.0x       |

Share in fees: `share_percentage = (user_locked_lp * tier_multiplier) / total_weighted_locked_lp * 100%`

## Raydium Integration
- Use Raydium SDK to create liquidity
- `slippage_tolerance` parameter to protect against price slippage
- Atomic transaction for all operations
- Integration with VC and SOL tokens to create the liquidity pool

## Error Handling
1. **Insufficient balance**: Check for sufficient VC and SOL
2. **Price slippage**: Check `slippage_tolerance` parameter, cancel if exceeded
3. **Transaction size limit**: Limits on maximum transaction size 