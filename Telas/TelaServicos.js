// TelaServicos.js
import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { ThemeContext } from './tema';
import {
  getServices,
  addService,
  deleteService,
  updateService,
  getAppointments,
  updateAppointment,
} from '../database';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

const TelaServicos = () => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [editingService, setEditingService] = useState(null);

  useEffect(() => {
    const loadServices = async () => {
      const storedServices = await getServices();
      setServices(storedServices);
    };
    loadServices();
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
      await addService(newService, newServiceDescription, 0);
      setNewService('');
      setNewServiceDescription('');
      const updatedServices = await getServices();
      setServices(updatedServices);
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
    const linkedAppointments = await checkServiceLinkedToAppointment(serviceName);
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
                const updatedServices = await getServices();
                setServices(updatedServices);
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
                const updatedServices = await getServices();
                setServices(updatedServices);
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
      const updatedServices = await getServices();
      setServices(updatedServices);
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
      const updatedServices = await getServices();
      setServices(updatedServices);
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
    </View>
  );
};

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
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#8A2BE2',
  },
  buttonText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
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
});

export default TelaServicos;
