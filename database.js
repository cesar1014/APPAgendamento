import * as SQLite from 'expo-sqlite';

// Função para abrir o banco de dados usando openDatabaseAsync
const openDatabase = async () => {
  const db = await SQLite.openDatabaseAsync('appointments.db');
  // Certifique-se de que as tabelas sejam criadas antes de continuar
  await createTablesIfNeeded(db); // Garantir que as tabelas sejam criadas
  return db;
};

// Função para criar tabelas se elas ainda não existirem
export const createTablesIfNeeded = async (db) => {
  console.log("Verificando e criando tabelas, se necessário...");
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      serviceDescription TEXT,
      date TEXT NOT NULL,
      time TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      serviceName TEXT NOT NULL UNIQUE,
      isFavorite INTEGER DEFAULT 0
    );
  `);
  console.log("Tabelas verificadas/criadas com sucesso.");
};

// Função para inicializar serviços padrão se a tabela de serviços estiver vazia
export const initializeDefaultServices = async () => {
  const db = await openDatabase();
  const result = await db.getFirstAsync('SELECT COUNT(*) as count FROM services');

  if (result.count === 0) {
    // Se não houver serviços, inserir os serviços padrões
    await db.runAsync('INSERT INTO services (serviceName, isFavorite) VALUES (?, ?), (?, ?), (?, ?)', 
      ['Banho', 0, 'Tosa', 0, 'Banho e Tosa', 0]);
  }
};

// Função para limpar o banco de dados (zerar as tabelas)
export const resetDatabase = async () => {
  const db = await openDatabase();
  await db.execAsync('DROP TABLE IF EXISTS appointments');
  await db.execAsync('DROP TABLE IF EXISTS services');
  
  await createTablesIfNeeded(db);
  await initializeDefaultServices();
};

// Função para adicionar agendamentos
export const addAppointment = async (appointment) => {
  const db = await openDatabase();
  const { name, phone, serviceDescription, date, time } = appointment;
  await db.runAsync(
    'INSERT INTO appointments (name, phone, serviceDescription, date, time) VALUES (?, ?, ?, ?, ?)',
    name, phone, serviceDescription, date, time
  );
};

// Função para obter todos os agendamentos
export const getAppointments = async () => {
  const db = await openDatabase();
  return await db.getAllAsync('SELECT * FROM appointments ORDER BY date(date) ASC, time ASC');
};

// Função para excluir um agendamento
export const deleteAppointment = async (id) => {
  const db = await openDatabase();
  await db.runAsync('DELETE FROM appointments WHERE id = ?', id);
};

// Função para atualizar agendamentos
export const updateAppointment = async (id, appointment) => {
  const db = await openDatabase();
  const { name, phone, serviceDescription, date, time } = appointment;
  await db.runAsync(
    'UPDATE appointments SET name = ?, phone = ?, serviceDescription = ?, date = ?, time = ? WHERE id = ?',
    name, phone, serviceDescription, date, time, id
  );
};

// Função para obter todos os serviços
export const getServices = async () => {
  const db = await openDatabase();
  return await db.getAllAsync('SELECT * FROM services ORDER BY isFavorite DESC, serviceName ASC');
};

// Função para adicionar um novo serviço
export const addService = async (serviceName, isFavorite = 0) => {
  const db = await openDatabase();
  await db.runAsync('INSERT INTO services (serviceName, isFavorite) VALUES (?, ?)', serviceName, isFavorite);
};

// Função para excluir um serviço e manter a descrição no agendamento
export const deleteService = async (id, serviceName) => {
  const db = await openDatabase();

  // Verificar quantos serviços existem no total
  const totalServices = await db.getFirstAsync('SELECT COUNT(*) as count FROM services');
  
  if (totalServices.count <= 1) {
    throw new Error('Não é possível excluir o último serviço.');
  }

  const linkedAppointments = await db.getAllAsync('SELECT * FROM appointments WHERE serviceDescription = ?', serviceName);

  if (linkedAppointments.length > 0) {
    // Perguntar ao usuário se ele realmente quer excluir o serviço
    const confirmation = window.confirm(
      `Existem ${linkedAppointments.length} agendamento(s) com o serviço "${serviceName}". 
      Deseja continuar com a exclusão? O serviço será excluído, mas os agendamentos continuarão a exibir "${serviceName}".`
    );
    
    if (!confirmation) {
      return;
    }
  }

  // Excluir o serviço da tabela de serviços
  await db.runAsync('DELETE FROM services WHERE id = ?', id);
};

// Função para atualizar um serviço
export const updateService = async (id, newServiceName, isFavorite) => {
  const db = await openDatabase();
  await db.runAsync('UPDATE services SET serviceName = ?, isFavorite = ? WHERE id = ?', newServiceName, isFavorite, id);
};
