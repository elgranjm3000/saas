'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { erpClasses } from '@/lib/design-utils'

// Componente de Header Uniforme
interface ERPHeaderProps {
  title: string
  subtitle: string
  actionButton?: {
    label: string
    icon?: LucideIcon
    href?: string
    onClick?: () => void
  }
}

export function ERPHeader({ title, subtitle, actionButton }: ERPHeaderProps) {
  return (
    <div className={erpClasses.headerSection}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={erpClasses.headerTitle} style={{ color: 'var(--color-primary)' }}>
            {title}
          </h1>
          <p className={erpClasses.headerSubtitle} style={{ color: 'var(--color-text-light)' }}>
            {subtitle}
          </p>
        </div>
        {actionButton && (
          <div className="ml-4">
            {actionButton.href ? (
              <Link href={actionButton.href} className={erpClasses.btnPrimary}>
                {actionButton.icon && <actionButton.icon className="w-4 h-4 mr-2" />}
                <span>{actionButton.label}</span>
              </Link>
            ) : (
              <button onClick={actionButton.onClick} className={erpClasses.btnPrimary}>
                {actionButton.icon && <actionButton.icon className="w-4 h-4 mr-2" />}
                <span>{actionButton.label}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Componente de Stats Card Uniforme
interface ERPStatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: 'primary' | 'accent' | 'success' | 'warning'
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
}

export function ERPStatCard({ title, value, icon: Icon, color, change, changeType }: ERPStatCardProps) {
  const colorMap = {
    primary: 'var(--color-primary)',
    accent: 'var(--color-accent)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)'
  }

  return (
    <div className="erp-stat-card" style={{ borderLeftColor: colorMap[color] }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-light)' }}>
            {title}
          </p>
          <p className="erp-stat-value">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              <span
                className={`text-sm font-medium ${
                  changeType === 'positive' ? 'text-green-600' :
                  changeType === 'negative' ? 'text-red-600' : 'text-orange-600'
                }`}
              >
                {change}
              </span>
            </div>
          )}
        </div>
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform"
          style={{ background: colorMap[color] }}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </div>
  )
}

// Componente de Search Uniforme
interface ERPSearchProps {
  placeholder: string
  value: string
  onChange: (value: string) => void
}

export function ERPSearch({ placeholder, value, onChange }: ERPSearchProps) {
  return (
    <div className="erp-card p-6 mb-8">
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={erpClasses.searchInput}
        />
      </div>
    </div>
  )
}

// Componente de Badge Uniforme
interface ERPBadgeProps {
  text: string
  type: 'success' | 'warning' | 'danger'
  icon?: LucideIcon
}

export function ERPBadge({ text, type, icon: Icon }: ERPBadgeProps) {
  return (
    <span className={`erp-badge ${type}`}>
      {Icon && <Icon className="w-3 h-3 mr-1" />}
      {text}
    </span>
  )
}

// Componente de Card Container
interface ERPCardProps {
  children: React.ReactNode
  className?: string
}

export function ERPCard({ children, className = '' }: ERPCardProps) {
  return (
    <div className={`erp-card ${className}`}>
      {children}
    </div>
  )
}

// Componente de Table Container
interface ERPTableCardProps {
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
}

export function ERPTableCard({ title, children, actions }: ERPTableCardProps) {
  return (
    <div className="erp-card overflow-hidden">
      <div className="p-6 border-b" style={{ borderColor: 'var(--color-neutral)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-light" style={{ color: 'var(--color-primary)' }}>{title}</h3>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      </div>
      {children}
    </div>
  )
}

// Componente de Action Button
interface ERPActionButtonProps {
  label: string
  icon?: LucideIcon
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
}

export function ERPActionButton({ label, icon: Icon, href, onClick, variant = 'primary' }: ERPActionButtonProps) {
  const baseClasses = 'flex items-center px-6 py-3 rounded-2xl transition-all font-medium'

  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  }

  const classes = `${baseClasses} ${variantClasses[variant]}`

  if (href) {
    return (
      <Link href={href} className={classes}>
        {Icon && <Icon className="w-4 h-4 mr-2" />}
        <span>{label}</span>
      </Link>
    )
  }

  return (
    <button onClick={onClick} className={classes}>
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      <span>{label}</span>
    </button>
  )
}