import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFood } from '../context/FoodContext';
import { useTranslation } from '../locales/LanguageContext';

export default function FilterModal({ visible, onClose }) {
  const {
    schema,
    categories,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    priceRange,
    setPriceRange,
    sortBy,
    setSortBy,
    resetFilters,
  } = useFood();

  const { t } = useTranslation();
  const s = schema;

  // Local draft states để người dùng chỉnh sửa trước khi nhấn Áp dụng
  const [draftCat, setDraftCat] = useState(filterCategory);
  const [draftStatus, setDraftStatus] = useState(filterStatus);
  const [draftMin, setDraftMin] = useState(priceRange.min);
  const [draftMax, setDraftMax] = useState(priceRange.max);
  const [draftSort, setDraftSort] = useState(sortBy);
  const [errorMsg, setErrorMsg] = useState('');

  // Đồng bộ khi mở modal
  useEffect(() => {
    if (visible) {
      setDraftCat(filterCategory);
      setDraftStatus(filterStatus);
      setDraftMin(priceRange.min);
      setDraftMax(priceRange.max);
      setDraftSort(sortBy);
      setErrorMsg('');
    }
  }, [visible, filterCategory, filterStatus, priceRange, sortBy]);

  const handleApply = () => {
    // Validate khoảng giá (Yêu cầu 4.4: Xử lý hợp lý khi khoảng giá không hợp lệ)
    const minVal = parseFloat(draftMin);
    const maxVal = parseFloat(draftMax);

    if (draftMin && draftMax && !isNaN(minVal) && !isNaN(maxVal)) {
      if (minVal > maxVal) {
        setErrorMsg(t('errorPriceRangeInvalid'));
        return;
      }
    }
    if ((draftMin && isNaN(minVal)) || minVal < 0 || (draftMax && isNaN(maxVal)) || maxVal < 0) {
      setErrorMsg(t('errorPriceRangeInvalid'));
      return;
    }

    setFilterCategory(draftCat);
    setFilterStatus(draftStatus);
    setPriceRange({ min: draftMin, max: draftMax });
    setSortBy(draftSort);
    onClose();
  };

  const handleReset = () => {
    resetFilters();
    setDraftCat('ALL');
    setDraftStatus('ALL');
    setDraftMin('');
    setDraftMax('');
    setDraftSort('default');
    setErrorMsg('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header Modal */}
          <View style={styles.modalHeader}>
            <View style={styles.titleRow}>
              <Ionicons name="filter" size={20} color="#FF6B35" style={{ marginRight: 8 }} />
              <Text style={styles.modalTitle}>{t('filterAndSort')}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {errorMsg ? (
              <View style={styles.errorAlert}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* 1. Lọc theo Loại món */}
            <Text style={styles.sectionTitle}>{t('filterByCategory')}</Text>
            <View style={styles.chipGroup}>
              <TouchableOpacity
                style={[styles.chip, draftCat === 'ALL' && styles.chipActive]}
                onPress={() => setDraftCat('ALL')}
              >
                <Text style={[styles.chipText, draftCat === 'ALL' && styles.chipTextActive]}>
                  {t('allCategories')}
                </Text>
              </TouchableOpacity>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c[s.catId]}
                  style={[styles.chip, draftCat === c[s.catId] && styles.chipActive]}
                  onPress={() => setDraftCat(c[s.catId])}
                >
                  <Text style={[styles.chipText, draftCat === c[s.catId] && styles.chipTextActive]}>
                    {c[s.catName]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 2. Lọc theo Trạng thái đang bán */}
            <Text style={styles.sectionTitle}>{t('filterByStatus')}</Text>
            <View style={styles.chipGroup}>
              <TouchableOpacity
                style={[styles.chip, draftStatus === 'ALL' && styles.chipActive]}
                onPress={() => setDraftStatus('ALL')}
              >
                <Text style={[styles.chipText, draftStatus === 'ALL' && styles.chipTextActive]}>
                  {t('allStatuses')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, draftStatus === 'AVAILABLE' && styles.chipActive]}
                onPress={() => setDraftStatus('AVAILABLE')}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={draftStatus === 'AVAILABLE' ? '#fff' : '#166534'}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.chipText, draftStatus === 'AVAILABLE' && styles.chipTextActive]}>
                  {t('onlyAvailable')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, draftStatus === 'UNAVAILABLE' && styles.chipActive]}
                onPress={() => setDraftStatus('UNAVAILABLE')}
              >
                <Ionicons
                  name="close-circle"
                  size={14}
                  color={draftStatus === 'UNAVAILABLE' ? '#fff' : '#991B1B'}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.chipText, draftStatus === 'UNAVAILABLE' && styles.chipTextActive]}>
                  {t('onlyUnavailable')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 3. Lọc theo Khoảng giá */}
            <Text style={styles.sectionTitle}>{t('priceRange')}</Text>
            <View style={styles.priceRow}>
              <View style={styles.priceInputBox}>
                <Text style={styles.inputSubLabel}>{t('minPrice')}</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0"
                  keyboardType="numeric"
                  value={draftMin}
                  onChangeText={(val) => {
                    setDraftMin(val);
                    setErrorMsg('');
                  }}
                />
              </View>
              <Text style={styles.priceSeparator}>—</Text>
              <View style={styles.priceInputBox}>
                <Text style={styles.inputSubLabel}>{t('maxPrice')}</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="100000"
                  keyboardType="numeric"
                  value={draftMax}
                  onChangeText={(val) => {
                    setDraftMax(val);
                    setErrorMsg('');
                  }}
                />
              </View>
            </View>

            {/* 4. Sắp xếp */}
            <Text style={styles.sectionTitle}>{t('sortBy')}</Text>
            <View style={styles.sortGroup}>
              <TouchableOpacity
                style={[styles.sortItem, draftSort === 'default' && styles.sortItemActive]}
                onPress={() => setDraftSort('default')}
              >
                <Text style={[styles.sortItemText, draftSort === 'default' && styles.sortItemTextActive]}>
                  {t('sortDefault')}
                </Text>
                {draftSort === 'default' && <Ionicons name="checkmark" size={18} color="#FF6B35" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortItem, draftSort === 'price_asc' && styles.sortItemActive]}
                onPress={() => setDraftSort('price_asc')}
              >
                <Text style={[styles.sortItemText, draftSort === 'price_asc' && styles.sortItemTextActive]}>
                  {t('sortPriceAsc')}
                </Text>
                {draftSort === 'price_asc' && <Ionicons name="checkmark" size={18} color="#FF6B35" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortItem, draftSort === 'price_desc' && styles.sortItemActive]}
                onPress={() => setDraftSort('price_desc')}
              >
                <Text style={[styles.sortItemText, draftSort === 'price_desc' && styles.sortItemTextActive]}>
                  {t('sortPriceDesc')}
                </Text>
                {draftSort === 'price_desc' && <Ionicons name="checkmark" size={18} color="#FF6B35" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortItem, draftSort === 'prep_asc' && styles.sortItemActive]}
                onPress={() => setDraftSort('prep_asc')}
              >
                <Text style={[styles.sortItemText, draftSort === 'prep_asc' && styles.sortItemTextActive]}>
                  {t('sortPrepTimeAsc')}
                </Text>
                {draftSort === 'prep_asc' && <Ionicons name="checkmark" size={18} color="#FF6B35" />}
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer nút Bấm */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Ionicons name="refresh" size={16} color="#64748B" style={{ marginRight: 4 }} />
              <Text style={styles.resetBtnText}>{t('resetFilter')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
              <Ionicons name="checkmark-done" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.applyBtnText}>{t('applyFilter')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceInputBox: {
    flex: 1,
  },
  inputSubLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  priceInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  priceSeparator: {
    fontSize: 18,
    color: '#94A3B8',
    marginTop: 16,
  },
  sortGroup: {
    gap: 6,
    marginTop: 4,
    marginBottom: 16,
  },
  sortItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sortItemActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FFD8A8',
  },
  sortItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  sortItemTextActive: {
    color: '#EA580C',
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  resetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  applyBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
