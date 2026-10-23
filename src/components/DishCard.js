import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFood } from '../context/FoodContext';
import { useTranslation } from '../locales/LanguageContext';

export default function DishCard({ dish, onPress }) {
  const { schema, categories } = useFood();
  const { t } = useTranslation();

  const s = schema;
  const name = dish[s.dishName];
  const price = dish[s.dishPrice];
  const prepTime = Number(dish[s.dishPrepTime]);
  const isAvailable = dish[s.dishIsAvailable];
  const catId = dish[s.dishCatId];
  const images = dish[s.dishImage] || [];

  // Tìm ảnh thumbnail (IsThumbnail = true), fallback ảnh đầu tiên nếu không có
  const thumbnailObj = images.find((img) => img[s.imgIsThumbnail] === true) || images[0];
  const thumbnailUrl = thumbnailObj ? thumbnailObj[s.imgUrl] : null;

  // Lấy tên loại món
  const categoryObj = categories.find((c) => c[s.catId] === catId);
  const categoryName = categoryObj ? categoryObj[s.catName] : '...';

  // Yêu cầu 4.3: Hiển thị "Quick / Nhanh" khi PreparationTime <= 15 phút, ngược lại là "Regular / Thông thường"
  const isQuick = prepTime <= 15;
  const prepBadgeText = isQuick ? t('quick') : t('regular');

  // Format giá tiền
  const formattedPrice = Number(price).toLocaleString('vi-VN');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Ảnh thumbnail */}
      <View style={styles.imageWrapper}>
        {thumbnailUrl ? (
          <Image source={{ uri: thumbnailUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.noImagePlaceholder]}>
            <Ionicons name="fast-food-outline" size={32} color="#94A3B8" />
          </View>
        )}

        {/* Badge trạng thái bán */}
        <View style={[styles.statusBadge, isAvailable ? styles.statusAvailable : styles.statusUnavailable]}>
          <Text style={[styles.statusBadgeText, isAvailable ? styles.availableText : styles.unavailableText]}>
            {isAvailable ? t('available') : t('unavailable')}
          </Text>
        </View>

        {/* Sync status badge (nếu tạo/sửa lúc offline) */}
        {dish._syncStatus && dish._syncStatus !== 'synced' && (
          <View style={styles.syncPendingBadge}>
            <Ionicons name="cloud-offline" size={12} color="#FFFFFF" />
          </View>
        )}
      </View>

      {/* Thông tin món ăn */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.categoryName} numberOfLines={1}>
            {categoryName}
          </Text>

          {/* Badge Thời gian chế biến Quick / Regular */}
          <View style={[styles.prepBadge, isQuick ? styles.prepBadgeQuick : styles.prepBadgeRegular]}>
            <Ionicons
              name={isQuick ? 'flash' : 'time-outline'}
              size={12}
              color={isQuick ? '#15803D' : '#1D4ED8'}
              style={{ marginRight: 3 }}
            />
            <Text style={[styles.prepBadgeText, isQuick ? styles.textQuick : styles.textRegular]}>
              {prepBadgeText} ({prepTime}m)
            </Text>
          </View>
        </View>

        <Text style={styles.dishName} numberOfLines={2}>
          {name}
        </Text>

        <View style={styles.footerRow}>
          <Text style={styles.priceText}>{formattedPrice} đ</Text>
          <View style={styles.detailArrow}>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 12,
    marginHorizontal: 16,
    flexDirection: 'row',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  imageWrapper: {
    width: 110,
    height: 110,
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  statusBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusAvailable: {
    backgroundColor: 'rgba(22, 101, 52, 0.9)',
  },
  statusUnavailable: {
    backgroundColor: 'rgba(153, 27, 27, 0.9)',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  availableText: {
    color: '#FFFFFF',
  },
  unavailableText: {
    color: '#FFFFFF',
  },
  syncPendingBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(234, 88, 12, 0.95)',
    borderRadius: 10,
    padding: 3,
  },
  content: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    maxWidth: '55%',
  },
  prepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  prepBadgeQuick: {
    backgroundColor: '#DCFCE7',
  },
  prepBadgeRegular: {
    backgroundColor: '#DBEAFE',
  },
  prepBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textQuick: {
    color: '#15803D',
  },
  textRegular: {
    color: '#1D4ED8',
  },
  dishName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginVertical: 4,
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FF6B35',
  },
  detailArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
