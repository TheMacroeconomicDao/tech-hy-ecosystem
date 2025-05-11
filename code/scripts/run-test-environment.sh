#!/bin/bash

# Скрипт запуска тестовой среды для проекта TECH-HY-SMARTS
# Этап 1: Подготовительный этап
# Задача 1.1.3: Настройка тестового окружения

# Определение путей проекта
PROJECT_ROOT="/Users/Gyber/ACTUAL-CODE/TECH-HY-SMARTS"
CODE_DIR="$PROJECT_ROOT/code"

# Убедимся, что мы находимся в директории проекта
cd "$CODE_DIR"

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
  mkdir -p "$CODE_DIR/logs"
  nohup solana-test-validator > "$CODE_DIR/logs/validator.log" 2>&1 &
  
  # Ожидаем запуска валидатора
  echo "Ожидаем запуска валидатора..."
  sleep 5
  
  # Проверяем состояние
  if check_validator; then
    echo "Тестовый валидатор успешно запущен"
  else
    echo "Не удалось запустить тестовый валидатор. Проверьте $CODE_DIR/logs/validator.log"
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
  cd "$CODE_DIR"
  anchor build
  
  # Проверяем результат сборки
  if [ $? -eq 0 ]; then
    echo "✅ Программы успешно собраны"
  else
    echo "❌ Сборка программ завершилась с ошибкой"
    exit 1
  fi
}

# Функция для запуска тестов
run_tests() {
  echo "Запускаем тесты..."
  cd "$CODE_DIR"
  anchor test --skip-local-validator
  
  # Проверяем результат выполнения тестов
  if [ $? -eq 0 ]; then
    echo "✅ Тесты успешно пройдены"
  else
    echo "❌ Тесты завершились с ошибкой"
    exit 1
  fi
}

# Создаем директорию для логов
mkdir -p "$CODE_DIR/logs"

# Проверяем запущен ли валидатор и при необходимости запускаем
if ! check_validator; then
  start_validator
fi

# Проверяем настроен ли cluster и, если нет, настраиваем
current_cluster=$(solana config get | grep "RPC URL" | awk '{print $3}')
if [[ "$current_cluster" != "http://localhost:8899" ]]; then
  echo "Настраиваем Solana на использование локального кластера..."
  solana config set --url localhost
fi

# Пополняем баланс
airdrop_sol

# Проверяем собраны ли программы и, если нет, собираем
if [ ! -d "$CODE_DIR/target/deploy" ] || [ ! -f "$CODE_DIR/target/deploy/vc_token-keypair.json" ]; then
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