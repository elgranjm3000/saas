/**
 * Utilidades de Diseño ERP - Sistema de Componentes Uniformes
 * Facilita la aplicación consistente del sistema de diseño en toda la aplicación
 */

// Clases CSS para el sistema de diseño ERP
export const erpClasses = {
  // Contenedores principales
  container: 'p-6 lg:p-8',
  card: 'erp-card',
  statCard: 'erp-stat-card',

  // Headers
  headerTitle: 'text-3xl font-light mb-3',
  headerSubtitle: 'font-light text-lg',
  headerSection: 'mb-10',

  // Inputs
  input: 'erp-input',
  searchInput: 'erp-input w-full pl-12',

  // Botones
  btnPrimary: 'btn-primary',
  btnSecondary: 'px-6 py-3 text-gray-600 bg-white/80 border border-gray-200/60 rounded-2xl hover:bg-white hover:border-gray-300 transition-all font-light',

  // Tablas
  table: 'erp-table',
  tableHeader: 'text-left py-4 px-6 font-medium',
  tableCell: 'py-4 px-6',

  // Badges
  badge: 'erp-badge',
  badgeSuccess: 'erp-badge success',
  badgeWarning: 'erp-badge warning',
  badgeDanger: 'erp-badge danger',

  // Iconos con colores del sistema
  iconPrimary: 'w-4 h-4',
  iconAccent: 'w-4 h-4',
  iconSuccess: 'w-4 h-4',
  iconWarning: 'w-4 h-4',
  iconDanger: 'w-4 h-4',

  // Colores del sistema (para estilos inline)
  colors: {
    primary: '#1B4965',
    primaryLight: '#2C5F8D',
    accent: '#D4A017',
    success: '#2E7D32',
    warning: '#F57C00',
    danger: '#C62828',
    neutral: '#FAFAFA',
    text: '#212121',
    textLight: '#757575',
  }
}

// Componentes de Header uniformes
export const createHeaderSection = (title: string, subtitle: string, actionButton?: JSX.Element) => `
  <div className="${erpClasses.headerSection}">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="${erpClasses.headerTitle}" style="color: var(--color-primary)">${title}</h1>
        <p class="${erpClasses.headerSubtitle}" style="color: var(--color-text-light)">${subtitle}</p>
      </div>
      ${actionButton ? '<div class="ml-4">' + actionButton + '</div>' : ''}
    </div>
  </div>
`

// Stats Cards uniformes
export const createStatCard = (title: string, value: string | number, icon: string, color: 'primary' | 'accent' | 'success' | 'warning', change?: string) => {
  const colorMap = {
    primary: 'var(--color-primary)',
    accent: 'var(--color-accent)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)'
  }

  return `
    <div class="erp-stat-card" style="border-left-color: ${colorMap[color]}">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-medium uppercase tracking-wider mb-2" style="color: var(--color-text-light)">${title}</p>
          <p class="erp-stat-value">${value}</p>
          ${change ? `<div class="flex items-center mt-2">
            <span class="text-sm font-medium" style="color: ${colorMap.success}">${change}</span>
          </div>` : ''}
        </div>
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style="background: ${colorMap[color]}">
          ${icon}
        </div>
      </div>
    </div>
  `
}

// Componentes de búsqueda uniformes
export const createSearchSection = (placeholder: string, value: string, onChange: string) => `
  <div class="erp-card p-6 mb-8">
    <div class="relative max-w-md">
      <input
        type="text"
        placeholder="${placeholder}"
        value="${value}"
        ${onChange}
        class="${erpClasses.searchInput}"
      />
    </div>
  </div>
`

// Badges semánticos
export const createBadge = (text: string, type: 'success' | 'warning' | 'danger') => {
  const typeMap = {
    success: 'erp-badge success',
    warning: 'erp-badge warning',
    danger: 'erp-badge danger'
  }
  return `<span class="${typeMap[type]}">${text}</span>`
}

// Función para actualizar estilos inline
export const getInlineStyle = (colorName: keyof typeof erpClasses.colors) => {
  return `color: ${erpClasses.colors[colorName]}` || `background: ${erpClasses.colors[colorName]}`
}

// Mapeo de íconos a colores
export const getIconColor = (type: 'primary' | 'accent' | 'success' | 'warning' | 'danger') => {
  return {
    primary: 'var(--color-primary)',
    accent: 'var(--color-accent)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)'
  }[type]
}