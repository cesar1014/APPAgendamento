import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Platform,
  Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  format,
  isSameDay,
  parseISO,
  isBefore,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAppointments, deleteAppointment,generateAppointmentText } from '../database';
import { ThemeContext } from './tema';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';

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

const AppointmentCard = ({
  appointment,
  onEdit,
  onDelete,
  onStartAtendimento,
}) => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const { icon, period } = getPeriodIcon(appointment.time);
  const [showActions, setShowActions] = useState(false);

  const currentDateTime = new Date();
  const appointmentDateTime = parseISO(`${appointment.date}T${appointment.time}`);
  const isPast = isBefore(appointmentDateTime, currentDateTime);

  const cardBackgroundColor = isPast
    ? isDarkMode
      ? '#541B1B'
      : '#FFB6C1'
    : theme.card;

    
    // Função para compartilhar o texto
    const handleShare = async (appointment) => {
      try {
        // Carregar o texto customizado do AsyncStorage
        const storedText = await AsyncStorage.getItem('appointmentText');
        const customText = storedText || 'Olá ${name}. Você possui agendado o serviço ${serviceDescription} às ${time} do dia ${formattedDate}.';
    
        const generatedText = generateAppointmentText(appointment, customText);
    
        if (generatedText) {
          await Share.share({
            message: generatedText, // Passando a mensagem corretamente
          });
        } else {
          Alert.alert('Texto não gerado corretamente');
        }
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
        Alert.alert('Erro ao compartilhar o texto.');
      }
    };

    return (
      <TouchableOpacity onPress={() => setShowActions(!showActions)}>
        <View style={[styles.card, { backgroundColor: cardBackgroundColor }]}>
          <View style={styles.header}>
            <Text style={[styles.periodText, { color: theme.text }]}>
              {icon} {period}
            </Text>
            <Text style={[styles.cardTime, { color: theme.text }]}>
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
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              {appointment.name} ({appointment.phone})
            </Text>
            <Text
              style={[
                styles.cardDescription,
                { color: isDarkMode ? '#D3D3D3' : '#4B4B4B' },
              ]}
            >
              {appointment.serviceDescription}
            </Text>
            {appointment.colaboradorNome && (
              <Text
                style={[
                  styles.colaboradorText,
                  { color: isDarkMode ? '#D3D3D3' : '#4B4B4B' },
                ]}
              >
                Colaborador: {appointment.colaboradorNome}
              </Text>
            )}
            {showActions && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  onPress={() => onStartAtendimento(appointment)}
                  style={styles.actionButton}
                >
                  <Text style={styles.startText}>Iniciar Atendimento</Text>
                </TouchableOpacity>
                <View style={styles.rightActionButtons}>
                  <TouchableOpacity
                    onPress={() => onEdit(appointment)}
                    style={styles.actionButton}
                  >
                    <Text style={styles.editText}>Alterar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onDelete(appointment)}
                    style={styles.actionButton}
                  >
                    <Text style={styles.removeText}>Excluir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleShare(appointment)}
                    style={styles.actionButton}
                  >
                    <Text style={styles.shareText}>Compartilhar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

export default function TelaInicial({
  navigation,
  appointments,
  setAppointments,
  businessInfo,
}) {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const loadAppointments = async () => {
      const storedAppointments = await getAppointments();
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
      const filtered = appointments.filter((app) =>
        isSameDay(new Date(app.date), selectedDate)
      );
      setFilteredAppointments(filtered);
    } else {
      setFilteredAppointments(appointments);
    }
  }, [selectedDate, appointments]);

  const handleDateChange = (event, date) => {
    if (date) {
      setSelectedDate(date);
    }
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const hideDatePicker = () => {
    setShowDatePicker(false);
  };

  const handleDelete = (appointment) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o agendamento de ${appointment.name}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          onPress: async () => {
            await deleteAppointment(appointment.id);
            const updatedAppointments = await getAppointments();

            Toast.show({
              type: 'success',
              text1: `Agendamento de ${appointment.name} foi excluído!`,
              visibilityTime: 2000,
            });

            setAppointments(updatedAppointments);
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleEdit = (appointment) => {
    navigation.navigate('AGENDAMENTO', { appointment });
  };

  const handleStartAtendimento = (appointment) => {
    navigation.navigate('ATENDIMENTO', { appointment });
  };

  const clearFilter = () => {
    setSelectedDate(null);
  };

  // Adicionar o botão de configurações no cabeçalho
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={{ marginRight: 15 }}
        >
          <Ionicons
            name="settings-outline"
            size={24}
            color={theme.headerText}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        {'Sua agenda'}
      </Text>
      <Text style={[styles.subtitle, { color: theme.text }]}>
        Aqui você pode ver todos os clientes e serviços agendados.
      </Text>

      <TouchableOpacity
        onPress={showDatePickerModal}
        style={[styles.dateFilterButton, { backgroundColor: theme.card }]}
      >
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
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            handleDateChange(event, date);
            if (Platform.OS === 'ios') {
              hideDatePicker();
            }
          }}
          locale="pt-BR"
        />
      )}

      {selectedDate && (
        <TouchableOpacity
          onPress={clearFilter}
          style={[styles.clearFilterButton, { backgroundColor: '#8A2BE2' }]}
        >
          <Text style={[styles.clearFilterText, { color: '#FFFFFF' }]}>
            Mostrar Todos
          </Text>
        </TouchableOpacity>
      )}

      <FlashList
        data={filteredAppointments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <AppointmentCard
            appointment={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStartAtendimento={handleStartAtendimento}
          />
        )}
        estimatedItemSize={150}
        ListEmptyComponent={() => (
          <Text style={[styles.emptyText, { color: theme.text }]}>
            Nenhum agendamento encontrado.
          </Text>
        )}
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#8A2BE2', marginTop: 10 }]}
        onPress={() => navigation.navigate('AGENDAMENTO')}
      >
        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
          Novo Agendamento
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#8A2BE2', marginTop: 10 }]}
        onPress={() => navigation.navigate('GERENCIAR')}
      >
        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Gerenciar</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
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
  filterText: {
    fontSize: 18,
    marginLeft: 10,
  },
  clearFilterButton: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    backgroundColor: '#8A2BE2', // Cor do sistema (roxo)
  },
  clearFilterText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  card: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    position: 'relative',
    backgroundColor: '#f9f9f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodText: {
    fontSize: 14,
    color: '#8A2BE2',  // Cor do sistema (roxo)
  },
  cardTime: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardContent: {
    marginTop: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  cardDescription: {
    fontSize: 14,
    marginTop: 5,
  },
  colaboradorText: {
    fontSize: 14,
    marginTop: 5,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'column',  // Organiza os botões em uma coluna
    marginTop: 15,
  },
  rightActionButtons: {
    flexDirection: 'row',  // Os botões à direita ficam em linha
    justifyContent: 'space-between', // Espaço entre os botões
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: '#8A2BE2',  // Cor do sistema (roxo)
    paddingVertical: 8,  // Botões menores
    paddingHorizontal: 12,  // Botões menores
    borderRadius: 6,  // Bordas mais suaves
    marginBottom: 8,  // Espaçamento entre os botões
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,  // Adicionando opacidade para um efeito mais sutil
  },
  startText: {
    fontSize: 14,  // Tamanho do texto reduzido
    color: '#00FF09',
    fontWeight: 'bold',
  },
  editText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  removeText: {
    fontSize: 14,  // Tamanho do texto reduzido
    color: 'red',
    fontWeight: 'bold',
  },
  shareText: {
    fontSize: 14,  // Tamanho do texto reduzido
    color: '#1E90FF',  // Azul para o botão de compartilhar
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  button: {
    padding: 15,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#8A2BE2',
  },
  buttonText: {
    fontSize: 14,  // Tamanho do texto reduzido
    fontWeight: 'bold',
    color: '#FFFFFF',
    
  },
});
