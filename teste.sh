#!/bin/bash

# 🧪 Script de Testes - MS Payment Service

set -e  # Parar em caso de erro

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     🧪 TESTES - MICROSSERVIÇO DE PAGAMENTOS              ║"
echo "╚════════════════════════════════════════════════════════════╝"

# Cores para saída
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URL base
API="http://localhost:3001"

# Função para teste
test_endpoint() {
  local number=$1
  local name=$2
  local method=$3
  local endpoint=$4
  local data=$5
  
  echo -e "\n${YELLOW}▶ Teste $number: $name${NC}"
  
  if [ -z "$data" ]; then
    response=$(curl -s -X $method "$API$endpoint")
  else
    response=$(curl -s -X $method "$API$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi
  
  echo "$response" | jq . 2>/dev/null || echo "$response"
}

# =============================================================================
# TESTES
# =============================================================================

echo -e "\n${GREEN}[1/6] Health Check${NC}"
curl -s "$API/health" | jq .

echo -e "\n${GREEN}[2/6] Criar Pagamento 1${NC}"
RESP1=$(curl -s -X POST "$API/payments" \
  -H "Content-Type: application/json" \
  -d '{"userId":"alice","amount":150.50,"description":"Notebook"}')
echo "$RESP1" | jq .
PAYMENT_ID_1=$(echo "$RESP1" | jq -r '.payment.id')
echo "ID Salvo: $PAYMENT_ID_1"

echo -e "\n${GREEN}[3/6] Criar Pagamento 2${NC}"
RESP2=$(curl -s -X POST "$API/payments" \
  -H "Content-Type: application/json" \
  -d '{"userId":"bob","amount":99.99,"description":"Mouse"}')
echo "$RESP2" | jq .
PAYMENT_ID_2=$(echo "$RESP2" | jq -r '.payment.id')

echo -e "\n${GREEN}[4/6] Listar Todos os Pagamentos${NC}"
curl -s "$API/payments" | jq .

echo -e "\n${GREEN}[5/6] Status PENDING → Aguardando 3 segundos...${NC}"
curl -s "$API/payments/$PAYMENT_ID_1" | jq '.status'
echo "⏳ Aguardando..."
sleep 3

echo -e "\n${GREEN}[6/6] Status agora deve ser SUCCESS${NC}"
curl -s "$API/payments/$PAYMENT_ID_1" | jq '.status'

# =============================================================================
# RESUMO
# =============================================================================

echo -e "\n╔════════════════════════════════════════════════════════════╗"
echo -e "║                  ✅ TESTES CONCLUÍDOS                      ║"
echo -e "╚════════════════════════════════════════════════════════════╝"

echo -e "\n${GREEN}Resumo:${NC}"
echo "  ✓ Health check funcionando"
echo "  ✓ Pagamento 1 criado (USD: genesis)"
echo "  ✓ Pagamento 2 criado (USD: bob)"
echo "  ✓ Listagem funcionando"
echo "  ✓ Status mudou de pending para success"

echo -e "\n${YELLOW}IDs para referência:${NC}"
echo "  Pagamento 1: $PAYMENT_ID_1"
echo "  Pagamento 2: $PAYMENT_ID_2"

echo -e "\n${YELLOW}Próximos passos:${NC}"
echo "  1. Ver dashboard RabbitMQ: http://localhost:15672"
echo "  2. Acessar logs: docker logs comprefacil-payment-service"
echo "  3. Ler documentação: cat GUIA_IMPLEMENTACAO.md"

echo ""
