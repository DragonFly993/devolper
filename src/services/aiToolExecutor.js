import {
  getTasks,
  addTask,
  updateTask,
  getHabits,
  addHabit,
  getTimeRecords,
  getTimeRecordsBetween,
  getDailyFocusSecondsForMonth,
  getHabitCalendarDatesInMonth,
  getTransactions,
  getSetting,
  getHealthData,
  addTransaction,
  getReminders,
  getTodayReminderCount,
  getWalletAccount,
  getWalletLedger,
  getPaymentOrders,
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

    case 'get_time_management_detail': {
      const today = todayStr();
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      const [todayRecords, weekRecords, monthMap] = await Promise.all([
        getTimeRecords(today),
        getTimeRecordsBetween(start.toISOString().split('T')[0], today),
        getDailyFocusSecondsForMonth(now.getFullYear(), now.getMonth() + 1),
      ]);
      const todayFocusSec = todayRecords.reduce((s, r) => s + Number(r.duration || 0), 0);
      const todayPomodoroCount = todayRecords.filter((r) => r.activity === '番茄钟').length;
      return {
        today_focus_minutes: Math.round(todayFocusSec / 60),
        today_pomodoro_count: todayPomodoroCount,
        pomodoro_completion_percent: Math.min(100, Math.round((todayPomodoroCount / 8) * 100)),
        week_total_minutes: Math.round(weekRecords.reduce((s, r) => s + Number(r.duration || 0), 0) / 60),
        week_records: weekRecords.map((r) => ({ date: r.date, activity: r.activity, minutes: Math.round(Number(r.duration || 0) / 60) })),
        month_daily_focus_minutes: Object.fromEntries(
          Object.entries(monthMap).map(([date, sec]) => [date, Math.round(Number(sec || 0) / 60)])
        ),
      };
    }

    case 'get_task_tracking_detail': {
      const tasks = await getTasks();
      const byPriority = { high: 0, medium: 0, low: 0 };
      tasks.forEach((t) => {
        const p = ['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium';
        byPriority[p] += 1;
      });
      return {
        total: tasks.length,
        pending: tasks.filter((t) => !t.completed).length,
        completed: tasks.filter((t) => !!t.completed).length,
        priority_distribution: byPriority,
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          completed: !!t.completed,
          priority: t.priority || 'medium',
        })),
      };
    }

    case 'get_habit_formation_detail': {
      const habits = await getHabits();
      const now = new Date();
      const doneDates = await getHabitCalendarDatesInMonth(now.getFullYear(), now.getMonth() + 1);
      return {
        total: habits.length,
        today_completed: habits.filter((h) => !!h.completed).length,
        longest_streak: Math.max(0, ...habits.map((h) => Number(h.streak || 0))),
        active_days_this_month: doneDates.length,
        done_dates_this_month: doneDates,
        habits: habits.map((h) => ({
          id: h.id,
          name: h.name,
          completed: !!h.completed,
          streak: Number(h.streak || 0),
          color: h.color,
        })),
      };
    }

    case 'get_finance_planning_detail': {
      const txs = await getTransactions();
      const budgetTotal = Number(await getSetting('budget_total', '5000')) || 5000;
      const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
      const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
      const categoryStats = {};
      txs.filter((t) => t.type === 'expense').forEach((t) => {
        const c = t.category || '其他';
        categoryStats[c] = (categoryStats[c] || 0) + Number(t.amount || 0);
      });
      return {
        budget_total: Math.round(budgetTotal * 100) / 100,
        spent_total: Math.round(expense * 100) / 100,
        income_total: Math.round(income * 100) / 100,
        budget_remaining: Math.round((budgetTotal - expense) * 100) / 100,
        category_stats: categoryStats,
        recent_transactions: txs.slice(0, 30).map((t) => ({
          id: t.id,
          title: t.title,
          amount: Number(t.amount || 0),
          type: t.type,
          date: t.date,
          category: t.category || '其他',
        })),
      };
    }

    case 'get_health_management_detail': {
      const today = todayStr();
      const [steps, calories, sleep, water] = await Promise.all([
        getHealthData('steps', today),
        getHealthData('calories', today),
        getHealthData('sleep', today),
        getHealthData('water', today),
      ]);
      return {
        date: today,
        steps: steps[0] ? Number(steps[0].value || 0) : 0,
        calories: calories[0] ? Number(calories[0].value || 0) : 0,
        sleep_hours: sleep[0] ? Number(sleep[0].value || 0) : 0,
        water_ml: water[0] ? Number(water[0].value || 0) : 0,
      };
    }

    case 'get_wallet_detail': {
      const [account, ledger, orders] = await Promise.all([
        getWalletAccount(),
        getWalletLedger(),
        getPaymentOrders(),
      ]);
      return {
        balance: Number(account.balance || 0),
        frozen: Number(account.frozen || 0),
        latest_ledger: ledger.slice(0, 20).map((l) => ({
          type: l.type,
          amount: Number(l.amount || 0),
          status: l.status,
          createdAt: l.createdAt,
          order_no: l.order_no || null,
        })),
        latest_orders: orders.slice(0, 20).map((o) => ({
          order_no: o.order_no,
          channel: o.channel,
          direction: o.direction,
          amount: Number(o.amount || 0),
          status: o.status,
          createdAt: o.createdAt,
        })),
      };
    }

    case 'get_reminder_center_detail': {
      const [reminders, todayCount] = await Promise.all([getReminders(), getTodayReminderCount()]);
      return {
        total: reminders.length,
        enabled_count: reminders.filter((r) => !!r.enabled).length,
        today_count: todayCount,
        reminders: reminders.slice(0, 50).map((r) => ({
          id: r.id,
          title: r.title,
          body: r.body || '',
          remindAt: r.remindAt,
          repeatType: r.repeatType,
          enabled: !!r.enabled,
          sourceModule: r.sourceModule || null,
        })),
      };
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
