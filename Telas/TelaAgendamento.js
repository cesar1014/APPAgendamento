<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { addAppointment, getAppointments, updateAppointment } from '../database'; // Import update function

const TelaAgendamentos = ({ route, navigation, appointments, setAppointments }) => {
  const { appointment } = route.params || {}; // Recebe os dados do agendamento, se houver
=======
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
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
  const [date, setDate] = useState(appointment ? new Date(appointment.date) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(appointment ? appointment.time : "08:00");
  const [name, setName] = useState(appointment ? appointment.name : "");
  const [phone, setPhone] = useState(appointment ? appointment.phone : "");
  const [serviceDescription, setServiceDescription] = useState(appointment ? appointment.serviceDescription : "");
<<<<<<< HEAD

  useEffect(() => {
    const loadAppointments = async () => {
      const storedAppointments = await getAppointments();
      setAppointments(storedAppointments);
    };
    loadAppointments();
  }, []);

  const isSlotTaken = (date, time) => {
    return appointments.some(
      (appt) => 
        appt.date === date.toDateString() &&
        appt.time === time &&
        appt.id !== (appointment ? appointment.id : null) // Ignora o próprio agendamento ao editar
    );
  };
=======
  const [errors, setErrors] = useState({});

  useEffect(() => {
    StatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content');
    StatusBar.setBackgroundColor(isDarkMode ? '#121212' : '#FFFFFF');
  }, [isDarkMode]);
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

<<<<<<< HEAD
  const validatePhone = (phone) => {
    const phoneRegex = /^\d{11}$/;
    return phoneRegex.test(phone);
  };

  const formattedDate = format(date, "PPPP", { locale: ptBR });

  const saveAppointment = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      alert("A data já passou. Escolha uma data futura.");
      return;
    }

    if (!name.trim()) {
      alert("O nome do cliente é obrigatório.");
      return;
    }

    if (!validatePhone(phone)) {
      alert("Número de telefone inválido.");
      return;
    }

    if (isSlotTaken(date, selectedTime)) {
      alert("Este horário já está ocupado. Escolha outro.");
      return;
    }

    const newAppointment = {
      date: date.toDateString(),
=======
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
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
      time: selectedTime,
      name,
      phone,
      serviceDescription,
    };

<<<<<<< HEAD
    if (appointment) {
      // Atualizar agendamento existente
      await updateAppointment(appointment.id, newAppointment);
    } else {
      // Adicionar novo agendamento
      await addAppointment(newAppointment);
=======
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
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
    }

    const updatedAppointments = await getAppointments();
    setAppointments(updatedAppointments);
<<<<<<< HEAD
    alert('Agendamento salvo com sucesso!');
=======
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
    navigation.goBack();
  };

  return (
<<<<<<< HEAD
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>{appointment ? 'Editar Agendamento' : 'Agende um atendimento'}</Text>

        <TextInput
          style={styles.input}
          placeholder="Nome do Cliente"
          placeholderTextColor="#c7c7cc"
          onChangeText={setName}
          value={name}
        />

        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <TextInput
            style={styles.input}
            placeholder="Selecionar Data"
            placeholderTextColor="#c7c7cc"
=======
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        <Text style={[styles.title, { color: theme.text }]}>{appointment ? 'Editar Agendamento' : 'Agende um atendimento'}</Text>

        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.card, color: theme.text },
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
            style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
            placeholder="Selecionar Data"
            placeholderTextColor={theme.text === '#000000' ? '#000000' : '#c7c7cc'}
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
            value={formattedDate}
            editable={false}
          />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
<<<<<<< HEAD
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
=======
            display="default"
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
            onChange={onDateChange}
            locale="pt-BR"
          />
        )}

        <TextInput
<<<<<<< HEAD
          style={styles.input}
          placeholder="Número de Telefone"
          placeholderTextColor="#c7c7cc"
=======
          style={[
            styles.input,
            { backgroundColor: theme.card, color: theme.text },
            errors.phone && styles.inputError
          ]}
          placeholder="Número de Telefone"
          placeholderTextColor={theme.text === '#000000' ? '#000000' : '#c7c7cc'}
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
          onChangeText={setPhone}
          value={phone}
          keyboardType="phone-pad"
        />
<<<<<<< HEAD

        <TextInput
          style={styles.descriptionInput}
          placeholder="Descrição do Serviço"
          placeholderTextColor="#c7c7cc"
=======
        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

        <TextInput
          style={[
            styles.descriptionInput,
            { backgroundColor: theme.card, color: theme.text },
            errors.serviceDescription && styles.inputError
          ]}
          placeholder="Descrição do Serviço"
          placeholderTextColor={theme.text === '#000000' ? '#000000' : '#c7c7cc'}
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
          onChangeText={setServiceDescription}
          value={serviceDescription}
          multiline
        />
<<<<<<< HEAD

        <Text style={styles.label}>Selecione o horário:</Text>
        <Picker
          selectedValue={selectedTime}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedTime(itemValue)}
        >
          {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00","19:00","20:00"].map(time => (
=======
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
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
            <Picker.Item
              key={time}
              label={time}
              value={time}
<<<<<<< HEAD
              color={isSlotTaken(date, time) ? 'gray' : 'black'}
=======
              color={time === selectedTime ? (theme.text === '#000000' ? '#000' : 'gray') : '#000000'}
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
            />
          ))}
        </Picker>

<<<<<<< HEAD
        <Text style={styles.selectedText}>Horário selecionado: {selectedTime}</Text>
      </ScrollView>

      <TouchableOpacity style={styles.saveButton} onPress={saveAppointment}>
        <Text style={styles.saveButtonText}>{appointment ? 'Salvar Alterações' : 'Agendar'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelButtonText}>Cancelar</Text>
=======
        <Text style={[styles.selectedText, { color: theme.text }]}>Horário selecionado: {selectedTime}</Text>
      </ScrollView>

      <TouchableOpacity style={[styles.saveButton, { backgroundColor: '#8A2BE2' }]} onPress={saveAppointment}>
  <Text style={[styles.saveButtonText, { color: theme.buttonText }]}>
    {appointment ? 'Salvar Alterações' : 'Agendar'}
  </Text>
</TouchableOpacity>


      <TouchableOpacity style={styles.clearButton} onPress={clearFields}>
        <Text style={styles.clearButtonText}>Limpar Campos</Text>
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
<<<<<<< HEAD
    backgroundColor: '#151515',
=======
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
<<<<<<< HEAD
    color: '#FFFFFF',
=======
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
<<<<<<< HEAD
    backgroundColor: '#23242C',
    color: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  descriptionInput: {
    backgroundColor: '#23242C',
    color: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    height: 80,
  },
  label: {
    color: '#FFFFFF',
=======
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 1,
  },
  descriptionInput: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
    height: 120,
  },
  label: {
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
    fontSize: 18,
    marginBottom: 10,
  },
  picker: {
<<<<<<< HEAD
    backgroundColor: '#23242C',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  selectedText: {
    color: '#FFFFFF',
=======
    marginBottom: 20,
  },
  selectedText: {
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
    fontSize: 16,
    marginBottom: 20,
  },
  saveButton: {
<<<<<<< HEAD
    backgroundColor: '#9282FA',
    padding: 15,
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 15,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
=======
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    borderRadius: 8, 
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: 'brown',
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
    padding: 15,
    alignItems: 'center',
    borderRadius: 8,
  },
<<<<<<< HEAD
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
=======
  clearButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
});

export default TelaAgendamentos;