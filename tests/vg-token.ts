import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VgToken } from "../target/types/vg_token";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, getAccount, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { expect } from "chai";

describe("vg-token", () => {
  // Настройка провайдера Anchor
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Получаем программу из IDL
  const program = anchor.workspace.VgToken as Program<VgToken>;

  // Ключевая пара для тестов
  const authority = Keypair.generate();
  
  // Минт токена, хаб-аккаунт и конфигурация налога
  let mint: PublicKey;
  let hubAccount: PublicKey;
  let taxConfig: PublicKey;
  
  // Казна DAO и пул стейкинга
  const daoTreasury = Keypair.generate().publicKey;
  const stakingPool = Keypair.generate().publicKey;
  
  // Программа-хук для налога (в реальной реализации здесь был бы адрес transfer-hook программы)
  const transferHookProgram = Keypair.generate().publicKey;

  // Подготовка к тестам
  before(async () => {
    // Отправляем SOL на тестовый аккаунт для оплаты транзакций
    const airdropSignature = await provider.connection.requestAirdrop(
      authority.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSignature);
    
    // Создаем seed для PDA tax config
    const [taxConfigPda] = await PublicKey.findProgramAddressSync(
      [Buffer.from("tax_config"), authority.publicKey.toBuffer()],
      program.programId
    );
    taxConfig = taxConfigPda;
  });

  it("Initializes the token mint and tax config", async () => {
    // Создаем минт (в реальности здесь был бы mint_extra с расширением Transfer Hook)
    const mintKeypair = Keypair.generate();
    mint = mintKeypair.publicKey;

    // Создаем хаб-аккаунт для хранения полной эмиссии
    const hubAccountInfo = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      authority,
      mint,
      authority.publicKey
    );
    hubAccount = hubAccountInfo.address;

    // Вызываем первый шаг инициализации - создаем минт и конфигурацию налога
    await program.methods.initializeMint()
      .accounts({
        authority: authority.publicKey,
        mint,
        taxConfig,
        daoTreasury,
        stakingPool,
        transferHookProgram,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([authority, mintKeypair])
      .rpc();

    // Проверяем конфигурацию налога
    const taxConfigAccount = await program.account.taxConfig.fetch(taxConfig);
    expect(taxConfigAccount.daoTreasury.toString()).to.equal(daoTreasury.toString());
    expect(taxConfigAccount.stakingPool.toString()).to.equal(stakingPool.toString());
    expect(taxConfigAccount.taxRateBps).to.equal(1000); // 10%
    expect(taxConfigAccount.daoShareBps).to.equal(5000); // 50%
    expect(taxConfigAccount.stakingShareBps).to.equal(5000); // 50%
  });

  it("Finalizes the token with hook configuration", async () => {
    // В реальной реализации здесь была бы проверка расширения Transfer Hook
    // и настройка extra_account_metas
    
    // Вызываем второй шаг инициализации - финализируем токен и создаем эмиссию
    await program.methods.finalizeToken()
      .accounts({
        authority: authority.publicKey,
        mint,
        hubAccount,
        taxConfig,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([authority])
      .rpc();
    
    // В реальной реализации здесь была бы проверка баланса hub-аккаунта
    // и попытка перевести токены с проверкой работы налога
  });
}); 