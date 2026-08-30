# 📱 API de WhatsApp para Consulta de Inventario

## 🎯 Propósito
Este API permite a agentes de WhatsApp consultar la disponibilidad de productos de múltiples compañías de forma rápida y sencilla.

## 🔗 Endpoint
```
https://tu-dominio.com/api/whatsapp/inventory
```

## 🔑 Autenticación
Incluye el parámetro `token=whatsapp_agent_2024` en todas las consultas.

## 📋 Formatos de Consulta

### Opción 1: Todos los Productos
```
GET /api/whatsapp/inventory?company=IDENTIFICADOR&token=whatsapp_agent_2024
```

### Opción 2: Productos Específicos  
```
GET /api/whatsapp/inventory?company=IDENTIFICADOR&products=SKU1,SKU2,SKU3&token=whatsapp_agent_2024
```

### Opción 3: Método POST
```json
POST /api/whatsapp/inventory
{
  "company": "IDENTIFICADOR",
  "products": ["SKU1", "SKU2"],
  "token": "whatsapp_agent_2024"
}
```

## 🔍 Identificadores de Compañía
Puedes usar cualquiera de estos como `company`:
- **ID numérico**: `4`
- **Email de la compañía**: `info@empresa.com`  
- **RIF/J**: `J123456789`
- **Nombre**: `Nombre Compañía` (búsqueda parcial)

## 📦 Formato de Respuesta
```json
{
  "compañia": "Nombre Compañía",
  "total_productos": 3,
  "productos": [
    {
      "sku": "ELEC-001",
      "nombre": "Laptop HP 15\"",
      "stock": 10,
      "stock_minimo": 5,
      "estado": "🟢 DISPONIBLE",
      "categoria": "Electrónicos",
      "almacen": "Almacén Principal",
      "ubicacion": "Av. Principal #123"
    }
  ]
}
```

## 🚨 Estados de Producto
- **🟢 DISPONIBLE**: Stock mayor al mínimo
- **🔴 BAJO STOCK**: Stock menor o igual al mínimo

## 📱 Ejemplos de Uso

### Consulta Rápida
```
https://tu-dominio.com/api/whatsapp/inventory?company=comesoft&token=whatsapp_agent_2024
```

### Productos Específicos
```
https://tu-dominio.com/api/whatsapp/inventory?company=comesoft&products=ELEC-001,BEB-001&token=whatsapp_agent_2024
```

### Por ID de Compañía
```
https://tu-dominio.com/api/whatsapp/inventory?company=4&token=whatsapp_agent_2024
```

## ⚠️ Errores Comunes
- **401 Unauthorized**: Token incorrecto o faltante
- **404 Not Found**: Compañía no encontrada
- **400 Bad Request**: Falta parámetro `company`

## 🛡️ Seguridad
El token `whatsapp_agent_2024` debe mantenerse confidencial y cambiarse periódicamente.

## 📞 Soporte
Para cambios o problemas, contactar al administrador del sistema.
