'use client'
import React from 'react';
import { useCurrencyStore } from '@/store/currency-store';

interface CurrencyBadgeProps {
  currencyId: number | null;
  showIGTF?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CurrencyBadge: React.FC<CurrencyBadgeProps> = ({
  currencyId,
  showIGTF = false,
  className = '',
  size = 'md'
}) => {
  const { currencies } = useCurrencyStore();
  const currency = currencies.find(c => c.id === currencyId);

  if (!currency) {
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 ${className}`}>
        -
      </span>
    );
  }

  const getCurrencyFlag = (code: string) => {
    const flags: Record<string, string> = {
      'VES': '🇻🇪',
      'USD': '🇺🇸',
      'EUR': '🇪🇺',
      'COP': '🇨🇴',
      'PTR': '🇵🇹'
    };
    return flags[code] || '💱';
  };

  const getBadgeColor = () => {
    if (currency.is_base_currency) {
      return 'bg-green-100 text-green-700 border border-green-200';
    }
    if (currency.applies_igtf) {
      return 'bg-orange-100 text-orange-700 border border-orange-200';
    }
    return 'bg-blue-100 text-blue-700 border border-blue-200';
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  return (
    <div className={`inline-flex items-center space-x-1.5 ${getBadgeColor()} ${sizeClasses[size]} rounded-xl ${className}`}>
      <span className="text-sm">{getCurrencyFlag(currency.code)}</span>
      <span className="font-semibold">{currency.code}</span>
      {showIGTF && currency.applies_igtf && (
        <span className="text-xs opacity-75">IGTF</span>
      )}
    </div>
  );
};

interface CurrencyAmountProps {
  amount: number;
  currencyId: number | null;
  showConverted?: boolean;
  className?: string;
}

export const CurrencyAmount: React.FC<CurrencyAmountProps> = ({
  amount,
  currencyId,
  showConverted = false,
  className = ''
}) => {
  const { currencies, convertCurrency } = useCurrencyStore();
  const [convertedAmount, setConvertedAmount] = React.useState<{
    amount: number;
    symbol: string;
    currencyCode: string;
  } | null>(null);

  const currency = currencies.find(c => c.id === currencyId);
  const baseCurrency = currencies.find(c => c.is_base_currency);

  React.useEffect(() => {
    const convert = async () => {
      if (!currency || !baseCurrency || !showConverted || currency.is_base_currency) {
        setConvertedAmount(null);
        return;
      }

      try {
        const conversion = await convertCurrency(currency.code, baseCurrency.code, amount);
        setConvertedAmount({
          amount: conversion.converted_amount,
          symbol: baseCurrency.symbol,
          currencyCode: baseCurrency.code
        });
      } catch (error) {
        console.error('Error converting currency:', error);
      }
    };

    convert();
  }, [amount, currencyId, showConverted, currency, baseCurrency, convertCurrency]);

  if (!currency) {
    // Si no hay moneda específica, intentar usar la moneda base
    if (baseCurrency) {
      return (
        <span className={className}>
          {baseCurrency.symbol}{amount.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </span>
      );
    }
    // Último recurso: mostrar sin símbolo pero con separación de miles
    return (
      <span className={className}>
        {amount.toLocaleString('es-VE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}
      </span>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-baseline space-x-1">
        <span className="font-semibold">{currency.symbol}</span>
        <span>{amount.toLocaleString('es-VE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}</span>
      </div>
      {convertedAmount && (
        <div className="text-xs text-gray-500 mt-0.5">
          ≈ {convertedAmount.symbol}{convertedAmount.amount.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })} {convertedAmount.currencyCode}
        </div>
      )}
    </div>
  );
};
