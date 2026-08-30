#!/bin/bash

# Script para probar el API de WhatsApp para consulta de inventario

BASE_URL="http://localhost:3000"
TOKEN="whatsapp_agent_2024"

echo "🧪 Probando API de WhatsApp para Inventario"
echo "=========================================="
echo ""

# Test 1: Obtener todos los productos de la compañía
echo "📋 Test 1: Todos los productos de compañía 'comesoft'"
echo "URL: ${BASE_URL}/api/whatsapp/inventory?company=comesoft&token=${TOKEN}"
echo ""

curl -s "${BASE_URL}/api/whatsapp/inventory?company=comesoft&token=${TOKEN}" | json_pp

echo ""
echo "=========================================="
echo ""

# Test 2: Productos específicos
echo "📋 Test 2: Productos específicos (ELEC-001, BEB-001)"
echo "URL: ${BASE_URL}/api/whatsapp/inventory?company=comesoft&products=ELEC-001,BEB-001&token=${TOKEN}"
echo ""

curl -s "${BASE_URL}/api/whatsapp/inventory?company=comesoft&products=ELEC-001,BEB-001&token=${TOKEN}" | json_pp

echo ""
echo "=========================================="
echo ""

# Test 3: POST request
echo "📋 Test 3: POST con productos específicos"
echo ""

curl -s -X POST "${BASE_URL}/api/whatsapp/inventory" \
  -H "Content-Type: application/json" \
  -d "{
    \"company\": \"comesoft\",
    \"products\": [\"ALI-001\", \"HOG-001\"],
    \"token\": \"${TOKEN}\}
  }" | json_pp

echo ""
echo "=========================================="
echo ""
echo "✅ Tests completados"
echo ""
echo "📱 Para usar desde WhatsApp, construye URLs así:"
echo "https://tu-dominio.com/api/whatsapp/inventory?company=comesoft&token=${TOKEN}"
