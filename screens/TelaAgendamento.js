import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TelaAgendamentos = ({ navigation, appointments, setAppointments }) => {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState("08:00");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");

  const isSlotTaken = (date, time) => {
    return appointments.some(
      (appointment) => appointment.date === date.toDateString() && appointment.time === time
    );
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\d{11}$/;
    return phoneRegex.test(phone);
  };

  const formattedDate = format(date, "PPPP", { locale: ptBR });

  const saveAppointment = () => {
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
      id: Math.random().toString(),
      date: date.toDateString(),
      time: selectedTime,
      name,
      phone,
      serviceDescription,
    };

    const updatedAppointments = [...appointments, newAppointment];
    setAppointments(updatedAppointments);
    alert('Agendamento salvo com sucesso!');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Agende um atendimento</Text>

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
            value={formattedDate}
            editable={false}
          />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            locale="pt-BR"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Número de Telefone"
          placeholderTextColor="#c7c7cc"
          onChangeText={setPhone}
          value={phone}
          keyboardType="phone-pad"
        />

        <TextInput
          style={styles.descriptionInput}
          placeholder="Descrição do Serviço"
          placeholderTextColor="#c7c7cc"
          onChangeText={setServiceDescription}
          value={serviceDescription}
          multiline
        />

        <Text style={styles.label}>Selecione o horário:</Text>
        <Picker
          selectedValue={selectedTime}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedTime(itemValue)}
        >
          {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"].map(time => (
            <Picker.Item
              key={time}
              label={time}
              value={time}
              color={isSlotTaken(date, time) ? 'gray' : 'black'}
            />
          ))}
        </Picker>

        <Text style={styles.selectedText}>Horário selecionado: {selectedTime}</Text>
      </ScrollView>

      <TouchableOpacity style={styles.saveButton} onPress={saveAppointment}>
        <Text style={styles.saveButtonText}>Agendar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelButtonText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#151515',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
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
    fontSize: 18,
    marginBottom: 10,
  },
  picker: {
    backgroundColor: '#23242C',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  selectedText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 20,
  },
  saveButton: {
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
    padding: 15,
    alignItems: 'center',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TelaAgendamentos;
