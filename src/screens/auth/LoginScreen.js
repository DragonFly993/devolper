import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, radius, shadow } from '../../theme/tokens';

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('提示', '请输入邮箱和密码');
      return;
    }
    setLoading(true);
    try {
      const res = await signIn(email.trim(), password);
      if (!res.ok) {
        Alert.alert('登录失败', res.error || '请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#ECFDF5', '#F0FDF4', '#F8FAFC']} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.logoRing} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={styles.logoInner}>
                <Ionicons name="leaf" size={40} color="#fff" />
              </View>
            </LinearGradient>
            <Text style={styles.title}>自我管理</Text>
            <Text style={styles.subtitle}>登录后，专注、任务与健康数据保存在本设备</Text>
          </View>

          <View style={[styles.card, shadow.card]}>
            <Text style={styles.fieldLabel}>邮箱</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Text style={styles.fieldLabel}>密码</Text>
            <TextInput
              style={styles.input}
              placeholder="至少 6 位"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={onSubmit}
              disabled={loading}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryBtnText}>{loading ? '登录中…' : '登录'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
              <Text style={styles.linkMuted}>还没有账号？</Text>
              <Text style={styles.linkBold}>去注册</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerHint}>Web 端刷新页面后仍保持登录（数据已写入浏览器本地存储）</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'web' ? 40 : 24,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 3,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInner: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16,
    marginBottom: 18,
    color: colors.text,
    backgroundColor: '#FAFAFA',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnDisabled: {
    opacity: 0.65,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    gap: 4,
  },
  linkMuted: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  linkBold: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  footerHint: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 16,
    paddingHorizontal: 16,
  },
});
