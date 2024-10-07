// Toast.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';

const CustomToast = () => {
  return (
    <Toast
      ref={(ref) => Toast.setRef(ref)}
      config={{
        success: (internalState) => (
          <View style={styles.toast}>
            <Text style={styles.text}>{internalState.text1}</Text>
            <Text style={styles.text}>{internalState.text2}</Text>
          </View>
        ),
      }}
    />
  );
};

const styles = StyleSheet.create({
  toast: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  text: {
    color: '#fff',
  },
});

export default CustomToast;