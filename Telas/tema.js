import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Importando AsyncStorage

const lightTheme = {
  background: '#FFFFFF',
  card: '#F0F0F0',
  text: '#000000',
  buttonBackground: '#007AFF',
  buttonText: '#FFFFFF',
  headerBackground: '#F8F8F8',
  headerText: '#000000',
};

const darkTheme = {
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  buttonBackground: '#007AFF',
  buttonText: '#FFFFFF',
  headerBackground: '#1E1E1E',
  headerText: '#FFFFFF',
};

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoadingTheme, setIsLoadingTheme] = useState(true); // Para carregar o tema no início

  useEffect(() => {
    // Recuperar o tema do AsyncStorage quando o app iniciar
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('themePreference');
        if (storedTheme !== null) {
          setIsDarkMode(storedTheme === 'dark'); // Aplica o tema salvo
        }
      } catch (error) {
        console.error("Erro ao carregar o tema:", error);
      } finally {
        setIsLoadingTheme(false); // Indica que o carregamento terminou
      }
    };

    loadTheme();
  }, []);

  // Alterna entre o modo claro e escuro e salva a preferência no AsyncStorage
  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode ? 'dark' : 'light';
      await AsyncStorage.setItem('themePreference', newTheme); // Salva a preferência
      setIsDarkMode(!isDarkMode); // Alterna o tema
    } catch (error) {
      console.error("Erro ao salvar o tema:", error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  if (isLoadingTheme) {
    return null; // Retorna nulo enquanto o tema está carregando, para evitar telas em branco
  }

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
