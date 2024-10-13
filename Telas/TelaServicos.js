import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ThemeContext } from './tema';
import { getServices, addService, deleteService, updateService, getAppointments, updateAppointment } from '../database';
import { MaterialIcons } from '@expo/vector-icons'; // Para usar ícones

const TelaServicos = () => {
  const { theme } = useContext(ThemeContext);
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState('');
  const [editingService, setEditingService] = useState(null);

  useEffect(() => {
    const loadServices = async () => {
      const storedServices = await getServices();
      // Os serviços já são ordenados pelo banco de dados
      setServices(storedServices);
    };
    loadServices();
  }, []);

  const checkServiceLinkedToAppointment = async (serviceName) => {
    const appointments = await getAppointments();
    return appointments.filter(appointment => appointment.serviceDescription === serviceName);
  };

  const handleAddService = async () => {
    if (!newService.trim()) {
      Alert.alert('Erro', 'O nome do serviço não pode estar vazio.');
      return;
    }

    try {
      await addService(newService, 0); // Adiciona o serviço como não favorito
      setNewService('');
      const updatedServices = await getServices();
      setServices(updatedServices);
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  const handleDeleteService = async (id, serviceName) => {
    const linkedAppointments = await checkServiceLinkedToAppointment(serviceName);
    if (linkedAppointments.length > 0) {
      Alert.alert(
        "Confirmar Exclusão",
        `Este serviço está vinculado a ${linkedAppointments.length} agendamentos. Deseja realmente excluí-lo e remover a associação nos agendamentos?`,
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Excluir",
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
                Alert.alert("Sucesso", "Serviço excluído e agendamentos atualizados.");
              } catch (error) {
                Alert.alert("Erro", error.message);
              }
            },
            style: "destructive",
          },
        ]
      );
    } else {
      Alert.alert(
        "Confirmar Exclusão",
        "Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.",
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Excluir",
            onPress: async () => {
              try {
                await deleteService(id);
                const updatedServices = await getServices();
                setServices(updatedServices);
                Alert.alert("Sucesso", "Serviço excluído com sucesso.");
              } catch (error) {
                Alert.alert("Erro", error.message);
              }
            },
            style: "destructive",
          },
        ]
      );
    }
  };

  const toggleFavorite = async (service) => {
    const newFavoriteStatus = service.isFavorite ? 0 : 1; // Alterna entre 0 e 1
    try {
      await updateService(service.id, service.serviceName, newFavoriteStatus); // Atualiza o status de favorito no banco de dados
      const updatedServices = await getServices();
      setServices(updatedServices);
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  const handleUpdateService = async () => {
    if (!editingService || !newService.trim()) {
      Alert.alert('Erro', 'O nome do serviço não pode estar vazio.');
      return;
    }

    try {
      await updateService(editingService.id, newService, editingService.isFavorite); // Mantém o status de favorito
      setNewService('');
      setEditingService(null);
      const updatedServices = await getServices();
      setServices(updatedServices);
      Alert.alert('Sucesso', 'Serviço atualizado com sucesso.');
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Gerenciar Serviços</Text>

      <TextInput
        style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
        placeholder="Novo Serviço"
        placeholderTextColor={theme.text === '#000000' ? '#000000' : '#c7c7cc'}
        value={newService}
        onChangeText={setNewService}
      />

      {editingService ? (
        <TouchableOpacity onPress={handleUpdateService} style={styles.button}>
          <Text style={styles.buttonText}>Salvar Alterações</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={handleAddService} style={styles.button}>
          <Text style={styles.buttonText}>Adicionar Serviço</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={services}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.serviceItem, { backgroundColor: theme.card }]}>
            <TouchableOpacity onPress={() => toggleFavorite(item)} style={styles.favoriteButton}>
              <MaterialIcons
                name={item.isFavorite ? "star" : "star-outline"} // Usa estrela preenchida se favorito
                size={24}
                color={item.isFavorite ? "gold" : "gray"} // Dourado se favorito, cinza se não
              />
            </TouchableOpacity>
            <Text style={{ color: theme.text, flex: 1 }}>{item.serviceName}</Text>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => { setEditingService(item); setNewService(item.serviceName); }}>
                <Text style={styles.actionText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteService(item.id, item.serviceName)}>
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
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  button: {
    backgroundColor: '#8A2BE2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
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
