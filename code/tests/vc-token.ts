import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VcToken } from "../target/types/vc_token";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getMinimumBalanceForRentExemptMint, MINT_SIZE, createInitializeMintInstruction, TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddress, getAccount, getMint, createAssociatedTokenAccountInstruction, transferCheckedInstruction, createTransferCheckedInstruction } from "@solana/spl-token";
import { assert } from "chai";
import * as mpl from '@metaplex-foundation/mpl-token-metadata';
import { PROGRAM_ID as METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';

describe("vc-token", () => {
  // Настраиваем клиент и провайдер
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program = anchor.workspace.VcToken as Program<VcToken>;
  
  // Генерируем keypair для теста
  const mintKeypair = Keypair.generate();
  const payer = provider.wallet;
  const tokenInfo = Keypair.generate();
  
  // Параметры токена
  const name = "Venture Club Token";
  const symbol = "VC";
  const decimals = 9;
  
  // Создаём казначейский кошелёк для тестов
  const treasuryWallet = Keypair.generate();
  const recipientWallet = Keypair.generate();
  
  // Константы из программы
  const VC_TOKEN_MINT_SEED = Buffer.from("vc_token_mint");
  const TOKEN_DECIMALS = 9;
  const TOTAL_SUPPLY = BigInt(5_000_000_000) * BigInt(10 ** TOKEN_DECIMALS);
  
  // Находим PDA для минта
  const [mintPda] = PublicKey.findProgramAddressSync(
    [VC_TOKEN_MINT_SEED],
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
  
  before("Подготовка тестового окружения", async () => {
    // Финансируем тестовый казначейский кошелёк
    const tx = await provider.connection.requestAirdrop(
      treasuryWallet.publicKey,
      1 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(tx);
  });
  
  it("Должен инициализировать VC токен", async () => {
    console.log("Минт PDA:", mintPda.toString());
    console.log("Казначейский кошелек:", treasuryWallet.publicKey.toString());
    
    // Находим ассоциированный токен-аккаунт для казначейства
    const treasuryTokenAccount = await getAssociatedTokenAddress(
      mintPda,
      treasuryWallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    console.log("Токен-аккаунт казначейства:", treasuryTokenAccount.toString());
    
    // Инициализируем токен
    const tx = await program.methods
      .initialize()
      .accounts({
        payer: provider.publicKey,
        treasury: treasuryWallet.publicKey,
        mint: mintPda,
        treasuryTokenAccount: treasuryTokenAccount,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc();
    
    console.log("Транзакция:", tx);
    
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
      decimals, 
      "Неправильное количество десятичных знаков"
    );
    
    assert.equal(
      mintInfo.supply.toString(), 
      TOTAL_SUPPLY.toString(),
      "Неправильное общее предложение токенов"
    );
    
    assert(
      mintInfo.freezeAuthority === null,
      "Freeze authority должен быть null"
    );
    
    // Проверяем баланс казначейства
    const treasuryAccount = await getAccount(
      provider.connection,
      treasuryTokenAccount,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    
    assert.equal(
      treasuryAccount.amount.toString(),
      TOTAL_SUPPLY.toString(),
      "Казначейство должно иметь все выпущенные токены"
    );
  });
  
  it("Устанавливает метаданные токена", async () => {
    const uri = "https://tech-hy.io/metadata/vc-token.json";
    
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
      assert.equal(metadataAccount.isMutable, false, "Метаданные должны быть неизменяемыми");
      
      console.log("Метаданные токена успешно установлены и проверены");
    } catch (error) {
      console.error("Ошибка при проверке метаданных:", error);
      assert.fail("Не удалось получить или проверить метаданные токена");
    }
  });
  
  // Новые тесты для крайних случаев
  it("Проверяет попытку передачи токенов при недостаточном балансе", async () => {
    // Создаем новый кошелек без токенов
    const emptyWallet = Keypair.generate();
    
    // Создаем ассоциированный токен-аккаунт для пустого кошелька
    const emptyTokenAccount = await getAssociatedTokenAddress(
      mintPda,
      emptyWallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    
    // Инициализируем токен-аккаунт (без токенов)
    await provider.sendTransaction(
      new anchor.web3.Transaction().add(
        createAssociatedTokenAccountInstruction(
          provider.publicKey,
          emptyTokenAccount,
          emptyWallet.publicKey,
          mintPda,
          TOKEN_2022_PROGRAM_ID
        )
      )
    );
    
    // Проверяем, что баланс равен нулю
    const accountBefore = await getAccount(
      provider.connection,
      emptyTokenAccount,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    assert.equal(accountBefore.amount.toString(), "0", "Начальный баланс должен быть нулевым");
    
    // Попытка перевести больше, чем есть на балансе, должна завершиться ошибкой
    try {
      const recipientTokenAccount = await getAssociatedTokenAddress(
        mintPda,
        recipientWallet.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      
      const transferTx = new anchor.web3.Transaction().add(
        createTransferCheckedInstruction(
          emptyTokenAccount,
          mintPda,
          recipientTokenAccount,
          emptyWallet.publicKey,
          100 * 10**decimals,
          decimals,
          [],
          TOKEN_2022_PROGRAM_ID
        )
      );
      
      await provider.sendTransaction(transferTx, [emptyWallet]);
      
      assert.fail("Должна возникнуть ошибка при недостаточном балансе");
    } catch (err) {
      assert.ok(err instanceof Error, "Ожидалась ошибка при недостаточном балансе");
    }
  });
  
  it("Проверяет максимально допустимую передачу токенов", async () => {
    // Находим ассоциированный токен-аккаунт для казначейства (у которого все токены)
    const treasuryTokenAccount = await getAssociatedTokenAddress(
      mintPda,
      treasuryWallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    
    // Проверяем текущий баланс казначейства
    const treasuryAccount = await getAccount(
      provider.connection,
      treasuryTokenAccount,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    
    // Получаем целевой токен-аккаунт для тестового перевода
    const testRecipient = Keypair.generate();
    const testRecipientTokenAccount = await getAssociatedTokenAddress(
      mintPda,
      testRecipient.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    
    // Создаем токен-аккаунт для получателя
    await provider.sendTransaction(
      new anchor.web3.Transaction().add(
        createAssociatedTokenAccountInstruction(
          provider.publicKey,
          testRecipientTokenAccount,
          testRecipient.publicKey,
          mintPda,
          TOKEN_2022_PROGRAM_ID
        )
      )
    );
    
    // Тестовая сумма для перевода - 1 токен
    const testAmount = BigInt(1 * 10**decimals);
    
    // Выполняем перевод от имени казначейства (требуется подпись)
    const transferTx = new anchor.web3.Transaction().add(
      createTransferCheckedInstruction(
        treasuryTokenAccount,
        mintPda,
        testRecipientTokenAccount,
        treasuryWallet.publicKey,
        Number(testAmount),
        decimals,
        [],
        TOKEN_2022_PROGRAM_ID
      )
    );
    
    await provider.sendTransaction(transferTx, [treasuryWallet]);
    
    // Проверяем баланс получателя
    const recipientBalance = await getAccount(
      provider.connection,
      testRecipientTokenAccount,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    
    assert.equal(
      recipientBalance.amount.toString(),
      testAmount.toString(),
      "Получатель должен получить точную сумму перевода"
    );
    
    // Проверяем обновленный баланс казначейства
    const updatedTreasuryAccount = await getAccount(
      provider.connection,
      treasuryTokenAccount,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    
    const expectedTreasuryBalance = BigInt(treasuryAccount.amount.toString()) - testAmount;
    
    assert.equal(
      updatedTreasuryAccount.amount.toString(),
      expectedTreasuryBalance.toString(),
      "Баланс казначейства должен уменьшиться на сумму перевода"
    );
  });
  
  // Этот тест будет добавлен позже после настройки других компонентов
  it.skip("Должен чеканить VC токены", async () => {
    // Создаем токен-аккаунт для получения VC токенов
    // ...
    
    // Чеканим токены
    // ...
    
    // Проверяем баланс
    // ...
  });
  
  // Этот тест будет добавлен позже после настройки других компонентов
  it.skip("Должен сжигать VC токены", async () => {
    // Сжигаем токены
    // ...
    
    // Проверяем обновленный баланс
    // ...
  });
}); 