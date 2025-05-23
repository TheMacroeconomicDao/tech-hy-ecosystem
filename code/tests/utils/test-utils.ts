import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, Keypair, Connection, LAMPORTS_PER_SOL, TransactionInstruction, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createMint, createAssociatedTokenAccount, mintTo, getAccount, getAssociatedTokenAddress, getMint } from '@solana/spl-token';
import { BN } from 'bn.js';

// Конфигурация для тестов
export const TEST_CONFIG = {
  vcTokenMintSeed: Buffer.from("vc_token_mint"),
  vgTokenMintSeed: Buffer.from("vg_token_mint"),
  burnAndEarnStateSeed: Buffer.from("burn_and_earn_state"),
  tokenDecimals: 9,
  vcTotalSupply: new BN(5_000_000_000).mul(new BN(10).pow(new BN(9))), // 5 миллиардов с 9 десятичными знаками
};

// Функция для создания тестовой среды
export async function setupTestEnvironment(provider: anchor.Provider): Promise<{
  vcTokenProgramId: PublicKey;
  vgTokenProgramId: PublicKey;
  burnAndEarnProgramId: PublicKey;
}> {
  // ID програм из конфигурации Anchor (в рабочем окружении должны быть реальные ID)
  const vcTokenProgramId = new PublicKey("VCzfGwp5qVL8pmta1GHqGrSQqzMa5qsY4M1jbjsdaYJ");
  const vgTokenProgramId = new PublicKey("VGnHJHKr2NwxSdQQoYrJY9TBZ9YHS5cCwBPEr68mEPG");
  const burnAndEarnProgramId = new PublicKey("BAEpWRJiqZrZkmyzGbcBAvQYpRKbRq5L3D5WwA1dvYf5");
  
  return {
    vcTokenProgramId,
    vgTokenProgramId,
    burnAndEarnProgramId,
  };
}

// Функция для получения PDA аккаунта mint VC токена
export async function findVcTokenMintAddress(programId: PublicKey): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync(
    [TEST_CONFIG.vcTokenMintSeed],
    programId
  );
}

// Функция для получения PDA аккаунта mint VG токена
export async function findVgTokenMintAddress(programId: PublicKey): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync(
    [TEST_CONFIG.vgTokenMintSeed],
    programId
  );
}

// Функция для получения PDA аккаунта BurnAndEarnState
export async function findBurnAndEarnStateAddress(programId: PublicKey): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync(
    [TEST_CONFIG.burnAndEarnStateSeed],
    programId
  );
}

// Функция для создания тестового кошелька и пополнения его SOL
export async function createFundedWallet(connection: Connection, lamports = LAMPORTS_PER_SOL): Promise<Keypair> {
  const wallet = Keypair.generate();
  const signature = await connection.requestAirdrop(wallet.publicKey, lamports);
  await connection.confirmTransaction(signature, 'confirmed');
  return wallet;
}

// Функция для выполнения транзакций
export async function executeTransaction(
  connection: Connection, 
  instructions: TransactionInstruction[],
  signers: Keypair[]
): Promise<string> {
  const transaction = new Transaction().add(...instructions);
  transaction.feePayer = signers[0].publicKey;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  
  transaction.sign(...signers);
  
  const signature = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(signature);
  
  return signature;
}

// Функция для получения баланса токена
export async function getTokenBalance(connection: Connection, tokenAccount: PublicKey): Promise<number> {
  const accountInfo = await connection.getTokenAccountBalance(tokenAccount);
  return Number(accountInfo.value.amount);
}

// Функция для создания тестовой LP позиции (имитация Raydium)
export async function createMockLpPosition(
  connection: Connection, 
  payer: Keypair,
  amount: BN
): Promise<{ mint: PublicKey, tokenAccount: PublicKey }> {
  // Создаем минт для имитации LP токена
  const mintKeypair = Keypair.generate();
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,
    null,
    TEST_CONFIG.tokenDecimals,
    mintKeypair
  );
  
  // Создаем аккаунт и минтим LP токены
  const tokenAccount = await createAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey
  );
  
  await mintTo(
    connection,
    payer,
    mint,
    tokenAccount,
    payer,
    BigInt(amount.toString())
  );
  
  return { mint, tokenAccount };
}

// Вспомогательная функция для логирования
export function logInfo(message: string, data?: any): void {
  console.log(`\x1b[36mINFO:\x1b[0m ${message}`);
  if (data) {
    console.dir(data, { depth: 5 });
  }
}

// Вспомогательная функция для логирования ошибок
export function logError(message: string, error?: any): void {
  console.error(`\x1b[31mERROR:\x1b[0m ${message}`);
  if (error) {
    console.error(error);
  }
}

/**
 * Создание нового минта SPL токена
 * @param connection - соединение с Solana
 * @param payer - плательщик комиссии
 * @param mintAuthority - адрес с правом минта токенов
 * @param decimals - количество десятичных знаков токена
 * @returns Адрес созданного минта
 */
export async function createTestMint(
  connection: Connection,
  payer: Keypair,
  mintAuthority: PublicKey,
  decimals = 9
): Promise<PublicKey> {
  return createMint(
    connection,
    payer,
    mintAuthority,
    mintAuthority, // freeze authority
    decimals,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  );
}

/**
 * Создание ассоциированного токен-аккаунта и минт токенов на него
 * @param connection - соединение с Solana
 * @param mint - адрес минта токена
 * @param owner - владелец токен-аккаунта
 * @param authority - адрес с правом минта
 * @param amount - количество токенов
 * @returns Адрес созданного токен-аккаунта
 */
export async function createTokenAccount(
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey,
  authority: Keypair,
  amount?: number
): Promise<PublicKey> {
  const tokenAccount = await createAssociatedTokenAccount(
    connection,
    authority,
    mint,
    owner,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  );
  
  if (amount) {
    await mintTo(
      connection,
      authority,
      mint,
      tokenAccount,
      authority,
      amount,
      [],
      undefined,
      TOKEN_PROGRAM_ID
    );
  }
  
  return tokenAccount;
}

/**
 * Ожидание определенного количества подтверждений транзакции
 * @param connection - соединение с Solana
 * @param txHash - хэш транзакции
 * @param confirmations - требуемое количество подтверждений
 * @returns Хэш подтвержденной транзакции
 */
export async function confirmTx(
  connection: Connection,
  txHash: string,
  confirmations = 1
): Promise<string> {
  const result = await connection.confirmTransaction({
    signature: txHash,
    lastValidBlockHeight: await connection.getBlockHeight(),
    blockhash: (await connection.getLatestBlockhash()).blockhash
  }, 'confirmed');
  
  return txHash;
}

/**
 * Ожидание указанного количества миллисекунд
 * @param ms - время в миллисекундах
 * @returns Promise, который разрешается через указанное время
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Генерирует PDA адрес с бампом
 * @param seeds - массив seed-ов для PDA
 * @param programId - ID программы
 * @returns [адрес PDA, бамп]
 */
export function findProgramAddress(
  seeds: (Buffer | Uint8Array)[],
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(seeds, programId);
}

/**
 * Загрузить данные аккаунта в указанный тип
 * @param connection - соединение с Solana
 * @param address - адрес аккаунта
 * @param program - программа Anchor
 * @param accountType - название типа аккаунта в IDL
 * @returns Данные аккаунта в указанном типе
 */
export async function loadAccountData(
  connection: Connection,
  address: PublicKey,
  program: Program,
  accountType: string
): Promise<any> {
  const accountInfo = await connection.getAccountInfo(address);
  if (!accountInfo) {
    throw new Error(`Аккаунт ${address.toString()} не найден`);
  }
  
  return program.coder.accounts.decode(accountType, accountInfo.data);
}