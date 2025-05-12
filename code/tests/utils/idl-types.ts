/**
 * Типы для работы с IDL программ экосистемы TECH-HY
 */
import { PublicKey } from '@solana/web3.js';

/**
 * Типы для программы VC Token
 */
export interface VcTokenProgram {
  initialize: () => Promise<string>;
  setMetadata: (name: string, symbol: string, uri: string) => Promise<string>;
}

export interface VcTokenAccounts {
  mint: PublicKey;
  treasury: PublicKey;
  treasuryTokenAccount: PublicKey;
  authority: PublicKey;
}

/**
 * Типы для программы VG Token
 */
export interface VgTokenProgram {
  initialize: (taxRate: number, taxBeneficiary: PublicKey) => Promise<string>;
  setMetadata: (name: string, symbol: string, uri: string) => Promise<string>;
  setTaxRate: (newTaxRate: number) => Promise<string>;
  setTaxBeneficiary: (newTaxBeneficiary: PublicKey) => Promise<string>;
  excludeFromTax: (account: PublicKey) => Promise<string>;
  includeInTax: (account: PublicKey) => Promise<string>;
}

export interface VgTokenAccounts {
  mint: PublicKey;
  treasury: PublicKey;
  treasuryTokenAccount: PublicKey;
  authority: PublicKey;
  taxConfig: PublicKey;
}

export interface TaxConfigAccount {
  taxRate: number;
  taxBeneficiary: PublicKey;
  excludedAccounts: PublicKey[];
}

/**
 * Типы для программы Burn and Earn
 */
export interface BurnAndEarnProgram {
  initialize: (
    vcPerLpTokenRate: number,
    totalPoolSize: number,
    swapDeadline: number,
    nftLevelRequirement: number
  ) => Promise<string>;
  
  updateConfig: (
    vcPerLpTokenRate: number,
    totalPoolSize: number,
    swapDeadline: number
  ) => Promise<string>;
  
  burnAndEarn: (
    vcAmount: number
  ) => Promise<string>;
}

export interface BurnAndEarnAccounts {
  config: PublicKey;
  vcMint: PublicKey;
  lpMint: PublicKey;
  user: PublicKey;
  userVcTokenAccount: PublicKey;
  userLpTokenAccount: PublicKey;
  programVcTokenAccount: PublicKey;
  programLpTokenAccount: PublicKey;
}

export interface BurnAndEarnConfig {
  authority: PublicKey;
  vcMint: PublicKey;
  lpMint: PublicKey;
  vcPerLpTokenRate: number;
  totalPoolSize: number;
  swapDeadline: number;
  nftLevelRequirement: number;
} 