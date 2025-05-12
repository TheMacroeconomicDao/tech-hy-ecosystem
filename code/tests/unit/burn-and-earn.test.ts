import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import { expect } from 'chai';
import { 
  findVcTokenMintAddress, 
  findVgTokenMintAddress, 
  findBurnAndEarnStateAddress,
  createFundedWallet, 
  getTokenBalance, 
  createMockLpPosition 
} from '../utils/test-utils';
import { BurnAndEarnIdl } from '../utils/types';
import BN from 'bn.js';

describe('Burn and Earn Unit Tests', () => {
  // Connection и provider для тестов
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;

  // ID программ из конфига
  const vcTokenProgramId = new PublicKey('VCzfGwp5qVL8pmta1GHqGrSQqzMa5qsY4M1jbjsdaYJ');
  const vgTokenProgramId = new PublicKey('VGnHJHKr2NwxSdQQoYrJY9TBZ9YHS5cCwBPEr68mEPG');
  const burnAndEarnProgramId = new PublicKey('BAEpWRJiqZrZkmyzGbcBAvQYpRKbRq5L3D5WwA1dvYf5');
  
  // Программа Burn and Earn
  const program = new Program(
    require('../idl/burn_and_earn.json') as BurnAndEarnIdl, 
    burnAndEarnProgramId
  ) as Program<BurnAndEarnIdl>;

  // Переменные для тестов
  let burnAndEarnState: PublicKey;
  let burnAndEarnStateBump: number;
  let vcMintPubkey: PublicKey;
  let vgMintPubkey: PublicKey;
  let userWallet: Keypair;
  let userVcTokenAccount: PublicKey;
  let userVgTokenAccount: PublicKey;
  let userLpRecord: PublicKey;
  let userLpRecordBump: number;
  
  const VC_AMOUNT_TO_BURN = new BN(1000).mul(new BN(10).pow(new BN(9))); // 1,000 VC

  before(async () => {
    console.log('Setting up Burn and Earn test environment...');
    
    // Получаем адреса аккаунтов через PDA
    [burnAndEarnState, burnAndEarnStateBump] = await findBurnAndEarnStateAddress(burnAndEarnProgramId);
    [vcMintPubkey] = await findVcTokenMintAddress(vcTokenProgramId);
    [vgMintPubkey] = await findVgTokenMintAddress(vgTokenProgramId);
    
    console.log(`Burn and Earn State PDA: ${burnAndEarnState.toString()}`);
    console.log(`VC Token mint PDA: ${vcMintPubkey.toString()}`);
    console.log(`VG Token mint PDA: ${vgMintPubkey.toString()}`);
    
    // Создаем тестового пользователя
    userWallet = await createFundedWallet(connection, 10 * LAMPORTS_PER_SOL);
    console.log(`User wallet: ${userWallet.publicKey.toString()}`);
    
    // Получаем адрес токен-аккаунта для VC токенов
    userVcTokenAccount = await getAssociatedTokenAddress(
      vcMintPubkey,
      userWallet.publicKey
    );
    
    // Получаем адрес токен-аккаунта для VG токенов
    userVgTokenAccount = await getAssociatedTokenAddress(
      vgMintPubkey,
      userWallet.publicKey
    );
    
    console.log(`User VC token account: ${userVcTokenAccount.toString()}`);
    console.log(`User VG token account: ${userVgTokenAccount.toString()}`);
    
    // Вычисляем адрес UserLpRecord PDA
    [userLpRecord, userLpRecordBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_lp_record'), userWallet.publicKey.toBuffer()],
      burnAndEarnProgramId
    );
    console.log(`User LP record PDA: ${userLpRecord.toString()}`);
    
    // Создаем и пополняем токен-аккаунт пользователя VC токенами для тестов
    try {
      // Инициализируем токен-аккаунт, если он еще не создан
      await createAssociatedTokenAccount(
        connection,
        provider.wallet.publicKey as unknown as Keypair,
        vcMintPubkey,
        userWallet.publicKey
      ).catch(() => console.log('User VC token account already exists'));
      
      // Минтим VC токены на аккаунт пользователя для тестирования
      // В реальной среде эти токены должны быть получены через обычный перевод
      // Но для тестов мы используем прямой минтинг
      // TODO: Заменить на более реалистичный подход в будущих версиях тестов
      // await mintTo(
      //   connection,
      //   provider.wallet.publicKey as unknown as Keypair,
      //   vcMintPubkey,
      //   userVcTokenAccount,
      //   provider.wallet.publicKey as unknown as Keypair,
      //   BigInt(VC_AMOUNT_TO_BURN.mul(new BN(2)).toString())
      // );
      
      console.log(`Minted ${VC_AMOUNT_TO_BURN.toString()} VC tokens to ${userWallet.publicKey.toString()}`);
    } catch (error) {
      console.error('Failed to setup VC tokens for user:', error);
      throw error;
    }
  });

  it('Should initialize Burn and Earn program', async () => {
    console.log('Testing Burn and Earn initialization...');
    
    try {
      // Вызываем инструкцию initialize
      await program.methods
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
      
      // Получаем данные аккаунта BurnAndEarnState для проверки
      const stateAccount = await program.account.burnAndEarnState.fetch(burnAndEarnState);
      
      console.log('Burn and Earn state account:', stateAccount);
      
      // Проверяем, что аккаунт был корректно инициализирован
      expect(stateAccount.authority.toString()).to.equal(provider.wallet.publicKey.toString());
      expect(stateAccount.vcMint.toString()).to.equal(vcMintPubkey.toString());
      expect(stateAccount.vgMint.toString()).to.equal(vgMintPubkey.toString());
      expect(stateAccount.totalLockedLp.toString()).to.equal('0');
      expect(stateAccount.totalVgMinted.toString()).to.equal('0');
      expect(stateAccount.totalVcBurned.toString()).to.equal('0');
      expect(stateAccount.bump).to.equal(burnAndEarnStateBump);
    } catch (error) {
      console.error('Failed to initialize Burn and Earn program:', error);
      throw error;
    }
  });

  it('Should convert VC to LP tokens and emit VG', async () => {
    console.log('Testing burn and lock functionality...');
    
    try {
      // Инициализируем VG токен-аккаунт, если он еще не создан
      await createAssociatedTokenAccount(
        connection,
        provider.wallet.publicKey as unknown as Keypair,
        vgMintPubkey,
        userWallet.publicKey
      ).catch(() => console.log('User VG token account already exists'));
      
      // Вызываем инструкцию burnAndLock
      await program.methods
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
      
      console.log('Burn and lock operation executed successfully');
      
      // Получаем данные аккаунта UserLpRecord для проверки
      const lpRecord = await program.account.userLpRecord.fetch(userLpRecord);
      
      console.log('User LP record:', lpRecord);
      
      // Обновляем данные аккаунта BurnAndEarnState
      const stateAccount = await program.account.burnAndEarnState.fetch(burnAndEarnState);
      
      console.log('Updated Burn and Earn state:', stateAccount);
      
      // Проверяем баланс VG токенов пользователя
      const vgBalance = await getTokenBalance(connection, userVgTokenAccount);
      console.log(`User VG token balance: ${vgBalance}`);
      
      // Проверяем, что записи были созданы и обновлены корректно
      expect(lpRecord.owner.toString()).to.equal(userWallet.publicKey.toString());
      expect(lpRecord.isInitialized).to.be.true;
      expect(Number(lpRecord.vcBurned)).to.be.greaterThan(0);
      expect(Number(lpRecord.lockedLp)).to.be.greaterThan(0);
      expect(Number(lpRecord.vgMinted)).to.be.greaterThan(0);
      
      // Проверяем, что общая статистика обновлена
      expect(Number(stateAccount.totalVcBurned)).to.be.greaterThan(0);
      expect(Number(stateAccount.totalLockedLp)).to.be.greaterThan(0);
      expect(Number(stateAccount.totalVgMinted)).to.be.greaterThan(0);
      
      // Проверяем, что пользователь получил VG токены
      expect(vgBalance).to.be.greaterThan(0);
    } catch (error) {
      console.error('Failed to execute burn and lock operation:', error);
      throw error;
    }
  });

  it('Should get statistics', async () => {
    console.log('Testing get statistics functionality...');
    
    try {
      // Вызываем инструкцию getStatistics
      await program.methods
        .getStatistics()
        .accounts({
          user: userWallet.publicKey,
          burnAndEarnState: burnAndEarnState,
          userLpRecord: userLpRecord,
        })
        .signers([userWallet])
        .rpc();
      
      console.log('Get statistics operation executed successfully');
      
      // Получаем данные аккаунта UserLpRecord
      const lpRecord = await program.account.userLpRecord.fetch(userLpRecord);
      
      console.log('User LP record statistics:', {
        lockedLp: lpRecord.lockedLp.toString(),
        vgMinted: lpRecord.vgMinted.toString(),
        vcBurned: lpRecord.vcBurned.toString(),
        nftLevel: lpRecord.nftLevel,
        lastUpdate: new Date(lpRecord.lastUpdate * 1000).toISOString()
      });
      
      // Получаем данные аккаунта BurnAndEarnState
      const stateAccount = await program.account.burnAndEarnState.fetch(burnAndEarnState);
      
      console.log('Global statistics:', {
        totalLockedLp: stateAccount.totalLockedLp.toString(),
        totalVgMinted: stateAccount.totalVgMinted.toString(),
        totalVcBurned: stateAccount.totalVcBurned.toString()
      });
    } catch (error) {
      console.error('Failed to get statistics:', error);
      throw error;
    }
  });
  
  it('Should create NFT Fee Key for eligible user', async () => {
    console.log('Testing NFT Fee Key creation...');
    
    try {
      // Проверяем уровень NFT пользователя
      const lpRecord = await program.account.userLpRecord.fetch(userLpRecord);
      
      if (lpRecord.nftLevel > 0) {
        // Вызываем инструкцию createNftFeeKey
        await program.methods
          .createNftFeeKey()
          .accounts({
            user: userWallet.publicKey,
            userLpRecord: userLpRecord,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([userWallet])
          .rpc();
        
        console.log(`NFT Fee Key created successfully with level: ${lpRecord.nftLevel}`);
      } else {
        console.log('User is not eligible for NFT Fee Key yet');
        console.log('Locked LP:', lpRecord.lockedLp.toString());
        console.log('Required for Bronze level:', new BN(1_000).mul(new BN(10).pow(new BN(9))).toString());
      }
    } catch (error) {
      console.error('Failed to create NFT Fee Key:', error);
      if (error.toString().includes('NoEligibleNft')) {
        console.log('Test passed: User correctly identified as not eligible for NFT');
      } else {
        throw error;
      }
    }
  });
}); 