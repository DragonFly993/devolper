import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { initDatabase, loginUser, registerUser, getUserById } from '../utils/database';
import { colors } from '../theme/tokens';
import { saveSessionUserId, getSessionUserId, clearSession } from '../auth/session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const bootstrap = useCallback(async () => {
    try {
      await Promise.resolve(initDatabase());
      const uid = await getSessionUserId();
      if (uid != null) {
        const u = await getUserById(uid);
        if (u) {
          setUser(u);
        } else {
          await clearSession();
        }
      }
    } catch (e) {
      console.error('Auth bootstrap', e);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const signIn = useCallback(async (email, password) => {
    const u = await loginUser(email, password);
    if (!u) {
      return { ok: false, error: '邮箱或密码错误' };
    }
    await saveSessionUserId(u.id);
    setUser(u);
    return { ok: true };
  }, []);

  const signUp = useCallback(async ({ email, password, nickname }) => {
    try {
      const u = await registerUser({ email, password, nickname });
      await saveSessionUserId(u.id);
      setUser(u);
      return { ok: true };
    } catch (e) {
      if (e && e.message === 'EMAIL_EXISTS') {
        return { ok: false, error: '该邮箱已注册' };
      }
      if (e && e.message === 'INVALID_INPUT') {
        return { ok: false, error: '请填写有效邮箱，密码至少 6 位' };
      }
      return { ok: false, error: '注册失败，请重试' };
    }
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const uid = user?.id;
    if (uid == null) return;
    const u = await getUserById(uid);
    if (u) setUser(u);
  }, [user?.id]);

  const value = {
    user,
    ready,
    signIn,
    signUp,
    signOut,
    refreshUser,
  };

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
});
