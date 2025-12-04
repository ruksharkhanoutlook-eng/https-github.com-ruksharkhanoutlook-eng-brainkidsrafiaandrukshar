import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "font-bold rounded-xl transition-all duration-200 shadow-md transform active:scale-95 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-brand-500 hover:bg-brand-600 text-white shadow-brand-500/30",
    secondary: "bg-white hover:bg-gray-50 text-brand-600 border-2 border-brand-100",
    accent: "bg-accent-purple hover:bg-purple-600 text-white shadow-purple-500/30",
    danger: "bg-accent-red hover:bg-red-600 text-white",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-xl",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
      {...props}
    >
      {children}
    </button>
  );
};