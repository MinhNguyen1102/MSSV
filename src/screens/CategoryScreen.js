import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFood } from '../context/FoodContext';
import { useTranslation } from '../locales/LanguageContext';

export default function CategoryScreen({ onBack }) {
  const { schema, categories, dishes, addCategory, deleteCategory } = useFood();
  const { t } = useTranslation();
  const s = schema;

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Đếm số món trong mỗi loại món
  const getDishCount = (catId) => {
    return dishes.filter((d) => d[s.dishCatId] === catId).length;
  };

  const handleCreate = async () => {
    setErrorMessage('');
    if (!newCatName.trim()) {
      setErrorMessage(t('categoryNameEmpty'));
      return;
    }

    try {
      await addCategory({
        [s.catName]: newCatName.trim(),
        [s.catDesc]: newCatDesc.trim(),
      });
      setNewCatName('');
      setNewCatDesc('');
      setShowAddModal(false);
    } catch (err) {
      setErrorMessage(t(err.message) || err.message);
    }
  };

  // Xóa loại món (Có ràng buộc 4.4: Không cho xóa loại món đang được sử dụng)
  const handleDelete = (catId, catName) => {
    const dishCount = getDishCount(catId);
    if (dishCount > 0) {
      // Báo lỗi theo đúng yêu cầu nghiệp vụ
      Alert.alert(
        t('validationError'),
        `${t('cannotDeleteCategoryInUse')} (${dishCount} ${t('dishes').toLowerCase()})`,
        [{ text: t('close') }]
      );
      return;
    }

    Alert.alert(t('delete'), `${t('confirmDeleteCategory')} "${catName}"?`, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategory(catId);
          } catch (err) {
            Alert.alert(t('validationError'), t(err.message) || err.message);
          }
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
        <Text style={styles.screenTitle}>{t('categoryManagement')}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>{t('add')}</Text>
        </TouchableOpacity>
      </View>

      {/* Danh sách loại món */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item[s.catId]}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const catId = item[s.catId];
          const catName = item[s.catName];
          const catDesc = item[s.catDesc];
          const count = getDishCount(catId);

          return (
            <View style={styles.catCard}>
              <View style={styles.catInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.catName}>{catName}</Text>
                  <View style={[styles.dishCountBadge, count > 0 ? styles.badgeInUse : styles.badgeEmpty]}>
                    <Text style={[styles.dishCountText, count > 0 ? styles.countInUse : styles.countEmpty]}>
                      {count} {t('dishes')}
                    </Text>
                  </View>
                </View>
                {catDesc ? <Text style={styles.catDesc}>{catDesc}</Text> : null}
                <Text style={styles.metaId}>ID: {catId}</Text>
              </View>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(catId, catName)}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* Modal Thêm Loại món mới */}
      <Modal visible={showAddModal} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.inputDialog}>
            <Text style={styles.dialogTitle}>{t('addNewCategory')}</Text>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Text style={styles.dialogLabel}>{t('categoryName')} *</Text>
            <TextInput
              style={styles.dialogInput}
              placeholder="VD: Hải sản nướng..."
              value={newCatName}
              onChangeText={(txt) => {
                setNewCatName(txt);
                setErrorMessage('');
              }}
            />

            <Text style={styles.dialogLabel}>{t('categoryDesc')}</Text>
            <TextInput
              style={[styles.dialogInput, { height: 70, textAlignVertical: 'top' }]}
              placeholder="Mô tả ngắn..."
              multiline={true}
              value={newCatDesc}
              onChangeText={setNewCatDesc}
            />

            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => {
                  setShowAddModal(false);
                  setErrorMessage('');
                }}
              >
                <Text style={styles.dialogCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dialogConfirmBtn} onPress={handleCreate}>
                <Text style={styles.dialogConfirmText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  catCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catInfo: {
    flex: 1,
    paddingRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  catName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  dishCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeInUse: {
    backgroundColor: '#EFF6FF',
  },
  badgeEmpty: {
    backgroundColor: '#F1F5F9',
  },
  dishCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  countInUse: {
    color: '#2563EB',
  },
  countEmpty: {
    color: '#64748B',
  },
  catDesc: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  metaId: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: 'monospace',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  inputDialog: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  errorBoxText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  dialogLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dialogInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 12,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  dialogCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  dialogCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  dialogConfirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FF6B35',
  },
  dialogConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
