# Arquitectura Multi-Moneda Escalable - Venezuela

## 🎯 Visión General

Sistema multi-moneda diseñado específicamente para la economía venezolana, donde:
- **USD es la moneda de referencia** (precios de productos)
- **VES es la moneda de pago** (facturación)
- **Tasas BCV se actualizan diariamente**
- **Conversión automática con historial**

---

## 📊 Componentes de la Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                         │
│  (React + TypeScript + Zustand)                            │
├─────────────────────────────────────────────────────────────┤
│  - ProductForm: Precios en USD                            │
│  - InvoiceForm: Conversión USD→VES en tiempo real         │
│  - BCVRateWidget: Display de tasa con actualización        │
│  - CurrencySelector: Selector inteligente de monedas      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER (FastAPI)                    │
├─────────────────────────────────────────────────────────────┤
│  POST /api/v1/products           → Crear producto (precio USD)│
│  POST /api/v1/invoices           → Crear factura (USD→VES)    │
│  GET  /api/v1/rates/bcv/today     → Obtener tasa BCV hoy     │
│  POST /api/v1/rates/bcv/sync     → Sincronizar tasas         │
│  GET  /api/v1/invoices/{id}/preview → Previsualizar factura  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER (Business Logic)            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐ │
│  │ BCVRateService (Scraping + Cache)                    │ │
│  │ - Obtiene tasa BCV con web scraping                  │ │
│  │ - Cache en Redis (1 hora)                             │ │
│  │ - Fallback a última tasa conocida                    │ │
│  └──────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ InvoiceCalculationService                            │ │
│  │ - Convierte USD → VES                               │ │
│  │ - Calcula IVA (16%)                                 │ │
│  │ - Calcula IGTF (3%)                                  │ │
│  │ - Soporta sobrescritura de tasa                     │ │
│  └──────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ CurrencyHistoryService                              │ │
│  │ - Registra historial de tasas diarias               │ │
│  │ - Audita cambios de tasas                           │ │
│  │ - Reportes de variación                             │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATA LAYER (SQLAlchemy + MySQL)           │
├─────────────────────────────────────────────────────────────┤
│  products:                                              │
│    - price_usd (DECIMAL(10,2)) - Precio en USD             │
│    - price_currency_id (FK) - Moneda del precio           │
│                                                          │
│  invoices:                                              │
│    - currency_id (FK) - Moneda de pago (VES)             │
│    - reference_currency_id (FK) - Moneda referencia (USD)  │
│    - exchange_rate (DECIMAL(10,4)) - Tasa usada          │
│    - exchange_rate_source (VARCHAR) - BCV/MANUAL         │
│    - manual_exchange_rate (DECIMAL(10,4)) - Sobrescritura │
│                                                          │
│  daily_rates:                                           │
│    - rate_date (DATE) - Día de la tasa                   │
│    - base_currency_id (FK) - Moneda base (VES)           │
│    - target_currency_id (FK) - Moneda destino (USD)      │
│    - exchange_rate (DECIMAL(10,4)) - Tasa del día         │
│    - source (VARCHAR) - BCV/MANUAL/SCHEDULED             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                        │
│  https://www.bcv.org.ve/ - Banco Central de Venezuela    │
│  Redis (Cache de tasas)                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Datos (Data Flow)

### 1. **Creación de Producto**
```
Producto (Laptop HP)
├── Precio: $1,000 USD (precio referencial)
├── Moneda precio: USD
└── No se almacena en VES (cambia constantemente)
```

### 2. **Creación de Factura**
```
1. Usuario selecciona productos (precios en USD)
2. Sistema busca tasa BCV del día (o usa manual)
3. Sistema calcula totales en VES:
   - Subtotal USD: $10,000
   - Tasa BCV: 34.50 Bs/USD
   - Subtotal VES: 345,000 Bs
   - IVA 16%: 55,200 Bs
   - IGTF 3%: 10,350 Bs
   - Total: 410,550 Bs
4. Factura se guarda en VES
5. Historial registra: USD → VES @ 34.50
```

### 3. **Actualización de Tasas BCV**
```
1. Cron job diario (9 AM) → POST /api/v1/rates/bcv/sync
2. BCVRateService:
   - Scraping https://www.bcv.org.ve/
   - Obtiene tasa: 34.50 Bs/USD
   - Guarda en Redis (cache 1 hora)
   - Guarda en tabla daily_rates
3. Futuras facturas usan nueva tasa
4. Facturas anteriores mantienen su tasa original
```

---

## 🏛️ Principios de Diseño Escalable

### 1. **Separation of Concerns**
- Servicios independientes
- Cada componente tiene una responsabilidad única
- Fácil testing unitario

### 2. **Caching Strategy**
- Redis para tasas BCV (TTL: 1 hora)
- Reducción de llamadas a BCV
- Fallback a última tasa conocida

### 3. **Audit Trail**
- Todo cambio de tasa queda registrado
- Historial inmutable de tasas
- Trazabilidad completa

### 4. **Idempotency**
- Múltiples llamadas a BCV sync = mismo resultado
- Cache previene duplicados
- Operaciones atómicas

### 5. **Graceful Degradation**
- Si BCV falla → usar última tasa + alerta
- Si Redis falla → ir a DB
- Si todo falla → permitir tasa manual

---

## 📦 Estructura de Archivos

```
backend/
├── models/
│   ├── currency_config.py          # Modelos de monedas
│   └── daily_rates.py             # Nuevo: Tasas diarias
├── services/
│   ├── bcv_rate_service.py         # Nuevo: Scraping BCV
│   ├── invoice_calculator.py       # Nuevo: Cálculo facturas
│   ├── currency_history_service.py # Nuevo: Historial tasas
│   └── cache_service.py            # Nuevo: Cache Redis
├── crud/
│   ├── products.py                 # CRUD productos
│   └── invoices.py                 # CRUD facturas
├── routers/
│   ├── products.py                 # API productos
│   ├── invoices.py                 # API facturas
│   └── rates.py                    # Nuevo: API tasas
└── alembic/versions/
    └── xxx_multi_currency_ves.py   # Migración

frontend/
├── src/
│   ├── types/
│   │   ├── invoice.ts              # Tipos de factura
│   │   └── currency.ts             # Tipos de moneda
│   ├── services/
│   │   ├── invoiceService.ts       # Servicio facturas
│   │   └── bcvService.ts            # Servicio BCV
│   ├── store/
│   │   └── invoiceStore.ts         # Zustand facturas
│   └── components/
│       ├── products/
│       │   └── ProductForm.tsx     # Formulario productos
│       └── invoices/
│           ├── InvoiceForm.tsx     # Formulario facturas
│           └── InvoicePreview.tsx   # Previsualización
```

---

## 🎯 Plan de Implementación

### Phase 1: Foundation (Backend)
1. ✅ Crear modelo `DailyRate`
2. ✅ Crear servicio `BCVRateService`
3. ✅ Crear servicio `CacheService` (Redis)
4. ✅ Migración: agregar campos a `products` e `invoices`

### Phase 2: Business Logic
1. ✅ Crear `InvoiceCalculationService`
2. ✅ Modificar `create_invoice()` con conversión USD→VES
3. ✅ Endpoint para preview de factura
4. ✅ Endpoint para sync de tasas BCV

### Phase 3: Frontend
1. ✅ Actualizar `ProductForm` (precios en USD)
2. ✅ Actualizar `InvoiceForm` (conversión en tiempo real)
3. ✅ Componente `BCVRateWidget`
4. ✅ Componente `InvoicePreview`

### Phase 4: Testing & Deployment
1. ✅ Tests unitarios servicios
2. ✅ Tests integración API
3. ✅ Manual testing end-to-end
4. ✅ Deployment con migrations

---

## 🔒 Seguridad & Validaciones

### Backend Validations
- Tasa BCV debe ser > 0
- Fecha tasa no puede ser futura
- Tasa manual requiere justificación
- Productos requieren precio en USD

### Frontend Validations
- Conversión en tiempo real
- Alerta si tasa BCV es antigua (>24 horas)
- Confirmación si tasa manual difiere >10% de BCV

---

## 📈 Métricas de Escalabilidad

| Métrica | Objetivo |
|---------|----------|
| Tiempo respuesta BCV | < 500ms |
| Tiempo cálculo factura | < 200ms |
| Tasa de cache hit | > 95% |
| Concurrency soportada | 1000+ usuarios |
| Uptime BCV service | 99.5% |

---

## 🚀 Próximos Pasos

1. **Ejecutar Phase 1** (Foundation)
2. **Testing continuo**
3. **Documentación**
4. **Code reviews**
