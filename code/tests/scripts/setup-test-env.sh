#!/bin/bash
set -e

# Настройка тестовой среды для TECH-HY проекта

echo "=== Настройка тестовой среды для TECH-HY проекта ==="

# Проверка наличия Solana CLI
if ! command -v solana &> /dev/null; then
    echo "Solana CLI не установлен. Установите его с помощью:"
    echo "sh -c '$(curl -sSfL https://release.solana.com/v1.17.0/install)'"
    exit 1
fi

# Проверка наличия Anchor
if ! command -v anchor &> /dev/null; then
    echo "Anchor не установлен. Установите его с помощью:"
    echo "cargo install --git https://github.com/coral-xyz/anchor avm --locked"
    echo "avm install latest"
    echo "avm use latest"
    exit 1
fi

# Создание временного кошелька для тестов
echo "Создание тестового кошелька..."
solana-keygen new --no-bip39-passphrase -o ./test-keypair.json -s -f
solana config set --keypair ./test-keypair.json
solana config set --url localhost

# Запуск локального валидатора
echo "Запуск локального валидатора Solana..."
solana-test-validator -r &
VALIDATOR_PID=$!
sleep 5

# Пополнение кошелька тестовыми SOL
echo "Пополнение тестового кошелька..."
solana airdrop 100

# Создание каталогов для IDL
echo "Создание каталогов для IDL..."
mkdir -p ./idl

# Установка зависимостей
echo "Установка npm зависимостей..."
npm install

# Компиляция программ
echo "Компиляция программ..."
cd .. && cd ..
anchor build

# Копирование IDL файлов
echo "Копирование IDL файлов в тестовое окружение..."
cp -f ./target/idl/vc_token.json ./code/tests/idl/
cp -f ./target/idl/vg_token.json ./code/tests/idl/
cp -f ./target/idl/burn_and_earn.json ./code/tests/idl/

echo "=== Тестовая среда настроена успешно! ==="

# Информация о том, как использовать тесты
echo "Для запуска тестов из директории code/tests:"
echo "- Модульные тесты: npm run test:unit"
echo "- Интеграционные тесты: npm run test:integration"
echo "- E2E тесты: npm run test:e2e"
echo "- Все тесты: npm run test:all"

# Примечание: не забудьте остановить validator вручную после завершения тестов
echo "Для остановки локального validator выполните: kill $VALIDATOR_PID" 