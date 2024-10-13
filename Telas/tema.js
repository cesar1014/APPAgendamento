import React, { createContext, useState } from 'react';

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

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
