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
} from 'react-native';
import { ThemeContext } from './tema';
import {
  getColaboradores,
  addColaborador,
  deleteColaborador,
  getServices,
  setColaboradorServices,
  getServicesForColaborador,
  updateColaboradorName,
} from '../database';
import { Checkbox } from 'react-native-paper';

// Import Toast
import Toast from 'react-native-toast-message';

export default function TelaColaboradores({ navigation }) {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const [colaboradores, setColaboradores] = useState([]);
  const [services, setServices] = useState([]);
  const [newColaborador, setNewColaborador] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [editingColaborador, setEditingColaborador] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadColaboradoresAndServices();
  }, []);

  const loadColaboradoresAndServices = async () => {
    try {
      const loadedColaboradores = await getColaboradores();
      setColaboradores(loadedColaboradores);

      const loadedServices = await getServices();
      setServices(loadedServices);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível carregar colaboradores ou serviços.',
        visibilityTime: 1500,
      });
    }
  };

  const handleAddColaborador = async () => {
    if (!newColaborador.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'O nome do colaborador não pode estar vazio.',
        visibilityTime: 1500,
      });
      return;
    }

    try {
      await addColaborador(newColaborador, selectedServices);
      setNewColaborador('');
      setSelectedServices([]);
      loadColaboradoresAndServices();
      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Colaborador adicionado com sucesso.',
        visibilityTime: 1500,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível adicionar o colaborador.',
        visibilityTime: 1500,
      });
    }
  };

  const handleUpdateColaborador = async () => {
    if (!editingColaborador || !newColaborador.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'O nome do colaborador não pode estar vazio.',
        visibilityTime: 1500,
      });
      return;
    }

    try {
      await updateColaboradorName(editingColaborador.id, newColaborador);
      await setColaboradorServices(editingColaborador.id, selectedServices);
      setNewColaborador('');
      setSelectedServices([]);
      setEditingColaborador(null);
      loadColaboradoresAndServices();
      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Colaborador atualizado com sucesso.',
        visibilityTime: 1500,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível atualizar o colaborador.',
        visibilityTime: 1500,
      });
    }
  };

  const handleDeleteColaborador = (id) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este colaborador? Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          onPress: async () => {
            try {
              await deleteColaborador(id);
              loadColaboradoresAndServices();
              Toast.show({
                type: 'success',
                text1: 'Sucesso',
                text2: 'Colaborador excluído com sucesso.',
                visibilityTime: 1500,
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: 'Não foi possível excluir o colaborador.',
                visibilityTime: 1500,
              });
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const startEditing = async (colaborador) => {
    setEditingColaborador(colaborador);
    setNewColaborador(colaborador.nome);
    const servicesForColaborador = await getServicesForColaborador(
      colaborador.id
    );
    setSelectedServices(servicesForColaborador.map((service) => service.id));
  };

  const toggleServiceSelection = (serviceId) => {
    setSelectedServices((prevSelected) => {
      if (prevSelected.includes(serviceId)) {
        return prevSelected.filter((id) => id !== serviceId);
      } else {
        return [...prevSelected, serviceId];
      }
    });
  };

  const renderServiceItem = ({ item }) => (
    <TouchableOpacity
      style={styles.serviceItem}
      onPress={() => toggleServiceSelection(item.id)}
    >
      <Text style={{ color: theme.text }}>{item.serviceName}</Text>
      <Checkbox
        status={selectedServices.includes(item.id) ? 'checked' : 'unchecked'}
        onPress={() => toggleServiceSelection(item.id)}
        color="#8A2BE2"
      />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        Gerenciar Colaboradores
      </Text>

      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.card, color: theme.text },
          !isDarkMode && { borderWidth: 1, borderColor: '#ccc' },
        ]}
        placeholder="Nome do Colaborador"
        placeholderTextColor={isDarkMode ? '#c7c7cc' : '#7c7c7c'}
        value={newColaborador}
        onChangeText={setNewColaborador}
      />

      {/* Botão para abrir o modal de seleção de serviços */}
      <TouchableOpacity
        style={[styles.selectButton, { backgroundColor: theme.card }]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={{ color: theme.text }}>
          Selecione os serviços de afinidade
        </Text>
      </TouchableOpacity>

      {/* Exibir serviços selecionados */}
      {selectedServices.length > 0 && (
        <View style={styles.selectedServicesContainer}>
          <Text style={{ color: theme.text }}>Serviços selecionados:</Text>
          {services
            .filter((service) => selectedServices.includes(service.id))
            .map((service) => (
              <Text key={service.id} style={{ color: theme.text }}>
                - {service.serviceName}
              </Text>
            ))}
        </View>
      )}

      {/* Modal para seleção de serviços */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
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

      {editingColaborador ? (
        <TouchableOpacity
          onPress={handleUpdateColaborador}
          style={[styles.button, { backgroundColor: '#8A2BE2', marginTop: 20 }]}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
            Salvar Alterações
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={handleAddColaborador}
          style={[styles.button, { backgroundColor: '#8A2BE2', marginTop: 20 }]}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
            Adicionar Colaborador
          </Text>
        </TouchableOpacity>
      )}

      {/* Lista de Colaboradores */}
      <FlatList
        data={colaboradores}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={[styles.colaboradorItem, { backgroundColor: theme.card }]}
          >
            <Text style={{ color: theme.text }}>{item.nome}</Text>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => startEditing(item)}>
                <Text style={styles.actionText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteColaborador(item.id)}
              >
                <Text style={styles.excluirText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
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
  selectButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedServicesContainer: {
    marginBottom: 10,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
  },
  colaboradorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
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
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fundo semi-transparente
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
  },
});
