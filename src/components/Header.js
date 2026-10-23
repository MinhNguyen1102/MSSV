import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFood } from '../context/FoodContext';
import { useTranslation } from '../locales/LanguageContext';

export default function Header({ currentScreen, onNavigate, onOpenFilter, activeFilterCount = 0 }) {
  const { mssv, isOnline, pendingSyncCount, isSyncing, triggerAutoSync } = useFood();
  const { language, toggleLanguage, t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* Hàng trên: Logo, MSSV và các nút tiện ích */}
      <View style={styles.topRow}>
        <View style={styles.titleContainer}>
          <Ionicons name="restaurant" size={24} color="#FF6B35" style={styles.icon} />
          <View>
            <Text style={styles.projectTitle}>{mssv}_FoodManager</Text>
            <Text style={styles.subTitle}>{t('appName')}</Text>
          </View>
        </View>

        <View style={styles.rightActions}>
          {/* Nút chuyển đổi Đa ngôn ngữ (English ↔ Tiếng Việt) */}
          <TouchableOpacity
            style={styles.langBtn}
            onPress={toggleLanguage}
            activeOpacity={0.8}
            accessibilityLabel="Switch Language"
          >
            <Ionicons name="globe-outline" size={16} color="#2B2D42" />
            <Text style={styles.langText}>{language.toUpperCase()}</Text>
          </TouchableOpacity>

          {/* Nút vào Quản lý Loại món */}
          <TouchableOpacity
            style={[styles.navIconBtn, currentScreen === 'CATEGORIES' && styles.navIconBtnActive]}
            onPress={() => onNavigate(currentScreen === 'CATEGORIES' ? 'DISH_LIST' : 'CATEGORIES')}
            activeOpacity={0.8}
          >
            <Ionicons
              name={currentScreen === 'CATEGORIES' ? 'arrow-back' : 'grid-outline'}
              size={20}
              color={currentScreen === 'CATEGORIES' ? '#fff' : '#2B2D42'}
            />
          </TouchableOpacity>

          {/* Nút vào Cài đặt */}
          <TouchableOpacity
            style={[styles.navIconBtn, currentScreen === 'SETTINGS' && styles.navIconBtnActive]}
            onPress={() => onNavigate(currentScreen === 'SETTINGS' ? 'DISH_LIST' : 'SETTINGS')}
            activeOpacity={0.8}
          >
            <Ionicons
              name={currentScreen === 'SETTINGS' ? 'arrow-back' : 'settings-outline'}
              size={20}
              color={currentScreen === 'SETTINGS' ? '#fff' : '#2B2D42'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Thanh trạng thái mạng & Đồng bộ (Yêu cầu 5: Offline & Tự động đồng bộ) */}
      <View style={[styles.networkBanner, isOnline ? styles.onlineBanner : styles.offlineBanner]}>
        <View style={styles.statusInfo}>
          <View style={[styles.statusDot, isOnline ? styles.onlineDot : styles.offlineDot]} />
          <Text style={[styles.statusText, isOnline ? styles.onlineText : styles.offlineText]}>
            {isOnline
              ? isSyncing
                ? t('syncing')
                : t('synced')
              : `${t('offline')} (${pendingSyncCount} pending)`}
          </Text>
        </View>

        {isOnline && pendingSyncCount > 0 && (
          <TouchableOpacity style={styles.syncBtn} onPress={triggerAutoSync} disabled={isSyncing}>
            <Ionicons name="sync" size={14} color="#0077B6" />
            <Text style={styles.syncBtnText}>{t('syncNow')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.3,
  },
  subTitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 4,
  },
  langText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  navIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navIconBtnActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  networkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  onlineBanner: {
    backgroundColor: '#F0FDF4',
  },
  offlineBanner: {
    backgroundColor: '#FEF2F2',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineDot: {
    backgroundColor: '#22C55E',
  },
  offlineDot: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  onlineText: {
    color: '#166534',
  },
  offlineText: {
    color: '#991B1B',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  syncBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
});
