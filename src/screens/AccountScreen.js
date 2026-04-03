import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { updateUserAvatar, updateUserPassword } from '../utils/database';

export default function AccountScreen() {
  const { user, signOut, refreshUser } = useAuth();
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);

  const pickAvatar = async () => {
    if (!user?.id) return;
    setPicking(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('提示', '需要相册权限才能选择头像');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const uri = asset.uri;
      let finalUri = uri;
      if (Platform.OS !== 'web' && FileSystem.documentDirectory) {
        const dest = `${FileSystem.documentDirectory}avatar_${user.id}.jpg`;
        await FileSystem.copyAsync({ from: uri, to: dest });
        finalUri = dest;
      }
      await updateUserAvatar(user.id, finalUri);
      await refreshUser();
      Alert.alert('已保存', '头像已更新');
    } catch (e) {
      console.error(e);
      Alert.alert('失败', e?.message || '无法更新头像');
    } finally {
      setPicking(false);
    }
  };

  const clearAvatar = () => {
    if (!user?.id) return;
    Alert.alert('清除头像', '确定使用默认头像吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: async () => {
          try {
            await updateUserAvatar(user.id, null);
            await refreshUser();
          } catch (e) {
            Alert.alert('失败', e?.message || '操作失败');
          }
        },
      },
    ]);
  };

  const submitPassword = async () => {
    if (!user?.id) return;
    if (newPwd !== confirmPwd) {
      Alert.alert('提示', '两次输入的新密码不一致');
      return;
    }
    setSaving(true);
    try {
      await updateUserPassword(user.id, oldPwd, newPwd);
      setOldPwd('');
      setNewPwd('');
      setConfirmPwd('');
      Alert.alert('已保存', '密码已修改');
    } catch (e) {
      const code = e && e.message;
      const msg =
        code === 'WRONG_PASSWORD'
          ? '当前密码不正确'
          : code === 'INVALID_PASSWORD'
          ? '新密码至少 6 位'
          : '修改失败，请重试';
      Alert.alert('无法修改', msg);
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    const doSignOut = async () => {
      await signOut();
    };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('确定要退出当前账号吗？')) {
        await doSignOut();
      }
      return;
    }
    Alert.alert('退出登录', '确定要退出当前账号吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: () => {
          void doSignOut();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>个人头像</Text>
        <View style={styles.avatarRow}>
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={pickAvatar}
            disabled={picking}
            activeOpacity={0.8}
          >
            {user?.avatarUri ? (
              <Image source={{ uri: user.avatarUri }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color="#999" />
              </View>
            )}
            {picking ? (
              <View style={styles.avatarLoading}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : null}
          </TouchableOpacity>
          <View style={styles.avatarActions}>
            <TouchableOpacity style={styles.primaryBtn} onPress={pickAvatar} disabled={picking}>
              <Text style={styles.primaryBtnText}>更换头像</Text>
            </TouchableOpacity>
            {user?.avatarUri ? (
              <TouchableOpacity style={styles.linkBtn} onPress={clearAvatar}>
                <Text style={styles.linkBtnText}>清除头像</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>修改密码</Text>
        <Text style={styles.hint}>新密码至少 6 位</Text>
        <TextInput
          style={styles.input}
          placeholder="当前密码"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={oldPwd}
          onChangeText={setOldPwd}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="新密码"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={newPwd}
          onChangeText={setNewPwd}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="确认新密码"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={confirmPwd}
          onChangeText={setConfirmPwd}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.savePwdBtn, saving && styles.btnDisabled]}
          onPress={submitPassword}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.savePwdBtnText}>保存新密码</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color="#c62828" />
        <Text style={styles.logoutText}>退出账号</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  hint: {
    fontSize: 13,
    color: '#888',
    marginBottom: 10,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#eee',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#e8e8e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLoading: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 48,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarActions: {
    flex: 1,
    marginLeft: 16,
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  linkBtn: {
    paddingVertical: 8,
  },
  linkBtnText: {
    color: '#2196F3',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    marginBottom: 12,
    color: '#333',
  },
  savePwdBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  savePwdBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  logoutText: {
    color: '#c62828',
    fontSize: 16,
    fontWeight: '600',
  },
});
