#!/bin/bash

# Скрипт настройки среды разработки для проекта TECH-HY-SMARTS
# Этап 1: Подготовительный этап
# Задача 1.1: Настройка среды разработки

echo "Начинаем настройку среды разработки для проекта TECH-HY-SMARTS..."

# Определение минимальных требуемых версий
MIN_RUST_VERSION="1.75.0"
MIN_SOLANA_VERSION="1.18.0"
MIN_ANCHOR_VERSION="0.29.0"

# Определение путей проекта
PROJECT_ROOT="/Users/Gyber/ACTUAL-CODE/TECH-HY-SMARTS"
CODE_DIR="$PROJECT_ROOT/code"
PROGRAMS_DIR="$CODE_DIR/programs"
SCRIPTS_DIR="$CODE_DIR/scripts"
TESTS_DIR="$CODE_DIR/tests"

# Проверка наличия инструментов
check_installed() {
  if command -v $1 &> /dev/null; then
    echo "✅ $1 установлен"
    return 0
  else
    echo "❌ $1 не установлен"
    return 1
  fi
}

# Сравнение версий (возвращает 0 если версия1 >= версия2)
version_ge() {
  [ "$1" = "$(echo -e "$1\n$2" | sort -V | tail -n1)" ]
}

# Получение текущей версии Rust
get_rust_version() {
  if check_installed rustc; then
    RUST_VERSION=$(rustc --version | cut -d " " -f 2)
    echo "Текущая версия Rust: $RUST_VERSION"
    # Проверяем, не ночная ли это версия
    if [[ $RUST_VERSION == *"nightly"* ]]; then
      echo "⚠️ У вас установлена ночная (nightly) версия Rust. Рекомендуется использовать стабильную версию."
      RUST_STABLE=false
    else
      RUST_STABLE=true
      # Проверяем версию
      if version_ge "$RUST_VERSION" "$MIN_RUST_VERSION"; then
        echo "✅ Версия Rust соответствует требованиям (>= $MIN_RUST_VERSION)"
        return 0
      else
        echo "⚠️ Версия Rust ($RUST_VERSION) ниже требуемой ($MIN_RUST_VERSION)"
        return 1
      fi
    fi
  fi
  return 1
}

# Получение текущей версии Solana
get_solana_version() {
  if check_installed solana; then
    SOLANA_VERSION=$(solana --version | head -n 1 | cut -d " " -f 2)
    echo "Текущая версия Solana CLI: $SOLANA_VERSION"
    # Проверяем версию
    if version_ge "$SOLANA_VERSION" "$MIN_SOLANA_VERSION"; then
      echo "✅ Версия Solana соответствует требованиям (>= $MIN_SOLANA_VERSION)"
      return 0
    else
      echo "⚠️ Версия Solana ($SOLANA_VERSION) ниже требуемой ($MIN_SOLANA_VERSION)"
      return 1
    fi
  fi
  return 1
}

# Получение текущей версии Anchor
get_anchor_version() {
  if check_installed anchor; then
    ANCHOR_VERSION=$(anchor --version | cut -d " " -f 2)
    echo "Текущая версия Anchor: $ANCHOR_VERSION"
    # Проверяем версию
    if version_ge "$ANCHOR_VERSION" "$MIN_ANCHOR_VERSION"; then
      echo "✅ Версия Anchor соответствует требованиям (>= $MIN_ANCHOR_VERSION)"
      return 0
    else
      echo "⚠️ Версия Anchor ($ANCHOR_VERSION) ниже требуемой ($MIN_ANCHOR_VERSION)"
      return 1
    fi
  fi
  return 1
}

# Создание структуры проекта
setup_project_structure() {
  echo "Создаем структуру проекта..."
  
  # Основные директории уже созданы, проверяем и создаем дополнительные
  mkdir -p "$CODE_DIR/target/deploy"
  mkdir -p "$CODE_DIR/tests/unit"
  mkdir -p "$CODE_DIR/tests/integration"
  mkdir -p "$CODE_DIR/app/frontend"
  mkdir -p "$CODE_DIR/app/sdk"
  mkdir -p "$CODE_DIR/logs"
  
  echo "✅ Структура проекта создана"
}

# Подзадача 1.1.1: Установка и обновление Solana CLI и Rust
install_rust_and_solana() {
  echo "Подзадача 1.1.1: Установка/обновление Solana CLI и Rust"
  
  # Проверяем и устанавливаем/обновляем Rust
  if check_installed rustc; then
    echo "Обновляем Rust..."
    # Проверяем стабильность версии
    if ! $RUST_STABLE; then
      echo "Переключаемся на стабильную версию Rust..."
      rustup default stable
    fi
    # Обновляем Rust
    rustup update stable
    rustup component add rustfmt clippy
  else
    echo "Устанавливаем Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
    source $HOME/.cargo/env
    rustup component add rustfmt clippy
  fi
  
  # Проверяем и устанавливаем Solana CLI
  if ! check_installed solana || ! get_solana_version; then
    echo "Устанавливаем/обновляем Solana CLI..."
    # Используем актуальный скрипт установки Solana от Anza
    for i in {1..3}; do
      echo "Попытка $i/3..."
      if sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"; then
        echo "✅ Solana CLI успешно установлен"
        break
      else
        echo "⚠️ Ошибка при установке Solana CLI, пробуем еще раз..."
        sleep 5
      fi
      
      if [ $i -eq 3 ]; then
        echo "❌ Не удалось установить Solana CLI автоматически"
        echo "Пожалуйста, установите Solana CLI вручную: https://docs.solana.com/cli/install-solana-cli-tools"
      fi
    done
    
    # Добавляем Solana в PATH
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
    echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.zprofile
    source ~/.zprofile
  else
    echo "Обновляем Solana CLI..."
    sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
  fi
  
  # Проверяем версии
  echo "Проверяем версии инструментов..."
  get_rust_version
  get_solana_version
  
  echo "✅ Rust и Solana CLI проверены/установлены"
}

# Подзадача 1.1.2: Настройка Anchor фреймворка
setup_anchor() {
  echo "Подзадача 1.1.2: Настройка Anchor фреймворка"
  
  # Проверяем и устанавливаем Anchor с AVM
  if ! check_installed anchor || ! get_anchor_version; then
    echo "Устанавливаем Anchor..."
    
    # Сначала устанавливаем AVM (Anchor Version Manager)
    for i in {1..3}; do
      echo "Установка AVM - попытка $i/3..."
      if cargo install --git https://github.com/coral-xyz/anchor avm --locked --force; then
        echo "✅ AVM успешно установлен"
        break
      else
        echo "⚠️ Ошибка при установке AVM, пробуем еще раз..."
        sleep 5
      fi
      
      if [ $i -eq 3 ]; then
        echo "❌ Не удалось установить AVM автоматически"
        echo "Пожалуйста, установите Anchor вручную: https://www.anchor-lang.com/docs/installation"
        return 1
      fi
    done
    
    # Затем устанавливаем стабильную версию Anchor через AVM
    echo "Установка Anchor через AVM..."
    avm install 0.29.0
    avm use 0.29.0
    
    if ! check_installed anchor; then
      echo "❌ Не удалось установить Anchor через AVM"
      echo "Пожалуйста, установите Anchor вручную: https://www.anchor-lang.com/docs/installation"
      return 1
    fi
  else
    echo "Обновляем Anchor..."
    avm install 0.29.0
    avm use 0.29.0
  fi
  
  # Проверяем версию Anchor
  get_anchor_version
  
  echo "✅ Anchor фреймворк настроен"
}

# Подзадача 1.1.3: Настройка тестового окружения
setup_test_environment() {
  echo "Подзадача 1.1.3: Настройка тестового окружения"
  
  # Переходим в директорию кода
  cd "$CODE_DIR"
  
  # Создаем конфигурацию для тестового окружения
  echo "Настраиваем конфигурацию для тестовой сети..."
  solana config set --url localhost
  
  # Создаем новый кошелек для разработки если не существует
  if [ ! -f ~/.config/solana/id.json ]; then
    echo "Создаем новый кошелек для разработки..."
    solana-keygen new --no-bip39-passphrase
  fi
  
  # Создаем директорию для ключей
  mkdir -p "$CODE_DIR/target/deploy"
  
  # Генерируем keypair для программ
  echo "Генерируем keypair для программ..."
  solana-keygen new -o "$CODE_DIR/target/deploy/vc_token-keypair.json" --no-bip39-passphrase
  solana-keygen new -o "$CODE_DIR/target/deploy/vg_token-keypair.json" --no-bip39-passphrase
  solana-keygen new -o "$CODE_DIR/target/deploy/burn_and_earn-keypair.json" --no-bip39-passphrase
  solana-keygen new -o "$CODE_DIR/target/deploy/vc_staking-keypair.json" --no-bip39-passphrase
  solana-keygen new -o "$CODE_DIR/target/deploy/vg_staking-keypair.json" --no-bip39-passphrase
  solana-keygen new -o "$CODE_DIR/target/deploy/nft_fee_key-keypair.json" --no-bip39-passphrase
  solana-keygen new -o "$CODE_DIR/target/deploy/governance-keypair.json" --no-bip39-passphrase
  solana-keygen new -o "$CODE_DIR/target/deploy/nft_investors_hand-keypair.json" --no-bip39-passphrase
  
  echo "✅ Тестовое окружение настроено"
}

# Установка дополнительных зависимостей для разработки
install_additional_dependencies() {
  echo "Установка дополнительных зависимостей для разработки..."
  
  # Переходим в директорию кода
  cd "$CODE_DIR"
  
  # Создаем package.json если не существует
  if [ ! -f "$CODE_DIR/package.json" ]; then
    echo "Создаем package.json..."
    cat > "$CODE_DIR/package.json" << EOL
{
  "name": "tech-hy-contracts",
  "version": "0.1.0",
  "description": "Smart contracts for TECH-HY ecosystem on Solana",
  "engines": {
    "node": ">=16"
  },
  "scripts": {
    "test": "pnpm exec ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts",
    "build": "anchor build",
    "deploy": "anchor deploy",
    "start-validator": "solana-test-validator",
    "lint": "eslint . --ext .ts"
  },
  "author": "TECH-HY Team",
  "license": "MIT",
  "private": true,
  "packageManager": "pnpm@8.7.0"
}
EOL
  fi
  
  # Установка пакетов с использованием pnpm и повторными попытками при ошибке
  install_pnpm_packages() {
    local packages="$1"
    local dev_flag="$2"
    
    for i in {1..3}; do
      echo "Попытка $i/3..."
      if [ "$dev_flag" = "--save-dev" ]; then
        if pnpm add -Dw $packages; then
          return 0
        fi
      else
        if pnpm add -w $packages; then
          return 0
        fi
      fi
      echo "⚠️ Ошибка при установке пакетов, пробуем еще раз..."
      sleep 2
    done
    
    echo "❌ Не удалось установить пакеты автоматически"
    return 1
  }
  
  # Создаем pnpm-workspace.yaml если не существует
  if [ ! -f "$CODE_DIR/pnpm-workspace.yaml" ]; then
    echo "Создаем pnpm-workspace.yaml..."
    cat > "$CODE_DIR/pnpm-workspace.yaml" << EOL
packages:
  - 'app/**'
  - 'tests/**'
EOL
  fi

  # Инициализируем pnpm
  echo "Инициализируем pnpm..."
  cd "$CODE_DIR"
  pnpm install

  # Установка TypeScript
  echo "Устанавливаем TypeScript и утилиты..."
  install_pnpm_packages "typescript ts-node @types/node" "--save-dev"
  
  # Установка библиотек для Solana
  echo "Устанавливаем библиотеки для Solana..."
  install_pnpm_packages "@solana/web3.js @solana/spl-token @metaplex-foundation/mpl-token-metadata"
  
  # Установка зависимостей для тестов
  echo "Устанавливаем зависимости для тестов..."
  install_pnpm_packages "mocha chai @coral-xyz/anchor" "--save-dev"
  
  # Создаем tsconfig.json
  echo "Создаем tsconfig.json..."
  cat > "$CODE_DIR/tsconfig.json" << EOL
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "declaration": true,
    "resolveJsonModule": true
  },
  "include": ["./tests", "./app"],
  "exclude": ["node_modules"]
}
EOL
  
  echo "✅ Дополнительные зависимости установлены"
}

# Создание Anchor.toml с настройками проекта
create_anchor_config() {
  echo "Создание конфигурации Anchor..."
  
  cd "$CODE_DIR"
  
  cat > Anchor.toml << EOL
[features]
seeds = false
skip-lint = false

[programs.localnet]
vc_token = "$(solana-keygen pubkey $CODE_DIR/target/deploy/vc_token-keypair.json)"
vg_token = "$(solana-keygen pubkey $CODE_DIR/target/deploy/vg_token-keypair.json)"
burn_and_earn = "$(solana-keygen pubkey $CODE_DIR/target/deploy/burn_and_earn-keypair.json)"
vc_staking = "$(solana-keygen pubkey $CODE_DIR/target/deploy/vc_staking-keypair.json)"
vg_staking = "$(solana-keygen pubkey $CODE_DIR/target/deploy/vg_staking-keypair.json)"
nft_fee_key = "$(solana-keygen pubkey $CODE_DIR/target/deploy/nft_fee_key-keypair.json)"
governance = "$(solana-keygen pubkey $CODE_DIR/target/deploy/governance-keypair.json)"
nft_investors_hand = "$(solana-keygen pubkey $CODE_DIR/target/deploy/nft_investors_hand-keypair.json)"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "Localnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "pnpm exec ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"

[workspace]
members = [
  "programs/vc-token",
  "programs/vg-token",
  "programs/burn-and-earn",
  "programs/vc-staking",
  "programs/vg-staking",
  "programs/nft-fee-key",
  "programs/governance",
  "programs/nft-investors-hand"
]

[test.validator]
url = "https://api.devnet.solana.com"

[test]
startup_wait = 5000
EOL

  echo "✅ Конфигурация Anchor создана"
}

# Копирование существующих программ в новую структуру
copy_existing_programs() {
  echo "Копирование существующих программ..."
  
  # Копируем VC токен если он существует
  if [ -f "$PROJECT_ROOT/tech-hy-contracts/programs/vc-token/Cargo.toml" ]; then
    echo "Копируем программу VC токена..."
    cp -r "$PROJECT_ROOT/tech-hy-contracts/programs/vc-token/src" "$PROGRAMS_DIR/vc-token/"
    cp "$PROJECT_ROOT/tech-hy-contracts/programs/vc-token/Cargo.toml" "$PROGRAMS_DIR/vc-token/"
  else
    # Создаем базовую структуру для VC токена
    echo "Создаем структуру для VC токена..."
    mkdir -p "$PROGRAMS_DIR/vc-token/src"
    
    # Создаем Cargo.toml для VC токена
    cat > "$PROGRAMS_DIR/vc-token/Cargo.toml" << EOL
[package]
name = "vc-token"
version = "0.1.0"
description = "VC Token implementation for TECH-HY ecosystem"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "vc_token"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
anchor-lang = "0.29.0"
anchor-spl = "0.29.0"
solana-program = "1.18.1"
EOL
  fi
  
  # Копируем тесты если они существуют
  if [ -f "$PROJECT_ROOT/tech-hy-contracts/tests/vc-token.ts" ]; then
    echo "Копируем тесты VC токена..."
    mkdir -p "$TESTS_DIR"
    cp "$PROJECT_ROOT/tech-hy-contracts/tests/vc-token.ts" "$TESTS_DIR/"
  fi
  
  echo "✅ Программы успешно скопированы/созданы"
}

# Создание файла lib.rs для VC токена если он не существует
create_vc_token_lib() {
  if [ ! -f "$PROGRAMS_DIR/vc-token/src/lib.rs" ]; then
    echo "Создаем базовый файл lib.rs для VC токена..."
    
    cat > "$PROGRAMS_DIR/vc-token/src/lib.rs" << EOL
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use anchor_lang::solana_program::program_option::COption;

declare_id!("11111111111111111111111111111111"); // Будет заменено на реальный программный ID

#[program]
pub mod vc_token {
    use super::*;

    // Инициализация нового VC токена
    pub fn initialize(
        ctx: Context<Initialize>,
        name: String,
        symbol: String,
        decimals: u8,
    ) -> Result<()> {
        let token_info = &mut ctx.accounts.token_info;
        token_info.name = name;
        token_info.symbol = symbol;
        token_info.decimals = decimals;
        token_info.mint = ctx.accounts.mint.key();
        token_info.authority = ctx.accounts.authority.key();
        token_info.total_supply = 0;

        msg!("VC Token успешно инициализирован: {}", token_info.name);
        Ok(())
    }

    // Чеканка новых токенов
    pub fn mint(ctx: Context<MintToken>, amount: u64) -> Result<()> {
        // Проверяем, что отправитель имеет права на чеканку
        require!(
            ctx.accounts.token_info.authority == ctx.accounts.authority.key(),
            VcTokenError::Unauthorized
        );

        // Чеканим токены
        let cpi_accounts = token::MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::mint_to(cpi_ctx, amount)?;

        // Обновляем общую эмиссию
        let token_info = &mut ctx.accounts.token_info;
        token_info.total_supply = token_info.total_supply.checked_add(amount).unwrap();

        msg!("Отчеканено {} VC токенов", amount);
        Ok(())
    }

    // Сжигание токенов
    pub fn burn(ctx: Context<BurnToken>, amount: u64) -> Result<()> {
        // Сжигаем токены
        let cpi_accounts = token::Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::burn(cpi_ctx, amount)?;

        // Обновляем общую эмиссию
        let token_info = &mut ctx.accounts.token_info;
        token_info.total_supply = token_info.total_supply.checked_sub(amount).unwrap();

        msg!("Сожжено {} VC токенов", amount);
        Ok(())
    }
}

// Структура для хранения информации о токене
#[account]
pub struct TokenInfo {
    pub name: String,         // Название токена
    pub symbol: String,       // Символ токена
    pub decimals: u8,         // Количество десятичных знаков
    pub mint: Pubkey,         // Адрес минта
    pub authority: Pubkey,    // Адрес управляющего
    pub total_supply: u64,    // Общая эмиссия
}

// Ошибки программы
#[error_code]
pub enum VcTokenError {
    #[msg("Пользователь не имеет необходимых прав")]
    Unauthorized,
    #[msg("Арифметическая ошибка")]
    ArithmeticError,
}

// Контекст для инициализации токена
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 1 + 32 + 32 + 8 + 200
    )]
    pub token_info: Account<'info, TokenInfo>,
    
    // Минт токена, должен быть предварительно создан
    #[account(
        constraint = mint.mint_authority == COption::Some(authority.key()) @ VcTokenError::Unauthorized
    )]
    pub mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

// Контекст для чеканки токенов
#[derive(Accounts)]
pub struct MintToken<'info> {
    #[account(mut)]
    pub token_info: Account<'info, TokenInfo>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        constraint = token_account.mint == mint.key(),
        constraint = token_account.owner == token_account_owner.key()
    )]
    pub token_account: Account<'info, TokenAccount>,
    
    pub token_account_owner: AccountInfo<'info>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

// Контекст для сжигания токенов
#[derive(Accounts)]
pub struct BurnToken<'info> {
    #[account(mut)]
    pub token_info: Account<'info, TokenInfo>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        constraint = token_account.mint == mint.key(),
        constraint = token_account.owner == authority.key()
    )]
    pub token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}
EOL
  fi
}

# Создание базового теста для VC токена
create_vc_token_test() {
  if [ ! -f "$TESTS_DIR/vc-token.ts" ]; then
    echo "Создаем базовый тест для VC токена..."
    
    cat > "$TESTS_DIR/vc-token.ts" << EOL
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
EOL
  fi
}

# Адаптация скрипта запуска тестовой среды
create_run_test_script() {
  echo "Создаем скрипт запуска тестовой среды..."
  
  if [ -f "$SCRIPTS_DIR/run-test-environment.sh" ]; then
    echo "Скрипт run-test-environment.sh уже существует."
  else
    cat > "$SCRIPTS_DIR/run-test-environment.sh" << EOL
#!/bin/bash

# Скрипт запуска тестовой среды для проекта TECH-HY-SMARTS
# Этап 1: Подготовительный этап
# Задача 1.1.3: Настройка тестового окружения

# Определение путей проекта
PROJECT_ROOT="/Users/Gyber/ACTUAL-CODE/TECH-HY-SMARTS"
CODE_DIR="\$PROJECT_ROOT/code"

# Убедимся, что мы находимся в директории проекта
cd "\$CODE_DIR"

# Проверка состояния тестового валидатора
check_validator() {
  if pgrep -x "solana-test-valid" > /dev/null; then
    echo "✅ Тестовый валидатор Solana уже запущен"
    return 0
  else
    echo "❌ Тестовый валидатор Solana не запущен"
    return 1
  fi
}

# Функция для запуска тестового валидатора
start_validator() {
  echo "Запускаем тестовый валидатор Solana..."
  mkdir -p "\$CODE_DIR/logs"
  nohup solana-test-validator > "\$CODE_DIR/logs/validator.log" 2>&1 &
  
  # Ожидаем запуска валидатора
  echo "Ожидаем запуска валидатора..."
  sleep 5
  
  # Проверяем состояние
  if check_validator; then
    echo "Тестовый валидатор успешно запущен"
  else
    echo "Не удалось запустить тестовый валидатор. Проверьте \$CODE_DIR/logs/validator.log"
    exit 1
  fi
}

# Функция для пополнения баланса для тестового кошелька
airdrop_sol() {
  echo "Пополняем баланс тестового кошелька..."
  solana airdrop 100 
  
  # Проверяем баланс
  echo "Текущий баланс:"
  solana balance
}

# Функция для сборки программ
build_programs() {
  echo "Собираем программы..."
  cd "\$CODE_DIR"
  anchor build
  
  # Проверяем результат сборки
  if [ \$? -eq 0 ]; then
    echo "✅ Программы успешно собраны"
  else
    echo "❌ Сборка программ завершилась с ошибкой"
    exit 1
  fi
}

# Функция для запуска тестов
run_tests() {
  echo "Запускаем тесты..."
  cd "\$CODE_DIR"
  anchor test --skip-local-validator
  
  # Проверяем результат выполнения тестов
  if [ \$? -eq 0 ]; then
    echo "✅ Тесты успешно пройдены"
  else
    echo "❌ Тесты завершились с ошибкой"
    exit 1
  fi
}

# Создаем директорию для логов
mkdir -p "\$CODE_DIR/logs"

# Проверяем запущен ли валидатор и при необходимости запускаем
if ! check_validator; then
  start_validator
fi

# Проверяем настроен ли cluster и, если нет, настраиваем
current_cluster=\$(solana config get | grep "RPC URL" | awk '{print \$3}')
if [[ "\$current_cluster" != "http://localhost:8899" ]]; then
  echo "Настраиваем Solana на использование локального кластера..."
  solana config set --url localhost
fi

# Пополняем баланс
airdrop_sol

# Проверяем собраны ли программы и, если нет, собираем
if [ ! -d "\$CODE_DIR/target/deploy" ] || [ ! -f "\$CODE_DIR/target/deploy/vc_token-keypair.json" ]; then
  echo "Программы не собраны или keypair-файлы не сгенерированы"
  build_programs
else
  echo "✅ Программы уже собраны"
fi

# Запускаем тесты
echo "Запускаем тесты для проверки среды..."
run_tests

echo "==== Тестовая среда запущена и проверена ===="
echo "Тестовый валидатор Solana работает на http://localhost:8899"
echo "Для отслеживания транзакций используйте: solana logs"
echo "Для остановки валидатора используйте: pkill solana-test-valid"
EOL

    # Делаем скрипт исполняемым
    chmod +x "$SCRIPTS_DIR/run-test-environment.sh"
  fi
  
  echo "✅ Скрипт запуска тестовой среды создан/проверен"
}

# Вызов функций для настройки среды
echo "==== Начинаем настройку среды ===="
RUST_STABLE=false  # Инициализируем переменную
get_rust_version    # Получаем текущую версию Rust и определяем стабильность
install_rust_and_solana
setup_anchor
setup_project_structure
setup_test_environment
copy_existing_programs
create_vc_token_lib
create_vc_token_test
install_additional_dependencies
create_anchor_config
create_run_test_script
chmod +x "$SCRIPTS_DIR/setup-environment.sh"

echo "==== Настройка среды разработки в новой структуре завершена ===="
echo "Для запуска тестовой среды используйте команду: $SCRIPTS_DIR/run-test-environment.sh"
echo "Для сборки проекта используйте: cd $CODE_DIR && anchor build"
echo "Для тестирования используйте: cd $CODE_DIR && anchor test" 