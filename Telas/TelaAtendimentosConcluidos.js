// TelaAtendimentosConcluidos.js
import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  getConcludedAppointments,
  deleteAtendimento,
  updateAtendimento, // Função que precisamos criar
} from '../database';
import { ThemeContext } from './tema';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function TelaAtendimentosConcluidos({ navigation }) {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    const storedAppointments = await getConcludedAppointments();
    setAppointments(storedAppointments);
    setFilteredAppointments(storedAppointments);
  };

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
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    } else {
      setSelectedDate(null);
    }
  };

  const clearFilter = () => {
    setSelectedDate(null);
  };

  const handleDelete = (atendimentoId) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este atendimento? Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          onPress: async () => {
            await deleteAtendimento(atendimentoId);
            loadAppointments(); // Atualiza a lista após a exclusão
            Alert.alert('Sucesso', 'Atendimento excluído com sucesso.');
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleEdit = (appointment) => {
    navigation.navigate('EDITAR_ATENDIMENTO_CONCLUIDO', { appointment, refreshAppointments: loadAppointments });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Atendimentos Concluídos</Text>

      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
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
          display="default"
          onChange={handleDateChange}
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

      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.card }]}
            onPress={() => {}}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {item.name} ({item.phone})
              </Text>
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => handleEdit(item)}>
                  <Text style={[styles.editText, { color: '#007AFF' }]}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.atendimentoId)}>
                  <Text style={[styles.deleteText, { color: 'red' }]}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={[styles.cardDescription, { color: theme.text }]}>
              {item.serviceDescription}
            </Text>
            <Text style={[styles.cardDate, { color: theme.text }]}>
              {format(parseISO(item.date), 'dd/MM/yyyy', { locale: ptBR })} às {item.time}
            </Text>
            {item.colaboradorNome && (
              <Text style={[styles.colaboradorText, { color: theme.text }]}>
                Colaborador: {item.colaboradorNome}
              </Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <Text style={[styles.emptyText, { color: theme.text }]}>
            Nenhum atendimento concluído encontrado.
          </Text>
        )}
      />
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
    backgroundColor: '#8A2BE2',
  },
  clearFilterText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  card: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardActions: {
    flexDirection: 'row',
  },
  editText: {
    marginRight: 15,
    fontSize: 16,
  },
  deleteText: {
    fontSize: 16,
  },
  cardDescription: {
    fontSize: 14,
    marginTop: 5,
  },
  cardDate: {
    fontSize: 14,
    marginTop: 5,
  },
  colaboradorText: {
    fontSize: 14,
    marginTop: 5,
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
});
