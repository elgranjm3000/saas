'use client'
import React, { useEffect, useState } from 'react';
import { useCurrencyStore } from '@/store/currency-store';

interface ProductPriceDisplayProps {
  price: number;
  currencyId: number | null;
  showConverted?: boolean;
  className?: string;
}

export const ProductPriceDisplay: React.FC<ProductPriceDisplayProps> = ({
  price,
  currencyId,
  showConverted = true,
  className = ''
}) => {
  const { currencies, convertCurrency } = useCurrencyStore();
  const [convertedPrice, setConvertedPrice] = useState<{
    amount: number;
    symbol: string;
    currencyCode: string;
  } | null>(null);

  const selectedCurrency = currencies.find(c => c.id === currencyId);
  const baseCurrency = currencies.find(c => c.is_base_currency);

  useEffect(() => {
    const convertPrice = async () => {
      if (!selectedCurrency || !baseCurrency || !showConverted) {
        setConvertedPrice(null);
        return;
      }

      // Si ya está en moneda base, no convertir
      if (selectedCurrency.is_base_currency) {
        setConvertedPrice(null);
        return;
      }

      try {
        const conversion = await convertCurrency(
          selectedCurrency.code,
          baseCurrency.code,
          price
        );

        setConvertedPrice({
          amount: conversion.converted_amount,
          symbol: baseCurrency.symbol,
          currencyCode: baseCurrency.code
        });
      } catch (error) {
        console.error('Error converting price:', error);
      }
    };

    convertPrice();
  }, [price, currencyId, selectedCurrency, baseCurrency, showConverted, convertCurrency]);

  if (!selectedCurrency) {
    return <span className={className}>-${price.toFixed(2)}</span>;
  }

  return (
    <div className={className}>
      <span className="font-medium text-gray-900">
        {selectedCurrency.symbol}{price.toFixed(2)}
      </span>
      {convertedPrice && (
        <span className="block text-xs text-gray-500 mt-0.5">
          ≈ {convertedPrice.symbol}{convertedPrice.amount.toFixed(2)} {convertedPrice.currencyCode}
        </span>
      )}
    </div>
  );
};
