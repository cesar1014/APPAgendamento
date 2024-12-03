import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  ActivityIndicator
} from 'react-native';
import { ThemeContext } from './tema';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNPickerSelect from 'react-native-picker-select';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, subDays, startOfYear, endOfYear } from 'date-fns';

import { getClientesAtendidos } from '../database';

export default function TelaClientesAtendidos() {
  const { theme, isDarkMode } = useContext(ThemeContext);

  const [clientes, setClientes] = useState([]);
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [filtroNome, setFiltroNome] = useState('');
  const [modalFiltroDataVisible, setModalFiltroDataVisible] = useState(false);

  const [tipoFiltroData, setTipoFiltroData] = useState(null); // Inicializado como null
  const [dataInicio, setDataInicio] = useState(null);
  const [dataFim, setDataFim] = useState(null);
  const [showDatePickerInicio, setShowDatePickerInicio] = useState(false);
  const [showDatePickerFim, setShowDatePickerFim] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const carregarClientes = async () => {
      try {
        setIsLoading(true);
        const clientesAtendidos = await getClientesAtendidos();
        setClientes(clientesAtendidos);
        setClientesFiltrados(clientesAtendidos);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    carregarClientes();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [filtroNome, tipoFiltroData, dataInicio, dataFim]);


  const handleDateChangeInicio = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePickerInicio(false);
    }
    if (selectedDate) {
      setDataInicio(selectedDate);
    }
  };

  const handleDateChangeFim = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePickerFim(false);
    }
    if (selectedDate) {
      setDataFim(selectedDate);
    }
  };

  const renderCliente = ({ item }) => (
    <View style={[styles.itemCliente, {
      backgroundColor: theme.card,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    }]}>
      <Text style={[styles.nomeCliente, { color: theme.text }]}>{item.name}</Text>
      <Text style={[styles.telefoneCliente, { color: theme.text }]}>{item.phone}</Text>
      <Text style={[styles.dataCliente, { color: theme.text, fontStyle: 'italic' }]}>
        Datas de Atendimento:
      </Text>
      {item.dates.map((date, index) => (
        <Text
          key={index}
          style={[styles.dataCliente, { color: theme.text }]}
        >
          {format(new Date(date), 'dd/MM/yyyy')}
        </Text>
      ))}
    </View>
  );

  // Função para aplicar filtros
  const aplicarFiltros = () => {
    let resultado = clientes;

    if (filtroNome.trim()) {
      resultado = resultado.filter(cliente =>
        cliente.name.toLowerCase().includes(filtroNome.toLowerCase())
      );
    }

    if (tipoFiltroData && tipoFiltroData !== 'todos') { // Atualizado para considerar 'todos'
      const hoje = new Date();
      resultado = resultado.filter(cliente => {
        return cliente.dates.some(dateStr => {
          const dataCliente = new Date(dateStr);
          switch (tipoFiltroData) {
            case 'mesAtual':
              return dataCliente >= startOfMonth(hoje) && dataCliente <= endOfMonth(hoje);
            case 'ultimos30Dias':
              return dataCliente >= subDays(hoje, 30);
            case 'anoAtual':
              return dataCliente >= startOfYear(hoje) && dataCliente <= endOfYear(hoje);
            case 'intervalo':
              return dataInicio && dataFim
                ? dataCliente >= dataInicio && dataCliente <= dataFim
                : true;
            default:
              return true;
          }
        });
      });
    }

    resultado.sort((a, b) => a.name.localeCompare(b.name));

    setClientesFiltrados(resultado);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#8A2BE2" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.filtrosContainer}>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.card, color: theme.text }
          ]}
          placeholder="Filtrar por nome"
          placeholderTextColor={isDarkMode ? '#c7c7cc' : '#7c7c7c'}
          value={filtroNome}
          onChangeText={setFiltroNome}
        />

        <TouchableOpacity
          style={[
            styles.botaoFiltroData,
            { backgroundColor: theme.card }
          ]}
          onPress={() => setModalFiltroDataVisible(true)}
        >
          <Text style={{ color: theme.text }}>Filtrar por Data</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={clientesFiltrados}
        renderItem={renderCliente}
        keyExtractor={(item, index) => index.toString()}
        ListEmptyComponent={() => (
          <Text style={[styles.textoVazio, { color: theme.text }]}>
            Nenhum cliente encontrado
          </Text>
        )}
      />

      {clientesFiltrados.length > 0 && (
        <Text style={[styles.contadorResultados, { color: theme.text }]}>
          {clientesFiltrados.length} cliente(s) encontrado(s)
        </Text>
      )}

      <Modal
        visible={modalFiltroDataVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalFiltroDataVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalConteudo, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitulo, { color: theme.text }]}>
              Filtrar por Data
            </Text>

            <RNPickerSelect
              placeholder={
                tipoFiltroData === null
                  ? {
                    label: 'Selecione uma opção...',
                    value: null,
                    color: theme.text,
                  }
                  : {}
              }
              value={tipoFiltroData}
              onValueChange={(value) => {
                setTipoFiltroData(value);
                if (value !== 'intervalo') {
                  setDataInicio(null);
                  setDataFim(null);
                }
              }}
              items={[
                { label: 'Todos os Períodos', value: 'todos' },
                { label: 'Mês Atual', value: 'mesAtual' },
                { label: 'Últimos 30 Dias', value: 'ultimos30Dias' },
                { label: 'Ano Atual', value: 'anoAtual' },
                { label: 'Intervalo Personalizado', value: 'intervalo' },
              ]}
              style={{
                inputIOS: {
                  color: theme.text,
                  padding: 15,
                  backgroundColor: theme.card,
                  borderRadius: 8,
                  fontSize: 16,
                  height: 50,
                },
                inputAndroid: {
                  color: theme.text,
                  backgroundColor: theme.card,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 8,
                  fontSize: 16,
                  height: 50,
                },
                placeholder: {
                  color: isDarkMode ? '#c7c7cc' : '#7c7c7c',
                },
              }}
            />

            {tipoFiltroData === 'intervalo' && (
              <>
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    styles.dateButtonWithMargin,
                    { backgroundColor: theme.card }
                  ]}
                  onPress={() => setShowDatePickerInicio(true)}
                >
                  <Ionicons
                    name="calendar"
                    size={20}
                    color={theme.text}
                    style={{ marginRight: 10 }}
                  />
                  <Text style={{ color: theme.text }}>
                    {dataInicio ? format(dataInicio, 'dd/MM/yyyy') : 'Data Início'}
                  </Text>
                </TouchableOpacity>
                {showDatePickerInicio && (
                  <DateTimePicker
                    locale="pt-BR"
                    value={dataInicio || new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChangeInicio}
                  />
                )}

                <TouchableOpacity
                  style={[styles.dateButton, { backgroundColor: theme.card }]}
                  onPress={() => setShowDatePickerFim(true)}
                >
                  <Ionicons
                    name="calendar"
                    size={20}
                    color={theme.text}
                    style={{ marginRight: 10 }}
                  />
                  <Text style={{ color: theme.text }}>
                    {dataFim ? format(dataFim, 'dd/MM/yyyy') : 'Data Fim'}
                  </Text>
                </TouchableOpacity>
                {showDatePickerFim && (
                  <DateTimePicker
                    locale="pt-BR"
                    value={dataFim || new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChangeFim}
                  />
                )}
              </>
            )}

            <TouchableOpacity
              style={[styles.botaoAplicar, { backgroundColor: '#8A2BE2' }]}
              onPress={() => {
                setModalFiltroDataVisible(false);
                aplicarFiltros();
              }}
            >
              <Text style={styles.botaoTexto}>Aplicar Filtros</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.botaoCancelar, { backgroundColor: '#FF6F61' }]}
              onPress={() => setModalFiltroDataVisible(false)}
            >
              <Text style={styles.botaoTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  filtrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  input: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    height: 50,
  },
  botaoFiltroData: {
    padding: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemCliente: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  nomeCliente: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  telefoneCliente: {
    fontSize: 16,
  },
  dataCliente: {
    fontSize: 14,
    marginTop: 5,
  },
  textoVazio: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalConteudo: {
    width: '80%',
    padding: 20,
    borderRadius: 8,
  },
  modalTitulo: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  dateButton: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dateButtonWithMargin: {
    marginTop: 20,
  },
  botaoAplicar: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  botaoCancelar: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  botaoTexto: {
    color: '#FFFFFF',
  },
  contadorResultados: {
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
