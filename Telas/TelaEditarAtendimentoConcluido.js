import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  ScrollView,
} from 'react-native';
import { Checkbox } from 'react-native-paper';
import { ThemeContext } from './tema';
import {
  getColaboradores,
  getServices,
  updateAtendimento,
} from '../database';

// Import Toast
import Toast from 'react-native-toast-message';

export default function TelaEditarAtendimentoConcluido({ route, navigation }) {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const { appointment } = route.params;

  const [services, setServices] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedColaborador, setSelectedColaborador] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalColabVisible, setModalColabVisible] = useState(false);

  useEffect(() => {
    loadServicesAndColaboradores();
  }, []);

  const loadServicesAndColaboradores = async () => {
    try {
      const storedServices = await getServices();
      setServices(storedServices);

      if (appointment.serviceDescription) {
        const initialServices = appointment.serviceDescription.split(', ');
        setSelectedServices(initialServices);
      }

      const storedColaboradores = await getColaboradores();
      setColaboradores(storedColaboradores);

      if (appointment.colaboradorId) {
        setSelectedColaborador(appointment.colaboradorId);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Erro ao carregar serviços e colaboradores.',
        visibilityTime: 1500,
      });
    }
  };

  const toggleServiceSelection = (serviceName) => {
    if (selectedServices.includes(serviceName)) {
      setSelectedServices((prev) =>
        prev.filter((service) => service !== serviceName)
      );
    } else {
      setSelectedServices((prev) => [...prev, serviceName]);
    }
  };

  const handleSaveChanges = async () => {
    if (selectedServices.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Selecione pelo menos um serviço.',
        visibilityTime: 1500,
      });
      return;
    }

    try {
      await updateAtendimento(
        appointment.atendimentoId,
        selectedServices.join(', '),
        selectedColaborador
      );

      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Atendimento atualizado com sucesso.',
        visibilityTime: 1500,
      });

      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Erro ao atualizar atendimento.',
        visibilityTime: 1500,
      });
    }
  };

  const renderServiceItem = ({ item }) => (
    <TouchableOpacity
      style={styles.serviceItem}
      onPress={() => toggleServiceSelection(item.serviceName)}
    >
      <Text style={[styles.serviceText, { color: theme.text }]}>
        {item.serviceName}
      </Text>
      <Checkbox
        status={selectedServices.includes(item.serviceName) ? 'checked' : 'unchecked'}
        onPress={() => toggleServiceSelection(item.serviceName)}
        color="#8A2BE2"
      />
    </TouchableOpacity>
  );

  const renderColaboradorItem = ({ item }) => (
    <TouchableOpacity
      style={styles.serviceItem}
      onPress={() => setSelectedColaborador(item.id)}
    >
      <Text style={[styles.serviceText, { color: theme.text }]}>
        {item.nome}
      </Text>
      <Checkbox
        status={selectedColaborador === item.id ? 'checked' : 'unchecked'}
        onPress={() => setSelectedColaborador(item.id)}
        color="#8A2BE2"
      />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Editar Atendimento</Text>

      {/* Seção de Serviços */}
      <TouchableOpacity
        style={[
          styles.selectButton,
          { backgroundColor: theme.card },
          !isDarkMode && { borderWidth: 1, borderColor: '#ccc' },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={{ color: theme.text }}>
          Selecionar Serviços ({selectedServices.length})
        </Text>
      </TouchableOpacity>

      {/* Exibir serviços selecionados */}
      {selectedServices.length > 0 ? (
        <View style={styles.selectedItemsContainer}>
          {selectedServices.map((service, index) => (
            <Text key={index} style={{ color: theme.text }}>
              - {service}
            </Text>
          ))}
        </View>
      ) : (
        <Text style={{ color: theme.text }}>Nenhum serviço selecionado</Text>
      )}

      {/* Seção de Colaboradores */}
      <TouchableOpacity
        style={[
          styles.selectButton,
          { backgroundColor: theme.card, marginTop: 20 },
          !isDarkMode && { borderWidth: 1, borderColor: '#ccc' },
        ]}
        onPress={() => setModalColabVisible(true)}
      >
        <Text style={{ color: theme.text }}>
          Selecionar Colaborador {selectedColaborador ? '(1)' : '(0)'}
        </Text>
      </TouchableOpacity>

      {/* Exibir colaborador selecionado */}
      {selectedColaborador ? (
        <View style={styles.selectedItemsContainer}>
          <Text style={{ color: theme.text }}>
            - {colaboradores.find((colab) => colab.id === selectedColaborador)?.nome}
          </Text>
        </View>
      ) : (
        <Text style={{ color: theme.text }}>Nenhum colaborador selecionado</Text>
      )}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#8A2BE2', marginTop: 30 }]}
        onPress={handleSaveChanges}
      >
        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
          Salvar Alterações
        </Text>
      </TouchableOpacity>

      {/* Modal para seleção de serviços */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View
            style={[styles.modalContainer, { backgroundColor: theme.background }]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Selecione os serviços
            </Text>
            <FlatList
              data={services}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderServiceItem}
            />
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#8A2BE2' }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                Concluído
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para seleção de colaboradores */}
      <Modal
        visible={modalColabVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalColabVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View
            style={[styles.modalContainer, { backgroundColor: theme.background }]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Selecione o colaborador
            </Text>
            <FlatList
              data={colaboradores}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderColaboradorItem}
            />
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#8A2BE2' }]}
              onPress={() => setModalColabVisible(false)}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                Concluído
              </Text>
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
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  selectButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedItemsContainer: {
    marginTop: 10,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fundo semi-transparente
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    maxHeight: '80%',
    borderRadius: 8,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  modalButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    marginBottom: 5,
  },
  serviceText: {
    flex: 1,
    marginRight: 10,
  },
});
