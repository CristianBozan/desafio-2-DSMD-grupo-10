#!/bin/bash

# ==============================================
# Script para subir o projeto no GitHub
# CompreFácil - Sistema de Pagamentos Distribuído
# ==============================================

set -e

REPO_NAME="ms-comprefacil-pagamentos"
REPO_DESCRIPTION="Desafio 2 SENAI - Microsserviços de pagamento e notificação com Node.js, RabbitMQ e PostgreSQL"

echo ""
echo "========================================"
echo " Configurando repositório no GitHub"
echo "========================================"
echo ""

# 1. Inicializar git
echo "📁 Inicializando repositório git..."
git init
git branch -M main

# 2. Configurar usuário (ajuste se necessário)
git config user.email "cristianbozan91@gmail.com"
git config user.name "Cristian"

# 3. Adicionar todos os arquivos
echo "➕ Adicionando arquivos..."
git add .

# 4. Commit inicial
echo "💾 Fazendo commit inicial..."
git commit -m "feat: implementação dos microsserviços de pagamento e notificação

- ms-payment-service: API REST + publisher AMQP com PostgreSQL
- ms-notification-service: consumer AMQP para notificações
- docker-compose com Postgres e RabbitMQ
- Fluxo assíncrono completo (pending → confirmed)
- README com instruções de execução"

# 5. Criar repositório no GitHub e publicar
echo ""
echo "🚀 Criando repositório público no GitHub..."

if command -v gh &> /dev/null; then
    gh repo create "$REPO_NAME" \
        --public \
        --description "$REPO_DESCRIPTION" \
        --source=. \
        --remote=origin \
        --push

    echo ""
    echo "✅ Projeto publicado com sucesso no GitHub!"
    echo "🔗 Acesse: https://github.com/$(gh api user --jq .login)/$REPO_NAME"
else
    echo ""
    echo "⚠️  GitHub CLI (gh) não encontrado."
    echo ""
    echo "Para publicar manualmente:"
    echo "1. Acesse https://github.com/new"
    echo "2. Crie um repositório público chamado '$REPO_NAME'"
    echo "3. Execute os comandos abaixo:"
    echo ""
    echo "   git remote add origin https://github.com/SEU_USUARIO/$REPO_NAME.git"
    echo "   git push -u origin main"
    echo ""
    echo "💡 Para instalar o GitHub CLI: https://cli.github.com/"
fi
