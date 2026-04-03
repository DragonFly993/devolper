/** OpenAI Chat Completions `tools` 定义（function calling） */
export const AI_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'list_tasks',
      description: '列出当前所有任务，含 id、标题、是否完成、优先级。',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_task',
      description: '新增一条待办任务。',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '任务标题' },
          priority: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
            description: '优先级，默认 medium',
          },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_task_completed',
      description: '将指定任务标记为已完成或未完成。',
      parameters: {
        type: 'object',
        properties: {
          task_id: { type: 'number', description: '任务 id' },
          completed: { type: 'boolean' },
        },
        required: ['task_id', 'completed'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_habits',
      description: '列出所有习惯及连续天数等信息。',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_habit',
      description: '新增一个习惯。',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '习惯名称' },
          color: { type: 'string', description: '可选，如 #4CAF50' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_dashboard_summary',
      description:
        '汇总今日待办未完成数、今日专注总分钟、习惯数量、本月支出、月度预算（若有），用于分析与回答。',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_health_snapshot',
      description: '查询今日步数、卡路里、睡眠(小时)、饮水量等健康概览（无记录则为 0）。',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_time_management_detail',
      description: '获取时间管理详细数据：今日专注、近7日趋势、当月日历专注映射与番茄完成率。',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_task_tracking_detail',
      description: '获取任务追踪详细数据：总任务、未完成、已完成、高中低优先级分布。',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_habit_formation_detail',
      description: '获取习惯养成详细数据：习惯列表、今日完成数、最长连续、当月打卡日期。',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_finance_planning_detail',
      description: '获取财务规划详细数据：预算、支出收入汇总、分类统计、最新交易明细。',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_health_management_detail',
      description: '获取健康管理详细数据：今日步数/卡路里/睡眠/饮水与基础健康画像。',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_wallet_detail',
      description: '获取钱包模块详细数据：余额、冻结金额、最近流水、最近订单状态。',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_reminder_center_detail',
      description: '获取提醒中心详细数据：提醒总数、启用数、今日提醒数、近期提醒列表。',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_expense',
      description: '记一笔支出。',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '说明，如「午餐」' },
          amount: { type: 'number', description: '金额，正数' },
          category: {
            type: 'string',
            enum: ['住房', '餐饮', '交通', '购物', '其他'],
            description: '默认 其他',
          },
        },
        required: ['title', 'amount'],
      },
    },
  },
];
