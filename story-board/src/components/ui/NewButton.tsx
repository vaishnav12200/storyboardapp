'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/helpers';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background relative overflow-hidden active:scale-95',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl',
        destructive: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl',
        outline: 'border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 backdrop-blur-sm hover:text-gray-900',
        secondary: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 hover:from-gray-200 hover:to-gray-300 shadow-md hover:shadow-lg',
        ghost: 'hover:bg-gray-100 hover:text-gray-900 text-gray-700',
        link: 'underline-offset-4 hover:underline text-indigo-600 hover:text-indigo-700',
        success: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl',
        warning: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 shadow-lg hover:shadow-xl',
        premium: 'bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 text-white hover:from-violet-700 hover:via-purple-700 hover:to-blue-700 shadow-xl hover:shadow-2xl border border-purple-400/50',
      },
      size: {
        default: 'h-11 py-3 px-6',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-13 px-8 text-base',
        xl: 'h-16 px-12 text-lg font-bold',
        icon: 'h-11 w-11',
        'icon-sm': 'h-9 w-9',
        'icon-lg': 'h-13 w-13',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, onClick, ...props }, ref) => {
    return (
      <motion.button
        whileHover={{ scale: variant === 'ghost' || variant === 'link' ? 1.02 : 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || disabled}
        onClick={onClick}
        type={props.type || 'button'}
      >
        <div className="flex items-center justify-center">
          {loading && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
            />
          )}
          {!loading && leftIcon && (
            <span className="mr-2 flex items-center">{leftIcon}</span>
          )}
          {children}
          {!loading && rightIcon && (
            <span className="ml-2 flex items-center">{rightIcon}</span>
          )}
        </div>
        
        {/* Shine effect */}
        {(variant === 'default' || variant === 'premium') && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.6 }}
          />
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;