'use client'
import { useEffect, useState } from 'react'

interface CurrencyRate {
  code: string
  rate: number
  change: number
}

export default function CurrencyTicker() {
  const [rates, setRates] = useState<CurrencyRate[]>([
    { code: 'USD', rate: 36.50, change: 0.5 },
    { code: 'EUR', rate: 39.42, change: -0.2 },
    { code: 'BTC', rate: 2430000, change: 1.2 },
  ])

  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())

      // Simular actualización de tasas
      setRates(prev => prev.map(rate => ({
        ...rate,
        rate: rate.rate + (Math.random() - 0.5) * 0.1,
        change: (Math.random() - 0.5) * 2
      })))
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="currency-ticker px-6 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {rates.map((rate) => (
            <div key={rate.code} className="flex items-center space-x-2">
              <span className="text-white/80 text-sm font-medium">{rate.code}</span>
              <span className="numeros-mono text-white text-sm">
                {rate.rate.toFixed(2)}
              </span>
              <span className={`text-xs ${rate.change >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {rate.change >= 0 ? '▲' : '▼'} {Math.abs(rate.change).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>

        <div className="text-white/60 text-xs">
          {currentTime.toLocaleTimeString('es-VE', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
      </div>
    </div>
  )
}
