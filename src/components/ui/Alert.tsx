import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-500',
    title: 'text-blue-800',
    text: 'text-blue-700',
  },
  success: {
    container: 'bg-green-50 border-green-200',
    icon: 'text-green-500',
    title: 'text-green-800',
    text: 'text-green-700',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200',
    icon: 'text-yellow-500',
    title: 'text-yellow-800',
    text: 'text-yellow-700',
  },
  error: {
    container: 'bg-red-50 border-red-200',
    icon: 'text-red-500',
    title: 'text-red-800',
    text: 'text-red-700',
  },
};

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle,
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  className = '',
}) => {
  const styles = variantStyles[variant];
  const Icon = icons[variant];

  return (
    <div
      className={`flex p-4 rounded-lg border ${styles.container} ${className}`}
      role="alert"
    >
      <Icon className={`w-5 h-5 ${styles.icon} flex-shrink-0`} />
      <div className="ml-3">
        {title && (
          <h3 className={`text-sm font-medium ${styles.title}`}>{title}</h3>
        )}
        <div className={`text-sm ${styles.text} ${title ? 'mt-1' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
};
