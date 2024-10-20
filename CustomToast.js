// components/CustomToast.js
import React, { useContext } from 'react';
import { BaseToast } from 'react-native-toast-message';
import { ThemeContext } from './Telas/tema';

export default function CustomToast(props) {
  const { theme } = useContext(ThemeContext);

  return (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: theme.buttonBackground,
        backgroundColor: theme.card,
      }}
      contentContainerStyle={{ backgroundColor: theme.card }}
      text1Style={{ color: theme.text }}
      text2Style={{ color: theme.text }}
    />
  );
}
