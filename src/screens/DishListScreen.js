import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFood } from '../context/FoodContext';
import { useTranslation } from '../locales/LanguageContext';
import DishCard from '../components/DishCard';
import FilterModal from '../components/FilterModal';

export default function DishListScreen({ onSelectDish, onAddNewDish }) {
  const {
    schema,
    categories,
    filteredDishes,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    filterStatus,
    priceRange,
    sortBy,
  } = useFood();

  const { t } = useTranslation();
  const s = schema;
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Tính số lượng bộ lọc đang được kích hoạt
  let activeFilterCount = 0;
  if (filterCategory !== 'ALL') activeFilterCount++;
  if (filterStatus !== 'ALL') activeFilterCount++;
  if (priceRange.min !== '' || priceRange.max !== '') activeFilterCount++;
  if (sortBy !== 'default') activeFilterCount++;

  return (
    <View style={styles.container}>
      {/* Thanh Tìm kiếm và Nút Lọc */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={activeFilterCount > 0 ? '#FFFFFF' : '#334155'}
          />
          {activeFilterCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Dải Chip phân loại nhanh ngang */}
      <View style={styles.categoriesBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          <TouchableOpacity
            style={[styles.categoryChip, filterCategory === 'ALL' && styles.categoryChipActive]}
            onPress={() => setFilterCategory('ALL')}
          >
            <Text style={[styles.categoryChipText, filterCategory === 'ALL' && styles.categoryChipTextActive]}>
              {t('allCategories')}
            </Text>
          </TouchableOpacity>

          {categories.map((c) => (
            <TouchableOpacity
              key={c[s.catId]}
              style={[styles.categoryChip, filterCategory === c[s.catId] && styles.categoryChipActive]}
              onPress={() => setFilterCategory(c[s.catId])}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  filterCategory === c[s.catId] && styles.categoryChipTextActive,
                ]}
              >
                {c[s.catName]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tiêu đề danh sách và đếm số lượng */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {t('totalDishes')}: <Text style={styles.countNumber}>{filteredDishes.length}</Text>
        </Text>
        {activeFilterCount > 0 && (
          <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
            <Text style={styles.activeFilterNote}>{activeFilterCount} {t('filter').toLowerCase()} applied</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Danh sách món ăn */}
      <FlatList
        data={filteredDishes}
        keyExtractor={(item) => item[s.dishId]}
        renderItem={({ item }) => (
          <DishCard dish={item} onPress={() => onSelectDish(item[s.dishId])} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={60} color="#CBD5E1" />
            <Text style={styles.emptyText}>{t('noDishesFound')}</Text>
          </View>
        }
      />

      {/* Floating Action Button (FAB) Thêm món mới */}
      <TouchableOpacity
        style={styles.fab}
        onPress={onAddNewDish}
        activeOpacity={0.85}
        accessibilityLabel={t('addNewDish')}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal Lọc và Sắp xếp */}
      <FilterModal visible={filterModalVisible} onClose={() => setFilterModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  categoriesBar: {
    paddingVertical: 6,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  countNumber: {
    color: '#1E293B',
    fontWeight: '800',
  },
  activeFilterNote: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 90,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
});
