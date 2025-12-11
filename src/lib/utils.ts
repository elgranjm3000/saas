import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatDate = (date: string | Date | null | undefined, format: 'short' | 'long' = 'short'): string => {
  // Validar que date no sea null o undefined
  if (!date) {
    return '-';
  }

  try {
    let dateObj: Date;
    
    // Convertir string a Date
    if (typeof date === 'string') {
      // Si es una fecha en formato YYYY-MM-DD, agregar hora para evitar problemas de zona horaria
      if (date.includes('T')) {
        dateObj = new Date(date);
      } else {
        // Agregar T00:00:00Z para interpretar como UTC
        dateObj = new Date(date + 'T00:00:00Z');
      }
    } else {
      dateObj = date;
    }

    // Validar que sea una fecha válida
    if (isNaN(dateObj.getTime())) {
      return '-';
    }

    if (format === 'short') {
      // Usar toLocaleDateString si está disponible
      if (typeof dateObj.toLocaleDateString === 'function') {
        try {
          return dateObj.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          });
        } catch (e) {
          // Fallback si toLocaleDateString falla
          return formatDateManual(dateObj, 'short');
        }
      }
      return formatDateManual(dateObj, 'short');
    }

    if (format === 'long') {
      // Usar toLocaleDateString si está disponible
      if (typeof dateObj.toLocaleDateString === 'function') {
        try {
          return dateObj.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        } catch (e) {
          // Fallback si toLocaleDateString falla
          return formatDateManual(dateObj, 'long');
        }
      }
      return formatDateManual(dateObj, 'long');
    }

    return '-';
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};


const formatDateManual = (dateObj: Date, format: 'short' | 'long'): string => {
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  const daysOfWeek = [
    'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'
  ];

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();

  if (format === 'short') {
    return `${day}/${month}/${year}`;
  }

  const dayOfWeek = daysOfWeek[dateObj.getDay()];
  const monthName = months[dateObj.getMonth()];

  return `${dayOfWeek}, ${day} de ${monthName} de ${year}`;
};

// Función para formatear tiempo
export const formatTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return '-';
    }

    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return '-';
  }
};

// Función para formatear fecha y hora combinadas
export const formatDateTime = (date: string | Date, format: 'short' | 'long' = 'short'): string => {
  try {
    const formattedDate = formatDate(date, format);
    const formattedTime = formatTime(date);

    if (formattedDate === '-' || formattedTime === '-') {
      return '-';
    }

    return `${formattedDate} ${formattedTime}`;
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '-';
  }
};

// Función para obtener la diferencia de días desde hoy
export const getDaysDifference = (date: string | Date): number => {
  try {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    
    // Establecer las horas a 0 para comparar solo fechas
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  } catch (error) {
    console.error('Error calculating days difference:', error);
    return 0;
  }
};

// Función para validar si una fecha es válida
export const isValidDate = (date: string | Date): boolean => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return !isNaN(dateObj.getTime());
  } catch {
    return false;
  }
};

// Función para obtener el estado de vencimiento de una factura
export const getInvoiceStatus = (dueDate: string | Date): 'vencida' | 'proxima' | 'vigente' => {
  const daysDiff = getDaysDifference(dueDate);

  if (daysDiff < 0) {
    return 'vencida';
  } else if (daysDiff <= 7) {
    return 'proxima';
  } else {
    return 'vigente';
  }
};

export const generateSKU = (prefix: string = 'PROD'): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};
