# Sistema de Monedas - Frontend

Sistema completo de gestión de monedas con soporte venezolano (IGTF, BCV, conversión de divisas).

## 📁 Estructura de Archivos

```
src/
├── components/currencies/
│   ├── CurrencyForm.tsx           # Formulario completo de moneda
│   ├── CurrencySelector.tsx       # Selector reutilizable
│   ├── CurrencyConverter.tsx      # Conversor de monedas
│   ├── IGTFCalculator.tsx         # Calculadora IGTF
│   ├── RateUpdateModal.tsx        # Modal para actualizar tasas
│   ├── RateHistory.tsx            # Historial de cambios
│   └── index.ts
├── store/
│   └── currency-store.ts          # Zustand store
├── types/
│   └── currency.ts                # TypeScript interfaces
└── lib/
    └── api.ts                     # API client (currenciesAPI)
```

## 🚀 Uso Rápido

### 1. Selector de Monedas en Facturas/Compras

```tsx
import { CurrencySelector } from '@/components/currencies';

function InvoiceForm() {
  const [currencyId, setCurrencyId] = useState<number>(1);

  return (
    <CurrencySelector
      value={currencyId}
      onChange={setCurrencyId}
      showRate={true}
      showIGTF={true}
      label="Moneda de la factura"
      excludeBaseCurrency={false}
    />
  );
}
```

### 2. Mostrar Montos Multi-moneda

```tsx
import { InvoiceItemCurrencyDisplay } from '@/components/currencies';

<InvoiceItemCurrencyDisplay
  currencyId={2}
  amount={100}
  baseCurrencyId={1}
/>
// Output: $100.00 USD (@ 36.5000) ≈ Bs 3,650.00 VES
```

### 3. Conversor de Monedas

```tsx
import { CurrencyConverter } from '@/components/currencies';

// Página completa con conversor interactivo
<CurrencyConverter />
```

### 4. Calculadora IGTF

```tsx
import { IGTFCalculator } from '@/components/currencies';

// Calcula automáticamente el IGTF (3%)
<IGTFCalculator />
```

## 📊 Zustand Store

### Métodos Principales

```typescript
import { useCurrencyStore } from '@/store/currency-store';

const {
  // Estado
  currencies,
  selectedCurrency,
  isLoading,
  error,

  // CRUD
  fetchCurrencies,
  createCurrency,
  updateCurrency,
  deleteCurrency,

  // Tasas
  updateCurrencyRate,
  fetchRateHistory,
  fetchStatistics,

  // Conversión
  convertCurrency,
  fetchConversionFactors,

  // IGTF
  calculateIGTF,

  // Helpers
  selectCurrency,
  clearError,
} = useCurrencyStore();
```

### Selectores

```typescript
import {
  getBaseCurrency,
  getActiveCurrencies,
  getIGTFCurrencies,
  getCurrencyByCode,
} from '@/store/currency-store';

// Obtener moneda base
const baseCurrency = getBaseCurrency(useCurrencyStore.getState());

// Obtener monedas activas
const activeCurrencies = getActiveCurrencies(useCurrencyStore.getState());

// Obtener monedas con IGTF
const igtfCurrencies = getIGTFCurrencies(useCurrencyStore.getState());

// Obtener moneda por código
const usdCurrency = getCurrencyByCode('USD')(useCurrencyStore.getState());
```

## 🔄 Integración en Facturas

### Ejemplo Completo

```tsx
'use client';

import { useState } from 'react';
import { useCurrencyStore, calculateIGTF } from '@/store/currency-store';
import { CurrencySelector } from '@/components/currencies';

export function InvoiceForm() {
  const { currencies, calculateIGTF, convertCurrency } = useCurrencyStore();
  const [currencyId, setCurrencyId] = useState<number>(1);
  const [amount, setAmount] = useState<number>(100);

  const handleCalculateIGTF = async () => {
    try {
      const igtf = await calculateIGTF(amount, currencyId, 'transfer');
      console.log('IGTF:', igtf);
      // { original_amount: 100, igtf_amount: 3, total_with_igtf: 103 }
    } catch (error) {
      console.error('Error calculating IGTF:', error);
    }
  };

  return (
    <form>
      {/* Seleccionar moneda */}
      <CurrencySelector
        value={currencyId}
        onChange={setCurrencyId}
        showRate={true}
        showIGTF={true}
      />

      {/* Monto */}
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(parseFloat(e.target.value))}
      />

      {/* Calcular IGTF */}
      <button type="button" onClick={handleCalculateIGTF}>
        Calcular IGTF
      </button>
    </form>
  );
}
```

## 💱 Conversión de Monedas

### API Directa

```typescript
import { useCurrencyStore } from '@/store/currency-store';

const { convertCurrency } = useCurrencyStore();

// Convertir 100 USD a VES
const result = await convertCurrency('USD', 'VES', 100);
console.log(result);
// {
//   original_amount: 100,
//   original_currency: "USD",
//   converted_amount: 3650.00,
//   target_currency: "VES",
//   exchange_rate_used: 36.50,
//   conversion_method: "direct",
//   rate_metadata: { ... }
// }
```

## 📋 Tipos TypeScript

### Currency

```typescript
interface Currency {
  id: number;
  company_id: number;
  code: string;              // ISO 4217: USD, VES, EUR
  name: string;              // Nombre completo
  symbol: string;            // $, Bs, €
  exchange_rate: string;    // NUMERIC(20,10)
  decimal_places: number;

  is_base_currency: boolean;
  conversion_factor: string | null;
  conversion_method: 'direct' | 'inverse' | 'via_usd' | null;

  applies_igtf: boolean;
  igtf_rate: string | null;
  igtf_exempt: boolean;
  igtf_min_amount: string | null;

  rate_update_method: 'manual' | 'api_bcv' | ...;
  last_rate_update: string | null;
  // ... más campos
}
```

### CurrencyConversion

```typescript
interface CurrencyConversion {
  original_amount: number;
  original_currency: string;
  converted_amount: number;
  target_currency: string;
  exchange_rate_used: number;
  conversion_method: string;
  rate_metadata: {
    rate: number;
    method: string;
    source: string;
    last_update: string | null;
  };
}
```

### IGTFResult

```typescript
interface IGTFResult {
  original_amount: number;
  igtf_amount: number;
  igtf_applied: boolean;
  total_with_igtf: number;
  metadata: {
    currency_code: string;
    applies: boolean;
    rate: number;
    reason: string;
  };
}
```

## 🎨 Componentes UI

### CurrencySelector Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| value | number | - | ID de moneda seleccionada |
| onChange | (id: number) => void | - | Callback al cambiar |
| disabled | boolean | false | Deshabilitar selector |
| showRate | boolean | true | Mostrar tasa de cambio |
| showIGTF | boolean | false | Mostrar info de IGTF |
| label | string | 'Moneda' | Etiqueta del campo |
| excludeBaseCurrency | boolean | false | Excluir moneda base |

### CurrencyForm Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| onSuccess | () => void | - | Callback al guardar |
| initialData | CurrencyUpdateForm | - | Datos iniciales para editar |
| currencyId | number | - | ID de moneda a editar |

## 🔧 Backend API

### Endpoints Disponibles

```typescript
// CRUD
currenciesAPI.getAll({ skip, limit, is_active })
currenciesAPI.getById(id)
currenciesAPI.create(data)
currenciesAPI.update(id, data)
currenciesAPI.delete(id)

// Tasas
currenciesAPI.updateRate(id, { new_rate, change_reason, ... })
currenciesAPI.getRateHistory(id, limit)
currenciesAPI.getStatistics(id)

// Conversión
currenciesAPI.convert(from_currency, to_currency, amount)
currenciesAPI.getConversionFactors()

// IGTF
currenciesAPI.calculateIGTF(amount, currency_id, payment_method)
currenciesAPI.getIGTFConfigs(currency_id)

// Validación
currenciesAPI.validateISO(code)
```

## 📝 Ejemplos Prácticos

### Crear Moneda USD

```typescript
const newUSD = await createCurrency({
  code: 'USD',
  name: 'Dólar Estadounidense',
  symbol: '$',
  exchange_rate: '36.50',
  decimal_places: 2,
  is_base_currency: false,
  conversion_method: 'direct',
  applies_igtf: true,
  igtf_rate: '3.00',
  rate_update_method: 'manual',
});
```

### Actualizar Tasa con Historial

```typescript
await updateCurrencyRate(1, {
  new_rate: '37.00',
  change_reason: 'Ajuste por inflación',
  change_type: 'manual',
  change_source: 'admin_user',
});
// Crea automáticamente registro en CurrencyRateHistory
```

### Convertir con Factores

```typescript
// USD 36.50 → factor = 1/36.50 = 0.0274
// COP 0.015 → factor = 0.015 (inverse)

const result = await convertCurrency('USD', 'VES', 100);
// Usa factor 0.0274 si method='direct'
// Usa factor 36.50 si method='inverse'
```

## 🧪 Testing

```bash
# Ejecutar tests de componentes
npm test CurrencySelector
npm test CurrencyConverter
npm test IGTFCalculator

# Tests de integración con API
npm test currency-store
```

## 🚧 Próximos Pasos

1. **Automatización de Tasas**: Implementar actualización automática desde API BCV
2. **Notificaciones**: Alertas cuando una tasa cambie significativamente
3. **Reportes**: Reportes de ganancias/pérdidas por fluctuación cambiaria
4. **Presupuestos**: Presupuestos multi-moneda con conversión automática

## 📚 Referencias

- [Backend API Docs](http://localhost:8000/docs)
- [ISO 4217 Currency Codes](https://en.wikipedia.org/wiki/ISO_4217)
- [IGTF Venezuela](http://www.seniat.gob.ve/)

## 🐛 Troubleshooting

### Error: "No hay monedas configuradas"

**Solución**: Vaya a `/currencies` y cree al menos una moneda base (VES).

### IGTF no se calcula

**Causas probables**:
- Moneda no tiene `applies_igtf: true`
- Monto está por debajo del `igtf_min_amount`
- Moneda está marcada como `igtf_exempt: true`

### Tasa de conversión incorrecta

**Verificar**:
- `conversion_method` (direct vs inverse)
- `conversion_factor` está calculado correctamente
- `exchange_rate` tiene precisión suficiente (10 decimales)

---

**Sistema desarrollado para ERP venezolano con soporte completo multi-moneda y IGTF.**
