import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';

// 检测是否在Web环境中
const isWeb = Platform.OS === 'web';

// 内存存储，用于Web环境
let memoryStorage = {
  tasks: [],
  habits: [],
  transactions: [],
  health_data: [],
  time_records: [],
  habit_check_ins: [],
  settings: {},
  users: [],
};

/** Web：刷新后恢复本地数据（含用户账号），避免仅 session 存在而 users 丢失 */
const WEB_DB_KEY = 'traebuild_web_db_v1';

function loadWebPersistence() {
  if (!isWeb || typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(WEB_DB_KEY);
    if (!raw) return;
    const p = JSON.parse(raw);
    if (!p || typeof p !== 'object') return;
    memoryStorage.tasks = Array.isArray(p.tasks) ? p.tasks : [];
    memoryStorage.habits = Array.isArray(p.habits) ? p.habits : [];
    memoryStorage.transactions = Array.isArray(p.transactions) ? p.transactions : [];
    memoryStorage.health_data = Array.isArray(p.health_data) ? p.health_data : [];
    memoryStorage.time_records = Array.isArray(p.time_records) ? p.time_records : [];
    memoryStorage.habit_check_ins = Array.isArray(p.habit_check_ins) ? p.habit_check_ins : [];
    memoryStorage.settings = p.settings && typeof p.settings === 'object' ? p.settings : {};
    memoryStorage.users = Array.isArray(p.users) ? p.users : [];
  } catch (e) {
    console.warn('loadWebPersistence', e);
  }
}

export function persistWebPersistence() {
  if (!isWeb || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(WEB_DB_KEY, JSON.stringify(memoryStorage));
  } catch (e) {
    console.warn('persistWebPersistence', e);
  }
}

// 在Web环境中使用内存存储，在原生环境中使用SQLite
let db;
if (isWeb) {
  // Web环境下的存储实现
  console.log('Running in Web environment, using memory storage');
} else {
  // 原生环境下使用SQLite
  const SQLite = require('expo-sqlite');
  db = SQLite.openDatabase('self_management.db');
}

// 初始化数据库
export const initDatabase = () => {
  if (isWeb) {
    loadWebPersistence();
    return;
  }
  db.transaction((tx) => {
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

      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS habit_check_ins (habit_id INTEGER NOT NULL, date TEXT NOT NULL, PRIMARY KEY (habit_id, date));'
      );

      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);'
      );

      tx.executeSql(
        "ALTER TABLE transactions ADD COLUMN category TEXT DEFAULT '其他';",
        [],
        () => {},
        () => true
      );

      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, nickname TEXT, createdAt TEXT);'
      );
      tx.executeSql(
        'ALTER TABLE users ADD COLUMN avatar_uri TEXT;',
        [],
        () => {},
        () => true
      );
    });
};

const mapUserRow = (row) => ({
  id: row.id,
  email: row.email,
  nickname: row.nickname,
  avatarUri: row.avatar_uri != null && row.avatar_uri !== '' ? row.avatar_uri : null,
});

const hashPassword = async (password) => {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
};

export const registerUser = async ({ email, password, nickname }) => {
  const normalized = String(email).trim().toLowerCase();
  if (!normalized || !password || password.length < 6) {
    throw new Error('INVALID_INPUT');
  }
  const password_hash = await hashPassword(password);
  const nick = (nickname && String(nickname).trim()) || normalized.split('@')[0];
  const createdAt = new Date().toISOString();

  if (isWeb) {
    if (memoryStorage.users.some((u) => u.email === normalized)) {
      throw new Error('EMAIL_EXISTS');
    }
    const id = Date.now() + Math.floor(Math.random() * 1000000);
    memoryStorage.users.push({
      id,
      email: normalized,
      password_hash,
      nickname: nick,
      createdAt,
      avatar_uri: null,
    });
    persistWebPersistence();
    return { id, email: normalized, nickname: nick, avatarUri: null };
  }

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO users (email, password_hash, nickname, createdAt) VALUES (?, ?, ?, ?);',
        [normalized, password_hash, nick, createdAt],
        (_, result) => {
          const insertId = result.insertId;
          resolve({
            id: insertId != null ? insertId : undefined,
            email: normalized,
            nickname: nick,
            avatarUri: null,
          });
        },
        (_, error) => {
          const code = error && error.code;
          const msg = error && error.message ? String(error.message) : String(error);
          if (code === 19 || msg.includes('UNIQUE') || msg.includes('constraint')) {
            reject(new Error('EMAIL_EXISTS'));
          } else {
            reject(error);
          }
        }
      );
    });
  });
};

export const loginUser = async (email, password) => {
  const normalized = String(email).trim().toLowerCase();
  const password_hash = await hashPassword(password);

  if (isWeb) {
    const u = memoryStorage.users.find((x) => x.email === normalized);
    if (!u || u.password_hash !== password_hash) {
      return null;
    }
    return mapUserRow(u);
  }

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT id, email, password_hash, nickname, avatar_uri FROM users WHERE email = ? LIMIT 1;',
        [normalized],
        (_, result) => {
          if (result.rows.length === 0) {
            resolve(null);
            return;
          }
          const row = result.rows.item(0);
          if (row.password_hash !== password_hash) {
            resolve(null);
            return;
          }
          resolve(mapUserRow(row));
        },
        (_, error) => reject(error)
      );
    });
  });
};

export const getUserById = (id) => {
  return new Promise((resolve, reject) => {
  if (isWeb) {
    const uid = Number(id);
    const u = memoryStorage.users.find((x) => Number(x.id) === uid);
    resolve(
      u
        ? {
            id: u.id,
            email: u.email,
            nickname: u.nickname,
            avatarUri: u.avatar_uri != null && u.avatar_uri !== '' ? u.avatar_uri : null,
          }
        : null
    );
    return;
  }
  db.transaction((tx) => {
    tx.executeSql(
      'SELECT id, email, nickname, avatar_uri FROM users WHERE id = ? LIMIT 1;',
      [id],
      (_, result) => {
        if (result.rows.length === 0) {
          resolve(null);
          return;
        }
        const row = result.rows.item(0);
        resolve(mapUserRow(row));
      },
      (_, error) => reject(error)
    );
  });
  });
};

export const updateUserAvatar = async (userId, avatarUri) => {
  const uri = avatarUri != null && String(avatarUri).trim() !== '' ? String(avatarUri).trim() : null;
  if (isWeb) {
    const u = memoryStorage.users.find((x) => Number(x.id) === Number(userId));
    if (!u) throw new Error('NOT_FOUND');
    u.avatar_uri = uri;
    persistWebPersistence();
    return;
  }
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'UPDATE users SET avatar_uri = ? WHERE id = ?;',
        [uri, userId],
        () => resolve(),
        (_, error) => reject(error)
      );
    });
  });
};

export const updateUserPassword = async (userId, oldPassword, newPassword) => {
  if (!newPassword || String(newPassword).length < 6) {
    throw new Error('INVALID_PASSWORD');
  }
  const oldHash = await hashPassword(oldPassword);
  const newHash = await hashPassword(newPassword);

  if (isWeb) {
    const u = memoryStorage.users.find((x) => Number(x.id) === Number(userId));
    if (!u) throw new Error('NOT_FOUND');
    if (u.password_hash !== oldHash) throw new Error('WRONG_PASSWORD');
    u.password_hash = newHash;
    persistWebPersistence();
    return;
  }

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT password_hash FROM users WHERE id = ? LIMIT 1;',
        [userId],
        (_, result) => {
          if (result.rows.length === 0) {
            reject(new Error('NOT_FOUND'));
            return;
          }
          const row = result.rows.item(0);
          if (row.password_hash !== oldHash) {
            reject(new Error('WRONG_PASSWORD'));
            return;
          }
          tx.executeSql(
            'UPDATE users SET password_hash = ? WHERE id = ?;',
            [newHash, userId],
            () => resolve(),
            (_, error) => reject(error)
          );
        },
        (_, error) => reject(error)
      );
    });
  });
};

// 任务相关操作
export const addTask = (task) => {
  return new Promise((resolve, reject) => {
    if (isWeb) {
      // Web环境下的实现
      const newTask = {
        id: Date.now(),
        title: task.title,
        completed: task.completed,
        priority: task.priority,
        createdAt: new Date().toISOString()
      };
      memoryStorage.tasks.push(newTask);
      persistWebPersistence();
      resolve({ insertId: newTask.id });
    } else {
      // 原生环境下的实现
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO tasks (title, completed, priority, createdAt) VALUES (?, ?, ?, ?);',
          [task.title, task.completed ? 1 : 0, task.priority, new Date().toISOString()],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    }
  });
};

export const getTasks = () => {
  return new Promise((resolve, reject) => {
    if (isWeb) {
      // Web环境下的实现
      const tasks = memoryStorage.tasks.map(task => ({
        id: task.id,
        title: task.title,
        completed: task.completed,
        priority: task.priority
      }));
      resolve(tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } else {
      // 原生环境下的实现
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
    }
  });
};

export const updateTask = (task) => {
  return new Promise((resolve, reject) => {
    if (isWeb) {
      // Web环境下的实现
      const index = memoryStorage.tasks.findIndex(t => t.id === task.id);
      if (index !== -1) {
        memoryStorage.tasks[index].completed = task.completed;
        memoryStorage.tasks[index].streak = task.streak;
        persistWebPersistence();
        resolve({ rowsAffected: 1 });
      } else {
        resolve({ rowsAffected: 0 });
      }
    } else {
      // 原生环境下的实现
      db.transaction(tx => {
        tx.executeSql(
          'UPDATE tasks SET completed = ? WHERE id = ?;',
          [task.completed ? 1 : 0, task.id],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    }
  });
};

export const deleteTask = (id) => {
  return new Promise((resolve, reject) => {
    if (isWeb) {
      // Web环境下的实现
      const initialLength = memoryStorage.tasks.length;
      memoryStorage.tasks = memoryStorage.tasks.filter(task => task.id !== id);
      persistWebPersistence();
      resolve({ rowsAffected: initialLength - memoryStorage.tasks.length });
    } else {
      // 原生环境下的实现
      db.transaction(tx => {
        tx.executeSql(
          'DELETE FROM tasks WHERE id = ?;',
          [id],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    }
  });
};

// 习惯相关操作
export const addHabit = (habit) => {
  return new Promise((resolve, reject) => {
    if (isWeb) {
      // Web环境下的实现
      const newHabit = {
        id: Date.now(),
        name: habit.name,
        completed: habit.completed,
        streak: habit.streak,
        color: habit.color,
        createdAt: new Date().toISOString()
      };
      memoryStorage.habits.push(newHabit);
      persistWebPersistence();
      resolve({ insertId: newHabit.id });
    } else {
      // 原生环境下的实现
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO habits (name, completed, streak, color, createdAt) VALUES (?, ?, ?, ?, ?);',
          [habit.name, habit.completed ? 1 : 0, habit.streak, habit.color, new Date().toISOString()],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    }
  });
};

export const getHabits = () => {
  return new Promise((resolve, reject) => {
    if (isWeb) {
      // Web环境下的实现
      const habits = memoryStorage.habits.map(habit => ({
        id: habit.id,
        name: habit.name,
        completed: habit.completed,
        streak: habit.streak,
        color: habit.color
      }));
      resolve(habits.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } else {
      // 原生环境下的实现
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
    }
  });
};

export const updateHabit = (habit) => {
  return new Promise((resolve, reject) => {
    if (isWeb) {
      // Web环境下的实现
      const index = memoryStorage.habits.findIndex(h => h.id === habit.id);
      if (index !== -1) {
        memoryStorage.habits[index].completed = habit.completed;
        memoryStorage.habits[index].streak = habit.streak;
        persistWebPersistence();
        resolve({ rowsAffected: 1 });
      } else {
        resolve({ rowsAffected: 0 });
      }
    } else {
      // 原生环境下的实现
      db.transaction(tx => {
        tx.executeSql(
          'UPDATE habits SET completed = ?, streak = ? WHERE id = ?;',
          [habit.completed ? 1 : 0, habit.streak, habit.id],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    }
  });
};

export const deleteHabit = (id) => {
  return new Promise((resolve, reject) => {
    if (isWeb) {
      memoryStorage.habit_check_ins = memoryStorage.habit_check_ins.filter(
        r => r.habitId !== id
      );
      const initialLength = memoryStorage.habits.length;
      memoryStorage.habits = memoryStorage.habits.filter(habit => habit.id !== id);
      persistWebPersistence();
      resolve({ rowsAffected: initialLength - memoryStorage.habits.length });
    } else {
      db.transaction(tx => {
        tx.executeSql('DELETE FROM habit_check_ins WHERE habit_id = ?;', [id], () => {}, () => true);
        tx.executeSql(
          'DELETE FROM habits WHERE id = ?;',
          [id],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    }
  });
};

// 交易相关操作
export const addTransaction = (transaction) => {
  const category = transaction.category || '其他';
  return new Promise((resolve, reject) => {
    if (isWeb) {
      const newTransaction = {
        id: Date.now(),
        title: transaction.title,
        amount: transaction.amount,
        type: transaction.type,
        date: transaction.date,
        category,
        createdAt: new Date().toISOString()
      };
      memoryStorage.transactions.push(newTransaction);
      persistWebPersistence();
      resolve({ insertId: newTransaction.id });
    } else {
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO transactions (title, amount, type, date, createdAt, category) VALUES (?, ?, ?, ?, ?, ?);',
          [transaction.title, transaction.amount, transaction.type, transaction.date, new Date().toISOString(), category],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    }
  });
};

export const getTransactions = () => {
  return new Promise((resolve, reject) => {
    if (isWeb) {
      // Web环境下的实现
      const transactions = memoryStorage.transactions.map(transaction => ({
        id: transaction.id,
        title: transaction.title,
        amount: transaction.amount,
        type: transaction.type,
        date: transaction.date,
        category: transaction.category || '其他'
      }));
      resolve(transactions.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } else {
      // 原生环境下的实现
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM transactions ORDER BY date DESC;',
          [],
          (_, result) => {
            const transactions = [];
            for (let i = 0; i < result.rows.length; i++) {
              const row = result.rows.item(i);
              transactions.push({
                id: row.id,
                title: row.title,
                amount: row.amount,
                type: row.type,
                date: row.date,
                category: row.category != null ? row.category : '其他'
              });
            }
            resolve(transactions);
          },
          (_, error) => reject(error)
        );
      });
    }
  });
};

// 健康数据相关操作
export const addHealthData = (data) => {
  return new Promise((resolve, reject) => {
    if (isWeb) {
      // Web环境下的实现
      const newData = {
        id: Date.now(),
        type: data.type,
        value: data.value,
        date: data.date,
        createdAt: new Date().toISOString()
      };
      memoryStorage.health_data.push(newData);
      persistWebPersistence();
      resolve({ insertId: newData.id });
    } else {
      // 原生环境下的实现
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO health_data (type, value, date, createdAt) VALUES (?, ?, ?, ?);',
          [data.type, data.value, data.date, new Date().toISOString()],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    }
  });
};

/** 同一天同一类型只保留一条：先删后插 */
export const upsertHealthData = (data) => {
  return new Promise((resolve, reject) => {
    if (isWeb) {
      memoryStorage.health_data = memoryStorage.health_data.filter(
        item => !(item.type === data.type && item.date === data.date)
      );
      const newData = {
        id: Date.now(),
        type: data.type,
        value: data.value,
        date: data.date,
        createdAt: new Date().toISOString()
      };
      memoryStorage.health_data.push(newData);
      persistWebPersistence();
      resolve({ insertId: newData.id });
    } else {
      db.transaction(tx => {
        tx.executeSql(
          'DELETE FROM health_data WHERE type = ? AND date = ?;',
          [data.type, data.date],
          () => {
            tx.executeSql(
              'INSERT INTO health_data (type, value, date, createdAt) VALUES (?, ?, ?, ?);',
              [data.type, data.value, data.date, new Date().toISOString()],
              (_, result) => resolve(result),
              (_, error) => reject(error)
            );
          },
          (_, error) => reject(error)
        );
      });
    }
  });
};

export const getHealthData = (type, date) => {
  return new Promise((resolve, reject) => {
    if (isWeb) {
      // Web环境下的实现
      const data = memoryStorage.health_data
        .filter(item => item.type === type && item.date === date)
        .map(item => ({
          id: item.id,
          type: item.type,
          value: item.value,
          date: item.date
        }));
      resolve(data);
    } else {
      // 原生环境下的实现
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
    }
  });
};

// 时间记录相关操作
export const addTimeRecord = (record) => {
  return new Promise((resolve, reject) => {
    if (isWeb) {
      // Web环境下的实现
      const newRecord = {
        id: Date.now(),
        activity: record.activity,
        duration: record.duration,
        date: record.date,
        createdAt: new Date().toISOString()
      };
      memoryStorage.time_records.push(newRecord);
      persistWebPersistence();
      resolve({ insertId: newRecord.id });
    } else {
      // 原生环境下的实现
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO time_records (activity, duration, date, createdAt) VALUES (?, ?, ?, ?);',
          [record.activity, record.duration, record.date, new Date().toISOString()],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    }
  });
};

export const getTimeRecords = (date) => {
  return new Promise((resolve, reject) => {
    if (isWeb) {
      // Web环境下的实现
      const records = memoryStorage.time_records
        .filter(record => record.date === date)
        .map(record => ({
          id: record.id,
          activity: record.activity,
          duration: record.duration,
          date: record.date
        }));
      resolve(records);
    } else {
      // 原生环境下的实现
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
    }
  });
};

export const getTimeRecordsBetween = (startDate, endDate) => {
  return new Promise((resolve, reject) => {
    if (isWeb) {
      const records = memoryStorage.time_records
        .filter(r => r.date >= startDate && r.date <= endDate)
        .map(r => ({
          id: r.id,
          activity: r.activity,
          duration: r.duration,
          date: r.date
        }));
      resolve(records);
    } else {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM time_records WHERE date >= ? AND date <= ? ORDER BY date ASC;',
          [startDate, endDate],
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
    }
  });
};

export const getSetting = (key, defaultValue = '') => {
  return new Promise((resolve, reject) => {
    if (isWeb) {
      const v = memoryStorage.settings[key];
      resolve(v !== undefined ? v : defaultValue);
    } else {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT value FROM settings WHERE key = ?;',
          [key],
          (_, result) => {
            if (result.rows.length > 0) {
              resolve(result.rows.item(0).value);
            } else {
              resolve(defaultValue);
            }
          },
          (_, error) => reject(error)
        );
      });
    }
  });
};

export const setSetting = (key, value) => {
  return new Promise((resolve, reject) => {
    if (isWeb) {
      memoryStorage.settings[key] = String(value);
      persistWebPersistence();
      resolve({ rowsAffected: 1 });
    } else {
      db.transaction(tx => {
        tx.executeSql(
          'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);',
          [key, String(value)],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    }
  });
};

export const recordHabitCheckIn = (habitId, date, done) => {
  return new Promise((resolve, reject) => {
    if (isWeb) {
      if (done) {
        const exists = memoryStorage.habit_check_ins.some(
          h => h.habitId === habitId && h.date === date
        );
        if (!exists) {
          memoryStorage.habit_check_ins.push({ habitId, date });
        }
      } else {
        memoryStorage.habit_check_ins = memoryStorage.habit_check_ins.filter(
          h => !(h.habitId === habitId && h.date === date)
        );
      }
      persistWebPersistence();
      resolve({ rowsAffected: 1 });
    } else {
      db.transaction(tx => {
        if (done) {
          tx.executeSql(
            'INSERT OR REPLACE INTO habit_check_ins (habit_id, date) VALUES (?, ?);',
            [habitId, date],
            (_, result) => resolve(result),
            (_, error) => reject(error)
          );
        } else {
          tx.executeSql(
            'DELETE FROM habit_check_ins WHERE habit_id = ? AND date = ?;',
            [habitId, date],
            (_, result) => resolve(result),
            (_, error) => reject(error)
          );
        }
      });
    }
  });
};

/** 返回该月至少完成一个习惯的日期集合，元素为 YYYY-MM-DD */
export const getHabitCalendarDatesInMonth = (year, month) => {
  const pad = n => String(n).padStart(2, '0');
  const start = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${pad(month)}-${pad(lastDay)}`;
  return new Promise((resolve, reject) => {
    if (isWeb) {
      const dates = new Set(
        memoryStorage.habit_check_ins
          .filter(h => h.date >= start && h.date <= end)
          .map(h => h.date)
      );
      resolve(Array.from(dates));
    } else {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT DISTINCT date FROM habit_check_ins WHERE date >= ? AND date <= ? ORDER BY date ASC;',
          [start, end],
          (_, result) => {
            const dates = [];
            for (let i = 0; i < result.rows.length; i++) {
              dates.push(result.rows.item(i).date);
            }
            resolve(dates);
          },
          (_, error) => reject(error)
        );
      });
    }
  });
};

/** 返回该月每日专注总秒数（任意活动），key 为 YYYY-MM-DD */
export const getDailyFocusSecondsForMonth = (year, month) => {
  const pad = n => String(n).padStart(2, '0');
  const start = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${pad(month)}-${pad(lastDay)}`;
  return new Promise(async (resolve, reject) => {
    try {
      const records = await getTimeRecordsBetween(start, end);
      const map = {};
      records.forEach(r => {
        map[r.date] = (map[r.date] || 0) + r.duration;
      });
      resolve(map);
    } catch (e) {
      reject(e);
    }
  });
};