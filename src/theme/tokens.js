/**
 * 全局视觉令牌：颜色、圆角、阴影、字号（首页与导航先接入，其它屏可逐步引用）
 */
export const colors = {
  primary: '#16A34A',
  primaryDark: '#15803D',
  primaryMuted: '#DCFCE7',
  bg: '#F1F5F9',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  tabInactive: '#94A3B8',
  heroGradient: ['#15803D', '#22C55E'],
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  tabBar: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 12,
  },
};

export const type = {
  title: { fontSize: 20, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  section: { fontSize: 17, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  sectionSub: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  body: { fontSize: 15, color: colors.text },
  caption: { fontSize: 12, color: colors.textMuted },
  statNum: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
};
