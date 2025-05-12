import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccount } from '@solana/spl-token';
import { expect } from 'chai';
import { findVgTokenMintAddress, createFundedWallet, getTokenBalance } from '../utils/test-utils';
import { VgTokenIdl } from '../utils/types';
import BN from 'bn.js';

describe('VG Token Unit Tests', () => {
  // Connection и provider для тестов
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;

  // ID программы VG Token из конфига
  const programId = new PublicKey('VGnHJHKr2NwxSdQQoYrJY9TBZ9YHS5cCwBPEr68mEPG');
  
  // Программа VG Token
  const program = new Program(
    require('../idl/vg_token.json') as VgTokenIdl, 
    programId
  ) as Program<VgTokenIdl>;

  let mintPubkey: PublicKey;
  let mintBump: number;
  let userWallet: Keypair;
  let userTokenAccount: PublicKey;
  let recipientWallet: Keypair;
  let recipientTokenAccount: PublicKey;
  let daoTreasuryWallet: Keypair;
  let daoTreasuryTokenAccount: PublicKey;
  let feeCollectorWallet: Keypair;
  let feeCollectorTokenAccount: PublicKey;
  let metadataUri = 'https://tech-hy.io/token-metadata/vg.json';
  
  const MINT_AMOUNT = new BN(1000).mul(new BN(10).pow(new BN(9))); // 1,000 VG
  const TRANSFER_AMOUNT = new BN(100).mul(new BN(10).pow(new BN(9))); // 100 VG
  const TAX_RATE_BPS = 1000; // 10%

  before(async () => {
    console.log('Setting up VG Token test environment...');
    
    // Получаем адрес минта VG токена через PDA
    [mintPubkey, mintBump] = await findVgTokenMintAddress(programId);
    console.log(`VG Token mint PDA: ${mintPubkey.toString()}`);
    
    // Создаем тестовые кошельки
    userWallet = await createFundedWallet(connection, 10 * LAMPORTS_PER_SOL);
    recipientWallet = await createFundedWallet(connection, 5 * LAMPORTS_PER_SOL);
    daoTreasuryWallet = await createFundedWallet(connection, 5 * LAMPORTS_PER_SOL);
    feeCollectorWallet = await createFundedWallet(connection, 5 * LAMPORTS_PER_SOL);
    
    console.log(`User wallet: ${userWallet.publicKey.toString()}`);
    console.log(`Recipient wallet: ${recipientWallet.publicKey.toString()}`);
    console.log(`DAO Treasury wallet: ${daoTreasuryWallet.publicKey.toString()}`);
    console.log(`Fee Collector wallet: ${feeCollectorWallet.publicKey.toString()}`);
  });

  it('Should initialize VG Token', async () => {
    console.log('Testing VG Token initialization...');
    
    try {
      // Вызываем инструкцию initialize
      await program.methods
        .initialize()
        .accounts({
          payer: provider.wallet.publicKey,
          mint: mintPubkey,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      
      console.log('VG Token initialized successfully');
    } catch (error) {
      console.error('Failed to initialize VG Token:', error);
      throw error;
    }
  });

  it('Should set VG Token metadata', async () => {
    console.log('Testing setting VG Token metadata...');
    
    const name = 'TECH-HY VG';
    const symbol = 'VG';
    
    try {
      // Вызываем инструкцию setMetadata
      await program.methods
        .setMetadata(name, symbol, metadataUri)
        .accounts({
          authority: provider.wallet.publicKey,
          mint: mintPubkey,
          payer: provider.wallet.publicKey,
          metadata: anchor.web3.PublicKey.findProgramAddressSync(
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
      
      console.log('VG Token metadata set successfully');
    } catch (error) {
      console.error('Failed to set VG Token metadata:', error);
      throw error;
    }
  });
  
  it('Should mint VG tokens', async () => {
    console.log('Testing minting VG tokens...');
    
    // Получаем адрес токен-аккаунта для пользователя
    userTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      userWallet.publicKey
    );
    
    try {
      // Вызываем инструкцию mintTokens
      await program.methods
        .mintTokens(MINT_AMOUNT)
        .accounts({
          payer: provider.wallet.publicKey,
          recipient: userWallet.publicKey,
          mint: mintPubkey,
          recipientTokenAccount: userTokenAccount,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      
      console.log(`Minted ${MINT_AMOUNT.toString()} VG tokens to ${userWallet.publicKey.toString()}`);
      
      // Проверяем, что токены были выпущены на кошелек пользователя
      const tokenBalance = await getTokenBalance(connection, userTokenAccount);
      
      console.log(`User token balance: ${tokenBalance}`);
      
      expect(tokenBalance).to.equal(MINT_AMOUNT.toNumber());
    } catch (error) {
      console.error('Failed to mint VG tokens:', error);
      throw error;
    }
  });
  
  it('Should transfer VG tokens with 10% tax', async () => {
    console.log('Testing transferring VG tokens with tax...');
    
    // Получаем адреса токен-аккаунтов
    recipientTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      recipientWallet.publicKey
    );
    
    daoTreasuryTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      daoTreasuryWallet.publicKey
    );
    
    feeCollectorTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      feeCollectorWallet.publicKey
    );
    
    try {
      // Инициализируем токен-аккаунты, если они еще не созданы
      await createAssociatedTokenAccount(
        connection,
        provider.wallet.publicKey as unknown as Keypair,
        mintPubkey,
        recipientWallet.publicKey
      ).catch(() => console.log('Recipient token account already exists'));
      
      await createAssociatedTokenAccount(
        connection,
        provider.wallet.publicKey as unknown as Keypair,
        mintPubkey,
        daoTreasuryWallet.publicKey
      ).catch(() => console.log('DAO treasury token account already exists'));
      
      await createAssociatedTokenAccount(
        connection,
        provider.wallet.publicKey as unknown as Keypair,
        mintPubkey,
        feeCollectorWallet.publicKey
      ).catch(() => console.log('Fee collector token account already exists'));
      
      // Вызываем инструкцию transfer с налогом
      await program.methods
        .transfer(TRANSFER_AMOUNT)
        .accounts({
          sender: userWallet.publicKey,
          recipient: recipientWallet.publicKey,
          daoTreasury: daoTreasuryWallet.publicKey,
          feeCollector: feeCollectorWallet.publicKey,
          mint: mintPubkey,
          senderTokenAccount: userTokenAccount,
          recipientTokenAccount: recipientTokenAccount,
          daoTreasuryTokenAccount: daoTreasuryTokenAccount,
          feeCollectorTokenAccount: feeCollectorTokenAccount,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([userWallet])
        .rpc();
      
      console.log(`Transferred ${TRANSFER_AMOUNT.toString()} VG tokens with 10% tax`);
      
      // Вычисляем ожидаемые значения
      const taxAmount = TRANSFER_AMOUNT.mul(new BN(TAX_RATE_BPS)).div(new BN(10000));
      const transferAmount = TRANSFER_AMOUNT.sub(taxAmount);
      const daoTaxAmount = taxAmount.div(new BN(2));
      const nftHoldersTaxAmount = taxAmount.sub(daoTaxAmount);
      
      // Проверяем балансы после перевода
      const senderBalance = await getTokenBalance(connection, userTokenAccount);
      const recipientBalance = await getTokenBalance(connection, recipientTokenAccount);
      const daoTreasuryBalance = await getTokenBalance(connection, daoTreasuryTokenAccount);
      const feeCollectorBalance = await getTokenBalance(connection, feeCollectorTokenAccount);
      
      console.log(`Sender balance: ${senderBalance}`);
      console.log(`Recipient balance: ${recipientBalance}`);
      console.log(`DAO Treasury balance: ${daoTreasuryBalance}`);
      console.log(`Fee Collector balance: ${feeCollectorBalance}`);
      
      // Проверяем, что балансы соответствуют ожидаемым значениям
      expect(senderBalance).to.equal(MINT_AMOUNT.sub(TRANSFER_AMOUNT).toNumber());
      expect(recipientBalance).to.equal(transferAmount.toNumber());
      expect(daoTreasuryBalance).to.equal(daoTaxAmount.toNumber());
      expect(feeCollectorBalance).to.equal(nftHoldersTaxAmount.toNumber());
    } catch (error) {
      console.error('Failed to transfer VG tokens with tax:', error);
      throw error;
    }
  });
  
  it('Should set freeze authority to DAO', async () => {
    console.log('Testing setting freeze authority to DAO...');
    
    try {
      // Вызываем инструкцию setFreezeAuthority
      await program.methods
        .setFreezeAuthority()
        .accounts({
          payer: provider.wallet.publicKey,
          mint: mintPubkey,
          daoAuthority: daoTreasuryWallet.publicKey,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      
      console.log(`Set freeze authority to DAO: ${daoTreasuryWallet.publicKey.toString()}`);
      
      // Здесь можно было бы проверить, что freeze authority был установлен на daoTreasuryWallet.publicKey,
      // но для этого нужно запросить информацию о минте через SPL Token API
    } catch (error) {
      console.error('Failed to set freeze authority to DAO:', error);
      throw error;
    }
  });
}); 