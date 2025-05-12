import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccount, getAccount } from '@solana/spl-token';
import { expect } from 'chai';
import { 
  findVcTokenMintAddress, 
  findVgTokenMintAddress, 
  findBurnAndEarnStateAddress,
  createFundedWallet, 
  getTokenBalance
} from '../utils/test-utils';
import { VcTokenIdl, VgTokenIdl, BurnAndEarnIdl } from '../utils/types';
import BN from 'bn.js';

describe('TECH-HY Ecosystem Integration Tests', () => {
  // Connection и provider для тестов
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;

  // ID программ из конфига
  const vcTokenProgramId = new PublicKey('VCzfGwp5qVL8pmta1GHqGrSQqzMa5qsY4M1jbjsdaYJ');
  const vgTokenProgramId = new PublicKey('VGnHJHKr2NwxSdQQoYrJY9TBZ9YHS5cCwBPEr68mEPG');
  const burnAndEarnProgramId = new PublicKey('BAEpWRJiqZrZkmyzGbcBAvQYpRKbRq5L3D5WwA1dvYf5');
  
  // Программы
  const vcTokenProgram = new Program(
    require('../idl/vc_token.json') as VcTokenIdl, 
    vcTokenProgramId
  ) as Program<VcTokenIdl>;
  
  const vgTokenProgram = new Program(
    require('../idl/vg_token.json') as VgTokenIdl, 
    vgTokenProgramId
  ) as Program<VgTokenIdl>;
  
  const burnAndEarnProgram = new Program(
    require('../idl/burn_and_earn.json') as BurnAndEarnIdl, 
    burnAndEarnProgramId
  ) as Program<BurnAndEarnIdl>;
  
  // Переменные для тестов
  let burnAndEarnState: PublicKey;
  let vcMintPubkey: PublicKey;
  let vgMintPubkey: PublicKey;
  let daoWallet: Keypair;
  let userWallet: Keypair;
  let userVcTokenAccount: PublicKey;
  let userVgTokenAccount: PublicKey;
  let userLpRecord: PublicKey;
  
  const VC_AMOUNT = new BN(10000).mul(new BN(10).pow(new BN(9))); // 10,000 VC
  const VC_AMOUNT_TO_BURN = new BN(5000).mul(new BN(10).pow(new BN(9))); // 5,000 VC
  const VC_AMOUNT_TO_TRANSFER = new BN(1000).mul(new BN(10).pow(new BN(9))); // 1,000 VC

  before(async () => {
    console.log('Setting up ecosystem integration test environment...');
    
    // Получаем адреса аккаунтов через PDA
    [burnAndEarnState] = await findBurnAndEarnStateAddress(burnAndEarnProgramId);
    [vcMintPubkey] = await findVcTokenMintAddress(vcTokenProgramId);
    [vgMintPubkey] = await findVgTokenMintAddress(vgTokenProgramId);
    
    console.log(`Burn and Earn State PDA: ${burnAndEarnState.toString()}`);
    console.log(`VC Token mint PDA: ${vcMintPubkey.toString()}`);
    console.log(`VG Token mint PDA: ${vgMintPubkey.toString()}`);
    
    // Создаем тестовые кошельки
    daoWallet = await createFundedWallet(connection, 50 * LAMPORTS_PER_SOL);
    userWallet = await createFundedWallet(connection, 50 * LAMPORTS_PER_SOL);
    
    console.log(`DAO wallet: ${daoWallet.publicKey.toString()}`);
    console.log(`User wallet: ${userWallet.publicKey.toString()}`);
    
    // Вычисляем адрес UserLpRecord PDA
    [userLpRecord] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_lp_record'), userWallet.publicKey.toBuffer()],
      burnAndEarnProgramId
    );
  });

  // Шаг 1: Инициализация и настройка VC Token
  it('Step 1: Initialize and setup VC Token', async () => {
    console.log('\n=== STEP 1: Initialize and setup VC Token ===');
    
    // Получаем адрес ассоциированного токен-аккаунта казны DAO для VC токенов
    const daoVcTokenAccount = await getAssociatedTokenAddress(
      vcMintPubkey,
      daoWallet.publicKey
    );
    
    try {
      // Инициализация VC токена
      await vcTokenProgram.methods
        .initialize()
        .accounts({
          payer: provider.wallet.publicKey,
          treasury: daoWallet.publicKey,
          mint: vcMintPubkey,
          treasuryTokenAccount: daoVcTokenAccount,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      
      console.log('VC Token initialized successfully');
      
      // Установка метаданных
      const metadataUri = 'https://tech-hy.io/token-metadata/vc.json';
      const name = 'TECH-HY VC';
      const symbol = 'VC';
      
      await vcTokenProgram.methods
        .setMetadata(name, symbol, metadataUri)
        .accounts({
          authority: provider.wallet.publicKey,
          mint: vcMintPubkey,
          payer: provider.wallet.publicKey,
          metadata: anchor.web3.PublicKey.findProgramAddressSync(
            [
              Buffer.from('metadata'),
              new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
              vcMintPubkey.toBuffer(),
            ],
            new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
          )[0],
          metadataProgram: new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'),
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();
      
      console.log('VC Token metadata set successfully');
      
      // Проверяем, что токены были выпущены на кошелек казны DAO
      const daoVcBalance = await getTokenBalance(connection, daoVcTokenAccount);
      const expectedSupply = new BN(5_000_000_000).mul(new BN(10).pow(new BN(9))).toNumber();
      
      console.log(`DAO Treasury VC token balance: ${daoVcBalance}`);
      expect(daoVcBalance).to.equal(expectedSupply);
    } catch (error) {
      console.error('Failed during VC Token setup:', error);
      throw error;
    }
  });

  // Шаг 2: Инициализация и настройка VG Token
  it('Step 2: Initialize and setup VG Token', async () => {
    console.log('\n=== STEP 2: Initialize and setup VG Token ===');
    
    try {
      // Инициализация VG токена
      await vgTokenProgram.methods
        .initialize()
        .accounts({
          payer: provider.wallet.publicKey,
          mint: vgMintPubkey,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      
      console.log('VG Token initialized successfully');
      
      // Установка метаданных
      const metadataUri = 'https://tech-hy.io/token-metadata/vg.json';
      const name = 'TECH-HY VG';
      const symbol = 'VG';
      
      await vgTokenProgram.methods
        .setMetadata(name, symbol, metadataUri)
        .accounts({
          authority: provider.wallet.publicKey,
          mint: vgMintPubkey,
          payer: provider.wallet.publicKey,
          metadata: anchor.web3.PublicKey.findProgramAddressSync(
            [
              Buffer.from('metadata'),
              new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
              vgMintPubkey.toBuffer(),
            ],
            new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
          )[0],
          metadataProgram: new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'),
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();
      
      console.log('VG Token metadata set successfully');
      
      // Установка freeze authority для DAO
      await vgTokenProgram.methods
        .setFreezeAuthority()
        .accounts({
          payer: provider.wallet.publicKey,
          mint: vgMintPubkey,
          daoAuthority: daoWallet.publicKey,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      
      console.log(`Freeze authority set to DAO: ${daoWallet.publicKey.toString()}`);
    } catch (error) {
      console.error('Failed during VG Token setup:', error);
      throw error;
    }
  });

  // Шаг 3: Инициализация Burn and Earn программы
  it('Step 3: Initialize Burn and Earn program', async () => {
    console.log('\n=== STEP 3: Initialize Burn and Earn program ===');
    
    try {
      // Инициализация программы Burn and Earn
      await burnAndEarnProgram.methods
        .initialize()
        .accounts({
          authority: provider.wallet.publicKey,
          burnAndEarnState: burnAndEarnState,
          vcMint: vcMintPubkey,
          vgMint: vgMintPubkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      
      console.log('Burn and Earn program initialized successfully');
      
      // Проверяем состояние Burn and Earn
      const stateAccount = await burnAndEarnProgram.account.burnAndEarnState.fetch(burnAndEarnState);
      
      expect(stateAccount.vcMint.toString()).to.equal(vcMintPubkey.toString());
      expect(stateAccount.vgMint.toString()).to.equal(vgMintPubkey.toString());
      expect(stateAccount.totalLockedLp.toString()).to.equal('0');
    } catch (error) {
      console.error('Failed to initialize Burn and Earn program:', error);
      throw error;
    }
  });

  // Шаг 4: Перевод VC токенов пользователю от казны DAO
  it('Step 4: Transfer VC tokens from DAO treasury to user', async () => {
    console.log('\n=== STEP 4: Transfer VC tokens from DAO to user ===');
    
    try {
      // Получаем адреса токен-аккаунтов
      const daoVcTokenAccount = await getAssociatedTokenAddress(
        vcMintPubkey,
        daoWallet.publicKey
      );
      
      userVcTokenAccount = await getAssociatedTokenAddress(
        vcMintPubkey,
        userWallet.publicKey
      );
      
      // Инициализируем токен-аккаунт пользователя, если он еще не существует
      await createAssociatedTokenAccount(
        connection,
        provider.wallet.publicKey as unknown as Keypair,
        vcMintPubkey,
        userWallet.publicKey
      ).catch(() => console.log('User VC token account already exists'));
      
      // Используем стандартный перевод SPL токенов для передачи средств от казны пользователю
      const transferIx = anchor.utils.token.createTransferInstruction(
        daoVcTokenAccount,
        userVcTokenAccount,
        daoWallet.publicKey,
        Number(VC_AMOUNT)
      );
      
      // Создаем и отправляем транзакцию
      const tx = new anchor.web3.Transaction().add(transferIx);
      await anchor.web3.sendAndConfirmTransaction(connection, tx, [daoWallet]);
      
      console.log(`Transferred ${VC_AMOUNT.toString()} VC tokens from DAO to user`);
      
      // Проверяем баланс пользователя
      const userVcBalance = await getTokenBalance(connection, userVcTokenAccount);
      console.log(`User VC token balance: ${userVcBalance}`);
      
      expect(userVcBalance).to.equal(VC_AMOUNT.toNumber());
    } catch (error) {
      console.error('Failed to transfer VC tokens from DAO to user:', error);
      throw error;
    }
  });

  // Шаг 5: Использование Burn and Earn для конвертации VC в VG
  it('Step 5: Use Burn and Earn to convert VC to VG', async () => {
    console.log('\n=== STEP 5: Use Burn and Earn to convert VC to VG ===');
    
    try {
      // Получаем адрес VG токен-аккаунта для пользователя
      userVgTokenAccount = await getAssociatedTokenAddress(
        vgMintPubkey,
        userWallet.publicKey
      );
      
      // Инициализируем токен-аккаунт пользователя для VG, если он еще не существует
      await createAssociatedTokenAccount(
        connection,
        provider.wallet.publicKey as unknown as Keypair,
        vgMintPubkey,
        userWallet.publicKey
      ).catch(() => console.log('User VG token account already exists'));
      
      // Запоминаем начальный баланс VC
      const initialVcBalance = await getTokenBalance(connection, userVcTokenAccount);
      
      // Используем Burn and Earn для конвертации VC в LP и эмиссии VG
      await burnAndEarnProgram.methods
        .burnAndLock(VC_AMOUNT_TO_BURN)
        .accounts({
          user: userWallet.publicKey,
          burnAndEarnState: burnAndEarnState,
          userLpRecord: userLpRecord,
          vcMint: vcMintPubkey,
          userVcTokenAccount: userVcTokenAccount,
          vgMint: vgMintPubkey,
          userVgTokenAccount: userVgTokenAccount,
          vcTokenProgram: vcTokenProgramId,
          vgTokenProgram: vgTokenProgramId,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        })
        .signers([userWallet])
        .rpc();
      
      console.log(`Used Burn and Earn to convert ${VC_AMOUNT_TO_BURN.toString()} VC tokens`);
      
      // Проверяем состояние после операции
      const lpRecord = await burnAndEarnProgram.account.userLpRecord.fetch(userLpRecord);
      const stateAccount = await burnAndEarnProgram.account.burnAndEarnState.fetch(burnAndEarnState);
      const userVcBalanceAfter = await getTokenBalance(connection, userVcTokenAccount);
      const userVgBalance = await getTokenBalance(connection, userVgTokenAccount);
      
      console.log('User LP record:', {
        lockedLp: lpRecord.lockedLp.toString(),
        vgMinted: lpRecord.vgMinted.toString(),
        vcBurned: lpRecord.vcBurned.toString()
      });
      
      console.log('Burn and Earn state:', {
        totalLockedLp: stateAccount.totalLockedLp.toString(),
        totalVgMinted: stateAccount.totalVgMinted.toString(),
        totalVcBurned: stateAccount.totalVcBurned.toString()
      });
      
      console.log(`User VC balance after: ${userVcBalanceAfter}`);
      console.log(`User VG balance: ${userVgBalance}`);
      
      // Проверяем, что VC токены были списаны
      expect(userVcBalanceAfter).to.equal(initialVcBalance - VC_AMOUNT_TO_BURN.toNumber());
      
      // Проверяем, что пользователь получил VG токены
      expect(userVgBalance).to.be.greaterThan(0);
      
      // Проверяем, что записи созданы и обновлены
      expect(lpRecord.owner.toString()).to.equal(userWallet.publicKey.toString());
      expect(Number(lpRecord.vcBurned)).to.be.greaterThan(0);
      expect(Number(lpRecord.lockedLp)).to.be.greaterThan(0);
      expect(Number(lpRecord.vgMinted)).to.be.greaterThan(0);
      expect(Number(stateAccount.totalVcBurned)).to.be.greaterThan(0);
    } catch (error) {
      console.error('Failed to use Burn and Earn:', error);
      throw error;
    }
  });

  // Шаг 6: Передача VG токенов другому пользователю с 10% налогом
  it('Step 6: Transfer VG tokens with 10% tax', async () => {
    console.log('\n=== STEP 6: Transfer VG tokens with 10% tax ===');
    
    try {
      // Создаем получателя
      const recipientWallet = await createFundedWallet(connection, 2 * LAMPORTS_PER_SOL);
      console.log(`Recipient wallet: ${recipientWallet.publicKey.toString()}`);
      
      // Создаем кошельки для казны DAO и коллектора комиссий
      const daoTreasuryWallet = await createFundedWallet(connection, 2 * LAMPORTS_PER_SOL);
      const feeCollectorWallet = await createFundedWallet(connection, 2 * LAMPORTS_PER_SOL);
      
      // Получаем адреса токен-аккаунтов
      const recipientTokenAccount = await getAssociatedTokenAddress(
        vgMintPubkey,
        recipientWallet.publicKey
      );
      
      const daoTreasuryTokenAccount = await getAssociatedTokenAddress(
        vgMintPubkey,
        daoTreasuryWallet.publicKey
      );
      
      const feeCollectorTokenAccount = await getAssociatedTokenAddress(
        vgMintPubkey,
        feeCollectorWallet.publicKey
      );
      
      // Создаем токен-аккаунты для получателя и аккаунтов комиссий
      await createAssociatedTokenAccount(
        connection,
        provider.wallet.publicKey as unknown as Keypair,
        vgMintPubkey,
        recipientWallet.publicKey
      ).catch(() => console.log('Recipient token account already exists'));
      
      await createAssociatedTokenAccount(
        connection,
        provider.wallet.publicKey as unknown as Keypair,
        vgMintPubkey,
        daoTreasuryWallet.publicKey
      ).catch(() => console.log('DAO treasury token account already exists'));
      
      await createAssociatedTokenAccount(
        connection,
        provider.wallet.publicKey as unknown as Keypair,
        vgMintPubkey,
        feeCollectorWallet.publicKey
      ).catch(() => console.log('Fee collector token account already exists'));
      
      // Получаем начальный баланс VG пользователя
      const initialVgBalance = await getTokenBalance(connection, userVgTokenAccount);
      
      // Определяем сумму для перевода (10 VG)
      const transferAmount = new BN(10).mul(new BN(10).pow(new BN(9)));
      
      // Вызываем функцию передачи VG токенов с 10% налогом
      await vgTokenProgram.methods
        .transfer(transferAmount)
        .accounts({
          sender: userWallet.publicKey,
          recipient: recipientWallet.publicKey,
          daoTreasury: daoTreasuryWallet.publicKey,
          feeCollector: feeCollectorWallet.publicKey,
          mint: vgMintPubkey,
          senderTokenAccount: userVgTokenAccount,
          recipientTokenAccount: recipientTokenAccount,
          daoTreasuryTokenAccount: daoTreasuryTokenAccount,
          feeCollectorTokenAccount: feeCollectorTokenAccount,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([userWallet])
        .rpc();
      
      console.log(`Transferred ${transferAmount.toString()} VG tokens with 10% tax`);
      
      // Проверяем балансы
      const userVgBalanceAfter = await getTokenBalance(connection, userVgTokenAccount);
      const recipientBalance = await getTokenBalance(connection, recipientTokenAccount);
      const daoTreasuryBalance = await getTokenBalance(connection, daoTreasuryTokenAccount);
      const feeCollectorBalance = await getTokenBalance(connection, feeCollectorTokenAccount);
      
      console.log(`User VG balance after: ${userVgBalanceAfter}`);
      console.log(`Recipient VG balance: ${recipientBalance}`);
      console.log(`DAO Treasury VG balance: ${daoTreasuryBalance}`);
      console.log(`Fee Collector VG balance: ${feeCollectorBalance}`);
      
      // Вычисляем ожидаемые значения
      const taxAmount = transferAmount.mul(new BN(1000)).div(new BN(10000)); // 10% налог
      const netTransferAmount = transferAmount.sub(taxAmount);
      const daoShare = taxAmount.div(new BN(2));
      const feeCollectorShare = taxAmount.sub(daoShare);
      
      // Проверяем, что токены были списаны с аккаунта отправителя
      expect(userVgBalanceAfter).to.equal(initialVgBalance - transferAmount.toNumber());
      
      // Проверяем, что получатель получил токены за вычетом налога
      expect(recipientBalance).to.equal(netTransferAmount.toNumber());
      
      // Проверяем, что налог был распределен правильно
      expect(daoTreasuryBalance).to.equal(daoShare.toNumber());
      expect(feeCollectorBalance).to.equal(feeCollectorShare.toNumber());
    } catch (error) {
      console.error('Failed to transfer VG tokens with tax:', error);
      throw error;
    }
  });

  // Шаг 7: Получение статистики по Burn and Earn
  it('Step 7: Get Burn and Earn statistics', async () => {
    console.log('\n=== STEP 7: Get Burn and Earn statistics ===');
    
    try {
      // Вызываем инструкцию getStatistics
      await burnAndEarnProgram.methods
        .getStatistics()
        .accounts({
          user: userWallet.publicKey,
          burnAndEarnState: burnAndEarnState,
          userLpRecord: userLpRecord,
        })
        .signers([userWallet])
        .rpc();
      
      // Получаем данные аккаунтов для анализа
      const lpRecord = await burnAndEarnProgram.account.userLpRecord.fetch(userLpRecord);
      const stateAccount = await burnAndEarnProgram.account.burnAndEarnState.fetch(burnAndEarnState);
      
      // Выводим статистику
      console.log('Final User LP Record Statistics:');
      console.log('- Locked LP tokens:', lpRecord.lockedLp.toString());
      console.log('- VG tokens minted:', lpRecord.vgMinted.toString());
      console.log('- VC tokens burned:', lpRecord.vcBurned.toString());
      console.log('- NFT level:', lpRecord.nftLevel);
      console.log('- Last update:', new Date(lpRecord.lastUpdate * 1000).toISOString());
      
      console.log('\nFinal Global Statistics:');
      console.log('- Total locked LP tokens:', stateAccount.totalLockedLp.toString());
      console.log('- Total VG tokens minted:', stateAccount.totalVgMinted.toString());
      console.log('- Total VC tokens burned:', stateAccount.totalVcBurned.toString());
      
      // Проверяем соответствие ожидаемым результатам
      expect(Number(lpRecord.vcBurned)).to.equal(VC_AMOUNT_TO_BURN.toNumber());
      expect(Number(stateAccount.totalVcBurned)).to.equal(VC_AMOUNT_TO_BURN.toNumber());
      expect(Number(lpRecord.vgMinted)).to.be.greaterThan(0);
      expect(Number(lpRecord.lockedLp)).to.be.greaterThan(0);
    } catch (error) {
      console.error('Failed to get Burn and Earn statistics:', error);
      throw error;
    }
  });
}); 
 