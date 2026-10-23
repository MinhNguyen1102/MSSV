import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFood } from '../context/FoodContext';
import { useTranslation } from '../locales/LanguageContext';
import { getMockApiUrl, setMockApiUrl } from '../services/apiService';
import { clearSyncLogs } from '../services/syncService';

export default function SettingsScreen({ onBack }) {
  const {
    mssv,
    schema,
    changeMSSV,
    resetData,
    syncLogs,
    isOnline,
    triggerAutoSync,
    pendingSyncCount,
  } = useFood();
  const { language, setLanguage, t } = useTranslation();

  const [inputMssv, setInputMssv] = useState(mssv);
  const [apiUrl, setApiUrlState] = useState('');
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    setInputMssv(mssv);
    const loadApi = async () => {
      const url = await getMockApiUrl();
      setApiUrlState(url);
    };
    loadApi();
  }, [mssv]);

  const handleSaveMssv = async () => {
    if (!inputMssv.trim()) {
      Alert.alert('Error', 'MSSV cannot be empty');
      return;
    }
    await changeMSSV(inputMssv.trim());
    Alert.alert('Success', `Updated MSSV to: ${inputMssv.trim()}`);
  };

  const handleSaveApiUrl = async () => {
    if (!apiUrl.trim()) return;
    await setMockApiUrl(apiUrl.trim());
    Alert.alert('Success', 'Updated MockAPI Endpoint');
    if (isOnline) await triggerAutoSync();
  };

  const handleTestConnection = async () => {
    setTestResult('Testing connection...');
    try {
      const res = await fetch(apiUrl, { method: 'GET' });
      if (res.ok) {
        setTestResult('✅ Connection successful! HTTP 200 OK');
      } else {
        setTestResult(`⚠️ Server responded with HTTP ${res.status}`);
      }
    } catch (e) {
      setTestResult(`❌ Connection error: ${e.message}`);
    }
  };

  const handleReset = () => {
    Alert.alert(t('resetDefaultData'), t('confirmResetData'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('confirm'),
        style: 'destructive',
        onPress: async () => {
          await resetData();
          Alert.alert('Success', t('dataResetSuccess'));
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>{t('settings')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 1. Ngôn ngữ giao diện (Yêu cầu 4.5) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('language')}</Text>
          <View style={styles.langSwitchRow}>
            <TouchableOpacity
              style={[styles.langChoice, language === 'en' && styles.langChoiceActive]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.langChoiceText, language === 'en' && styles.langChoiceTextActive]}>
                English (Default)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langChoice, language === 'vi' && styles.langChoiceActive]}
              onPress={() => setLanguage('vi')}
            >
              <Text style={[styles.langChoiceText, language === 'vi' && styles.langChoiceTextActive]}>
                Tiếng Việt
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Cấu hình MSSV & Tiền tố Bảng/Cột (Quy định bắt buộc đề bài) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('studentConfig')}</Text>
          <Text style={styles.cardSubtitle}>
            Bắt buộc có tiền tố MSSV_ ở đầu tên Bảng và tên tất cả các trường dữ liệu
          </Text>

          <Text style={styles.label}>{t('studentIdLabel')}</Text>
          <View style={styles.inlineRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={inputMssv}
              onChangeText={setInputMssv}
              placeholder="e.g. BIT240001"
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveMssv}>
              <Text style={styles.primaryBtnText}>{t('save')}</Text>
            </TouchableOpacity>
          </View>

          {/* Bảng tra cứu trực quan các field đã gắn tiền tố MSSV_ */}
          <View style={styles.schemaBox}>
            <Text style={styles.schemaHeader}>Active Storage Schema Names:</Text>
            <Text style={styles.schemaItem}>• Table 1: <Text style={styles.bold}>{schema.categoryTable}</Text></Text>
            <Text style={styles.schemaItem}>  - Fields: {schema.catId}, {schema.catName}, {schema.catDesc}</Text>
            <Text style={styles.schemaItem}>• Table 2: <Text style={styles.bold}>{schema.dishTable}</Text></Text>
            <Text style={styles.schemaItem}>  - Fields: {schema.dishId}, {schema.dishName}, {schema.dishPrice}, {schema.dishPrepTime}, {schema.dishIsAvailable}, {schema.dishDesc}, {schema.dishCatId}, {schema.dishImage}</Text>
            <Text style={styles.schemaItem}>• DishImage Sub-fields: {schema.imgUrl}, {schema.imgIsThumbnail}</Text>
          </View>
        </View>

        {/* 3. Cấu hình MockAPI & Offline Sync (Yêu cầu 5) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('autoSyncNotice')}</Text>
          <Text style={styles.cardSubtitle}>
            Trạng thái mạng: {isOnline ? '🟢 Online' : '🔴 Offline'} | Hàng đợi chờ: {pendingSyncCount}
          </Text>

          <Text style={styles.label}>{t('mockApiUrl')}</Text>
          <TextInput
            style={styles.input}
            value={apiUrl}
            onChangeText={setApiUrlState}
            placeholder="https://..."
            autoCapitalize="none"
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleSaveApiUrl}>
              <Text style={styles.secondaryBtnText}>{t('save')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleTestConnection}>
              <Text style={styles.secondaryBtnText}>{t('testConnection')}</Text>
            </TouchableOpacity>
            {isOnline && (
              <TouchableOpacity style={styles.syncBtn} onPress={triggerAutoSync}>
                <Ionicons name="sync" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.syncBtnText}>{t('syncNow')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {testResult ? <Text style={styles.testResult}>{testResult}</Text> : null}
        </View>

        {/* 4. Nhật ký Đồng bộ (Sync Logs - Rất hữu ích cho Video 2) */}
        <View style={styles.card}>
          <View style={styles.logHeader}>
            <Text style={styles.cardTitle}>Activity & Sync Logs</Text>
            <TouchableOpacity onPress={clearSyncLogs}>
              <Text style={styles.clearLogText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.logsBox}>
            {syncLogs.length > 0 ? (
              syncLogs.map((log) => (
                <View key={log.id} style={styles.logItem}>
                  <Text style={styles.logTime}>[{log.time}]</Text>
                  <Text
                    style={[
                      styles.logMsg,
                      log.type === 'success' && styles.logSuccess,
                      log.type === 'warning' && styles.logWarning,
                      log.type === 'error' && styles.logError,
                    ]}
                  >
                    {log.message}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noLogs}>No sync events yet. Turn off Wi-Fi/Internet, make changes, and turn back on to test.</Text>
            )}
          </View>
        </View>

        {/* 5. Khôi phục dữ liệu mẫu */}
        <View style={[styles.card, { marginBottom: 40 }]}>
          <Text style={styles.cardTitle}>{t('resetDefaultData')}</Text>
          <Text style={styles.cardSubtitle}>
            Khôi phục lại 3 loại món và 6 món ăn mẫu ban đầu.
          </Text>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Ionicons name="refresh" size={16} color="#DC2626" style={{ marginRight: 6 }} />
            <Text style={styles.resetBtnText}>{t('resetDefaultData')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 18,
  },
  langSwitchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langChoice: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langChoiceActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  langChoiceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  langChoiceTextActive: {
    color: '#FFFFFF',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  inlineRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1E293B',
  },
  primaryBtn: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  schemaBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  schemaHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  schemaItem: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  bold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  secondaryBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  syncBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  testResult: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearLogText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  logsBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    maxHeight: 180,
  },
  logItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  logTime: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: 'monospace',
    marginRight: 6,
  },
  logMsg: {
    fontSize: 11,
    color: '#E2E8F0',
    flex: 1,
  },
  logSuccess: {
    color: '#4ADE80',
  },
  logWarning: {
    color: '#FBBF24',
  },
  logError: {
    color: '#F87171',
  },
  noLogs: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 8,
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
});
