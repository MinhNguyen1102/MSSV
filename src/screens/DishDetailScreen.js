import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFood } from '../context/FoodContext';
import { useTranslation } from '../locales/LanguageContext';

export default function DishDetailScreen({ dishId, onBack, onEditDish }) {
  const { schema, dishes, categories, deleteDish, setThumbnailImage, updateDish } = useFood();
  const { t } = useTranslation();
  const s = schema;

  // Tìm món ăn
  const dish = dishes.find((d) => d[s.dishId] === dishId);

  // State cho Modal thêm ảnh mới
  const [showAddImageModal, setShowAddImageModal] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  // Xử lý khi ID không tồn tại (Yêu cầu 4.4)
  if (!dish) {
    return (
      <View style={styles.notFoundContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.notFoundText}>{t('notFoundDish')}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.backBtnText}>{t('back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const name = dish[s.dishName];
  const price = dish[s.dishPrice];
  const prepTime = Number(dish[s.dishPrepTime]);
  const isAvailable = dish[s.dishIsAvailable];
  const description = dish[s.dishDesc];
  const catId = dish[s.dishCatId];
  const images = dish[s.dishImage] || [];

  const categoryObj = categories.find((c) => c[s.catId] === catId);
  const categoryName = categoryObj ? categoryObj[s.catName] : '...';

  // Badge tính động theo PrepTime
  const isQuick = prepTime <= 15;
  const prepBadgeText = isQuick ? t('quick') : t('regular');

  // Xóa món ăn với xác nhận (Yêu cầu 4.1)
  const handleDelete = async () => {
    try {
      await deleteDish(dishId);
      setDeleteConfirmVisible(false);
      onBack();
    } catch (err) {
      Alert.alert(t('validationError'), err.message);
    }
  };

  // Thêm ảnh mới vào danh sách ảnh của món
  const handleAddImage = async () => {
    if (!newImageUrl.trim()) return;
    const url = newImageUrl.trim();
    const updatedImages = [
      ...images,
      {
        [s.imgUrl]: url,
        [s.imgIsThumbnail]: images.length === 0, // Nếu chưa có ảnh nào thì ảnh này làm thumbnail
      },
    ];

    try {
      await updateDish(dishId, {
        ...dish,
        [s.dishImage]: updatedImages,
      });
      setNewImageUrl('');
      setShowAddImageModal(false);
    } catch (err) {
      Alert.alert(t('validationError'), err.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Bar điều hướng */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconNavBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color="#1E293B" />
        </TouchableOpacity>

        <Text style={styles.topBarTitle} numberOfLines={1}>
          {name}
        </Text>

        <View style={styles.topBarActions}>
          <TouchableOpacity style={styles.iconNavBtn} onPress={() => onEditDish(dishId)}>
            <Ionicons name="pencil" size={20} color="#0284C7" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconNavBtn, styles.deleteNavBtn]}
            onPress={() => setDeleteConfirmVisible(true)}
          >
            <Ionicons name="trash-outline" size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Gallery ảnh & chọn ảnh đại diện (Yêu cầu 4.3: Hiển thị nhiều ảnh, thay đổi ảnh đại diện) */}
        <View style={styles.gallerySection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t('imagesGallery')}</Text>
            <TouchableOpacity
              style={styles.addImageBtn}
              onPress={() => setShowAddImageModal(true)}
            >
              <Ionicons name="add" size={16} color="#FF6B35" style={{ marginRight: 4 }} />
              <Text style={styles.addImageBtnText}>{t('addImageUrl')}</Text>
            </TouchableOpacity>
          </View>

          {images.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
              {images.map((imgItem, idx) => {
                const imgUrl = imgItem[s.imgUrl];
                const isThumb = imgItem[s.imgIsThumbnail] === true;

                return (
                  <View key={idx} style={[styles.imageCard, isThumb && styles.imageCardThumbnail]}>
                    <Image source={{ uri: imgUrl }} style={styles.galleryImg} resizeMode="cover" />

                    {isThumb ? (
                      <View style={styles.thumbIndicator}>
                        <Ionicons name="star" size={12} color="#FFFFFF" style={{ marginRight: 3 }} />
                        <Text style={styles.thumbIndicatorText}>{t('isThumbnailBadge')}</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.setThumbBtn}
                        onPress={() => setThumbnailImage(dishId, imgUrl)}
                      >
                        <Text style={styles.setThumbBtnText}>{t('setAsThumbnail')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.emptyImageBox}>
              <Ionicons name="images-outline" size={40} color="#94A3B8" />
              <Text style={styles.emptyImageText}>{t('noImages')}</Text>
            </View>
          )}
        </View>

        {/* Thông tin chi tiết */}
        <View style={styles.detailsCard}>
          {/* Tên món & Giá */}
          <Text style={styles.dishName}>{name}</Text>
          <Text style={styles.price}>{Number(price).toLocaleString('vi-VN')} đ</Text>

          {/* Badges thông tin */}
          <View style={styles.badgesRow}>
            {/* Loại món */}
            <View style={styles.badgeItem}>
              <Ionicons name="grid-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
              <Text style={styles.badgeItemText}>{categoryName}</Text>
            </View>

            {/* Badge Quick / Regular */}
            <View
              style={[
                styles.badgeItem,
                isQuick ? styles.badgeQuick : styles.badgeRegular,
              ]}
            >
              <Ionicons
                name={isQuick ? 'flash' : 'time-outline'}
                size={14}
                color={isQuick ? '#15803D' : '#1D4ED8'}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.badgeItemText,
                  isQuick ? styles.textQuick : styles.textRegular,
                ]}
              >
                {prepBadgeText} ({prepTime} {t('prepTimePlaceholder').includes('phút') ? 'phút' : 'mins'})
              </Text>
            </View>

            {/* Trạng thái đang bán */}
            <View
              style={[
                styles.badgeItem,
                isAvailable ? styles.badgeAvailable : styles.badgeUnavailable,
              ]}
            >
              <Ionicons
                name={isAvailable ? 'checkmark-circle' : 'close-circle'}
                size={14}
                color={isAvailable ? '#166534' : '#991B1B'}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.badgeItemText,
                  isAvailable ? styles.textAvailable : styles.textUnavailable,
                ]}
              >
                {isAvailable ? t('available') : t('unavailable')}
              </Text>
            </View>
          </View>

          {/* Mô tả */}
          <View style={styles.descSection}>
            <Text style={styles.descTitle}>{t('description')}</Text>
            <Text style={styles.descBody}>{description || t('noDescription')}</Text>
          </View>

          {/* Thông tin kỹ thuật phục vụ thuyết minh */}
          <View style={styles.techMetaBox}>
            <Text style={styles.techMetaTitle}>Technical Data (MSSV Prefixed Fields):</Text>
            <Text style={styles.techMetaText}>• ID: {dish[s.dishId]}</Text>
            <Text style={styles.techMetaText}>• Category ID: {dish[s.dishCatId]}</Text>
            <Text style={styles.techMetaText}>• Sync Status: {dish._syncStatus || 'synced'}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Modal Thêm URL ảnh */}
      <Modal visible={showAddImageModal} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.inputDialog}>
            <Text style={styles.dialogTitle}>{t('addImageUrl')}</Text>
            <Text style={styles.dialogSubtitle}>{t('enterImageUrlPrompt')}</Text>
            <TextInput
              style={styles.dialogInput}
              placeholder="https://images.unsplash.com/..."
              value={newImageUrl}
              onChangeText={setNewImageUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setShowAddImageModal(false)}
              >
                <Text style={styles.dialogCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dialogConfirmBtn} onPress={handleAddImage}>
                <Text style={styles.dialogConfirmText}>{t('add')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dialog Xác nhận Xóa món */}
      <Modal visible={deleteConfirmVisible} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.inputDialog}>
            <Ionicons name="trash" size={40} color="#DC2626" style={{ alignSelf: 'center', marginBottom: 8 }} />
            <Text style={[styles.dialogTitle, { textAlign: 'center' }]}>{t('delete')}</Text>
            <Text style={[styles.dialogSubtitle, { textAlign: 'center', marginBottom: 16 }]}>
              {t('confirmDeleteDish')}
            </Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setDeleteConfirmVisible(false)}
              >
                <Text style={styles.dialogCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dialogConfirmBtn, { backgroundColor: '#DC2626' }]} onPress={handleDelete}>
                <Text style={styles.dialogConfirmText}>{t('delete')}</Text>
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
  iconNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteNavBtn: {
    backgroundColor: '#FEF2F2',
  },
  topBarTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginHorizontal: 12,
    textAlign: 'center',
  },
  topBarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  content: {
    flex: 1,
  },
  gallerySection: {
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addImageBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF6B35',
  },
  galleryScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  imageCard: {
    width: 220,
    height: 160,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  imageCardThumbnail: {
    borderColor: '#FF6B35',
  },
  galleryImg: {
    width: '100%',
    height: '100%',
  },
  thumbIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  thumbIndicatorText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  setThumbBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  setThumbBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyImageBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
  emptyImageText: {
    marginTop: 8,
    color: '#94A3B8',
    fontSize: 14,
  },
  detailsCard: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 12,
  },
  dishName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  price: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FF6B35',
    marginBottom: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  badgeQuick: {
    backgroundColor: '#DCFCE7',
  },
  badgeRegular: {
    backgroundColor: '#DBEAFE',
  },
  badgeAvailable: {
    backgroundColor: '#DCFCE7',
  },
  badgeUnavailable: {
    backgroundColor: '#FEE2E2',
  },
  textQuick: {
    color: '#15803D',
  },
  textRegular: {
    color: '#1D4ED8',
  },
  textAvailable: {
    color: '#166534',
  },
  textUnavailable: {
    color: '#991B1B',
  },
  descSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  descTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  descBody: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
  },
  techMetaBox: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  techMetaTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  techMetaText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'monospace',
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginVertical: 16,
    textAlign: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
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
