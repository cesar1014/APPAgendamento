import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { ThemeContext } from './tema';
import {
  addAppointment,
  updateAppointment,
  getAppointments,
  getServicesBySector,
  getColaboradores,
  getColaboradoresForService,
} from '../database';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNPickerSelect from 'react-native-picker-select';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TelaAgendamento({
  route,
  navigation,
  appointments,
  setAppointments,
}) {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceDescription, setServiceDescription] = useState(null);
  const [serviceDescriptionText, setServiceDescriptionText] = useState('');
  const [date, setDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('08:00');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [services, setServices] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [allColaboradores, setAllColaboradores] = useState([]);
  const [colaboradorId, setColaboradorId] = useState(null);
  const [errors, setErrors] = useState({});

  const { appointment } = route.params || {};

  useEffect(() => {
    const loadServicesAndColaboradores = async () => {
      // Obter o ramo de atividade selecionado
      const info = await AsyncStorage.getItem('businessInfo');
      let selectedActivityField = '';
      if (info) {
        const parsedInfo = JSON.parse(info);
        selectedActivityField = parsedInfo.activityField;
      }

      let storedServices = [];
      if (selectedActivityField) {
        storedServices = await getServicesBySector(selectedActivityField);
      } else {
        // Se não houver ramo selecionado, pode carregar todos ou nenhum serviço
        storedServices = [];
      }

      setServices(storedServices);

      const storedColaboradores = await getColaboradores();
      setAllColaboradores(storedColaboradores);
      setColaboradores(storedColaboradores);
    };

    loadServicesAndColaboradores();
  }, []);

  useEffect(() => {
    if (appointment) {
      setName(appointment.name);
      setPhone(appointment.phone);
      setServiceDescription(appointment.serviceDescription);
      setDate(new Date(appointment.date));
      setSelectedTime(appointment.time);
      setColaboradorId(appointment.colaboradorId);
    }
  }, [appointment]);

  // Atualizar a descrição do serviço selecionado
  useEffect(() => {
    const updateServiceDescription = async () => {
      if (serviceDescription) {
        const selectedService = services.find(
          (service) => service.serviceName === serviceDescription
        );
        if (selectedService) {
          setServiceDescriptionText(selectedService.description || '');
        } else {
          setServiceDescriptionText('');
        }
      } else {
        setServiceDescriptionText('');
      }
    };

    updateServiceDescription();
  }, [serviceDescription, services]);

  // Atualizar a lista de colaboradores com base no serviço selecionado
  useEffect(() => {
    const updateColaboradoresList = async () => {
      if (serviceDescription) {
        const selectedService = services.find(
          (service) => service.serviceName === serviceDescription
        );

        if (selectedService) {
          const associatedColaboradores = await getColaboradoresForService(
            selectedService.id
          );

          const nonAssociatedColaboradores = allColaboradores.filter(
            (colaborador) =>
              !associatedColaboradores.some(
                (assocColab) => assocColab.id === colaborador.id
              )
          );

          associatedColaboradores.sort((a, b) =>
            a.nome.localeCompare(b.nome)
          );
          nonAssociatedColaboradores.sort((a, b) =>
            a.nome.localeCompare(b.nome)
          );

          const combinedList = [
            ...associatedColaboradores,
            ...nonAssociatedColaboradores,
          ];

          setColaboradores(combinedList);
        }
      } else {
        const sortedColaboradores = [...allColaboradores].sort((a, b) =>
          a.nome.localeCompare(b.nome)
        );
        setColaboradores(sortedColaboradores);
      }
    };

    updateColaboradoresList();
  }, [serviceDescription, services, allColaboradores]);

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const validateInputs = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Nome é obrigatório.';
    if (!phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório.';
    } else if (!/^\d{10,11}$/.test(phone)) {
      newErrors.phone = 'Telefone inválido.';
    }
    if (!serviceDescription) newErrors.service = 'Serviço é obrigatório.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateInputs()) {
      return;
    }

    const appointmentData = {
      name,
      phone,
      serviceDescription,
      date: date.toISOString().split('T')[0],
      time: selectedTime,
      colaboradorId,
    };

    try {
      const existingAppointments = await getAppointments();
      const isConflict = existingAppointments.some(
        (app) =>
          app.date === appointmentData.date &&
          app.time === appointmentData.time &&
          app.id !== (appointment ? appointment.id : null)
      );

      if (isConflict) {
        Alert.alert(
          'Conflito de horário',
          'Já existe um agendamento para este horário. Deseja continuar?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Continuar',
              onPress: async () => {
                if (appointment) {
                  await updateAppointment(appointment.id, appointmentData);
                } else {
                  await addAppointment(appointmentData);
                }
                const updatedAppointments = await getAppointments();
                setAppointments(updatedAppointments);
                navigation.goBack();

                // Exibe o Toast de sucesso
                Toast.show({
                  type: 'success',
                  text1: 'Sucesso',
                  text2: appointment
                    ? 'Agendamento atualizado com sucesso.'
                    : 'Agendamento criado com sucesso.',
                  visibilityTime: 1500,
                });
              },
            },
          ]
        );
      } else {
        if (appointment) {
          await updateAppointment(appointment.id, appointmentData);
        } else {
          await addAppointment(appointmentData);
        }
        const updatedAppointments = await getAppointments();
        setAppointments(updatedAppointments);
        navigation.goBack();

        // Exibe o Toast de sucesso
        Toast.show({
          type: 'success',
          text1: 'Sucesso',
          text2: appointment
            ? 'Agendamento atualizado com sucesso.'
            : 'Agendamento criado com sucesso.',
          visibilityTime: 1500,
        });
      }
    } catch (error) {
      // Exibe o Toast de erro
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Ocorreu um erro ao salvar o agendamento.',
        visibilityTime: 1500,
      });
    }
  };

  const clearFields = () => {
    setName('');
    setPhone('');
    setServiceDescription(null);
    setDate(new Date());
    setSelectedTime('08:00');
    setColaboradorId(null);
    setErrors({});
  };

  // Opções para o Picker de serviços
  const serviceOptions = services.map((service) => ({
    label: service.serviceName,
    value: service.serviceName,
    key: service.id,
  }));

  // Opções para o Picker de colaboradores
  const colaboradorOptions = colaboradores.map((colaborador) => ({
    label: colaborador.nome,
    value: colaborador.id,
    key: colaborador.id,
  }));

  // Opções para o Picker de horários
  const timeOptions = [
    '08:00',
    '08:30',
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '12:30',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
    '17:30',
    '18:00',
    '18:30',
    '19:00',
    '19:30',
    '20:00',
  ].map((time) => ({ label: time, value: time }));

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.card, color: theme.text },
          !isDarkMode && { borderWidth: 1, borderColor: '#ccc' },
          errors.name && styles.inputError,
        ]}
        placeholder="Nome do Cliente"
        placeholderTextColor={isDarkMode ? '#c7c7cc' : '#7c7c7c'}
        value={name}
        onChangeText={setName}
      />
      {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.card, color: theme.text },
          !isDarkMode && { borderWidth: 1, borderColor: '#ccc' },
          errors.phone && styles.inputError,
        ]}
        placeholder="Telefone"
        placeholderTextColor={isDarkMode ? '#c7c7cc' : '#7c7c7c'}
        value={phone}
        onChangeText={(text) => setPhone(text.replace(/\D/g, ''))}
        keyboardType="phone-pad"
      />
      {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

      <Text style={[styles.label, { color: theme.text }]}>
        Selecione o serviço:
      </Text>
      <View style={[styles.pickerContainer]}>
        <RNPickerSelect
          placeholder={{
            label: 'Selecione o serviço',
            value: null,
            color: isDarkMode ? '#c7c7cc' : '#7c7c7c',
          }}
          items={serviceOptions}
          onValueChange={(value) => setServiceDescription(value)}
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
          value={serviceDescription}
          useNativeAndroidPickerStyle={false}
          Icon={() => null}
        />
      </View>
      {errors.service && <Text style={styles.errorText}>{errors.service}</Text>}

      {/* Exibir a descrição do serviço selecionado */}
      {serviceDescriptionText ? (
        <Text
          style={{
            color: theme.text,
            marginBottom: 10,
            fontStyle: 'italic',
          }}
        >
          {serviceDescriptionText}
        </Text>
      ) : null}

      {/* Mostrar o Picker de Colaboradores apenas se houver colaboradores */}
      {colaboradores.length > 0 && (
        <>
          <Text style={[styles.label, { color: theme.text }]}>
            Selecione o colaborador:
          </Text>
          <View style={[styles.pickerContainer]}>
            <RNPickerSelect
              placeholder={{
                label: 'Selecione o colaborador',
                value: null,
                color: isDarkMode ? '#c7c7cc' : '#7c7c7c',
              }}
              items={colaboradorOptions}
              onValueChange={(value) => setColaboradorId(value)}
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
              value={colaboradorId}
              useNativeAndroidPickerStyle={false}
              Icon={() => null}
            />
          </View>
          {errors.colaborador && (
            <Text style={styles.errorText}>{errors.colaborador}</Text>
          )}
        </>
      )}

      <Text style={[styles.label, { color: theme.text }]}>Data:</Text>
      <TouchableOpacity
        style={[
          styles.dateButton,
          {
            backgroundColor: theme.card,
            borderColor: isDarkMode ? '#444' : '#ccc',
            borderWidth: 1,
            borderRadius: 8,
          },
        ]}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={{ color: theme.text, fontSize: 16 }}>
          {date.toLocaleDateString('pt-BR')}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          locale="pt-BR"
          themeVariant={isDarkMode ? 'dark' : 'light'}
        />
      )}

      <Text style={[styles.label, { color: theme.text }]}>
        Selecione o horário:
      </Text>
      <View style={[styles.pickerContainer]}>
        <RNPickerSelect
          placeholder={{}}
          items={timeOptions}
          onValueChange={(value) => setSelectedTime(value)}
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
          }}
          value={selectedTime}
          useNativeAndroidPickerStyle={false}
          Icon={() => null}
        />
      </View>

      <TouchableOpacity
        onPress={handleSave}
        style={[styles.button, { backgroundColor: '#8A2BE2' }]}
      >
        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
          {appointment ? 'Salvar Alterações' : 'Agendar'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={clearFields}
        style={[styles.button, { backgroundColor: '#FF6F61', marginTop: 10 }]}
      >
        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
          Limpar Campos
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
  input: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    height: 50,
  },
  inputError: {
    borderColor: '#FF6F61',
    borderWidth: 1,
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
  },
  dateButton: {
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    height: 50,
    justifyContent: 'center',
  },
  pickerContainer: {
    marginBottom: 15,
    borderRadius: 8,
    overflow: 'hidden',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});
