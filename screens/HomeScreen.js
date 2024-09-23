// HomeScreen.js
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const getPeriodIcon = (time) => {
  const [hour] = time.split(':').map(Number);
  if (hour >= 8 && hour < 12) {
    return { icon: '🌅', period: 'Manhã' };
  } else if (hour >= 12 && hour < 18) {
    return { icon: '🌞', period: 'Tarde' };
  } else if (hour >= 18 && hour <= 20) {
    return { icon: '🌙', period: 'Noite' };
  }
  return { icon: '', period: '' };
};

const AppointmentCard = ({ appointment, onEdit, onDelete }) => {
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
            )}
          </Text>
        </View>
        <View style={styles.cardContent}>
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
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function HomeScreen({ navigation, appointments, setAppointments }) {
  const handleEdit = (appointment) => {
    navigation.navigate('AGENDAMENTO', { appointment });
  };

  const handleDelete = async (appointment) => {
    const updatedAppointments = appointments.filter(a => a.id !== appointment.id);
    setAppointments(updatedAppointments);
    await AsyncStorage.setItem('@appointments', JSON.stringify(updatedAppointments));
    Alert.alert("Sucesso", `Agendamento excluído: ${appointment.name}`);
  };

  const sortedAppointments = appointments.sort((a, b) => {
    const dateA = new Date(a.date + ' ' + a.time);
    const dateB = new Date(b.date + ' ' + b.time);
    return dateA - dateB;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sua agenda</Text>
      <FlatList
        data={sortedAppointments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AppointmentCard
            appointment={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('AGENDAMENTO')}
      >
        <Text style={styles.buttonText}>Novo Agendamento</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
    color: '#FFFFFF',
    opacity: 0.9,
  },
  cardTime: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: '#BDB4FA',
    marginTop: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
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
    padding: 15,
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});