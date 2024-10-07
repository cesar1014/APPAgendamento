import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { format, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { addAppointment, updateAppointment, getAppointments } from '../database';
import { ThemeContext } from './tema';

const TelaAgendamentos = ({ route, navigation, appointments, setAppointments }) => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const { appointment } = route.params || {};
  const [date, setDate] = useState(appointment ? new Date(appointment.date) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(appointment ? appointment.time : "08:00");
  const [name, setName] = useState(appointment ? appointment.name : "");
  const [phone, setPhone] = useState(appointment ? appointment.phone : "");
  const [serviceDescription, setServiceDescription] = useState(appointment ? appointment.serviceDescription : "");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    StatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content');
    StatusBar.setBackgroundColor(isDarkMode ? '#121212' : '#FFFFFF');
  }, [isDarkMode]);

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formattedDate = format(date, "PPPP", { locale: ptBR });

  const validateInputs = () => {
    const newErrors = {};
    if (!name) newErrors.name = "Nome é obrigatório.";
    if (!phone || phone.length !== 11) newErrors.phone = "O número deve conter 11 dígitos.";
    if (!serviceDescription) newErrors.serviceDescription = "Descrição é obrigatória.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearFields = () => {
    setName('');
    setPhone('');
    setServiceDescription('');
    setDate(new Date());
    setSelectedTime("08:00");
  };

  const saveAppointment = async () => {
    if (!validateInputs()) return;

    const newAppointment = {
      date: date.toISOString().split('T')[0],
      time: selectedTime,
      name,
      phone,
      serviceDescription,
    };

    const existingAppointments = await getAppointments();
    const conflict = existingAppointments.some((app) =>
      app.date === newAppointment.date && app.time === newAppointment.time && app.id !== (appointment ? appointment.id : null)
    );

    if (conflict) {
      Alert.alert(
        "Conflito de horário",
        "Já existe um agendamento para esse horário. Deseja continuar mesmo assim?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Continuar", onPress: () => saveConfirmedAppointment(newAppointment) },
        ]
      );
    } else {
      saveConfirmedAppointment(newAppointment);
    }
  };

  const saveConfirmedAppointment = async (newAppointment) => {
    if (isBefore(new Date(newAppointment.date), new Date())) {
      Alert.alert("Atenção", "Você está marcando um agendamento no passado.");
    }

    if (appointment) {
      await updateAppointment(appointment.id, newAppointment);
      Alert.alert("Sucesso", "Agendamento atualizado com sucesso!");
    } else {
      await addAppointment(newAppointment);
      Alert.alert("Sucesso", "Novo agendamento criado com sucesso!");
    }

    const updatedAppointments = await getAppointments();
    setAppointments(updatedAppointments);
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        <Text style={[styles.title, { color: theme.text }]}>{appointment ? 'Editar Agendamento' : 'Agende um atendimento'}</Text>

        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.card, color: theme.text },
            !isDarkMode && { borderWidth: 1, borderColor: '#ccc' }, // Borda no tema claro
            errors.name && styles.inputError
          ]}
          placeholder="Nome do Cliente"
          placeholderTextColor={theme.text === '#000000' ? '#000000' : '#c7c7cc'}
          onChangeText={setName}
          value={name}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <TextInput
            style={[styles.input, 
              { backgroundColor: theme.card, color: theme.text },
              !isDarkMode && { borderWidth: 1, borderColor: '#ccc' } // Borda no tema claro
            ]}
            placeholder="Selecionar Data"
            placeholderTextColor={theme.text === '#000000' ? '#000000' : '#c7c7cc'}
            value={formattedDate}
            editable={false}
          />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
            locale="pt-BR"
          />
        )}

        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.card, color: theme.text },
            !isDarkMode && { borderWidth: 1, borderColor: '#ccc' }, // Borda no tema claro
            errors.phone && styles.inputError
          ]}
          placeholder="Número de Telefone"
          placeholderTextColor={theme.text === '#000000' ? '#000000' : '#c7c7cc'}
          onChangeText={setPhone}
          value={phone}
          keyboardType="phone-pad"
        />
        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

        <TextInput
          style={[
            styles.descriptionInput,
            { backgroundColor: theme.card, color: theme.text },
            !isDarkMode && { borderWidth: 1, borderColor: '#ccc' }, // Borda no tema claro
            errors.serviceDescription && styles.inputError
          ]}
          placeholder="Descrição do Serviço"
          placeholderTextColor={theme.text === '#000000' ? '#000000' : '#c7c7cc'}
          onChangeText={setServiceDescription}
          value={serviceDescription}
          multiline
        />
        {errors.serviceDescription && <Text style={styles.errorText}>{errors.serviceDescription}</Text>}

        <Text style={[styles.label, { color: theme.text }]}>Selecione o horário:</Text>
        <Picker
          selectedValue={selectedTime}
          style={[styles.picker, { backgroundColor: theme.card }]}
          onValueChange={(itemValue) => setSelectedTime(itemValue)}
        >
          {["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
            "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", 
            "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", 
            "20:00"].map(time => (
            <Picker.Item
              key={time}
              label={time}
              value={time}
              color={time === selectedTime ? (theme.text === '#000000' ? '#000' : 'gray') : '#000000'}
            />
          ))}
        </Picker>

        <Text style={[styles.selectedText, { color: theme.text }]}>Horário selecionado: {selectedTime}</Text>
      </ScrollView>

      <TouchableOpacity style={[styles.saveButton, { backgroundColor: '#8A2BE2' }]} onPress={saveAppointment}>
        <Text style={[styles.saveButtonText, { color: theme.buttonText }]}>
          {appointment ? 'Salvar Alterações' : 'Agendar'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.clearButton} onPress={clearFields}>
        <Text style={styles.clearButtonText}>Limpar Campos</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  inputError: {
    borderColor: '#FF6F61', // Vermelho suave para erros
    borderWidth: 1,
  },
  descriptionInput: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
    height: 120,
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
  },
  picker: {
    marginBottom: 20,
  },
  selectedText: {
    fontSize: 16,
    marginBottom: 20,
  },
  saveButton: {
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    borderRadius: 8,
    elevation: 3, // Sombra para o botão
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#FF6F61', // Botão de limpar
    padding: 15,
    alignItems: 'center',
    borderRadius: 8,
    elevation: 2, // Sombra para o botão
  },
  clearButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

export default TelaAgendamentos;