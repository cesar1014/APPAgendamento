import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { Checkbox } from 'react-native-paper';
import { ThemeContext } from './tema';
import {
  getColaboradores,
  getServices,
  getColaboradoresForService,
  addAtendimento,
  updateAppointment,
  getAppointments,
} from '../database';
import Toast from 'react-native-toast-message';

export default function TelaAtendimento({
  route,
  navigation,
  appointments,
  setAppointments,
}) {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const { appointment } = route.params;

  const [services, setServices] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedColaboradores, setSelectedColaboradores] = useState([]);
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
        setSelectedColaboradores([appointment.colaboradorId]);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível carregar serviços e colaboradores.',
        visibilityTime: 2000,
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

  const toggleColaboradorSelection = (colaboradorId) => {
    if (selectedColaboradores.includes(colaboradorId)) {
      setSelectedColaboradores((prev) =>
        prev.filter((id) => id !== colaboradorId)
      );
    } else {
      setSelectedColaboradores((prev) => [...prev, colaboradorId]);
    }
  };

  const handleFinalizarAtendimento = async () => {
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
      // Atualizar o agendamento original com as novas informações
      await updateAppointment(appointment.id, {
        ...appointment,
        serviceDescription: selectedServices.join(', '),
        colaboradorId:
          selectedColaboradores.length > 0 ? selectedColaboradores[0] : null,
      });

      // Adicionar o atendimento concluído
      await addAtendimento(
        appointment.id,
        selectedServices.join(', '),
        selectedColaboradores.length > 0 ? selectedColaboradores[0] : null
      );

      // Atualiza a lista de agendamentos na página inicial
      const updatedAppointments = await getAppointments();
      setAppointments(updatedAppointments);

      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Atendimento concluído com sucesso.',
        visibilityTime: 1500,
      });
      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível finalizar o atendimento.',
        visibilityTime: 1500,
      });
    }
  };

  const renderServiceItem = ({ item }) => (
    <TouchableOpacity
      style={styles.serviceItem}
      onPress={() => toggleServiceSelection(item.serviceName)}
    >
      <Text style={{ color: theme.text }}>{item.serviceName}</Text>
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
      onPress={() => toggleColaboradorSelection(item.id)}
    >
      <Text style={{ color: theme.text }}>{item.nome}</Text>
      <Checkbox
        status={selectedColaboradores.includes(item.id) ? 'checked' : 'unchecked'}
        onPress={() => toggleColaboradorSelection(item.id)}
        color="#8A2BE2"
      />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Seção de Serviços */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Serviços</Text>

      <TouchableOpacity
        style={[
          styles.selectButton,
          {
            backgroundColor: theme.card,
            borderColor: isDarkMode ? '#444' : '#ccc',
            borderWidth: 1,
            borderRadius: 8,
          },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={{ color: theme.text }}>Selecione os serviços</Text>
      </TouchableOpacity>

      {selectedServices.length > 0 ? (
        selectedServices.map((service, index) => (
          <Text key={index} style={{ color: theme.text, marginBottom: 5 }}>
            - {service}
          </Text>
        ))
      ) : (
        <Text style={{ color: theme.text }}>Nenhum serviço selecionado</Text>
      )}

      {/* Seção de Colaboradores */}
      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>
        Colaboradores
      </Text>

      <TouchableOpacity
        style={[
          styles.selectButton,
          {
            backgroundColor: theme.card,
            borderColor: isDarkMode ? '#444' : '#ccc',
            borderWidth: 1,
            borderRadius: 8,
          },
        ]}
        onPress={() => setModalColabVisible(true)}
      >
        <Text style={{ color: theme.text }}>Selecione os colaboradores</Text>
      </TouchableOpacity>

      {selectedColaboradores.length > 0 ? (
        colaboradores
          .filter((colab) => selectedColaboradores.includes(colab.id))
          .map((colab) => (
            <Text key={colab.id} style={{ color: theme.text, marginBottom: 5 }}>
              - {colab.nome}
            </Text>
          ))
      ) : (
        <Text style={{ color: theme.text }}>Nenhum colaborador selecionado</Text>
      )}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#8A2BE2', marginTop: 20 }]}
        onPress={handleFinalizarAtendimento}
      >
        <Text style={styles.buttonText}>Finalizar Atendimento</Text>
      </TouchableOpacity>

      {/* Modal para serviços */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
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
              <Text style={styles.buttonText}>Concluído</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para colaboradores */}
      <Modal
        visible={modalColabVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalColabVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Selecione os colaboradores
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
              <Text style={styles.buttonText}>Concluído</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  selectButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    marginBottom: 10,
  },
});
