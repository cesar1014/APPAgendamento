import * as SQLite from 'expo-sqlite';

// Função para abrir o banco de dados
const openDatabase = async () => {
  const db = await SQLite.openDatabaseAsync('appointments.db');
  return db;
};

// Função para criar as tabelas, se necessário
export const createTablesIfNeeded = async () => {
  const db = await openDatabase();
  try {
    // Ativar o modo WAL e criar tabelas em um único execAsync
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

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
        serviceName TEXT NOT NULL UNIQUE,
        isFavorite INTEGER DEFAULT 0
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

    console.log('Tabelas criadas/verificadas com sucesso.');
  } catch (error) {
    console.error('Erro ao criar as tabelas:', error);
    throw error;
  }
};

// Função para verificar se as tabelas existem
export const checkTablesExist = async () => {
  const db = await openDatabase();
  try {
    const tables = [
      'appointments',
      'services',
      'colaboradores',
      'service_colaboradores',
      'atendimentos',
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

// Função para inicializar serviços padrão
export const initializeDefaultServices = async () => {
  const db = await openDatabase();
  try {
    // Verifica se já existem serviços no banco de dados
    const result = await db.getFirstAsync('SELECT COUNT(*) as count FROM services;');
    const count = result.count;

    if (count === 0) {
      // Inserir serviços padrão com isFavorite = 0
      await db.runAsync(
        'INSERT INTO services (serviceName, isFavorite) VALUES (?, ?);',
        ['Banho', 0]
      );
      await db.runAsync(
        'INSERT INTO services (serviceName, isFavorite) VALUES (?, ?);',
        ['Tosa', 0]
      );
      await db.runAsync(
        'INSERT INTO services (serviceName, isFavorite) VALUES (?, ?);',
        ['Tosa e Banho', 0]
      );

      console.log('Serviços padrão inseridos com sucesso.');
    } else {
      console.log('Serviços já existem no banco de dados.');
    }
  } catch (error) {
    console.error('Erro ao inicializar serviços padrão:', error);
    throw error;
  }
};

// Adicionar atendimento
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
      SELECT a.*, c.nome as colaboradorNome, at.serviceDescription, at.colaboradorId
      FROM appointments a
      LEFT JOIN colaboradores c ON a.colaboradorId = c.id
      INNER JOIN atendimentos at ON at.appointmentId = a.id AND at.atendimentoConcluido = 1
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

// Função para adicionar um serviço
export const addService = async (serviceName, isFavorite = 0) => {
  const db = await openDatabase();
  try {
    const result = await db.runAsync(
      'INSERT INTO services (serviceName, isFavorite) VALUES (?, ?);',
      [serviceName, isFavorite]
    );
    console.log('Serviço adicionado com sucesso:', result.lastInsertRowId);
  } catch (error) {
    console.error('Erro ao adicionar serviço:', error);
    throw error;
  }
};

// Função para obter todos os serviços
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

// Função para atualizar um serviço
export const updateService = async (id, serviceName, isFavorite = 0) => {
  const db = await openDatabase();
  try {
    const result = await db.runAsync(
      'UPDATE services SET serviceName = ?, isFavorite = ? WHERE id = ?;',
      [serviceName, isFavorite, id]
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

// Função para obter agendamentos vinculados a um serviço específico
export const getAppointmentsLinkedToService = async (serviceDescription) => {
  const db = await openDatabase();
  try {
    const appointments = await db.getAllAsync(
      'SELECT * FROM appointments WHERE serviceDescription = ?;',
      [serviceDescription]
    );
    return appointments;
  } catch (error) {
    console.error('Erro ao obter agendamentos vinculados ao serviço:', error);
    throw error;
  }
};

