import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { format, isSameDay, parseISO, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAppointments, deleteAppointment } from '../database';
import { ThemeContext } from './tema';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';

const getPeriodIcon = (time) => {
  const [hour] = time.split(':').map(Number);
  if (hour >= 8 && hour < 12) {
    return { icon: '🌅', period: 'Manhã' };
  } else if (hour >= 12 && hour < 18) {
    return { icon: '🌇', period: 'Tarde' };
  } else if (hour >= 18 && hour <= 20) {
    return { icon: '🌙', period: 'Noite' };
  }
  return { icon: '', period: '' };
};

const AppointmentCard = ({ appointment, onEdit, onDelete }) => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const { icon, period } = getPeriodIcon(appointment.time);
  const [showActions, setShowActions] = useState(false);

  // Verificar se o agendamento está no passado
  const currentDateTime = new Date();
  const appointmentDateTime = parseISO(`${appointment.date}T${appointment.time}`);
  const isPast = isBefore(appointmentDateTime, currentDateTime);

  // Definir a cor do cartão com base na verificação de data
  const cardBackgroundColor = isPast 
    ? (isDarkMode ? '#541B1B' : '#FFB6C1') // Cor para o passado: escura ou clara
    : theme.card; // Cor padrão se não estiver no passado

  return (
    <TouchableOpacity onPress={() => setShowActions(!showActions)}>
      <View style={[styles.card, { backgroundColor: cardBackgroundColor }]}>
        <View style={styles.header}>
          <Text style={[styles.periodText, { color: theme.text }]}>{icon} {period}</Text>
          <Text style={[styles.cardTime, { color: theme.text }]}>
            {appointment.time}
            {!isSameDay(new Date(appointment.date), new Date()) && (
              <Text style={styles.dateText}> {format(new Date(appointment.date), 'dd/MM', { locale: ptBR })}</Text>
            )}
          </Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{appointment.name} ({appointment.phone})</Text>
          {/* Manter a descrição original do serviço, mesmo que ele tenha sido excluído */}
          <Text style={[styles.cardDescription, { color: isDarkMode ? '#D3D3D3' : '#4B4B4B' }]}>
            {appointment.serviceDescription}
          </Text>
          {showActions && (
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => onEdit(appointment)}>
                <Text style={[styles.editText, { color: theme.buttonBackground }]}>Alterar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(appointment)}>
                <Text style={[styles.removeText, { color: 'red' }]}>Excluir</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function TelaInicial({ navigation, appointments, setAppointments }) {
  const { theme } = useContext(ThemeContext);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const loadAppointments = async () => {
      const storedAppointments = await getAppointments();

      // Ordenar os agendamentos pela data e hora
      const sortedAppointments = storedAppointments.sort((a, b) => {
        const dateTimeA = parseISO(`${a.date}T${a.time}`);
        const dateTimeB = parseISO(`${b.date}T${b.time}`);
        return dateTimeA - dateTimeB;
      });

      setAppointments(sortedAppointments);
      setFilteredAppointments(sortedAppointments);
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
            
            // Exibir Toast quando o agendamento for excluído
            Toast.show({
              type: 'success',
              text1: `Agendamento de ${appointment.name} foi excluído!`,
              visibilityTime: 2000,
            });

            setAppointments(updatedAppointments);
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleEdit = (appointment) => {
    navigation.navigate('AGENDAMENTO', { appointment });
  };

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
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <AppointmentCard
            appointment={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
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
      </TouchableOpacity>

      {/* Botão para Gerenciar Serviços */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#8A2BE2', marginTop: 10 }]}
        onPress={() => navigation.navigate('SERVIÇOS')} // Navega para a tela de serviços
      >
        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Gerenciar Serviços</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
  },
  cardTime: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#2E0F50', // Azul escuro para o título
  },
  cardDescription: {
    fontSize: 14,
    marginTop: 5,
    color: '#4B4B4B', // Cinza escuro para o tema claro e roxo escuro para o tema escuro
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    padding: 15,
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 20,
    backgroundColor: '#8A2BE2',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    backgroundColor: '#8A2BE2',
  },
  clearFilterText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});
