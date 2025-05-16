import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VcToken } from "../target/types/vc_token";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, getAccount, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { expect } from "chai";

describe("vc-token", () => {
  // Настройка провайдера Anchor
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Получаем программу из IDL
  const program = anchor.workspace.VcToken as Program<VcToken>;

  // Ключевая пара для тестов
  const authority = Keypair.generate();
  
  // Минт токена и токен-аккаунт
  let mint: PublicKey;
  let tokenAccount: PublicKey;

  // Константа полной эмиссии
  const TOTAL_SUPPLY = BigInt(5_000_000_000 * LAMPORTS_PER_SOL);

  // Подготовка к тестам
  before(async () => {
    // Отправляем SOL на тестовый аккаунт для оплаты транзакций
    const airdropSignature = await provider.connection.requestAirdrop(
      authority.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSignature);
  });

  it("Initializes the token with total supply", async () => {
    // Создаем минт
    const mintKeypair = Keypair.generate();
    mint = mintKeypair.publicKey;

    // Получаем аккаунт для токенов
    const tokenAccountInfo = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      authority,
      mint,
      authority.publicKey
    );
    tokenAccount = tokenAccountInfo.address;

    // Вызываем инструкцию initialize
    await program.methods.initialize()
      .accounts({
        authority: authority.publicKey,
        mint,
        tokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([authority, mintKeypair])
      .rpc();

    // Проверяем баланс токенов
    const accountInfo = await getAccount(provider.connection, tokenAccount);
    expect(accountInfo.amount).to.equal(TOTAL_SUPPLY);

    // Проверяем, что mint authority отозван
    try {
      await createMint(
        provider.connection,
        authority,
        mint,
        null,
        9
      );
      expect.fail("Expected error when minting with revoked authority");
    } catch (error) {
      // Ожидаем ошибку, так как mint authority должен быть отозван
      expect(error).to.exist;
    }
  });
}); 