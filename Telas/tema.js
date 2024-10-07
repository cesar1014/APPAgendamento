import React, { createContext, useState } from 'react';

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

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};