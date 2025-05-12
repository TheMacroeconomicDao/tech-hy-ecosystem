import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { 
  PublicKey, 
  Keypair, 
  SystemProgram, 
  LAMPORTS_PER_SOL 
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddress,
  getAccount,
  getMint,
} from "@solana/spl-token";
import { assert } from "chai";
import { VgToken } from "../target/types/vg_token";
import * as mpl from '@metaplex-foundation/mpl-token-metadata';
import { PROGRAM_ID as METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';

describe("VG Token Tests", () => {
  // Конфигурация провайдера
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.VgToken as Program<VgToken>;
  const wallet = provider.wallet;

  // Создаём тестовые аккаунты
  const recipientWallet = Keypair.generate();
  const daoTreasury = Keypair.generate();
  const feeCollector = Keypair.generate();

  // Константы из программы
  const VG_TOKEN_MINT_SEED = Buffer.from("vg_token_mint");
  const TOKEN_DECIMALS = 9;
  const INITIAL_MINT_AMOUNT = 1_000_000 * 10**9; // 1 миллион токенов для теста
  const TRANSFER_AMOUNT = 100_000 * 10**9; // 100k токенов для перевода
  const TAX_RATE_BPS = 1000; // 10% налог

  // Находим PDA для минта
  const [mintPda] = PublicKey.findProgramAddressSync(
    [VG_TOKEN_MINT_SEED],
    program.programId
  );

  // Находим PDA для метаданных
  const [metadataPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mintPda.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );

  // Рассчитываем ожидаемые результаты перевода с налогом
  const expectedTaxAmount = Math.floor(TRANSFER_AMOUNT * (TAX_RATE_BPS / 10000));
  const expectedTransferAmount = TRANSFER_AMOUNT - expectedTaxAmount;
  const expectedDaoTaxAmount = Math.floor(expectedTaxAmount * 0.5); // 50% налога
  const expectedNftHoldersTaxAmount = expectedTaxAmount - expectedDaoTaxAmount;

  before("Подготовка тестового окружения", async () => {
    // Финансируем тестовые кошельки
    for (const wallet of [recipientWallet, daoTreasury, feeCollector]) {
      const tx = await provider.connection.requestAirdrop(
        wallet.publicKey,
        1 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(tx);
    }
  });

  it("Инициализирует VG токен", async () => {
    console.log("Минт PDA:", mintPda.toString());

    // Инициализируем токен
    const tx = await program.methods
      .initialize()
      .accounts({
        payer: provider.publicKey,
        mint: mintPda,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc();

    console.log("Транзакция инициализации:", tx);

    // Проверяем созданный минт
    const mintInfo = await getMint(
      provider.connection,
      mintPda,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    
    console.log("Информация о минте:", mintInfo);
    
    assert.equal(
      mintInfo.decimals, 
      TOKEN_DECIMALS, 
      "Неправильное количество десятичных знаков"
    );
    
    assert.equal(
      mintInfo.supply.toString(), 
      "0",
      "Начальная эмиссия должна быть нулевой"
    );
  });

  it("Устанавливает метаданные токена", async () => {
    const name = "TECH-HY Governance Token";
    const symbol = "VG";
    const uri = "https://tech-hy.io/metadata/vg-token.json";

    console.log("Metadata PDA:", metadataPda.toString());

    await program.methods
      .setMetadata(name, symbol, uri)
      .accounts({
        authority: provider.publicKey,
        mint: mintPda,
        metadata: metadataPda,
        payer: provider.publicKey,
        metadataProgram: METADATA_PROGRAM_ID,
      })
      .rpc();

    // Получение и проверка метаданных
    try {
      const metadataAccount = await mpl.accounts.Metadata.fromAccountAddress(
        provider.connection,
        metadataPda
      );
      
      console.log("Метаданные токена:", metadataAccount.data);
      
      assert.equal(metadataAccount.data.name.trim(), name, "Имя токена не совпадает");
      assert.equal(metadataAccount.data.symbol.trim(), symbol, "Символ токена не совпадает");
      assert.equal(metadataAccount.data.uri.trim(), uri, "URI токена не совпадает");
      assert.equal(metadataAccount.mint.toString(), mintPda.toString(), "Минт токена не совпадает");
      assert.equal(metadataAccount.isMutable, true, "Метаданные должны быть изменяемыми");
      
      console.log("Метаданные токена успешно установлены и проверены");
    } catch (error) {
      console.error("Ошибка при проверке метаданных:", error);
      assert.fail("Не удалось получить или проверить метаданные токена");
    }
  });

  it("Минтит VG токены", async () => {
    // Находим ассоциированный токен-аккаунт для кошелька провайдера
    const providerTokenAccount = await getAssociatedTokenAddress(
      mintPda,
      provider.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    console.log("Токен-аккаунт провайдера:", providerTokenAccount.toString());

    // Минтим токены для себя
    const tx = await program.methods
      .mintTokens(new anchor.BN(INITIAL_MINT_AMOUNT))
      .accounts({
        payer: provider.publicKey,
        recipient: provider.publicKey,
        mint: mintPda,
        recipientTokenAccount: providerTokenAccount,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc();

    console.log("Транзакция минтинга:", tx);

    // Проверяем созданный минт
    const mintInfo = await getMint(
      provider.connection,
      mintPda,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    
    assert.equal(
      mintInfo.supply.toString(), 
      INITIAL_MINT_AMOUNT.toString(),
      "Ошибка при минтинге токенов"
    );

    // Проверяем баланс кошелька
    const tokenAccount = await getAccount(
      provider.connection,
      providerTokenAccount,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    assert.equal(
      tokenAccount.amount.toString(),
      INITIAL_MINT_AMOUNT.toString(),
      "Баланс кошелька не соответствует ожидаемому"
    );
  });

  it("Переводит VG токены с налогом 10%", async () => {
    // Находим ассоциированные токен-аккаунты
    const senderTokenAccount = await getAssociatedTokenAddress(
      mintPda,
      provider.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const recipientTokenAccount = await getAssociatedTokenAddress(
      mintPda,
      recipientWallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const daoTreasuryTokenAccount = await getAssociatedTokenAddress(
      mintPda,
      daoTreasury.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const feeCollectorTokenAccount = await getAssociatedTokenAddress(
      mintPda,
      feeCollector.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    console.log("Перевод", TRANSFER_AMOUNT, "VG токенов с налогом 10%");
    console.log("Ожидаемый налог:", expectedTaxAmount);
    console.log("Ожидаемая сумма перевода:", expectedTransferAmount);
    console.log("Ожидаемый налог для DAO:", expectedDaoTaxAmount);
    console.log("Ожидаемый налог для NFT:", expectedNftHoldersTaxAmount);

    // Выполняем перевод
    const tx = await program.methods
      .transfer(new anchor.BN(TRANSFER_AMOUNT))
      .accounts({
        sender: provider.publicKey,
        recipient: recipientWallet.publicKey,
        daoTreasury: daoTreasury.publicKey,
        feeCollector: feeCollector.publicKey,
        mint: mintPda,
        senderTokenAccount: senderTokenAccount,
        recipientTokenAccount: recipientTokenAccount,
        daoTreasuryTokenAccount: daoTreasuryTokenAccount,
        feeCollectorTokenAccount: feeCollectorTokenAccount,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc();

    console.log("Транзакция перевода:", tx);

    // Проверяем балансы всех аккаунтов
    const senderAccount = await getAccount(
      provider.connection,
      senderTokenAccount,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    const recipientAccount = await getAccount(
      provider.connection,
      recipientTokenAccount,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    const daoTreasuryAccount = await getAccount(
      provider.connection,
      daoTreasuryTokenAccount,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    const feeCollectorAccount = await getAccount(
      provider.connection,
      feeCollectorTokenAccount,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    console.log("Баланс отправителя после перевода:", senderAccount.amount.toString());
    console.log("Баланс получателя после перевода:", recipientAccount.amount.toString());
    console.log("Баланс DAO после перевода:", daoTreasuryAccount.amount.toString());
    console.log("Баланс NFT коллектора после перевода:", feeCollectorAccount.amount.toString());

    // Проверяем, что балансы соответствуют ожидаемым значениям
    assert.equal(
      recipientAccount.amount.toString(),
      expectedTransferAmount.toString(),
      "Получатель получил неверную сумму"
    );

    assert.equal(
      daoTreasuryAccount.amount.toString(),
      expectedDaoTaxAmount.toString(),
      "DAO получила неверную сумму налога"
    );

    assert.equal(
      feeCollectorAccount.amount.toString(),
      expectedNftHoldersTaxAmount.toString(),
      "NFT коллектор получил неверную сумму налога"
    );

    // Проверяем общий баланс отправителя после перевода
    const expectedSenderBalance = 
      BigInt(INITIAL_MINT_AMOUNT) - BigInt(TRANSFER_AMOUNT);

    assert.equal(
      senderAccount.amount.toString(),
      expectedSenderBalance.toString(),
      "Баланс отправителя неверный после перевода"
    );
  });

  it("Устанавливает freeze authority для DAO", async () => {
    const tx = await program.methods
      .setFreezeAuthority()
      .accounts({
        payer: provider.publicKey,
        mint: mintPda,
        daoAuthority: daoTreasury.publicKey, // Для теста используем DAO treasury как authority
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc();

    console.log("Транзакция установки freeze authority:", tx);

    // Проверяем установленный freeze authority
    const mintInfo = await getMint(
      provider.connection,
      mintPda,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    
    assert.equal(
      mintInfo.freezeAuthority?.toString(), 
      daoTreasury.publicKey.toString(),
      "Freeze authority не установлен или установлен неверно"
    );
  });

  // Интеграционный тест с имитацией NFT Fee Key
  it("Корректно распределяет налог между несколькими держателями NFT Fee Key", async () => {
    // Создаем имитацию системы NFT Fee Key с несколькими держателями
    const nftFeeKeyHolders = [
      { holder: Keypair.generate(), share: 0.4 }, // 40% доля
      { holder: Keypair.generate(), share: 0.35 }, // 35% доля
      { holder: Keypair.generate(), share: 0.25 }  // 25% доля
    ];

    // Финансируем всех держателей для создания аккаунтов
    for (const { holder } of nftFeeKeyHolders) {
      const tx = await provider.connection.requestAirdrop(
        holder.publicKey,
        0.1 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(tx);
    }

    // Создаем базовый класс для имитации системы NFT Fee Key
    class MockNftFeeKeySystem {
      constructor(
        public holders: { holder: Keypair, share: number }[],
        public mintPda: PublicKey,
        public feeCollector: PublicKey
      ) {}

      // Метод для распределения собранных комиссий держателям
      async distributeFees(connection: anchor.web3.Connection, payer: Keypair) {
        // Получаем текущий баланс коллектора комиссий
        const feeCollectorTokenAccount = await getAssociatedTokenAddress(
          this.mintPda,
          this.feeCollector,
          false,
          TOKEN_2022_PROGRAM_ID
        );

        const feeCollectorAccount = await getAccount(
          connection,
          feeCollectorTokenAccount,
          "confirmed",
          TOKEN_2022_PROGRAM_ID
        );

        const totalFees = BigInt(feeCollectorAccount.amount.toString());
        if (totalFees === BigInt(0)) {
          console.log("Нет комиссий для распределения");
          return;
        }

        console.log(`Распределение ${totalFees} токенов VG между держателями NFT`);

        // Создаем аккаунты для всех держателей, если они не существуют
        for (const { holder } of this.holders) {
          const holderTokenAccount = await getAssociatedTokenAddress(
            this.mintPda,
            holder.publicKey,
            false,
            TOKEN_2022_PROGRAM_ID
          );

          // Проверяем существует ли аккаунт
          try {
            await getAccount(connection, holderTokenAccount, "confirmed", TOKEN_2022_PROGRAM_ID);
          } catch (error) {
            // Если аккаунт не существует, создаем его
            await provider.sendTransaction(
              new anchor.web3.Transaction().add(
                createAssociatedTokenAccountInstruction(
                  payer.publicKey,
                  holderTokenAccount,
                  holder.publicKey,
                  this.mintPda,
                  TOKEN_2022_PROGRAM_ID
                )
              )
            );
          }
        }

        // Распределяем комиссии пропорционально долям
        for (const { holder, share } of this.holders) {
          const holderTokenAccount = await getAssociatedTokenAddress(
            this.mintPda,
            holder.publicKey,
            false,
            TOKEN_2022_PROGRAM_ID
          );

          const holderAmount = BigInt(Math.floor(Number(totalFees) * share));
          if (holderAmount > BigInt(0)) {
            // Переводим долю комиссий держателю
            await provider.sendTransaction(
              new anchor.web3.Transaction().add(
                createTransferCheckedInstruction(
                  feeCollectorTokenAccount,
                  this.mintPda,
                  holderTokenAccount,
                  this.feeCollector,
                  Number(holderAmount),
                  TOKEN_DECIMALS,
                  [],
                  TOKEN_2022_PROGRAM_ID
                )
              ),
              [// Требуется подпись от имени коллектора комиссий
               Keypair.fromSecretKey(feeCollector.secretKey)]
            );

            console.log(`Переведено ${holderAmount} токенов держателю с долей ${share * 100}%`);
          }
        }
      }
    }

    // Инициализируем имитацию системы NFT Fee Key
    const mockNftSystem = new MockNftFeeKeySystem(
      nftFeeKeyHolders,
      mintPda,
      feeCollector
    );

    // Выполняем несколько переводов для накопления комиссий
    const senderTokenAccount = await getAssociatedTokenAddress(
      mintPda,
      provider.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    // Общая сумма для тестовых переводов (1 миллион токенов)
    const testTransferTotal = 1_000_000 * 10**TOKEN_DECIMALS;
    
    // Выполняем 5 переводов по 200k токенов каждый
    const transfersCount = 5;
    const amountPerTransfer = testTransferTotal / transfersCount;

    for (let i = 0; i < transfersCount; i++) {
      // Создаем тестового получателя для каждого перевода
      const testRecipient = Keypair.generate();
      
      // Финансируем получателя для создания аккаунта
      const airdropTx = await provider.connection.requestAirdrop(
        testRecipient.publicKey,
        0.1 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropTx);
      
      // Создаем токен-аккаунт для получателя
      const recipientTokenAccount = await getAssociatedTokenAddress(
        mintPda,
        testRecipient.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      
      // Выполняем перевод через VG токен (с налогом 10%)
      const tx = await program.methods
        .transfer(new anchor.BN(amountPerTransfer))
        .accounts({
          sender: provider.publicKey,
          recipient: testRecipient.publicKey,
          daoTreasury: daoTreasury.publicKey,
          feeCollector: feeCollector.publicKey,
          mint: mintPda,
          senderTokenAccount: senderTokenAccount,
          recipientTokenAccount: recipientTokenAccount,
          daoTreasuryTokenAccount: await getAssociatedTokenAddress(
            mintPda,
            daoTreasury.publicKey,
            false,
            TOKEN_2022_PROGRAM_ID
          ),
          feeCollectorTokenAccount: await getAssociatedTokenAddress(
            mintPda,
            feeCollector.publicKey,
            false,
            TOKEN_2022_PROGRAM_ID
          ),
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();
      
      console.log(`Перевод #${i+1}: ${amountPerTransfer} токенов VG с налогом 10%`);
    }
    
    // Проверяем, что налог накопился в fee_collector
    const feeCollectorTokenAccount = await getAssociatedTokenAddress(
      mintPda,
      feeCollector.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    
    const feeCollectorAccountBefore = await getAccount(
      provider.connection,
      feeCollectorTokenAccount,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    
    // Ожидаемый налог: 10% от общей суммы переводов, и 50% от этого налога идет в fee_collector
    const expectedTotalTax = Math.floor(testTransferTotal * (TAX_RATE_BPS / 10000));
    const expectedFeeCollectorAmount = Math.floor(expectedTotalTax * 0.5);
    
    console.log("Собранный налог перед распределением:", feeCollectorAccountBefore.amount.toString());
    assert.equal(
      feeCollectorAccountBefore.amount.toString(),
      expectedFeeCollectorAmount.toString(),
      "Неверная сумма собранного налога"
    );
    
    // Распределяем комиссии между держателями NFT
    await mockNftSystem.distributeFees(provider.connection, provider.wallet.payer);
    
    // Проверяем, что комиссии распределены правильно
    const feeCollectorAccountAfter = await getAccount(
      provider.connection,
      feeCollectorTokenAccount,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    
    // Проверяем балансы всех держателей NFT
    let totalDistributed = BigInt(0);
    
    for (const { holder, share } of nftFeeKeyHolders) {
      const holderTokenAccount = await getAssociatedTokenAddress(
        mintPda,
        holder.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      
      const holderAccount = await getAccount(
        provider.connection,
        holderTokenAccount,
        "confirmed",
        TOKEN_2022_PROGRAM_ID
      );
      
      const expectedAmount = BigInt(Math.floor(expectedFeeCollectorAmount * share));
      console.log(`Держатель с долей ${share * 100}% получил ${holderAccount.amount} VG`);
      
      totalDistributed += BigInt(holderAccount.amount.toString());
      
      // Проверяем, что сумма соответствует доле (с небольшой погрешностью из-за округления)
      const diff = Math.abs(Number(BigInt(holderAccount.amount.toString()) - expectedAmount));
      assert(diff <= 1, `Неверная сумма распределения для держателя с долей ${share * 100}%`);
    }
    
    // Проверяем, что все комиссии были распределены (с возможной погрешностью в 1-2 единицы)
    const remainingFees = BigInt(feeCollectorAccountAfter.amount.toString());
    const totalFeesBefore = BigInt(feeCollectorAccountBefore.amount.toString());
    
    assert(
      remainingFees < BigInt(3),
      `Не все комиссии были распределены. Осталось: ${remainingFees}`
    );
    
    assert.approximately(
      Number(totalDistributed),
      Number(totalFeesBefore - remainingFees),
      2,
      "Общая сумма распределения не соответствует ожидаемой"
    );
    
    console.log("Имитация NFT Fee Key успешно протестирована");
  });
}); 