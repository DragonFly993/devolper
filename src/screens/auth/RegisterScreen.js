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
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { colors, radius, shadow } from '../../theme/tokens';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);

  const showMessage = (title, message) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${title}\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

  const showEmailExists = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const ok = window.confirm('该邮箱已注册，是否前往登录？');
      if (ok) navigation.navigate('Login');
      return;
    }
    Alert.alert('注册失败', '该邮箱已注册，是否前往登录？', [
      { text: '取消', style: 'cancel' },
      { text: '去登录', onPress: () => navigation.navigate('Login') },
    ]);
  };

  const onSubmit = async () => {
    if (!email.trim()) {
      showMessage('提示', '请输入邮箱');
      return;
    }
    if (password.length < 6) {
      showMessage('提示', '密码至少 6 位');
      return;
    }
    if (password !== password2) {
      showMessage('提示', '两次输入的密码不一致');
      return;
    }
    setLoading(true);
    try {
      const res = await signUp({
        email: email.trim(),
        password,
        nickname: nickname.trim(),
      });
      if (!res.ok) {
        const msg = res.error || '请重试';
        if (msg.includes('该邮箱已注册')) {
          showEmailExists();
          return;
        }
        showMessage('注册失败', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#ECFDF5', '#F0FDF4', '#F8FAFC']} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.lead}>创建账号后，数据保存在本设备；可随时在「账户与设置」中修改头像与密码。</Text>

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
            <Text style={styles.fieldLabel}>昵称（可选）</Text>
            <TextInput
              style={styles.input}
              placeholder="显示在首页问候语"
              placeholderTextColor={colors.textMuted}
              value={nickname}
              onChangeText={setNickname}
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
            <Text style={styles.fieldLabel}>确认密码</Text>
            <TextInput
              style={styles.input}
              placeholder="再次输入密码"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={password2}
              onChangeText={setPassword2}
            />
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={onSubmit}
              disabled={loading}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryBtnText}>{loading ? '提交中…' : '注册并登录'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
              <Text style={styles.linkMuted}>已有账号？</Text>
              <Text style={styles.linkBold}>返回登录</Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: Platform.OS === 'web' ? 24 : 12,
    paddingBottom: 32,
  },
  lead: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 18,
    lineHeight: 22,
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
    marginBottom: 14,
    color: colors.text,
    backgroundColor: '#FAFAFA',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
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
    marginTop: 20,
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
});
