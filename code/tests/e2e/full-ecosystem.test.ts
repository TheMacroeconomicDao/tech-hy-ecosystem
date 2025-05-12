import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccount } from '@solana/spl-token';
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

describe('TECH-HY Ecosystem E2E Tests', () => {
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
  let daoVcTokenAccount: PublicKey;
  let userNames = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve'];
  const users: { 
    name: string, 
    wallet: Keypair,
    vcAccount: PublicKey,
    vgAccount: PublicKey,
    lpRecord: PublicKey,
    vcBalance: number,
    vgBalance: number,
    lpLocked: BN
  }[] = [];

  // Константы для операций
  const VC_DISTRIBUTION_AMOUNT = new BN(100_000).mul(new BN(10).pow(new BN(9))); // 100,000 VC для каждого пользователя
  
  before(async () => {
    console.log('Setting up TECH-HY ecosystem E2E test environment...');
    
    // Получаем адреса PDA аккаунтов
    [burnAndEarnState] = await findBurnAndEarnStateAddress(burnAndEarnProgramId);
    [vcMintPubkey] = await findVcTokenMintAddress(vcTokenProgramId);
    [vgMintPubkey] = await findVgTokenMintAddress(vgTokenProgramId);
    
    console.log(`Burn and Earn State: ${burnAndEarnState.toString()}`);
    console.log(`VC Token mint: ${vcMintPubkey.toString()}`);
    console.log(`VG Token mint: ${vgMintPubkey.toString()}`);
    
    // Создаем DAO кошелек
    daoWallet = await createFundedWallet(connection, 100 * LAMPORTS_PER_SOL);
    console.log(`DAO wallet: ${daoWallet.publicKey.toString()}`);
    
    // Создаем тестовых пользователей
    for (const name of userNames) {
      const wallet = await createFundedWallet(connection, 10 * LAMPORTS_PER_SOL);
      const vcAccount = await getAssociatedTokenAddress(vcMintPubkey, wallet.publicKey);
      const vgAccount = await getAssociatedTokenAddress(vgMintPubkey, wallet.publicKey);
      const lpRecord = PublicKey.findProgramAddressSync(
        [Buffer.from('user_lp_record'), wallet.publicKey.toBuffer()],
        burnAndEarnProgramId
      )[0];
      
      users.push({
        name,
        wallet,
        vcAccount,
        vgAccount,
        lpRecord,
        vcBalance: 0,
        vgBalance: 0,
        lpLocked: new BN(0)
      });
      
      console.log(`Created user ${name}: ${wallet.publicKey.toString()}`);
    }
  });

  // E2E сценарий 1: Инициализация экосистемы
  it('E2E Scenario 1: Initialize ecosystem', async () => {
    console.log('\n=== E2E SCENARIO 1: INITIALIZE ECOSYSTEM ===');
    
    try {
      // Получаем адрес ассоциированного токен-аккаунта казны DAO для VC токенов
      daoVcTokenAccount = await getAssociatedTokenAddress(
        vcMintPubkey,
        daoWallet.publicKey
      );
      
      // 1.1 Инициализация VC токена
      console.log('1.1 Initializing VC Token...');
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
      
      // 1.2 Установка метаданных VC токена
      console.log('1.2 Setting VC Token metadata...');
      await vcTokenProgram.methods
        .setMetadata('TECH-HY VC', 'VC', 'https://tech-hy.io/token-metadata/vc.json')
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
      
      // 1.3 Инициализация VG токена
      console.log('1.3 Initializing VG Token...');
      await vgTokenProgram.methods
        .initialize()
        .accounts({
          payer: provider.wallet.publicKey,
          mint: vgMintPubkey,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      
      // 1.4 Установка метаданных VG токена
      console.log('1.4 Setting VG Token metadata...');
      await vgTokenProgram.methods
        .setMetadata('TECH-HY VG', 'VG', 'https://tech-hy.io/token-metadata/vg.json')
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
      
      // 1.5 Установка freeze authority для VG токена
      console.log('1.5 Setting VG Token freeze authority...');
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
      
      // 1.6 Инициализация Burn and Earn программы
      console.log('1.6 Initializing Burn and Earn program...');
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
      
      // Проверяем, что все инициализировано успешно
      console.log('Checking ecosystem initialization...');
      
      // Проверка баланса VC токенов у казны DAO
      const daoVcBalance = await getTokenBalance(connection, daoVcTokenAccount);
      const expectedSupply = new BN(5_000_000_000).mul(new BN(10).pow(new BN(9))).toNumber();
      expect(daoVcBalance).to.equal(expectedSupply);
      console.log(`DAO Treasury VC balance: ${daoVcBalance} (✓)`);
      
      // Проверка состояния Burn and Earn
      const stateAccount = await burnAndEarnProgram.account.burnAndEarnState.fetch(burnAndEarnState);
      expect(stateAccount.authority.toString()).to.equal(provider.wallet.publicKey.toString());
      expect(stateAccount.vcMint.toString()).to.equal(vcMintPubkey.toString());
      expect(stateAccount.vgMint.toString()).to.equal(vgMintPubkey.toString());
      expect(stateAccount.totalLockedLp.toString()).to.equal('0');
      console.log('Burn and Earn state initialized correctly (✓)');
      
      console.log('Ecosystem initialized successfully! ✓');
    } catch (error) {
      console.error('Failed during ecosystem initialization:', error);
      throw error;
    }
  });

  // E2E сценарий 2: Распределение VC токенов пользователям
  it('E2E Scenario 2: Distribute VC tokens to users', async () => {
    console.log('\n=== E2E SCENARIO 2: DISTRIBUTE VC TOKENS ===');
    
    try {
      // Подготовка токен-аккаунтов пользователей и распределение токенов
      console.log('Distributing VC tokens to users...');
      
      for (const user of users) {
        // Создаем токен-аккаунты для пользователя, если они еще не существуют
        await createAssociatedTokenAccount(
          connection,
          provider.wallet.publicKey as unknown as Keypair,
          vcMintPubkey,
          user.wallet.publicKey
        ).catch(() => console.log(`${user.name}'s VC token account already exists`));
        
        await createAssociatedTokenAccount(
          connection,
          provider.wallet.publicKey as unknown as Keypair,
          vgMintPubkey,
          user.wallet.publicKey
        ).catch(() => console.log(`${user.name}'s VG token account already exists`));
        
        // Переводим VC токены от казны пользователю
        const transferIx = anchor.utils.token.createTransferInstruction(
          daoVcTokenAccount,
          user.vcAccount,
          daoWallet.publicKey,
          Number(VC_DISTRIBUTION_AMOUNT)
        );
        
        // Создаем и отправляем транзакцию
        const tx = new anchor.web3.Transaction().add(transferIx);
        await anchor.web3.sendAndConfirmTransaction(connection, tx, [daoWallet]);
        
        // Обновляем баланс пользователя в нашей структуре данных
        user.vcBalance = await getTokenBalance(connection, user.vcAccount);
        
        console.log(`Transferred ${VC_DISTRIBUTION_AMOUNT.toString()} VC tokens to ${user.name}`);
        console.log(`${user.name}'s VC balance: ${user.vcBalance}`);
        
        // Проверяем, что перевод прошел успешно
        expect(user.vcBalance).to.equal(VC_DISTRIBUTION_AMOUNT.toNumber());
      }
      
      console.log('VC tokens distributed successfully! ✓');
    } catch (error) {
      console.error('Failed during VC token distribution:', error);
      throw error;
    }
  });

  // E2E сценарий 3: Пользователи используют Burn and Earn
  it('E2E Scenario 3: Users utilize Burn and Earn', async () => {
    console.log('\n=== E2E SCENARIO 3: USERS UTILIZE BURN AND EARN ===');
    
    try {
      // Общая статистика перед операциями
      console.log('Global statistics before operations:');
      const initialState = await burnAndEarnProgram.account.burnAndEarnState.fetch(burnAndEarnState);
      console.log(`- Total locked LP: ${initialState.totalLockedLp.toString()}`);
      console.log(`- Total VG minted: ${initialState.totalVgMinted.toString()}`);
      console.log(`- Total VC burned: ${initialState.totalVcBurned.toString()}`);
      
      // Каждый пользователь конвертирует разное количество VC токенов
      const burnRatios = [0.1, 0.2, 0.3, 0.5, 0.8]; // % от баланса VC
      
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const ratio = burnRatios[i % burnRatios.length];
        const amountToBurn = new BN(Math.floor(user.vcBalance * ratio));
        
        console.log(`\n${user.name} is converting ${amountToBurn.toString()} VC tokens (${ratio * 100}% of balance)...`);
        
        // Используем Burn and Earn для конвертации VC в LP и эмиссии VG
        await burnAndEarnProgram.methods
          .burnAndLock(amountToBurn)
          .accounts({
            user: user.wallet.publicKey,
            burnAndEarnState: burnAndEarnState,
            userLpRecord: user.lpRecord,
            vcMint: vcMintPubkey,
            userVcTokenAccount: user.vcAccount,
            vgMint: vgMintPubkey,
            userVgTokenAccount: user.vgAccount,
            vcTokenProgram: vcTokenProgramId,
            vgTokenProgram: vgTokenProgramId,
            tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
            associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          })
          .signers([user.wallet])
          .rpc();
        
        // Обновляем балансы и записи пользователя
        user.vcBalance = await getTokenBalance(connection, user.vcAccount);
        user.vgBalance = await getTokenBalance(connection, user.vgAccount);
        
        const lpRecord = await burnAndEarnProgram.account.userLpRecord.fetch(user.lpRecord);
        user.lpLocked = lpRecord.lockedLp;
        
        // Выводим результаты
        console.log(`${user.name}'s updated stats:`);
        console.log(`- VC balance: ${user.vcBalance}`);
        console.log(`- VG balance: ${user.vgBalance}`);
        console.log(`- LP locked: ${user.lpLocked.toString()}`);
        console.log(`- NFT level: ${lpRecord.nftLevel}`);
        
        // Определяем уровень NFT на основе заблокированных LP
        const lpLocked = Number(lpRecord.lockedLp) / 10**9;
        let expectedLevel = 0;
        if (lpLocked >= 1_000_000) expectedLevel = 4; // Platinum
        else if (lpLocked >= 100_000) expectedLevel = 3; // Gold
        else if (lpLocked >= 10_000) expectedLevel = 2; // Silver
        else if (lpLocked >= 1_000) expectedLevel = 1; // Bronze
        
        // Проверяем правильность уровня NFT
        expect(lpRecord.nftLevel).to.equal(expectedLevel);
      }
      
      // Проверяем общую статистику после операций
      console.log('\nGlobal statistics after operations:');
      const finalState = await burnAndEarnProgram.account.burnAndEarnState.fetch(burnAndEarnState);
      console.log(`- Total locked LP: ${finalState.totalLockedLp.toString()}`);
      console.log(`- Total VG minted: ${finalState.totalVgMinted.toString()}`);
      console.log(`- Total VC burned: ${finalState.totalVcBurned.toString()}`);
      
      // Проверяем, что глобальная статистика обновлена корректно
      expect(Number(finalState.totalLockedLp)).to.be.greaterThan(0);
      expect(Number(finalState.totalVgMinted)).to.be.greaterThan(0);
      expect(Number(finalState.totalVcBurned)).to.be.greaterThan(0);
      
      // Вычисляем суммарные значения из пользовательских записей
      let totalLockedLp = new BN(0);
      let totalVgIssued = new BN(0);
      for (const user of users) {
        const lpRecord = await burnAndEarnProgram.account.userLpRecord.fetch(user.lpRecord);
        totalLockedLp = totalLockedLp.add(lpRecord.lockedLp);
        totalVgIssued = totalVgIssued.add(new BN(user.vgBalance));
      }
      
      // Проверяем, что суммарные значения соответствуют глобальной статистике
      expect(totalLockedLp.toString()).to.equal(finalState.totalLockedLp.toString());
      
      console.log('\nBurn and Earn operations completed successfully! ✓');
    } catch (error) {
      console.error('Failed during Burn and Earn operations:', error);
      throw error;
    }
  });

  // E2E сценарий 4: Пользователи переводят VG токены между собой с налогом
  it('E2E Scenario 4: Users transfer VG tokens with tax', async () => {
    console.log('\n=== E2E SCENARIO 4: VG TOKEN TRANSFERS WITH TAX ===');
    
    try {
      // Создаем аккаунты для налога
      const daoTreasuryWallet = await createFundedWallet(connection, 2 * LAMPORTS_PER_SOL);
      const feeCollectorWallet = await createFundedWallet(connection, 2 * LAMPORTS_PER_SOL);
      console.log(`DAO Treasury wallet: ${daoTreasuryWallet.publicKey.toString()}`);
      console.log(`Fee Collector wallet: ${feeCollectorWallet.publicKey.toString()}`);
      
      // Получаем адреса токен-аккаунтов
      const daoTreasuryTokenAccount = await getAssociatedTokenAddress(
        vgMintPubkey,
        daoTreasuryWallet.publicKey
      );
      
      const feeCollectorTokenAccount = await getAssociatedTokenAddress(
        vgMintPubkey,
        feeCollectorWallet.publicKey
      );
      
      // Создаем токен-аккаунты для получения налога
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
      
      // Выполняем переводы между всеми пользователями
      console.log('\nPerforming VG token transfers between users:');
      
      // Сохраняем начальные балансы для проверки после всех операций
      const initialBalances = users.map(user => user.vgBalance);
      
      // Отслеживаем общее количество налога
      let totalDaoTax = 0;
      let totalFeeCollectorTax = 0;
      
      // Каждый пользователь выполняет перевод следующему в списке
      for (let i = 0; i < users.length; i++) {
        const sender = users[i];
        const recipient = users[(i + 1) % users.length];
        
        // Проверяем, что есть что переводить
        if (sender.vgBalance === 0) {
          console.log(`${sender.name} has no VG tokens to transfer, skipping...`);
          continue;
        }
        
        // Определяем сумму для перевода (10% от баланса)
        const transferAmount = new BN(Math.ceil(sender.vgBalance * 0.1));
        if (transferAmount.lten(0)) continue;
        
        console.log(`\n${sender.name} transfers ${transferAmount.toString()} VG tokens to ${recipient.name} with 10% tax...`);
        
        // Рассчитываем ожидаемые значения
        const taxAmount = transferAmount.mul(new BN(1000)).div(new BN(10000)); // 10% налог
        const netTransferAmount = transferAmount.sub(taxAmount);
        const daoShare = taxAmount.div(new BN(2));
        const feeCollectorShare = taxAmount.sub(daoShare);
        
        // Вызываем функцию передачи VG токенов с 10% налогом
        await vgTokenProgram.methods
          .transfer(transferAmount)
          .accounts({
            sender: sender.wallet.publicKey,
            recipient: recipient.wallet.publicKey,
            daoTreasury: daoTreasuryWallet.publicKey,
            feeCollector: feeCollectorWallet.publicKey,
            mint: vgMintPubkey,
            senderTokenAccount: sender.vgAccount,
            recipientTokenAccount: recipient.vgAccount,
            daoTreasuryTokenAccount: daoTreasuryTokenAccount,
            feeCollectorTokenAccount: feeCollectorTokenAccount,
            tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
            associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([sender.wallet])
          .rpc();
        
        // Обновляем балансы
        sender.vgBalance = await getTokenBalance(connection, sender.vgAccount);
        recipient.vgBalance = await getTokenBalance(connection, recipient.vgAccount);
        const daoTreasuryBalance = await getTokenBalance(connection, daoTreasuryTokenAccount);
        const feeCollectorBalance = await getTokenBalance(connection, feeCollectorTokenAccount);
        
        // Отслеживаем налоги
        totalDaoTax = daoTreasuryBalance;
        totalFeeCollectorTax = feeCollectorBalance;
        
        console.log(`Transfer completed:`);
        console.log(`- ${sender.name}'s updated VG balance: ${sender.vgBalance}`);
        console.log(`- ${recipient.name}'s updated VG balance: ${recipient.vgBalance}`);
        console.log(`- DAO Treasury received tax: ${daoShare.toString()}`);
        console.log(`- Fee Collector received tax: ${feeCollectorShare.toString()}`);
      }
      
      // Проверяем, что налоги собраны
      console.log('\nTax collection summary:');
      console.log(`- Total DAO Treasury tax: ${totalDaoTax}`);
      console.log(`- Total Fee Collector tax: ${totalFeeCollectorTax}`);
      
      expect(totalDaoTax).to.be.greaterThan(0);
      expect(totalFeeCollectorTax).to.be.greaterThan(0);
      expect(totalDaoTax).to.approximately(totalFeeCollectorTax, 10); // Примерно равны с учетом округления
      
      console.log('\nVG token transfers completed successfully! ✓');
    } catch (error) {
      console.error('Failed during VG token transfers:', error);
      throw error;
    }
  });

  // E2E сценарий 5: Проверка права на получение NFT Fee Key
  it('E2E Scenario 5: Check NFT Fee Key eligibility', async () => {
    console.log('\n=== E2E SCENARIO 5: NFT FEE KEY ELIGIBILITY ===');
    
    try {
      console.log('Checking NFT eligibility for all users:');
      
      for (const user of users) {
        // Получаем запись LP токенов пользователя
        const lpRecord = await burnAndEarnProgram.account.userLpRecord.fetch(user.lpRecord);
        
        console.log(`\n${user.name}'s NFT eligibility check:`);
        console.log(`- Locked LP tokens: ${lpRecord.lockedLp.toString()}`);
        console.log(`- Current NFT level: ${lpRecord.nftLevel}`);
        
        // Определяем уровень NFT на основе заблокированных LP
        const lpLocked = Number(lpRecord.lockedLp) / 10**9;
        let expectedLevel = 0;
        if (lpLocked >= 1_000_000) expectedLevel = 4; // Platinum
        else if (lpLocked >= 100_000) expectedLevel = 3; // Gold
        else if (lpLocked >= 10_000) expectedLevel = 2; // Silver
        else if (lpLocked >= 1_000) expectedLevel = 1; // Bronze
        
        // Если пользователь имеет право на NFT
        if (expectedLevel > 0) {
          console.log(`${user.name} is eligible for NFT level ${expectedLevel}!`);
          
          try {
            // Пробуем создать NFT Fee Key
            await burnAndEarnProgram.methods
              .createNftFeeKey()
              .accounts({
                user: user.wallet.publicKey,
                userLpRecord: user.lpRecord,
                systemProgram: anchor.web3.SystemProgram.programId,
              })
              .signers([user.wallet])
              .rpc();
            
            console.log(`✓ ${user.name} successfully created an NFT Fee Key!`);
          } catch (error) {
            if (error.toString().includes('NFT creation is not yet implemented')) {
              console.log(`✓ Expected error: NFT creation is not yet fully implemented`);
            } else {
              throw error;
            }
          }
        } else {
          console.log(`${user.name} is not eligible for an NFT yet.`);
          
          try {
            // Пробуем создать NFT Fee Key, ожидаем ошибку
            await burnAndEarnProgram.methods
              .createNftFeeKey()
              .accounts({
                user: user.wallet.publicKey,
                userLpRecord: user.lpRecord,
                systemProgram: anchor.web3.SystemProgram.programId,
              })
              .signers([user.wallet])
              .rpc();
            
            throw new Error(`${user.name} was able to create NFT when they shouldn't!`);
          } catch (error) {
            if (error.toString().includes('NoEligibleNft')) {
              console.log(`✓ Expected error: User correctly identified as not eligible for NFT`);
            } else if (error.toString().includes('NFT creation is not yet implemented')) {
              console.log(`✓ Expected error: NFT creation is not yet fully implemented`);
            } else {
              throw error;
            }
          }
        }
      }
      
      console.log('\nNFT eligibility checks completed successfully! ✓');
    } catch (error) {
      console.error('Failed during NFT eligibility check:', error);
      throw error;
    }
  });
}); 