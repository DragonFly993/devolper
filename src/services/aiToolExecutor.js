import {
  getTasks,
  addTask,
  updateTask,
  getHabits,
  addHabit,
  getTimeRecords,
  getTransactions,
  getSetting,
  getHealthData,
  addTransaction,
} from '../utils/database';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function parseArgs(raw) {
  if (raw == null || raw === '') return {};
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(String(raw));
  } catch {
    return {};
  }
}

export async function executeAiTool(name, argumentsJson) {
  const args = parseArgs(argumentsJson);

  switch (name) {
    case 'list_tasks': {
      const tasks = await getTasks();
      return {
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          completed: t.completed,
          priority: t.priority,
        })),
      };
    }

    case 'add_task': {
      const title = String(args.title || '').trim();
      if (!title) return { ok: false, error: '缺少标题' };
      const priority = ['high', 'medium', 'low'].includes(args.priority) ? args.priority : 'medium';
      await addTask({ title, priority, completed: false });
      return { ok: true, message: '任务已添加' };
    }

    case 'set_task_completed': {
      const taskId = Number(args.task_id);
      const completed = Boolean(args.completed);
      if (!Number.isFinite(taskId)) return { ok: false, error: '无效 task_id' };
      const tasks = await getTasks();
      const t = tasks.find((x) => x.id === taskId);
      if (!t) return { ok: false, error: '未找到该任务' };
      await updateTask({ ...t, completed });
      return { ok: true, message: '任务状态已更新' };
    }

    case 'list_habits': {
      const habits = await getHabits();
      return {
        habits: habits.map((h) => ({
          id: h.id,
          name: h.name,
          completed: h.completed,
          streak: h.streak,
          color: h.color,
        })),
      };
    }

    case 'add_habit': {
      const habitName = String(args.name || '').trim();
      if (!habitName) return { ok: false, error: '缺少习惯名称' };
      const color = typeof args.color === 'string' && args.color.trim() ? args.color.trim() : '#4CAF50';
      await addHabit({ name: habitName, completed: false, streak: 0, color });
      return { ok: true, message: '习惯已添加' };
    }

    case 'get_dashboard_summary': {
      const today = todayStr();
      const ym = today.slice(0, 7);
      const [tasks, habits, timeRecs, txs] = await Promise.all([
        getTasks(),
        getHabits(),
        getTimeRecords(today),
        getTransactions(),
      ]);
      const todoPending = tasks.filter((t) => !t.completed).length;
      const focusSec = timeRecs.reduce((s, r) => s + (r.duration || 0), 0);
      const monthExpense = txs
        .filter((t) => t.type === 'expense' && t.date && t.date.startsWith(ym))
        .reduce((s, t) => s + Number(t.amount || 0), 0);
      const budgetRaw = await getSetting('budget_total', '5000');
      const budgetTotal = parseFloat(budgetRaw) || 0;
      return {
        date: today,
        todo_pending: todoPending,
        today_focus_minutes: Math.round(focusSec / 60),
        habit_count: habits.length,
        month_expense: Math.round(monthExpense * 100) / 100,
        month_budget: budgetTotal,
        month_remaining: Math.round((budgetTotal - monthExpense) * 100) / 100,
      };
    }

    case 'get_health_snapshot': {
      const today = todayStr();
      const types = ['steps', 'calories', 'sleep', 'water'];
      const entries = await Promise.all(types.map(async (type) => {
        const rows = await getHealthData(type, today);
        const v = rows && rows[0] ? Number(rows[0].value) : 0;
        return [type, v];
      }));
      return Object.fromEntries(entries);
    }

    case 'add_expense': {
      const title = String(args.title || '').trim();
      const amount = Number(args.amount);
      if (!title) return { ok: false, error: '缺少说明' };
      if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: '金额无效' };
      const cats = ['住房', '餐饮', '交通', '购物', '其他'];
      const category = cats.includes(args.category) ? args.category : '其他';
      await addTransaction({
        title,
        amount,
        type: 'expense',
        date: todayStr(),
        category,
      });
      return { ok: true, message: '支出已记录' };
    }

    default:
      return { ok: false, error: `未知工具: ${name}` };
  }
}
