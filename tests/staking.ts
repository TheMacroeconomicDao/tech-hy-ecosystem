import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Staking } from "../target/types/staking";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, mintTo, getAccount, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { expect } from "chai";

describe("staking", () => {
  // Настройка провайдера Anchor
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Получаем программу из IDL
  const program = anchor.workspace.Staking as Program<Staking>;

  // Ключевые пары для тестов
  const authority = Keypair.generate();
  const user = Keypair.generate();
  
  // Минт VG токена и связанные аккаунты
  let vgMint: PublicKey;
  let authorityVgAccount: PublicKey;
  let userVgAccount: PublicKey;
  let rewardsVault: PublicKey;
  let stakingVault: PublicKey;
  
  // Конфигурация стейкинга и аккаунт стейкинга пользователя
  let stakingConfig: PublicKey;
  let stakingAccount: PublicKey;

  // Сумма для тестирования стейкинга
  const stakeAmount = 500 * LAMPORTS_PER_SOL; // 500 VG

  // Подготовка к тестам
  before(async () => {
    // Отправляем SOL на тестовые аккаунты для оплаты транзакций
    const airdropSignature1 = await provider.connection.requestAirdrop(
      authority.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSignature1);
    
    const airdropSignature2 = await provider.connection.requestAirdrop(
      user.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSignature2);
    
    // Создаем минт VG токена
    vgMint = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      9
    );
    
    // Создаем аккаунт authority для VG токенов
    const authorityVgAccountInfo = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      authority,
      vgMint,
      authority.publicKey
    );
    authorityVgAccount = authorityVgAccountInfo.address;
    
    // Создаем аккаунт пользователя для VG токенов
    const userVgAccountInfo = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      user,
      vgMint,
      user.publicKey
    );
    userVgAccount = userVgAccountInfo.address;
    
    // Минтим некоторое количество токенов пользователю для тестов
    await mintTo(
      provider.connection,
      authority,
      vgMint,
      userVgAccount,
      authority.publicKey,
      stakeAmount * 2n
    );
    
    // Создаем аккаунт для хранилища наград
    const rewardsVaultKeypair = Keypair.generate();
    rewardsVault = rewardsVaultKeypair.publicKey;
    
    // Создаем аккаунт для хранилища стейков
    const stakingVaultKeypair = Keypair.generate();
    stakingVault = stakingVaultKeypair.publicKey;
    
    // Находим PDA для аккаунта стейкинга пользователя
    const [stakingAccountPda] = await PublicKey.findProgramAddressSync(
      [
        Buffer.from("staking"),
        user.publicKey.toBuffer(),
        stakingConfig.toBuffer()
      ],
      program.programId
    );
    stakingAccount = stakingAccountPda;
  });
  
  it("Initializes the staking configuration", async () => {
    // Создаем keypair для конфигурации стейкинга
    const stakingConfigKeypair = Keypair.generate();
    stakingConfig = stakingConfigKeypair.publicKey;
    
    // Инициализируем конфигурацию стейкинга
    await program.methods.initializeConfig()
      .accounts({
        authority: authority.publicKey,
        stakingConfig,
        vgMint,
        rewardsVault,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([authority, stakingConfigKeypair])
      .rpc();
    
    // Проверяем, что конфигурация создана корректно
    const configAccount = await program.account.stakingConfig.fetch(stakingConfig);
    expect(configAccount.authority.toString()).to.equal(authority.publicKey.toString());
    expect(configAccount.vgMint.toString()).to.equal(vgMint.toString());
    expect(configAccount.rewardsVault.toString()).to.equal(rewardsVault.toString());
    expect(configAccount.stakersCount).to.equal(0);
    expect(configAccount.totalStaked).to.equal(0);
    expect(configAccount.rewardRate).to.equal(500); // 5% годовых
  });
  
  it("Stakes tokens", async () => {
    // Стейкаем токены
    await program.methods.stake(new anchor.BN(stakeAmount))
      .accounts({
        owner: user.publicKey,
        stakingAccount,
        stakingConfig,
        ownerTokenAccount: userVgAccount,
        stakingVault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([user])
      .rpc();
    
    // Проверяем, что аккаунт стейкинга создан корректно
    const stakeAccount = await program.account.stakingAccount.fetch(stakingAccount);
    expect(stakeAccount.owner.toString()).to.equal(user.publicKey.toString());
    expect(stakeAccount.amount.toString()).to.equal(stakeAmount.toString());
    expect(stakeAccount.level).to.equal(2); // Level 2 для 500 VG
    
    // Проверяем, что статистика стейкинга обновлена
    const configAccount = await program.account.stakingConfig.fetch(stakingConfig);
    expect(configAccount.stakersCount).to.equal(1);
    expect(configAccount.totalStaked.toString()).to.equal(stakeAmount.toString());
  });
}); 