import * as SQLite from 'expo-sqlite';

const openDatabase = async () => {
  const db = await SQLite.openDatabaseAsync('appointments.db');
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
  `);
  return db;
};

// adicionar agendamento
export const addAppointment = async (appointment) => {
  const db = await openDatabase();
  const { name, phone, serviceDescription, date, time } = appointment;
  await db.runAsync(
    'INSERT INTO appointments (name, phone, serviceDescription, date, time) VALUES (?, ?, ?, ?, ?)',
    name, phone, serviceDescription, date, time
  );
};

// buscar agendamentos e ordenar por data
export const getAppointments = async () => {
  const db = await openDatabase();
  const result = await db.getAllAsync(`
    SELECT * FROM appointments
    ORDER BY date(date) ASC, time ASC
  `);
  return result;
};

// deletar um agendamento
export const deleteAppointment = async (id) => {
  const db = await openDatabase();
  await db.runAsync('DELETE FROM appointments WHERE id = ?', id);
};

// atualizar um agendamento existente
export const updateAppointment = async (id, appointment) => {
  const db = await openDatabase();
  const { name, phone, serviceDescription, date, time } = appointment;
  await db.runAsync(
    'UPDATE appointments SET name = ?, phone = ?, serviceDescription = ?, date = ?, time = ? WHERE id = ?',
    name, phone, serviceDescription, date, time, id
  );
};
