<<<<<<< HEAD
import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAppointments, deleteAppointment } from '../database';
=======
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAppointments, deleteAppointment } from '../database';
import { ThemeContext } from './tema'; // Use o contexto de tema
import DateTimePicker from '@react-native-community/datetimepicker';
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)

const getPeriodIcon = (time) => {
  const [hour] = time.split(':').map(Number);
  if (hour >= 8 && hour < 12) {
    return { icon: '🌅', period: 'Manhã' };
  } else if (hour >= 12 && hour < 18) {
<<<<<<< HEAD
    return { icon: '🌞', period: 'Tarde' };
=======
    return { icon: '🌇', period: 'Tarde' };
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
  } else if (hour >= 18 && hour <= 20) {
    return { icon: '🌙', period: 'Noite' };
  }
  return { icon: '', period: '' };
};

const AppointmentCard = ({ appointment, onEdit, onDelete }) => {
<<<<<<< HEAD
  const { icon, period } = getPeriodIcon(appointment.time);
  const [showActions, setShowActions] = React.useState(false);

  return (
    <TouchableOpacity onPress={() => setShowActions(!showActions)}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.periodText}>
            {icon} {period}
          </Text>
          <Text style={styles.cardTime}>
            {appointment.time}
            {!isSameDay(new Date(appointment.date), new Date()) && (
              <Text style={styles.dateText}>
                {' '}
                {format(new Date(appointment.date), 'dd/MM', { locale: ptBR })}
              </Text>
=======
  const { theme, isDarkMode } = useContext(ThemeContext);
  const { icon, period } = getPeriodIcon(appointment.time);
  const [showActions, setShowActions] = useState(false);

  return (
    <TouchableOpacity onPress={() => setShowActions(!showActions)}>
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={styles.header}>
          <Text style={[styles.periodText, { color: theme.text }]}>{icon} {period}</Text>
          <Text style={[styles.cardTime, { color: theme.text }]}>
            {appointment.time}
            {!isSameDay(new Date(appointment.date), new Date()) && (
              <Text style={styles.dateText}> {format(new Date(appointment.date), 'dd/MM', { locale: ptBR })}</Text>
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
            )}
          </Text>
        </View>
        <View style={styles.cardContent}>
<<<<<<< HEAD
          <Text style={styles.cardTitle}>
            {appointment.name} ({appointment.phone})
          </Text>
          <Text style={styles.cardDescription}>{appointment.serviceDescription}</Text>
          {showActions && (
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => onEdit(appointment)}>
                <Text style={styles.editText}>Alterar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(appointment)}>
                <Text style={styles.removeText}>Excluir</Text>
=======
          <Text style={[styles.cardTitle, { color: theme.text }]}>{appointment.name} ({appointment.phone})</Text>
          <Text style={[styles.cardDescription, { color: isDarkMode ? '#9282FA' : theme.subText }]}>
            {appointment.serviceDescription}
          </Text>
          {showActions && (
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => onEdit(appointment)}>
                <Text style={[styles.editText, { color: theme.buttonBackground }]}>Alterar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(appointment)}>
                <Text style={[styles.removeText, { color: 'red' }]}>Excluir</Text>
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function TelaInicial({ navigation, appointments, setAppointments }) {
<<<<<<< HEAD
  useEffect(() => {
    const loadAppointments = async () => {
      const storedAppointments = await getAppointments();

      // Ordena os agendamentos pelo mais próximo (data e hora)
      const sortedAppointments = storedAppointments.sort((a, b) => {
        // Converte a data e hora para objetos Date para comparação
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA - dateB; // Ordena do mais próximo para o mais distante
      });

      // Atualiza o estado com os agendamentos ordenados
      setAppointments(sortedAppointments);
    };

    loadAppointments();
  }, []);

=======
  const { theme } = useContext(ThemeContext);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const loadAppointments = async () => {
      const storedAppointments = await getAppointments();
      setAppointments(storedAppointments);
      setFilteredAppointments(storedAppointments);
    };
    loadAppointments();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const filtered = appointments.filter((app) => isSameDay(new Date(app.date), selectedDate));
      setFilteredAppointments(filtered);
    } else {
      setFilteredAppointments(appointments);
    }
  }, [selectedDate, appointments]);

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    } else {
      setSelectedDate(null);
    }
  };

  const handleDelete = (appointment) => {
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir o agendamento de ${appointment.name}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          onPress: async () => {
            await deleteAppointment(appointment.id);
            const updatedAppointments = await getAppointments();
            setAppointments(updatedAppointments);
            Alert.alert("Sucesso", `Agendamento excluído: ${appointment.name}`);
          },
          style: "destructive",
        },
      ]
    );
  };

>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
  const handleEdit = (appointment) => {
    navigation.navigate('AGENDAMENTO', { appointment });
  };

<<<<<<< HEAD
  const handleDelete = async (appointment) => {
    await deleteAppointment(appointment.id);
    const updatedAppointments = await getAppointments();
    setAppointments(updatedAppointments);
    Alert.alert("Sucesso", `Agendamento excluído: ${appointment.name}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sua agenda</Text>
      <FlatList
        data={appointments}
=======
  const clearFilter = () => {
    setSelectedDate(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Sua agenda</Text>
      <Text style={[styles.subtitle, { color: theme.text }]}>
        Aqui você pode ver todos os clientes e serviços agendados para hoje.
      </Text>

      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.dateFilterButton, { backgroundColor: theme.card }]}>
        <Image
          source={require('../assets/IconesTelaInicial/Calendario.png')}
          style={styles.calendarIcon}
        />
        <Text style={[styles.filterText, { color: theme.text }]}>
          {selectedDate
            ? format(new Date(selectedDate), 'dd/MM/yyyy', { locale: ptBR })
            : 'Selecionar data'}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {selectedDate && (
        <TouchableOpacity onPress={clearFilter} style={[styles.clearFilterButton, { backgroundColor: '#8A2BE2' }]}>
          <Text style={[styles.clearFilterText, { color: '#FFFFFF' }]}>Mostrar Todos</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={filteredAppointments}
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <AppointmentCard
            appointment={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
<<<<<<< HEAD
      />
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('AGENDAMENTO')}
      >
        <Text style={styles.buttonText}>Novo Agendamento</Text>
=======
        ListEmptyComponent={() => (
          <Text style={[styles.emptyText, { color: theme.text }]}>
            Nenhum agendamento encontrado.
          </Text>
        )}
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#8A2BE2' }]}
        onPress={() => navigation.navigate('AGENDAMENTO')}
      >
        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Novo Agendamento</Text>
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
<<<<<<< HEAD
    backgroundColor: '#151515',
  },
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#23242C',
=======
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  card: {
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardContent: {
    marginTop: 10,
  },
  periodText: {
    fontSize: 14,
<<<<<<< HEAD
    color: '#FFFFFF',
    opacity: 0.9,
  },
  cardTime: {
    fontSize: 16,
    color: '#FFFFFF',
=======
  },
  cardTime: {
    fontSize: 16,
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 16,
<<<<<<< HEAD
    color: '#FFFFFF',
=======
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
    fontWeight: 'bold',
    marginTop: 5,
  },
  cardDescription: {
    fontSize: 14,
<<<<<<< HEAD
    color: '#BDB4FA',
=======
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
    marginTop: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
<<<<<<< HEAD
  editText: {
    color: '#027DF0',
    fontSize: 14,
  },
  removeText: {
    color: '#F09102',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#9282FA',
=======
  button: {
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
    padding: 15,
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 20,
<<<<<<< HEAD
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
=======
    backgroundColor: '#8A2BE2', // Cor roxa para o botão "Novo Agendamento"
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF', // Texto branco para melhor contraste
  },
  filterText: {
    fontSize: 18,
    marginLeft: 10,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  dateFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
  },
  calendarIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  clearFilterButton: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    backgroundColor: '#8A2BE2', // Cor roxa para o botão "Mostrar Todos"
  },
  clearFilterText: {
    fontSize: 16,
    color: '#FFFFFF', // Texto branco para melhor contraste
>>>>>>> 654615f (Atualizaçao do código,tenho que  verificar o calendario novamente)
  },
});