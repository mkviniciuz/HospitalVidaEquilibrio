import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const PreferencesContext = createContext();

export function usePreferences() {
  return useContext(PreferencesContext);
}

export function PreferencesProvider({ children }) {
  const getUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user ? user.id : null;
    } catch {
      return null;
    }
  };

  const getSavedTheme = () => {
    const userId = getUserId();
    if (userId) return localStorage.getItem(`theme_${userId}`) || 'light';
    return localStorage.getItem('theme') || 'light';
  };

  const getSavedLayout = () => {
    const userId = getUserId();
    if (userId) return localStorage.getItem(`layout_${userId}`) || 'sidebar';
    return localStorage.getItem('layout') || 'sidebar';
  };

  const [theme, setTheme] = useState(getSavedTheme);
  const [layout, setLayout] = useState(getSavedLayout);
  const [appSettings, setAppSettings] = useState({
    app_name: 'Vida Equilíbrio',
    app_logo: null,
    app_primary_color: '#5d9e90'
  });

  const reloadPreferences = () => {
    setTheme(getSavedTheme());
    setLayout(getSavedLayout());
    fetchAppSettings();
  };

  const fetchAppSettings = async () => {
    try {
      const data = await api.getAppSettings();
      if (data) setAppSettings(data);
    } catch (err) {
      console.error('Erro ao carregar configurações do app:', err);
    }
  };

  useEffect(() => {
    fetchAppSettings();
  }, []);

  useEffect(() => {
    const userId = getUserId();
    const key = userId ? `theme_${userId}` : 'theme';
    localStorage.setItem(key, theme);
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const userId = getUserId();
    const key = userId ? `layout_${userId}` : 'layout';
    localStorage.setItem(key, layout);
  }, [layout]);

  useEffect(() => {
    if (appSettings?.app_primary_color) {
      document.documentElement.style.setProperty('--primary-color', appSettings.app_primary_color);
    }
  }, [appSettings]);

  const value = {
    theme,
    setTheme,
    layout,
    setLayout,
    appSettings,
    reloadPreferences
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}
