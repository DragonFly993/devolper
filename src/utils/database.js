import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('self_management.db');

// 初始化数据库
export const initDatabase = () => {
  db.transaction(tx => {
    // 创建任务表
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, completed INTEGER, priority TEXT, createdAt TEXT);'
    );
    
    // 创建习惯表
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS habits (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, completed INTEGER, streak INTEGER, color TEXT, createdAt TEXT);'
    );
    
    // 创建交易表
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, amount REAL, type TEXT, date TEXT, createdAt TEXT);'
    );
    
    // 创建健康数据表
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS health_data (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, value REAL, date TEXT, createdAt TEXT);'
    );
    
    // 创建时间记录表
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS time_records (id INTEGER PRIMARY KEY AUTOINCREMENT, activity TEXT, duration INTEGER, date TEXT, createdAt TEXT);'
    );
  });
};

// 任务相关操作
export const addTask = (task) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO tasks (title, completed, priority, createdAt) VALUES (?, ?, ?, ?);',
        [task.title, task.completed ? 1 : 0, task.priority, new Date().toISOString()],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

export const getTasks = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM tasks ORDER BY createdAt DESC;',
        [],
        (_, result) => {
          const tasks = [];
          for (let i = 0; i < result.rows.length; i++) {
            tasks.push({
              id: result.rows.item(i).id,
              title: result.rows.item(i).title,
              completed: result.rows.item(i).completed === 1,
              priority: result.rows.item(i).priority
            });
          }
          resolve(tasks);
        },
        (_, error) => reject(error)
      );
    });
  });
};

export const updateTask = (task) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'UPDATE tasks SET completed = ? WHERE id = ?;',
        [task.completed ? 1 : 0, task.id],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

export const deleteTask = (id) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM tasks WHERE id = ?;',
        [id],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

// 习惯相关操作
export const addHabit = (habit) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO habits (name, completed, streak, color, createdAt) VALUES (?, ?, ?, ?, ?);',
        [habit.name, habit.completed ? 1 : 0, habit.streak, habit.color, new Date().toISOString()],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

export const getHabits = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM habits ORDER BY createdAt DESC;',
        [],
        (_, result) => {
          const habits = [];
          for (let i = 0; i < result.rows.length; i++) {
            habits.push({
              id: result.rows.item(i).id,
              name: result.rows.item(i).name,
              completed: result.rows.item(i).completed === 1,
              streak: result.rows.item(i).streak,
              color: result.rows.item(i).color
            });
          }
          resolve(habits);
        },
        (_, error) => reject(error)
      );
    });
  });
};

export const updateHabit = (habit) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'UPDATE habits SET completed = ?, streak = ? WHERE id = ?;',
        [habit.completed ? 1 : 0, habit.streak, habit.id],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

export const deleteHabit = (id) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM habits WHERE id = ?;',
        [id],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

// 交易相关操作
export const addTransaction = (transaction) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO transactions (title, amount, type, date, createdAt) VALUES (?, ?, ?, ?, ?);',
        [transaction.title, transaction.amount, transaction.type, transaction.date, new Date().toISOString()],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

export const getTransactions = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM transactions ORDER BY date DESC;',
        [],
        (_, result) => {
          const transactions = [];
          for (let i = 0; i < result.rows.length; i++) {
            transactions.push({
              id: result.rows.item(i).id,
              title: result.rows.item(i).title,
              amount: result.rows.item(i).amount,
              type: result.rows.item(i).type,
              date: result.rows.item(i).date
            });
          }
          resolve(transactions);
        },
        (_, error) => reject(error)
      );
    });
  });
};

// 健康数据相关操作
export const addHealthData = (data) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO health_data (type, value, date, createdAt) VALUES (?, ?, ?, ?);',
        [data.type, data.value, data.date, new Date().toISOString()],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

export const getHealthData = (type, date) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM health_data WHERE type = ? AND date = ?;',
        [type, date],
        (_, result) => {
          const data = [];
          for (let i = 0; i < result.rows.length; i++) {
            data.push({
              id: result.rows.item(i).id,
              type: result.rows.item(i).type,
              value: result.rows.item(i).value,
              date: result.rows.item(i).date
            });
          }
          resolve(data);
        },
        (_, error) => reject(error)
      );
    });
  });
};

// 时间记录相关操作
export const addTimeRecord = (record) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO time_records (activity, duration, date, createdAt) VALUES (?, ?, ?, ?);',
        [record.activity, record.duration, record.date, new Date().toISOString()],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

export const getTimeRecords = (date) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM time_records WHERE date = ?;',
        [date],
        (_, result) => {
          const records = [];
          for (let i = 0; i < result.rows.length; i++) {
            records.push({
              id: result.rows.item(i).id,
              activity: result.rows.item(i).activity,
              duration: result.rows.item(i).duration,
              date: result.rows.item(i).date
            });
          }
          resolve(records);
        },
        (_, error) => reject(error)
      );
    });
  });
};