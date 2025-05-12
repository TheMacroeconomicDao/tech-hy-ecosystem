import { Idl } from '@coral-xyz/anchor';

// IDL для VC Token
export interface VcTokenIdl extends Idl {
  name: "vc_token";
  instructions: [
    {
      name: "initialize";
      accounts: [
        { name: "payer"; isMut: true; isSigner: true },
        { name: "treasury"; isMut: true; isSigner: false },
        { name: "mint"; isMut: true; isSigner: false },
        { name: "treasuryTokenAccount"; isMut: true; isSigner: false },
        { name: "tokenProgram"; isMut: false; isSigner: false },
        { name: "associatedTokenProgram"; isMut: false; isSigner: false },
        { name: "systemProgram"; isMut: false; isSigner: false }
      ];
      args: [];
    },
    {
      name: "setMetadata";
      accounts: [
        { name: "authority"; isMut: true; isSigner: true },
        { name: "mint"; isMut: true; isSigner: false },
        { name: "payer"; isMut: true; isSigner: true },
        { name: "metadata"; isMut: true; isSigner: false },
        { name: "metadataProgram"; isMut: false; isSigner: false },
        { name: "systemProgram"; isMut: false; isSigner: false },
        { name: "rent"; isMut: false; isSigner: false }
      ];
      args: [
        { name: "name"; type: "string" },
        { name: "symbol"; type: "string" },
        { name: "uri"; type: "string" }
      ];
    }
  ];
}

// IDL для VG Token
export interface VgTokenIdl extends Idl {
  name: "vg_token";
  instructions: [
    {
      name: "initialize";
      accounts: [
        { name: "payer"; isMut: true; isSigner: true },
        { name: "mint"; isMut: true; isSigner: false },
        { name: "tokenProgram"; isMut: false; isSigner: false },
        { name: "systemProgram"; isMut: false; isSigner: false }
      ];
      args: [];
    },
    {
      name: "mintTokens";
      accounts: [
        { name: "payer"; isMut: true; isSigner: true },
        { name: "recipient"; isMut: true; isSigner: false },
        { name: "mint"; isMut: true; isSigner: false },
        { name: "recipientTokenAccount"; isMut: true; isSigner: false },
        { name: "tokenProgram"; isMut: false; isSigner: false },
        { name: "associatedTokenProgram"; isMut: false; isSigner: false },
        { name: "systemProgram"; isMut: false; isSigner: false }
      ];
      args: [
        { name: "amount"; type: "u64" }
      ];
    },
    {
      name: "transfer";
      accounts: [
        { name: "sender"; isMut: true; isSigner: true },
        { name: "recipient"; isMut: true; isSigner: false },
        { name: "daoTreasury"; isMut: true; isSigner: false },
        { name: "feeCollector"; isMut: true; isSigner: false },
        { name: "mint"; isMut: true; isSigner: false },
        { name: "senderTokenAccount"; isMut: true; isSigner: false },
        { name: "recipientTokenAccount"; isMut: true; isSigner: false },
        { name: "daoTreasuryTokenAccount"; isMut: true; isSigner: false },
        { name: "feeCollectorTokenAccount"; isMut: true; isSigner: false },
        { name: "tokenProgram"; isMut: false; isSigner: false },
        { name: "associatedTokenProgram"; isMut: false; isSigner: false },
        { name: "systemProgram"; isMut: false; isSigner: false }
      ];
      args: [
        { name: "amount"; type: "u64" }
      ];
    },
    {
      name: "setMetadata";
      accounts: [
        { name: "authority"; isMut: true; isSigner: true },
        { name: "mint"; isMut: true; isSigner: false },
        { name: "payer"; isMut: true; isSigner: true },
        { name: "metadata"; isMut: true; isSigner: false },
        { name: "metadataProgram"; isMut: false; isSigner: false },
        { name: "systemProgram"; isMut: false; isSigner: false },
        { name: "rent"; isMut: false; isSigner: false }
      ];
      args: [
        { name: "name"; type: "string" },
        { name: "symbol"; type: "string" },
        { name: "uri"; type: "string" }
      ];
    },
    {
      name: "setFreezeAuthority";
      accounts: [
        { name: "payer"; isMut: true; isSigner: true },
        { name: "mint"; isMut: true; isSigner: false },
        { name: "daoAuthority"; isMut: false; isSigner: false },
        { name: "tokenProgram"; isMut: false; isSigner: false },
        { name: "systemProgram"; isMut: false; isSigner: false }
      ];
      args: [];
    }
  ];
}

// IDL для Burn and Earn
export interface BurnAndEarnIdl extends Idl {
  name: "burn_and_earn";
  instructions: [
    {
      name: "initialize";
      accounts: [
        { name: "authority"; isMut: true; isSigner: true },
        { name: "burnAndEarnState"; isMut: true; isSigner: false },
        { name: "vcMint"; isMut: false; isSigner: false },
        { name: "vgMint"; isMut: false; isSigner: false },
        { name: "systemProgram"; isMut: false; isSigner: false }
      ];
      args: [];
    },
    {
      name: "burnAndLock";
      accounts: [
        { name: "user"; isMut: true; isSigner: true },
        { name: "burnAndEarnState"; isMut: true; isSigner: false },
        { name: "userLpRecord"; isMut: true; isSigner: false },
        { name: "vcMint"; isMut: false; isSigner: false },
        { name: "userVcTokenAccount"; isMut: true; isSigner: false },
        { name: "vgMint"; isMut: false; isSigner: false },
        { name: "userVgTokenAccount"; isMut: true; isSigner: false },
        { name: "vcTokenProgram"; isMut: false; isSigner: false },
        { name: "vgTokenProgram"; isMut: false; isSigner: false },
        { name: "tokenProgram"; isMut: false; isSigner: false },
        { name: "associatedTokenProgram"; isMut: false; isSigner: false },
        { name: "systemProgram"; isMut: false; isSigner: false },
        { name: "clock"; isMut: false; isSigner: false }
      ];
      args: [
        { name: "vcAmount"; type: "u64" }
      ];
    },
    {
      name: "getStatistics";
      accounts: [
        { name: "user"; isMut: false; isSigner: true },
        { name: "burnAndEarnState"; isMut: false; isSigner: false },
        { name: "userLpRecord"; isMut: false; isSigner: false }
      ];
      args: [];
    },
    {
      name: "createNftFeeKey";
      accounts: [
        { name: "user"; isMut: true; isSigner: true },
        { name: "userLpRecord"; isMut: false; isSigner: false },
        { name: "systemProgram"; isMut: false; isSigner: false }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "burnAndEarnState";
      type: {
        kind: "struct";
        fields: [
          { name: "authority"; type: "publicKey" },
          { name: "vcMint"; type: "publicKey" },
          { name: "vgMint"; type: "publicKey" },
          { name: "totalLockedLp"; type: "u64" },
          { name: "totalVgMinted"; type: "u64" },
          { name: "totalVcBurned"; type: "u64" },
          { name: "bump"; type: "u8" }
        ];
      };
    },
    {
      name: "userLpRecord";
      type: {
        kind: "struct";
        fields: [
          { name: "owner"; type: "publicKey" },
          { name: "isInitialized"; type: "bool" },
          { name: "lockedLp"; type: "u64" },
          { name: "vgMinted"; type: "u64" },
          { name: "vcBurned"; type: "u64" },
          { name: "nftLevel"; type: "u8" },
          { name: "lastUpdate"; type: "i64" }
        ];
      };
    }
  ];
  errors: [
    { code: 6000; name: "Unauthorized"; msg: "Операция не авторизована" },
    { code: 6001; name: "InvalidAmount"; msg: "Недопустимая сумма" },
    { code: 6002; name: "MathOverflow"; msg: "Математическое переполнение" },
    { code: 6003; name: "NoEligibleNft"; msg: "Нет права на получение NFT" },
    { code: 6004; name: "RaydiumError"; msg: "Ошибка интеграции с Raydium" },
    { code: 6005; name: "VgMintError"; msg: "Ошибка минтинга VG токенов" },
    { code: 6006; name: "NftCreationError"; msg: "Ошибка создания NFT" }
  ];
} 