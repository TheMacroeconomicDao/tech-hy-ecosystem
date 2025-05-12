import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { expect } from 'chai';
import { BN } from 'bn.js';
import { createFundedWallet, getTokenBalance } from '../../../../tests/utils/test-utils';

describe('VC Token Unit Tests', () => {
  // Connection и provider для тестов
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;

  // ID программы VC Token из конфига
  const programId = new PublicKey('VCzfGwp5qVL8pmta1GHqGrSQqzMa5qsY4M1jbjsdaYJ');
  
  // Программа VC Token
  const program = anchor.workspace.VcToken;
  
  // Константы для тестов
  const VC_TOKEN_MINT_SEED = Buffer.from("vc_token_mint");
  const TOKEN_DECIMALS = 9;
  const TOTAL_SUPPLY = new BN(5_000_000_000).mul(new BN(10).pow(new BN(9))); // 5 млрд с 9 десятичными знаками
  
  // Переменные для тестирования
  let mintPubkey: PublicKey;
  let mintBump: number;
  let treasuryWallet: Keypair;
  let treasuryTokenAccount: PublicKey;
  let metadataUri = 'https://tech-hy.io/token-metadata/vc.json';

  before(async () => {
    console.log('Setting up VC Token test environment...');
    
    // Получаем адрес минта VC токена через PDA
    [mintPubkey, mintBump] = PublicKey.findProgramAddressSync(
      [VC_TOKEN_MINT_SEED],
      programId
    );
    console.log(`VC Token mint PDA: ${mintPubkey.toString()}`);
    
    // Создаем казну DAO
    treasuryWallet = await createFundedWallet(connection, 10 * LAMPORTS_PER_SOL);
    console.log(`Treasury wallet: ${treasuryWallet.publicKey.toString()}`);
  });

  it('Should initialize VC Token', async () => {
    console.log('Testing VC Token initialization...');
    
    // Получаем адрес ассоциированного токен-аккаунта для казны
    treasuryTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      treasuryWallet.publicKey
    );
    
    try {
      // Вызываем инструкцию initialize
      await program.methods
        .initialize()
        .accounts({
          payer: provider.wallet.publicKey,
          treasury: treasuryWallet.publicKey,
          mint: mintPubkey,
          treasuryTokenAccount: treasuryTokenAccount,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      
      console.log('VC Token initialized successfully');
      
      // Проверяем, что токены были выпущены на кошелек казны
      const tokenBalance = await getTokenBalance(connection, treasuryTokenAccount);
      const expectedSupply = TOTAL_SUPPLY.toNumber();
      
      console.log(`Treasury token balance: ${tokenBalance}`);
      console.log(`Expected supply: ${expectedSupply}`);
      
      expect(tokenBalance).to.equal(expectedSupply);
    } catch (error) {
      console.error('Failed to initialize VC Token:', error);
      throw error;
    }
  });

  it('Should set VC Token metadata', async () => {
    console.log('Testing setting VC Token metadata...');
    
    const name = 'TECH-HY VC';
    const symbol = 'VC';
    
    try {
      // Вызываем инструкцию setMetadata
      await program.methods
        .setMetadata(name, symbol, metadataUri)
        .accounts({
          authority: provider.wallet.publicKey,
          mint: mintPubkey,
          payer: provider.wallet.publicKey,
          metadata: PublicKey.findProgramAddressSync(
            [
              Buffer.from('metadata'),
              new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
              mintPubkey.toBuffer(),
            ],
            new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
          )[0],
          metadataProgram: new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'),
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();
      
      console.log('VC Token metadata set successfully');
    } catch (error) {
      console.error('Failed to set VC Token metadata:', error);
      throw error;
    }
  });
}); 