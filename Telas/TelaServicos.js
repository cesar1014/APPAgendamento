import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { ThemeContext } from './tema';
import {
  getServicesBySector,
  addService,
  deleteService,
  updateService,
  getAppointments,
  updateAppointment,
  importServicesFromSector,
  getAllActivityFields,
  getActivityFieldByName,
} from '../database';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TelaServicos = () => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [editingService, setEditingService] = useState(null);
  const [availableSectors, setAvailableSectors] = useState([]);
  const [selectedSector, setSelectedSector] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [currentActivityField, setCurrentActivityField] = useState('');

  useEffect(() => {
    loadServices();
    loadAvailableSectors();
  }, []);

  useEffect(() => {
    if (editingService) {
      setNewService(editingService.serviceName);
      setNewServiceDescription(editingService.description || '');
    } else {
      setNewService('');
      setNewServiceDescription('');
    }
  }, [editingService]);

  const loadServices = async () => {
    try {
      // Obter o ramo de atividade selecionado
      const info = await AsyncStorage.getItem('businessInfo');
      let selectedActivityField = '';
      if (info) {
        const parsedInfo = JSON.parse(info);
        selectedActivityField = parsedInfo.activityField;
        setCurrentActivityField(selectedActivityField);
      }

      if (selectedActivityField) {
        const storedServices = await getServicesBySector(selectedActivityField);
        setServices(storedServices);
      } else {
        // Caso não haja ramo selecionado, pode carregar todos ou nenhum serviço
        setServices([]);
      }
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    }
  };

  const loadAvailableSectors = async () => {
    try {
      const sectors = await getAllActivityFields();
      const sectorNames = sectors.map((sector) => sector.name);
      console.log('Ramos de atividade disponíveis:', sectorNames);
      setAvailableSectors(sectorNames);
    } catch (error) {
      console.error('Erro ao carregar ramos de atividade:', error);
    }
  };

  const checkServiceLinkedToAppointment = async (serviceName) => {
    const appointments = await getAppointments();
    return appointments.filter(
      (appointment) => appointment.serviceDescription === serviceName
    );
  };

  const handleAddService = async () => {
    if (!newService.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'O nome do serviço não pode estar vazio.',
        visibilityTime: 1500,
      });
      return;
    }

    try {
      // Obter o ID do ramo de atividade atual
      const sectorData = await getActivityFieldByName(currentActivityField);
      let activityFieldId = null;
      if (sectorData) {
        activityFieldId = sectorData.id;
      }

      await addService(newService, newServiceDescription, 0, activityFieldId);
      setNewService('');
      setNewServiceDescription('');
      loadServices();
      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Serviço adicionado com sucesso.',
        visibilityTime: 1500,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível adicionar o serviço.',
        visibilityTime: 1500,
      });
    }
  };

  const handleDeleteService = async (id, serviceName) => {
    const linkedAppointments = await checkServiceLinkedToAppointment(
      serviceName
    );
    if (linkedAppointments.length > 0) {
      Alert.alert(
        'Confirmar Exclusão',
        `Este serviço está vinculado a ${linkedAppointments.length} agendamentos. Deseja realmente excluí-lo e remover a associação nos agendamentos?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Excluir',
            onPress: async () => {
              try {
                // Atualiza os agendamentos removendo a descrição do serviço
                for (const appointment of linkedAppointments) {
                  await updateAppointment(appointment.id, {
                    ...appointment,
                    serviceDescription: null, // Remove a descrição do serviço
                  });
                }
                // Exclui o serviço
                await deleteService(id);
                loadServices();
                Toast.show({
                  type: 'success',
                  text1: 'Sucesso',
                  text2: 'Serviço excluído e agendamentos atualizados.',
                  visibilityTime: 1500,
                });
              } catch (error) {
                Toast.show({
                  type: 'error',
                  text1: 'Erro',
                  text2: 'Não foi possível excluir o serviço.',
                  visibilityTime: 1500,
                });
              }
            },
            style: 'destructive',
          },
        ]
      );
    } else {
      Alert.alert(
        'Confirmar Exclusão',
        'Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Excluir',
            onPress: async () => {
              try {
                await deleteService(id);
                loadServices();
                Toast.show({
                  type: 'success',
                  text1: 'Sucesso',
                  text2: 'Serviço excluído com sucesso.',
                  visibilityTime: 1500,
                });
              } catch (error) {
                Toast.show({
                  type: 'error',
                  text1: 'Erro',
                  text2: 'Não foi possível excluir o serviço.',
                  visibilityTime: 1500,
                });
              }
            },
            style: 'destructive',
          },
        ]
      );
    }
  };

  const toggleFavorite = async (service) => {
    const newFavoriteStatus = service.isFavorite ? 0 : 1;
    try {
      await updateService(
        service.id,
        service.serviceName,
        service.description,
        newFavoriteStatus
      );
      loadServices();
      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Serviço atualizado com sucesso.',
        visibilityTime: 1500,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível atualizar o serviço.',
        visibilityTime: 1500,
      });
    }
  };

  const handleUpdateService = async () => {
    if (!editingService || !newService.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'O nome do serviço não pode estar vazio.',
        visibilityTime: 1500,
      });
      return;
    }

    try {
      await updateService(
        editingService.id,
        newService,
        newServiceDescription,
        editingService.isFavorite
      );
      setNewService('');
      setNewServiceDescription('');
      setEditingService(null);
      loadServices();
      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Serviço atualizado com sucesso.',
        visibilityTime: 1500,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível atualizar o serviço.',
        visibilityTime: 1500,
      });
    }
  };

  const handleImportServices = async () => {
    if (!selectedSector) {
      Alert.alert(
        'Erro',
        'Por favor, selecione um ramo de atividade para importar serviços.'
      );
      return;
    }

    try {
      // Obter o ID do ramo de atividade atual
      const sectorData = await getActivityFieldByName(currentActivityField);
      let activityFieldId = null;
      if (sectorData) {
        activityFieldId = sectorData.id;
      }

      await importServicesFromSector(selectedSector, activityFieldId);
      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: `Serviços do ramo ${selectedSector} importados com sucesso.`,
        visibilityTime: 1500,
      });
      setModalVisible(false);
      loadServices(); // Recarregar serviços após importação
    } catch (error) {
      console.error('Erro ao importar serviços:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao importar os serviços.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Gerenciar Serviços</Text>

      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.card, color: theme.text },
          !isDarkMode && { borderColor: '#ccc', borderWidth: 1 },
        ]}
        placeholder="Nome do Serviço"
        placeholderTextColor={isDarkMode ? '#c7c7cc' : '#7c7c7c'}
        value={newService}
        onChangeText={setNewService}
      />

      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.card, color: theme.text },
          !isDarkMode && { borderColor: '#ccc', borderWidth: 1 },
        ]}
        placeholder="Descrição do Serviço"
        placeholderTextColor={isDarkMode ? '#c7c7cc' : '#7c7c7c'}
        value={newServiceDescription}
        onChangeText={setNewServiceDescription}
      />

      {editingService ? (
        <TouchableOpacity
          onPress={handleUpdateService}
          style={[styles.button, { backgroundColor: '#8A2BE2' }]}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Salvar Alterações</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={handleAddService}
          style={[styles.button, { backgroundColor: '#8A2BE2' }]}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Adicionar Serviço</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={services}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.serviceItem, { backgroundColor: theme.card }]}>
            <TouchableOpacity
              onPress={() => toggleFavorite(item)}
              style={styles.favoriteButton}
            >
              <MaterialIcons
                name={item.isFavorite ? 'star' : 'star-outline'}
                size={24}
                color={item.isFavorite ? 'gold' : 'gray'}
              />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: 'bold' }}>
                {item.serviceName}
              </Text>
              {item.description ? (
                <Text style={{ color: theme.text, fontSize: 12 }}>
                  {item.description}
                </Text>
              ) : null}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => setEditingService(item)}>
                <Text style={styles.actionText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteService(item.id, item.serviceName)}
              >
                <Text style={styles.excluirText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Botão para Importar Serviços */}
      <TouchableOpacity
        style={[styles.importButton, { backgroundColor: '#8A2BE2' }]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.importButtonText, { color: '#FFFFFF' }]}>
          Importar Serviços de Outros Ramos
        </Text>
      </TouchableOpacity>

      {/* Modal para Selecionar o Ramo de Atividade para Importar */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Selecionar Ramo de Atividade para Importar
              </Text>
              <Picker
                selectedValue={selectedSector}
                style={[styles.picker, { color: theme.text }]}
                onValueChange={(itemValue) => setSelectedSector(itemValue)}
              >
                <Picker.Item label="-- Selecione --" value="" />
                {availableSectors
                  .map((sector) => (
                    <Picker.Item key={sector} label={sector} value={sector} />
                  ))}
              </Picker>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleImportServices}
                >
                  <Text style={styles.modalButtonText}>Importar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text
                    style={[styles.modalButtonText, styles.cancelButtonText]}
                  >
                    Cancelar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 15,
    fontWeight: 'bold',
  },
  input: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    height: 50,
    fontSize: 16,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    fontWeight: 'bold',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
  },
  favoriteButton: {
    marginRight: 10,
  },
  actions: {
    flexDirection: 'row',
  },
  actionText: {
    marginLeft: 10,
    color: '#007AFF',
  },
  excluirText: {
    marginLeft: 10,
    color: 'red',
  },
  importButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  importButtonText: {
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
    backgroundColor: '#8A2BE2',
  },
  cancelButton: {
    backgroundColor: '#CCCCCC',
  },
  modalButtonText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#333333',
  },
});

export default TelaServicos;
