import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VcToken } from "../target/types/vc_token";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getMinimumBalanceForRentExemptMint, MINT_SIZE, createInitializeMintInstruction } from "@solana/spl-token";
import { assert } from "chai";

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
  const name = "TECH-HY VC Token";
  const symbol = "VC";
  const decimals = 9;
  
  // Адрес получателя токенов
  const recipient = Keypair.generate();
  
  it("Должен инициализировать VC токен", async () => {
    // Создаем минт токена
    const lamports = await getMinimumBalanceForRentExemptMint(provider.connection);
    const createMintAccountInstruction = SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    });
    
    const initializeMintInstruction = createInitializeMintInstruction(
      mintKeypair.publicKey,
      decimals,
      payer.publicKey,
      payer.publicKey
    );
    
    await provider.sendAndConfirm(
      new anchor.web3.Transaction()
        .add(createMintAccountInstruction)
        .add(initializeMintInstruction),
      [mintKeypair]
    );
    
    // Инициализируем VC токен
    await program.methods
      .initialize(name, symbol, decimals)
      .accounts({
        tokenInfo: tokenInfo.publicKey,
        mint: mintKeypair.publicKey,
        authority: payer.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([tokenInfo])
      .rpc();
    
    // Проверяем, что токен инициализирован
    const tokenInfoAccount = await program.account.tokenInfo.fetch(tokenInfo.publicKey);
    assert.equal(tokenInfoAccount.name, name);
    assert.equal(tokenInfoAccount.symbol, symbol);
    assert.equal(tokenInfoAccount.decimals, decimals);
    assert.ok(tokenInfoAccount.mint.equals(mintKeypair.publicKey));
    assert.ok(tokenInfoAccount.authority.equals(payer.publicKey));
    assert.equal(tokenInfoAccount.totalSupply.toNumber(), 0);
    
    console.log("VC токен успешно инициализирован");
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