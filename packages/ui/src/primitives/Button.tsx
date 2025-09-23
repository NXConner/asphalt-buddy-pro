import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', ...props }) => {
  const base = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const styles =
    variant === 'primary'
      ? 'bg-black text-white hover:bg-gray-800 focus:ring-black'
      : 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400';
  return <button className={`${base} ${styles} ${className}`} {...props} />;
};

