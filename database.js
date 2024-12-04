import * as SQLite from 'expo-sqlite';

let db;

// Função para abrir o banco de dados
const openDatabase = async () => {
  if (db) {
    return db;
  }
  db = await SQLite.openDatabaseAsync('appointments.db');
  return db;
};

const defaultServicesBySector = {
  'Oficina Mecânica': [
    {
      serviceName: 'Troca de Óleo',
      description: 'Troca de óleo do motor.',
      isFavorite: 0,
    },
    {
      serviceName: 'Troca de Pneu',
      description: 'Substituição de pneus desgastados.',
      isFavorite: 0,
    },
    {
      serviceName: 'Revisão',
      description: 'Revisão completa do veículo.',
      isFavorite: 0,
    },
    {
      serviceName: 'Balanceamento',
      description: 'Balanceamento das rodas.',
      isFavorite: 0,
    },
  ],
  'Barbearia': [
    {
      serviceName: 'Corte de Cabelo',
      description: 'Corte personalizado de cabelo.',
      isFavorite: 0,
    },
    {
      serviceName: 'Barba',
      description: 'Aparar e desenhar a barba.',
      isFavorite: 0,
    },
    {
      serviceName: 'Sobrancelha',
      description: 'Modelagem das sobrancelhas.',
      isFavorite: 0,
    },
  ],
  'Pet Shop': [
    {
      serviceName: 'Banho',
      description: 'Banho completo para seu pet.',
      isFavorite: 0,
    },
    {
      serviceName: 'Tosa',
      description: 'Corte de pelos do pet.',
      isFavorite: 0,
    },
    {
      serviceName: 'Banho e Tosa',
      description: 'Serviço completo de higiene e estética para pets.',
      isFavorite: 0,
    },
    {
      serviceName: 'Consulta Veterinária',
      description: 'Consulta com veterinário especializado.',
      isFavorite: 0,
    },
  ],
};

// Função para criar as tabelas, se necessário
export const createTablesIfNeeded = async () => {
  const db = await openDatabase();
  try {
    // Ativar o modo WAL e criar tabelas em um único execAsync
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS activityFields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        serviceDescription TEXT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        colaboradorId INTEGER,
        FOREIGN KEY (colaboradorId) REFERENCES colaboradores(id)
      );

      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        serviceName TEXT NOT NULL,
        description TEXT,
        isFavorite INTEGER DEFAULT 0,
        activityFieldId INTEGER,
        FOREIGN KEY (activityFieldId) REFERENCES activityFields(id)
      );

      CREATE TABLE IF NOT EXISTS colaboradores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS service_colaboradores (
        serviceId INTEGER,
        colaboradorId INTEGER,
        PRIMARY KEY (serviceId, colaboradorId),
        FOREIGN KEY (serviceId) REFERENCES services(id),
        FOREIGN KEY (colaboradorId) REFERENCES colaboradores(id)
      );

      CREATE TABLE IF NOT EXISTS atendimentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        appointmentId INTEGER NOT NULL,
        serviceDescription TEXT NOT NULL,
        colaboradorId INTEGER,
        atendimentoConcluido INTEGER DEFAULT 0,
        FOREIGN KEY (appointmentId) REFERENCES appointments(id),
        FOREIGN KEY (colaboradorId) REFERENCES colaboradores(id)
      );
    `);

    // Inserir ramos de atividade predefinidos (sem inserir serviços)
    for (const sector of Object.keys(defaultServicesBySector)) {
      await db.runAsync('INSERT OR IGNORE INTO activityFields (name) VALUES (?);', [sector]);
    }

    console.log('Tabelas criadas/verificadas com sucesso.');
  } catch (error) {
    console.error('Erro ao criar as tabelas:', error);
    throw error;
  }
};


// Função para inserir serviços predefinidos com base no ramo selecionado
export const insertDefaultServices = async (activityFieldName) => {
  const db = await openDatabase();
  try {
    const services = defaultServicesBySector[activityFieldName];
    if (!services) {
      console.warn(`Nenhum serviço predefinido encontrado para o ramo: ${activityFieldName}`);
      return;
    }

    // Obter o ID do ramo de atividade
    const sectorData = await db.getFirstAsync(
      'SELECT id FROM activityFields WHERE name = ?;',
      [activityFieldName]
    );

    if (!sectorData) {
      console.error(`Ramo de atividade não encontrado: ${activityFieldName}`);
      return;
    }

    const activityFieldId = sectorData.id;

    // Inserir serviços predefinidos
    for (const service of services) {
      await db.runAsync(
        'INSERT OR IGNORE INTO services (serviceName, description, isFavorite, activityFieldId) VALUES (?, ?, ?, ?);',
        [service.serviceName, service.description, service.isFavorite, activityFieldId]
      );
    }

    console.log(`Serviços predefinidos inseridos para o ramo: ${activityFieldName}`);
  } catch (error) {
    console.error('Erro ao inserir serviços predefinidos:', error);
    throw error;
  }
};

// Função para obter um ramo de atividade pelo nome
export const getActivityFieldByName = async (activityFieldName) => {
  const db = await openDatabase();
  try {
    const result = await db.getFirstAsync(
      'SELECT * FROM activityFields WHERE name = ?;',
      [activityFieldName]
    );
    return result || null;
  } catch (error) {
    console.error('Erro ao buscar ramo de atividade por nome:', error);
    throw error;
  }
};

// Função para obter todos os ramos de atividade
export const getAllActivityFields = async () => {
  const db = await openDatabase();
  try {
    const activityFields = await db.getAllAsync('SELECT * FROM activityFields;');
    return activityFields;
  } catch (error) {
    console.error('Erro ao obter ramos de atividade:', error);
    throw error;
  }
};

export const updateActivityFields = async () => {
  const db = await openDatabase();
  try {
    for (const sector of Object.keys(defaultServicesBySector)) {
      await db.runAsync('INSERT OR IGNORE INTO activityFields (name) VALUES (?);', [sector]);
    }
    console.log('Ramos de atividade atualizados com sucesso.');
  } catch (error) {
    console.error('Erro ao atualizar ramos de atividade:', error);
    throw error;
  }
};

// Função para obter serviços por ramo de atividade
export const getServicesBySector = async (activityFieldName) => {
  const db = await openDatabase();
  try {
    const sectorData = await db.getFirstAsync(
      'SELECT id FROM activityFields WHERE name = ?;',
      [activityFieldName]
    );

    if (!sectorData) {
      console.warn(`Ramo de atividade não encontrado: ${activityFieldName}`);
      return [];
    }

    const activityFieldId = sectorData.id;

    const services = await db.getAllAsync(
      'SELECT * FROM services WHERE activityFieldId = ? ORDER BY isFavorite DESC, serviceName ASC;',
      [activityFieldId]
    );
    return services;
  } catch (error) {
    console.error('Erro ao obter serviços por ramo:', error);
    throw error;
  }
};

// Função para importar serviços de outro ramo de atividade
export const importServicesFromSector = async (sourceSectorName, targetActivityFieldId) => {
  const db = await openDatabase();
  try {
    // Obter o ID do ramo de origem
    const sourceSector = await db.getFirstAsync(
      'SELECT id FROM activityFields WHERE name = ?;',
      [sourceSectorName]
    );

    if (!sourceSector) {
      console.error('Ramo de atividade de origem não encontrado.');
      return;
    }

    const sourceSectorId = sourceSector.id;

    // Verificar se existem serviços para o ramo de origem
    let servicesToImport = await db.getAllAsync(
      'SELECT serviceName, description, isFavorite FROM services WHERE activityFieldId = ?;',
      [sourceSectorId]
    );

    // Se não houver serviços, inserir os serviços padrão para o ramo de origem
    if (servicesToImport.length === 0) {
      console.log(`Nenhum serviço encontrado para o ramo ${sourceSectorName}. Inserindo serviços padrão.`);
      await insertDefaultServices(sourceSectorName);
      // Recarregar os serviços após a inserção
      servicesToImport = await db.getAllAsync(
        'SELECT serviceName, description, isFavorite FROM services WHERE activityFieldId = ?;',
        [sourceSectorId]
      );
    }

    for (const service of servicesToImport) {
      // Verificar se o serviço já existe no ramo atual para evitar duplicatas
      const existingService = await db.getFirstAsync(
        'SELECT id FROM services WHERE serviceName = ? AND activityFieldId = ?;',
        [service.serviceName, targetActivityFieldId]
      );

      if (!existingService) {
        await db.runAsync(
          'INSERT INTO services (serviceName, description, isFavorite, activityFieldId) VALUES (?, ?, ?, ?);',
          [service.serviceName, service.description, service.isFavorite, targetActivityFieldId]
        );
        console.log(`Serviço importado: ${service.serviceName}`);
      } else {
        console.log(`Serviço já existe: ${service.serviceName}`);
      }
    }

    console.log(`Serviços importados de ${sourceSectorName} com sucesso.`);
  } catch (error) {
    console.error('Erro ao importar serviços:', error);
    throw error;
  }
};

// Função para adicionar um agendamento
export const addAppointment = async (appointment) => {
  const db = await openDatabase();
  const {
    name,
    phone,
    serviceDescription,
    date,
    time,
    colaboradorId = null,
  } = appointment;

  try {
    const result = await db.runAsync(
      'INSERT INTO appointments (name, phone, serviceDescription, date, time, colaboradorId) VALUES (?, ?, ?, ?, ?, ?);',
      [name, phone, serviceDescription, date, time, colaboradorId]
    );
    console.log('Agendamento adicionado com sucesso:', result.lastInsertRowId);
  } catch (error) {
    console.error('Erro ao adicionar agendamento:', error);
    throw error;
  }
};

// Função para atualizar um agendamento existente
export const updateAppointment = async (id, appointment) => {
  const db = await openDatabase();
  const {
    name,
    phone,
    serviceDescription,
    date,
    time,
    colaboradorId = null,
  } = appointment;

  try {
    const result = await db.runAsync(
      'UPDATE appointments SET name = ?, phone = ?, serviceDescription = ?, date = ?, time = ?, colaboradorId = ? WHERE id = ?;',
      [name, phone, serviceDescription, date, time, colaboradorId, id]
    );
    console.log('Agendamento atualizado com sucesso:', result.changes);
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    throw error;
  }
};

// Função para obter todos os agendamentos que NÃO estão concluídos
export const getAppointments = async () => {
  const db = await openDatabase();
  try {
    const appointments = await db.getAllAsync(`
      SELECT a.*, c.nome as colaboradorNome
      FROM appointments a
      LEFT JOIN colaboradores c ON a.colaboradorId = c.id
      WHERE NOT EXISTS (
        SELECT 1 FROM atendimentos at WHERE at.appointmentId = a.id AND at.atendimentoConcluido = 1
      )
      ORDER BY date(a.date) ASC, a.time ASC;
    `);
    return appointments;
  } catch (error) {
    console.error('Erro ao obter agendamentos:', error);
    throw error;
  }
};

// Função para obter agendamentos concluídos
export const getConcludedAppointments = async () => {
  const db = await openDatabase();
  try {
    const appointments = await db.getAllAsync(`
      SELECT a.*, at.id as atendimentoId, at.serviceDescription, at.colaboradorId, c.nome as colaboradorNome
      FROM appointments a
      INNER JOIN atendimentos at ON at.appointmentId = a.id AND at.atendimentoConcluido = 1
      LEFT JOIN colaboradores c ON at.colaboradorId = c.id
      ORDER BY date(a.date) ASC, a.time ASC;
    `);
    return appointments;
  } catch (error) {
    console.error('Erro ao obter agendamentos concluídos:', error);
    throw error;
  }
};

// Função para deletar um agendamento
export const deleteAppointment = async (id) => {
  const db = await openDatabase();
  try {
    const result = await db.runAsync(
      'DELETE FROM appointments WHERE id = ?;',
      [id]
    );
    console.log('Agendamento excluído com sucesso:', result.changes);
  } catch (error) {
    console.error('Erro ao excluir agendamento:', error);
    throw error;
  }
};

// Função para adicionar um serviço com descrição
export const addService = async (
  serviceName,
  description = '',
  isFavorite = 0,
  activityFieldId = null
) => {
  const db = await openDatabase();
  try {
    const result = await db.runAsync(
      'INSERT INTO services (serviceName, description, isFavorite, activityFieldId) VALUES (?, ?, ?, ?);',
      [serviceName, description, isFavorite, activityFieldId]
    );
    console.log('Serviço adicionado com sucesso:', result.lastInsertRowId);
  } catch (error) {
    console.error('Erro ao adicionar serviço:', error);
    throw error;
  }
};


// Função para obter todos os serviços (incluindo a descrição e o ramo)
export const getAllServices = async () => {
  const db = await openDatabase();
  try {
    const services = await db.getAllAsync(
      'SELECT s.*, af.name as activityFieldName FROM services s LEFT JOIN activityFields af ON s.activityFieldId = af.id ORDER BY s.serviceName ASC;'
    );
    return services;
  } catch (error) {
    console.error('Erro ao obter todos os serviços:', error);
    throw error;
  }
};

// Função para atualizar um serviço com descrição
export const updateService = async (
  id,
  serviceName,
  description = '',
  isFavorite = 0
) => {
  const db = await openDatabase();
  try {
    const result = await db.runAsync(
      'UPDATE services SET serviceName = ?, description = ?, isFavorite = ? WHERE id = ?;',
      [serviceName, description, isFavorite, id]
    );
    console.log('Serviço atualizado com sucesso:', result.changes);
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    throw error;
  }
};

// Função para deletar um serviço
export const deleteService = async (id) => {
  const db = await openDatabase();
  try {
    // Exclui o serviço
    await db.runAsync('DELETE FROM services WHERE id = ?;', [id]);
    // Exclui associações na tabela service_colaboradores
    await db.runAsync('DELETE FROM service_colaboradores WHERE serviceId = ?;', [id]);
    console.log('Serviço excluído com sucesso');
  } catch (error) {
    console.error('Erro ao excluir serviço:', error);
    throw error;
  }
};

// Função para adicionar um colaborador
export const addColaborador = async (nome, serviceIds = []) => {
  const db = await openDatabase();
  try {
    const result = await db.runAsync(
      'INSERT INTO colaboradores (nome) VALUES (?);',
      [nome]
    );
    const colaboradorId = result.lastInsertRowId;
    console.log('Colaborador adicionado com sucesso:', colaboradorId);

    // Inserir associações com serviços
    for (const serviceId of serviceIds) {
      await db.runAsync(
        'INSERT INTO service_colaboradores (serviceId, colaboradorId) VALUES (?, ?);',
        [serviceId, colaboradorId]
      );
    }
  } catch (error) {
    console.error('Erro ao adicionar colaborador:', error);
    throw error;
  }
};

// Função para obter todos os colaboradores
export const getColaboradores = async () => {
  const db = await openDatabase();
  try {
    const colaboradores = await db.getAllAsync('SELECT * FROM colaboradores;');
    return colaboradores;
  } catch (error) {
    console.error('Erro ao obter colaboradores:', error);
    throw error;
  }
};

// Função para atualizar o nome de um colaborador
export const updateColaboradorName = async (id, nome) => {
  const db = await openDatabase();
  try {
    const result = await db.runAsync(
      'UPDATE colaboradores SET nome = ? WHERE id = ?;',
      [nome, id]
    );
    console.log('Nome do colaborador atualizado com sucesso:', result.changes);
  } catch (error) {
    console.error('Erro ao atualizar nome do colaborador:', error);
    throw error;
  }
};

// Função para definir os serviços associados a um colaborador
export const setColaboradorServices = async (colaboradorId, serviceIds) => {
  const db = await openDatabase();
  try {
    // Remover associações antigas
    await db.runAsync(
      'DELETE FROM service_colaboradores WHERE colaboradorId = ?;',
      [colaboradorId]
    );

    // Inserir novas associações
    for (const serviceId of serviceIds) {
      await db.runAsync(
        'INSERT INTO service_colaboradores (serviceId, colaboradorId) VALUES (?, ?);',
        [serviceId, colaboradorId]
      );
    }
    console.log('Serviços do colaborador atualizados com sucesso.');
  } catch (error) {
    console.error('Erro ao definir serviços do colaborador:', error);
    throw error;
  }
};

// Função para deletar um colaborador
export const deleteColaborador = async (id) => {
  const db = await openDatabase();
  try {
    // Remover agendamentos associados ao colaborador
    await db.runAsync(
      'UPDATE appointments SET colaboradorId = NULL WHERE colaboradorId = ?;',
      [id]
    );
    // Remover associações com serviços
    await db.runAsync(
      'DELETE FROM service_colaboradores WHERE colaboradorId = ?;',
      [id]
    );
    // Remover o colaborador
    const result = await db.runAsync(
      'DELETE FROM colaboradores WHERE id = ?;',
      [id]
    );
    console.log('Colaborador excluído com sucesso:', result.changes);
  } catch (error) {
    console.error('Erro ao excluir colaborador:', error);
    throw error;
  }
};

// Função para obter os colaboradores associados a um serviço
export const getColaboradoresForService = async (serviceId) => {
  const db = await openDatabase();
  try {
    const colaboradores = await db.getAllAsync(
      `
      SELECT c.*
      FROM colaboradores c
      INNER JOIN service_colaboradores sc ON c.id = sc.colaboradorId
      WHERE sc.serviceId = ?;
      `,
      [serviceId]
    );
    return colaboradores;
  } catch (error) {
    console.error('Erro ao obter colaboradores para o serviço:', error);
    throw error;
  }
};

// Função para obter os serviços associados a um colaborador
export const getServicesForColaborador = async (colaboradorId) => {
  const db = await openDatabase();
  try {
    const services = await db.getAllAsync(
      `
      SELECT s.*
      FROM services s
      INNER JOIN service_colaboradores sc ON s.id = sc.serviceId
      WHERE sc.colaboradorId = ?;
      `,
      [colaboradorId]
    );
    return services;
  } catch (error) {
    console.error('Erro ao obter serviços para o colaborador:', error);
    throw error;
  }
};

export const getServices = async () => {
  const db = await openDatabase();
  try {
    const services = await db.getAllAsync(
      'SELECT * FROM services ORDER BY isFavorite DESC, serviceName ASC;'
    );
    return services;
  } catch (error) {
    console.error('Erro ao obter serviços:', error);
    throw error;
  }
};

// Função para adicionar um atendimento
export const addAtendimento = async (
  appointmentId,
  serviceDescription,
  colaboradorId = null
) => {
  const db = await openDatabase();
  await db.runAsync(
    'INSERT INTO atendimentos (appointmentId, serviceDescription, colaboradorId, atendimentoConcluido) VALUES (?, ?, ?, 1);',
    [appointmentId, serviceDescription, colaboradorId]
  );
};

// Obter atendimentos em andamento
export const getAtendimentos = async () => {
  const db = await openDatabase();
  return await db.getAllAsync(
    'SELECT * FROM atendimentos WHERE atendimentoConcluido = 0;'
  );
};

// Finalizar atendimento
export const finalizarAtendimento = async (id) => {
  const db = await openDatabase();
  await db.runAsync('UPDATE atendimentos SET atendimentoConcluido = 1 WHERE id = ?;', [id]);
};

// Obter atendimentos concluídos
export const getAtendimentosConcluidos = async () => {
  const db = await openDatabase();
  return await db.getAllAsync(
    'SELECT * FROM atendimentos WHERE atendimentoConcluido = 1;'
  );
};

// Deletar atendimento
export const deleteAtendimento = async (id) => {
  const db = await openDatabase();
  await db.runAsync('DELETE FROM atendimentos WHERE id = ?;', [id]);
};

// Função para atualizar um atendimento
export const updateAtendimento = async (id, serviceDescription, colaboradorId = null) => {
  const db = await openDatabase();
  await db.runAsync(
    'UPDATE atendimentos SET serviceDescription = ?, colaboradorId = ? WHERE id = ?;',
    [serviceDescription, colaboradorId, id]
  );
};
// Função para gerar o texto de agendamento
export const generateAppointmentText = (appointment, customText) => {
  const { name, serviceDescription, date, time } = appointment;
  const formattedDate = new Date(date).toLocaleDateString('pt-BR');

  // Usar o texto personalizado ou o texto padrão
  const appointmentText = customText
    ? customText.replace('${name}', name)
                .replace('${serviceDescription}', serviceDescription)
                .replace('${time}', time)
                .replace('${formattedDate}', formattedDate)
    : `Olá ${name}. Você possui agendado o serviço ${serviceDescription} às ${time} do dia ${formattedDate}.`;

  return appointmentText;
};

export const checkTablesExist = async () => {
  const db = await openDatabase();
  try {
    const tables = [
      'appointments',
      'services',
      'colaboradores',
      'service_colaboradores',
      'atendimentos',
      'activityFields',
    ];
    for (const table of tables) {
      const result = await db.getFirstAsync(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?;`,
        [table]
      );
      if (!result) {
        console.error(`Tabela ${table} não existe.`);
      } else {
        console.log(`Tabela ${table} existe.`);
      }
    }
  } catch (error) {
    console.error('Erro ao verificar se as tabelas existem:', error);
    throw error;
  }
};

export const getClientesAtendidos = async () => {
  const db = await openDatabase();
  try {
    const clientesAtendidos = await db.getAllAsync(`
      SELECT a.name, a.phone, GROUP_CONCAT(DISTINCT a.date) as dates
      FROM appointments a
      INNER JOIN atendimentos at ON at.appointmentId = a.id AND at.atendimentoConcluido = 1
      GROUP BY a.name, a.phone
      ORDER BY MAX(a.date) DESC;
    `);

    // Processar os resultados para criar um array de clientes
    const clientesProcessados = clientesAtendidos.map(cliente => ({
      name: cliente.name,
      phone: cliente.phone,
      // Converter string de datas em array e ordenar
      dates: cliente.dates.split(',')
        .map(date => date.trim())
        .sort((a, b) => new Date(a) - new Date(b))
    }));

    return clientesProcessados;
  } catch (error) {
    console.error('Erro ao buscar clientes atendidos:', error);
    throw error;
  }
};

export const deleteAllServices = async () => {
  const db = await openDatabase();
  try {
    await db.runAsync('DELETE FROM services;');
    console.log('Todos os serviços excluídos com sucesso.');
  } catch (error) {
    console.error('Erro ao excluir serviços:', error);
    throw error;
  }
};

// Função para deletar todos os agendamentos
export const deleteAllAppointments = async () => {
  const db = await openDatabase();
  try {
    await db.runAsync('DELETE FROM appointments;');
    console.log('Todos os agendamentos excluídos com sucesso.');
  } catch (error) {
    console.error('Erro ao excluir agendamentos:', error);
    throw error;
  }
};

// Função para deletar todos os colaboradores
export const deleteAllColaboradores = async () => {
  const db = await openDatabase();
  try {
    await db.runAsync('DELETE FROM colaboradores;');
    console.log('Todos os colaboradores excluídos com sucesso.');
  } catch (error) {
    console.error('Erro ao excluir colaboradores:', error);
    throw error;
  }
};
export const exportDatabase = async () => {
  const db = await openDatabase();
  try {
    // Collect data from all tables
    const activityFields = await db.getAllAsync('SELECT * FROM activityFields;');
    const services = await db.getAllAsync('SELECT * FROM services;');
    const colaboradores = await db.getAllAsync('SELECT * FROM colaboradores;');
    const serviceColaboradores = await db.getAllAsync('SELECT * FROM service_colaboradores;');
    const appointments = await db.getAllAsync('SELECT * FROM appointments;');
    const atendimentos = await db.getAllAsync('SELECT * FROM atendimentos;');

    // Construct backup object
    const backupData = {
      activityFields,
      services,
      colaboradores,
      serviceColaboradores,
      appointments,
      atendimentos,
    };

    return backupData;
  } catch (error) {
    console.error('Erro ao exportar o banco de dados:', error);
    throw error;
  }
};

// Enhanced importDatabase to include all tables
export const importDatabase = async (backupData) => {
  const db = await openDatabase();
  try {
    await db.execAsync('BEGIN TRANSACTION;');

    // Limpar dados existentes nas tabelas que possuem dependências
    await db.runAsync('DELETE FROM service_colaboradores;');
    await db.runAsync('DELETE FROM atendimentos;');
    await db.runAsync('DELETE FROM appointments;');
    await db.runAsync('DELETE FROM services;');
    await db.runAsync('DELETE FROM colaboradores;');
    await db.runAsync('DELETE FROM activityFields;');

    // Inserir dados nas tabelas na ordem correta
    for (const field of backupData.activityFields) {
      await db.runAsync(
        'INSERT INTO activityFields (id, name) VALUES (?, ?);',
        [field.id, field.name]
      );
    }

    for (const service of backupData.services) {
      await db.runAsync(
        'INSERT INTO services (id, serviceName, description, isFavorite, activityFieldId) VALUES (?, ?, ?, ?, ?);',
        [service.id, service.serviceName, service.description, service.isFavorite, service.activityFieldId]
      );
    }

    for (const colaborador of backupData.colaboradores) {
      await db.runAsync(
        'INSERT INTO colaboradores (id, nome) VALUES (?, ?);',
        [colaborador.id, colaborador.nome]
      );
    }

    for (const sc of backupData.serviceColaboradores) {
      await db.runAsync(
        'INSERT INTO service_colaboradores (serviceId, colaboradorId) VALUES (?, ?);',
        [sc.serviceId, sc.colaboradorId]
      );
    }

    for (const appointment of backupData.appointments) {
      await db.runAsync(
        'INSERT INTO appointments (id, name, phone, serviceDescription, date, time, colaboradorId) VALUES (?, ?, ?, ?, ?, ?, ?);',
        [
          appointment.id,
          appointment.name,
          appointment.phone,
          appointment.serviceDescription,
          appointment.date,
          appointment.time,
          appointment.colaboradorId,
        ]
      );
    }

    for (const atendimento of backupData.atendimentos) {
      await db.runAsync(
        'INSERT INTO atendimentos (id, appointmentId, serviceDescription, colaboradorId, atendimentoConcluido) VALUES (?, ?, ?, ?, ?);',
        [
          atendimento.id,
          atendimento.appointmentId,
          atendimento.serviceDescription,
          atendimento.colaboradorId,
          atendimento.atendimentoConcluido,
        ]
      );
    }

    await db.execAsync('COMMIT;');
    console.log('Banco de dados importado com sucesso.');
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    console.error('Erro ao importar o banco de dados:', error);
    throw error;
  }
};

