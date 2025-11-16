'use client';

import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from '@/lib/store';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { loadUserFromStorage } from '@/lib/store/authSlice';
import { setTheme } from '@/lib/store/uiSlice';

// Auth initialization component
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Try to load user from storage on app start
    dispatch(loadUserFromStorage());
  }, [dispatch]);

  return <>{children}</>;
}

// Theme provider component
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useAppSelector((state) => state.ui);
  const dispatch = useAppDispatch();
  const [isInitialized, setIsInitialized] = useState(false);

  // Load theme from localStorage on mount - only once
  useEffect(() => {
    if (!isInitialized) {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        dispatch(setTheme(savedTheme));
      }
      setIsInitialized(true);
    }
  }, [dispatch, isInitialized]);

  // Apply theme changes to DOM and save to localStorage
  useEffect(() => {
    if (isInitialized) {
      const htmlElement = document.documentElement;
      
      // Remove both classes first
      htmlElement.classList.remove('light', 'dark');
      
      // Add the current theme class
      htmlElement.classList.add(theme);
      
      // Also set data attribute for more flexibility
      htmlElement.setAttribute('data-theme', theme);
      
      // Update CSS custom properties if needed
      if (theme === 'dark') {
        htmlElement.style.colorScheme = 'dark';
      } else {
        htmlElement.style.colorScheme = 'light';
      }

      // Save to localStorage
      localStorage.setItem('theme', theme);
    }
  }, [theme, isInitialized]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#374151',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb',
              borderRadius: '0.75rem',
              padding: '16px',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthInitializer>
    </Provider>
  );
}