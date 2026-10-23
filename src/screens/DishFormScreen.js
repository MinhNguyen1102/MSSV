import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFood } from '../context/FoodContext';
import { useTranslation } from '../locales/LanguageContext';

// Ảnh mẫu Unsplash chất lượng cao để sinh viên/giảng viên test nhanh khi demo
const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80',
];

export default function DishFormScreen({ dishId, onBack, onSaved }) {
  const { schema, dishes, categories, addDish, updateDish } = useFood();
  const { t } = useTranslation();
  const s = schema;

  const isEditMode = Boolean(dishId);
  const existingDish = isEditMode ? dishes.find((d) => d[s.dishId] === dishId) : null;

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);

  // URL input dialog state
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [formError, setFormError] = useState('');

  // Tải dữ liệu cũ nếu là chế độ Edit
  useEffect(() => {
    if (existingDish) {
      setName(existingDish[s.dishName] || '');
      setPrice(String(existingDish[s.dishPrice] || ''));
      setPrepTime(String(existingDish[s.dishPrepTime] || ''));
      setCategoryId(existingDish[s.dishCatId] || '');
      setIsAvailable(Boolean(existingDish[s.dishIsAvailable]));
      setDescription(existingDish[s.dishDesc] || '');
      setImages(existingDish[s.dishImage] || []);
    } else if (categories.length > 0) {
      // Mặc định chọn category đầu tiên khi tạo mới
      setCategoryId(categories[0][s.catId]);
      // Mặc định thêm 1 ảnh mẫu
      setImages([
        {
          [s.imgUrl]: SAMPLE_IMAGES[0],
          [s.imgIsThumbnail]: true,
        },
      ]);
    }
  }, [existingDish, categories]);

  // Thêm ảnh vào danh sách
  const handleAddImage = (url) => {
    if (!url.trim()) return;
    const isFirst = images.length === 0;
    const newImg = {
      [s.imgUrl]: url.trim(),
      [s.imgIsThumbnail]: isFirst, // Ảnh đầu tiên tự động làm thumbnail
    };
    setImages([...images, newImg]);
    setCustomUrl('');
    setShowUrlDialog(false);
    setFormError('');
  };

  // Chọn ảnh làm thumbnail (Chỉ 1 ảnh thumbnail = true)
  const handleSetThumbnail = (index) => {
    const updated = images.map((img, i) => ({
      ...img,
      [s.imgIsThumbnail]: i === index,
    }));
    setImages(updated);
  };

  // Xóa ảnh khỏi form
  const handleRemoveImage = (index) => {
    const isRemovingThumb = images[index][s.imgIsThumbnail];
    const filtered = images.filter((_, i) => i !== index);
    // Nếu vừa xóa thumbnail và vẫn còn ảnh, gán ảnh đầu tiên làm thumbnail
    if (isRemovingThumb && filtered.length > 0) {
      filtered[0][s.imgIsThumbnail] = true;
    }
    setImages(filtered);
  };

  // Xử lý Lưu form
  const handleSave = async () => {
    setFormError('');
    try {
      const payload = {
        [s.dishName]: name,
        [s.dishPrice]: price,
        [s.dishPrepTime]: prepTime,
        [s.dishCatId]: categoryId,
        [s.dishIsAvailable]: isAvailable,
        [s.dishDesc]: description,
        [s.dishImage]: images,
      };

      if (isEditMode) {
        await updateDish(dishId, payload);
      } else {
        await addDish(payload);
      }

      onSaved();
    } catch (err) {
      const translated = t(err.message) || err.message;
      setFormError(translated);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="close" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>
          {isEditMode ? t('editDishTitle') : t('createDishTitle')}
        </Text>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave}>
          <Text style={styles.saveHeaderBtnText}>{t('save')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Banner báo lỗi validation nếu có */}
        {formError ? (
          <View style={styles.errorAlert}>
            <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        ) : null}

        {/* 1. Tên món ăn */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            {t('dishNameLabel')} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t('dishNamePlaceholder')}
            value={name}
            onChangeText={(txt) => {
              setName(txt);
              setFormError('');
            }}
          />
        </View>

        {/* 2. Chọn loại món ăn (Category Picker) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            {t('selectCategory')} <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.categoryPickerRow}>
            {categories.map((c) => {
              const selected = categoryId === c[s.catId];
              return (
                <TouchableOpacity
                  key={c[s.catId]}
                  style={[styles.categoryChoice, selected && styles.categoryChoiceSelected]}
                  onPress={() => setCategoryId(c[s.catId])}
                >
                  <Text
                    style={[
                      styles.categoryChoiceText,
                      selected && styles.categoryChoiceTextSelected,
                    ]}
                  >
                    {c[s.catName]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. Giá & Thời gian chuẩn bị */}
        <View style={styles.rowFields}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>
              {t('priceLabel')} (đ) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder={t('pricePlaceholder')}
              keyboardType="numeric"
              value={price}
              onChangeText={(txt) => {
                setPrice(txt);
                setFormError('');
              }}
            />
          </View>

          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>
              {t('prepTimeLabel')} (m) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder={t('prepTimePlaceholder')}
              keyboardType="numeric"
              value={prepTime}
              onChangeText={(txt) => {
                setPrepTime(txt);
                setFormError('');
              }}
            />
            {/* Gợi ý Quick / Regular theo thời gian vừa nhập */}
            {prepTime ? (
              <Text style={styles.prepHint}>
                ⚡ {Number(prepTime) <= 15 ? t('quick') : t('regular')}
              </Text>
            ) : null}
          </View>
        </View>

        {/* 4. Switch Trạng thái đang bán */}
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.label}>{t('isAvailableSwitch')}</Text>
            <Text style={styles.switchSub}>{isAvailable ? t('available') : t('unavailable')}</Text>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={setIsAvailable}
            trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
            thumbColor={isAvailable ? '#22C55E' : '#94A3B8'}
          />
        </View>

        {/* 5. Mô tả món ăn */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t('description')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t('descriptionPlaceholder')}
            multiline={true}
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* 6. Quản lý Hình ảnh (Mục 4.3: Thêm ảnh URL, chọn thumbnail) */}
        <View style={styles.fieldGroup}>
          <View style={styles.imageSectionHeader}>
            <Text style={styles.label}>
              {t('imagesSection')} <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.addUrlBtn}
              onPress={() => setShowUrlDialog(true)}
            >
              <Ionicons name="link" size={15} color="#FF6B35" style={{ marginRight: 4 }} />
              <Text style={styles.addUrlBtnText}>{t('addImageBtn')}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.thumbnailNote}>{t('thumbnailExplanation')}</Text>

          {/* Dải ảnh mẫu để chọn nhanh */}
          <Text style={styles.sampleHeader}>Quick-pick sample photos:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sampleScroll}>
            {SAMPLE_IMAGES.map((sampleUrl, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleAddImage(sampleUrl)}
                style={styles.sampleThumbWrapper}
              >
                <Image source={{ uri: sampleUrl }} style={styles.sampleThumb} />
                <View style={styles.sampleAddBadge}>
                  <Ionicons name="add" size={12} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Danh sách ảnh hiện tại của món */}
          <View style={styles.imageGrid}>
            {images.map((img, idx) => {
              const url = img[s.imgUrl];
              const isThumb = img[s.imgIsThumbnail] === true;

              return (
                <View key={idx} style={[styles.imgCard, isThumb && styles.imgCardThumb]}>
                  <Image source={{ uri: url }} style={styles.cardImage} resizeMode="cover" />

                  {/* Nút bấm chọn làm Thumbnail */}
                  <TouchableOpacity
                    style={[styles.thumbPill, isThumb && styles.thumbPillActive]}
                    onPress={() => handleSetThumbnail(idx)}
                  >
                    <Ionicons
                      name={isThumb ? 'star' : 'star-outline'}
                      size={12}
                      color={isThumb ? '#FFFFFF' : '#475569'}
                      style={{ marginRight: 3 }}
                    />
                    <Text style={[styles.thumbPillText, isThumb && styles.thumbPillTextActive]}>
                      {isThumb ? t('isThumbnailBadge') : t('setAsThumbnail')}
                    </Text>
                  </TouchableOpacity>

                  {/* Nút xóa ảnh */}
                  <TouchableOpacity
                    style={styles.removeImgBtn}
                    onPress={() => handleRemoveImage(idx)}
                  >
                    <Ionicons name="trash-outline" size={14} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* Nút Lưu to dưới cùng */}
        <TouchableOpacity style={styles.bigSaveBtn} onPress={handleSave}>
          <Text style={styles.bigSaveBtnText}>{t('save')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal nhập link ảnh thủ công */}
      <Modal visible={showUrlDialog} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.inputDialog}>
            <Text style={styles.dialogTitle}>{t('addImageUrl')}</Text>
            <Text style={styles.dialogSubtitle}>{t('enterImageUrlPrompt')}</Text>
            <TextInput
              style={styles.dialogInput}
              placeholder="https://..."
              value={customUrl}
              onChangeText={setCustomUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setShowUrlDialog(false)}
              >
                <Text style={styles.dialogCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogConfirmBtn}
                onPress={() => handleAddImage(customUrl)}
              >
                <Text style={styles.dialogConfirmText}>{t('add')}</Text>
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
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 6,
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  saveHeaderBtn: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveHeaderBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  scroll: {
    flex: 1,
    padding: 20,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1E293B',
  },
  textArea: {
    height: 85,
    textAlignVertical: 'top',
  },
  categoryPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChoice: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChoiceSelected: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  categoryChoiceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  categoryChoiceTextSelected: {
    color: '#FFFFFF',
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  prepHint: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  switchSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  imageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  addUrlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addUrlBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF6B35',
  },
  thumbnailNote: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  sampleHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  sampleScroll: {
    marginBottom: 14,
  },
  sampleThumbWrapper: {
    position: 'relative',
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sampleThumb: {
    width: 60,
    height: 50,
    borderRadius: 8,
  },
  sampleAddBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    padding: 2,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imgCard: {
    width: '48%',
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  imgCardThumb: {
    borderColor: '#FF6B35',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  thumbPill: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  thumbPillActive: {
    backgroundColor: '#FF6B35',
  },
  thumbPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  thumbPillTextActive: {
    color: '#FFFFFF',
  },
  removeImgBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  bigSaveBtn: {
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  bigSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
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
    marginBottom: 6,
  },
  dialogSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  dialogInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 16,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
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
