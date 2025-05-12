#!/bin/bash
set -e

# Скрипт для запуска тестов TECH-HY проекта

# Проверка аргументов
if [ "$#" -lt 1 ]; then
    echo "Использование: $0 [unit|integration|e2e|all|coverage]"
    exit 1
fi

# Проверка, запущен ли validator
if ! pgrep -x "solana-test-validator" > /dev/null; then
    echo "Локальный Solana validator не запущен!"
    echo "Запустите его с помощью: ./scripts/setup-test-env.sh"
    exit 1
fi

# Переходим в директорию тестов
cd "$(dirname "$0")/.."

# Функция для запуска модульных тестов
run_unit_tests() {
    echo "=== Запуск модульных тестов ==="
    npm run test:unit
}

# Функция для запуска интеграционных тестов
run_integration_tests() {
    echo "=== Запуск интеграционных тестов ==="
    npm run test:integration
}

# Функция для запуска E2E тестов
run_e2e_tests() {
    echo "=== Запуск E2E тестов ==="
    npm run test:e2e
}

# Функция для запуска всех тестов
run_all_tests() {
    echo "=== Запуск всех тестов ==="
    npm run test:all
}

# Функция для запуска тестов с покрытием кода
run_coverage() {
    echo "=== Запуск тестов с покрытием кода ==="
    
    # Устанавливаем nyc, если не установлен
    if ! command -v nyc &> /dev/null; then
        echo "Установка nyc для покрытия кода..."
        npm install -g nyc
    fi
    
    # Запускаем тесты с nyc
    nyc npm run test:all
    
    # Создаем отчет
    nyc report --reporter=html
    
    echo "Отчет о покрытии создан в директории ./coverage/"
}

# Запуск соответствующих тестов
case "$1" in
    "unit")
        run_unit_tests
        ;;
    "integration")
        run_integration_tests
        ;;
    "e2e")
        run_e2e_tests
        ;;
    "all")
        run_all_tests
        ;;
    "coverage")
        run_coverage
        ;;
    *)
        echo "Неизвестный тип тестов: $1"
        echo "Использование: $0 [unit|integration|e2e|all|coverage]"
        exit 1
        ;;
esac

echo "=== Тесты выполнены! ===" 