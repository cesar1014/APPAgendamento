import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const lightTheme = {
    background: '#FFFFFF',
    text: '#000000',
    card: '#F0F0F0',
    headerBackground: '#F0F0F0',
    headerText: '#000000',
    buttonBackground: '#8A2BE2',
  };

  const darkTheme = {
    background: '#1C1C1C',
    text: '#FFFFFF',
    card: '#333333',
    headerBackground: '#1C1C1C',
    headerText: '#FFFFFF',
    buttonBackground: '#8A2BE2',
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  // Alternar o tema e salvar a escolha no AsyncStorage
  const toggleTheme = async () => {
    const newIsDarkMode = !isDarkMode;
    setIsDarkMode(newIsDarkMode);
    try {
      await AsyncStorage.setItem('theme', newIsDarkMode ? 'dark' : 'light');
    } catch (e) {
      console.error('Erro ao salvar a preferência de tema:', e);
    }
  };

  // Carregar a preferência de tema ao iniciar o app
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('theme');
        if (storedTheme === 'dark') {
          setIsDarkMode(true);
        } else {
          setIsDarkMode(false);
        }
      } catch (e) {
        console.error('Erro ao carregar a preferência de tema:', e);
      }
    };

    loadTheme(); // Carrega o tema ao montar o componente
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
