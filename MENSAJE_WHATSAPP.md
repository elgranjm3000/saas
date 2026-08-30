# 📱 Mensaje para Agente de WhatsApp

## 👋 Hola! Te comparto el acceso para consultar disponibilidad de productos

### 🔗 **URL del Sistema:**
```
https://tu-dominio.com/api/whatsapp/inventory
```

### 🔑 **Token de Acceso:**
```
whatsapp_agent_2024
```

## 📋 **Cómo Usarlo:**

### **Opción 1: Consulta Rápida (Todos los productos)**
```
https://tu-dominio.com/api/whatsapp/inventory?company=comesoft&token=whatsapp_agent_2024
```

### **Opción 2: Productos Específicos**
```
https://tu-dominio.com/api/whatsapp/inventory?company=comesoft&products=ELEC-001,BEB-001&token=whatsapp_agent_2024
```

## 🏢 **Compañías Disponibles:**
- **comesoft** (ID: 4)
- O puedes buscar por: email, RIF, o nombre parcial

## 📦 **SKUs Disponibles (Demo):**
- **ELEC-001**: Laptop HP 15"
- **ELEC-002**: Mouse Inalámbrico  
- **ELEC-003**: Teclado Gamer
- **ELEC-004**: Monitor 24"
- **BEB-001**: Coca-Cola 2L
- **BEB-002**: Agua Mineral 1L
- **ALI-001**: Arroz Blanco 1kg
- **Y muchos más...**

## 📊 **Respuesta que recibirás:**
```json
{
  "compañia": "Compañía Ejemplo",
  "total_productos": 17,
  "productos": [
    {
      "sku": "ELEC-001",
      "nombre": "Laptop HP 15\"",
      "stock": 10,
      "estado": "🟢 DISPONIBLE",
      "categoria": "Electrónicos"
    }
  ]
}
```

## 🚨 **Estados:**
- **🟢 DISPONIBLE**: Hay stock suficiente
- **🔴 BAJO STOCK**: Stock bajo, necesita reposición

## 💡 **Tips:**
- Puedes usar cualquier parte del nombre de la compañía
- Para varios SKUs, sepáralos con coma: `SKU1,SKU2,SKU3`
- El response es JSON, fácil de leer

¿Necesitas ayuda con algo? Estoy para servirte! 🎯