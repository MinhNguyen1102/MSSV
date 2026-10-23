import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  getActiveMSSV,
  setActiveMSSV,
  initializeStorage,
  loadCategories,
  saveCategories,
  loadDishes,
  saveDishes,
} from '../services/storageService';
import { MSSV_DEFAULT, createSchema } from '../config/mssvConfig';
import { normalizeDish } from '../services/dataModel';
import {
  getSyncQueue,
  enqueueSyncAction,
  ensureInitialSyncQueued,
  processSyncQueue,
  addSyncLog,
  getSyncLogs,
} from '../services/syncService';

const FoodContext = createContext(null);

export const FoodProvider = ({ children }) => {
  const [mssv, setMssv] = useState(MSSV_DEFAULT);
  const [schema, setSchema] = useState(createSchema(MSSV_DEFAULT));
  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Trạng thái mạng & Đồng bộ
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [syncLogs, setSyncLogs] = useState([]);
  const syncRunRef = useRef(false);

  // Bộ lọc tìm kiếm & sắp xếp (Yêu cầu 4.2: Giữ các điều kiện đã chọn khi chuyển màn hình)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'AVAILABLE' | 'UNAVAILABLE'
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'price_asc' | 'price_desc' | 'prep_asc'

  // Tải dữ liệu ban đầu
  const reloadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentMssv = await getActiveMSSV();
      setMssv(currentMssv);
      const newSchema = createSchema(currentMssv);
      setSchema(newSchema);

      const data = await initializeStorage(false);
      setCategories(data.categories);
      setDishes(data.dishes);

      const queue = await getSyncQueue();
      setPendingSyncCount(queue.length);

      const logs = await getSyncLogs();
      setSyncLogs(logs);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  // Hàm tự động đồng bộ hàng đợi
  const handleAutoSync = useCallback(async () => {
    if (syncRunRef.current) return;
    syncRunRef.current = true;
    setIsSyncing(true);
    try {
      if (isOnline) await ensureInitialSyncQueued();
      await processSyncQueue();
      const updatedQueue = await getSyncQueue();
      setPendingSyncCount(updatedQueue.length);
      const updatedDishes = await loadDishes();
      setDishes(updatedDishes);
      const updatedLogs = await getSyncLogs();
      setSyncLogs(updatedLogs);
    } catch (err) {
      console.warn('Auto sync failed:', err);
    } finally {
      syncRunRef.current = false;
      setIsSyncing(false);
    }
  }, [isOnline]);

  // First online launch queues local seed/user data and syncs it automatically.
  // The bootstrap marker is endpoint-specific and bootstrap writes are additive.
  useEffect(() => {
    if (!isLoading && isOnline) handleAutoSync();
  }, [isLoading, isOnline, handleAutoSync]);

  // Lắng nghe thay đổi kết nối mạng để tự động đồng bộ (Yêu cầu 5: Tự động phát hiện & đồng bộ khi có Internet)
  useEffect(() => {
    let wasOffline = false;

    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);

      if (wasOffline && online) {
        addSyncLog('[Network] Thiết bị đã kết nối Internet trở lại. Kích hoạt tự động đồng bộ...', 'info');
        handleAutoSync();
      } else if (!online) {
        addSyncLog('[Network] Thiết bị đã ngắt kết nối Internet. Chuyển sang chế độ Offline.', 'warning');
      }
      wasOffline = !online;
    });

    return () => unsubscribe();
  }, [handleAutoSync]);

  // Cập nhật MSSV mới
  const changeMSSV = async (newMssv) => {
    if (!newMssv || !newMssv.trim()) return;
    const clean = newMssv.trim();
    await setActiveMSSV(clean);
    setMssv(clean);
    const newSchema = createSchema(clean);
    setSchema(newSchema);
    // Khởi tạo lại storage theo MSSV mới
    const data = await initializeStorage(true);
    setCategories(data.categories);
    setDishes(data.dishes);
  };

  // Khôi phục dữ liệu ban đầu (Reset Seed Data)
  const resetData = async () => {
    const data = await initializeStorage(true);
    setCategories(data.categories);
    setDishes(data.dishes);
    const logs = await getSyncLogs();
    setSyncLogs(logs);
  };

  // --- CRUD CHO MÓN ĂN (DISH) ---

  /**
   * Thêm món ăn mới với kiểm tra validation đầy đủ
   */
  const addDish = async (dishInput) => {
    const s = schema;
    const input = normalizeDish(dishInput, mssv);
    const name = String(input[s.dishName] || '').trim();
    const price = Number(input[s.dishPrice]);
    const prepTime = Number(input[s.dishPrepTime]);
    const categoryId = input[s.dishCatId];
    const images = input[s.dishImage];

    // Validation theo mục 3 & 4.4
    if (!name) {
      throw new Error('errorNameEmpty');
    }
    if (isNaN(price) || price <= 0) {
      throw new Error('errorPriceInvalid');
    }
    if (isNaN(prepTime) || prepTime <= 0) {
      throw new Error('errorPrepTimeInvalid');
    }
    if (!categoryId || !categories.some((category) => String(category[s.catId]) === String(categoryId))) {
      throw new Error('errorCategoryRequired');
    }

    // Kiểm tra tên món không trùng trong cùng một loại (Yêu cầu mục 3)
    const isDuplicate = dishes.some(
      (d) =>
        d[s.dishCatId] === categoryId &&
        String(d[s.dishName] || '').trim().toLowerCase() === name.toLowerCase()
    );
    if (isDuplicate) {
      throw new Error('errorNameDuplicate');
    }

    // Đảm bảo có ảnh và chính xác 1 thumbnail
    if (!images || images.length === 0) {
      throw new Error('errorImageRequired');
    }

    // Tạo đối tượng món ăn mới với đầy đủ tiền tố MSSV_
    const newId = `dish_${Date.now()}`;
    const newDish = normalizeDish({
      ...input,
      [s.dishId]: newId,
      [s.dishName]: name,
      [s.dishPrice]: price,
      [s.dishPrepTime]: prepTime,
      [s.dishIsAvailable]: Boolean(dishInput[s.dishIsAvailable]),
      [s.dishDesc]: (dishInput[s.dishDesc] || '').trim(),
      [s.dishCatId]: categoryId,
      [s.dishImage]: images,
      _syncStatus: isOnline ? 'synced' : 'pending_create',
    }, mssv);

    const updatedDishes = [newDish, ...dishes];
    setDishes(updatedDishes);
    await saveDishes(updatedDishes);

    // Xử lý đồng bộ / offline
    if (!isOnline) {
      await enqueueSyncAction({ type: 'CREATE_DISH', payload: newDish });
      const q = await getSyncQueue();
      setPendingSyncCount(q.length);
    } else {
      // Có mạng: Đẩy lên MockAPI
      try {
        await enqueueSyncAction({ type: 'CREATE_DISH', payload: newDish });
        await handleAutoSync();
      } catch (e) {
        console.warn('Direct api call error, kept in queue:', e);
      }
    }

    return newDish;
  };

  /**
   * Cập nhật thông tin món ăn
   */
  const updateDish = async (dishId, dishInput) => {
    const s = schema;
    const input = normalizeDish(dishInput, mssv);
    const name = String(input[s.dishName] || '').trim();
    const price = Number(input[s.dishPrice]);
    const prepTime = Number(input[s.dishPrepTime]);
    const categoryId = input[s.dishCatId];
    const images = input[s.dishImage];

    if (!name) throw new Error('errorNameEmpty');
    if (isNaN(price) || price <= 0) throw new Error('errorPriceInvalid');
    if (isNaN(prepTime) || prepTime <= 0) throw new Error('errorPrepTimeInvalid');
    if (!categoryId || !categories.some((category) => String(category[s.catId]) === String(categoryId))) throw new Error('errorCategoryRequired');

    // Kiểm tra trùng tên trong cùng loại với các món khác
    const isDuplicate = dishes.some(
      (d) =>
        d[s.dishId] !== dishId &&
        d[s.dishCatId] === categoryId &&
        String(d[s.dishName] || '').trim().toLowerCase() === name.toLowerCase()
    );
    if (isDuplicate) throw new Error('errorNameDuplicate');

    if (!images || images.length === 0) throw new Error('errorImageRequired');

    const updatedDishes = dishes.map((d) => {
      if (d[s.dishId] === dishId) {
        return {
          ...d,
          [s.dishName]: name,
          [s.dishPrice]: price,
          [s.dishPrepTime]: prepTime,
          [s.dishIsAvailable]: Boolean(dishInput[s.dishIsAvailable]),
          [s.dishDesc]: (dishInput[s.dishDesc] || '').trim(),
          [s.dishCatId]: categoryId,
          [s.dishImage]: images,
          _syncStatus: isOnline ? 'synced' : 'pending_update',
        };
      }
      return d;
    });

    setDishes(updatedDishes);
    await saveDishes(updatedDishes);

    const updatedDish = updatedDishes.find((d) => d[s.dishId] === dishId);

    if (!isOnline) {
      await enqueueSyncAction({ type: 'UPDATE_DISH', payload: updatedDish });
      const q = await getSyncQueue();
      setPendingSyncCount(q.length);
    } else {
      try {
        await enqueueSyncAction({ type: 'UPDATE_DISH', payload: updatedDish });
        await handleAutoSync();
      } catch (e) {
        console.warn('Direct api call error:', e);
      }
    }

    return updatedDish;
  };

  /**
   * Xóa món ăn
   */
  const deleteDish = async (dishId) => {
    const s = schema;
    const target = dishes.find((d) => d[s.dishId] === dishId);
    if (!target) return;

    const remaining = dishes.filter((d) => d[s.dishId] !== dishId);
    setDishes(remaining);
    await saveDishes(remaining);

    if (!isOnline) {
      await enqueueSyncAction({
        type: 'DELETE_DISH',
        payload: { dishId, name: target[s.dishName] },
      });
      const q = await getSyncQueue();
      setPendingSyncCount(q.length);
    } else {
      try {
        await enqueueSyncAction({
          type: 'DELETE_DISH',
          payload: { dishId, name: target[s.dishName] },
        });
        await handleAutoSync();
      } catch (e) {
        console.warn('Delete api call error:', e);
      }
    }
  };

  /**
   * Đặt một ảnh làm ảnh Thumbnail đại diện (Mỗi món có tối đa 01 ảnh IsThumbnail = true)
   */
  const setThumbnailImage = async (dishId, imageUrl) => {
    const s = schema;
    const updatedDishes = dishes.map((d) => {
      if (d[s.dishId] === dishId) {
        const thumbnailIndex = (d[s.dishImage] || []).findIndex((img) => img[s.imgUrl] === imageUrl);
        const updatedImages = (d[s.dishImage] || []).map((img) => ({
          ...img,
          [s.imgIsThumbnail]: thumbnailIndex >= 0 && (d[s.dishImage] || [])[thumbnailIndex] === img,
        }));
        return {
          ...d,
          [s.dishImage]: updatedImages,
          _syncStatus: isOnline ? 'synced' : 'pending_update',
        };
      }
      return d;
    });

    setDishes(updatedDishes);
    await saveDishes(updatedDishes);

    const updatedItem = updatedDishes.find((d) => d[s.dishId] === dishId);
    if (!isOnline) {
      await enqueueSyncAction({ type: 'UPDATE_DISH', payload: updatedItem });
      const q = await getSyncQueue();
      setPendingSyncCount(q.length);
    } else {
      await enqueueSyncAction({ type: 'UPDATE_DISH', payload: updatedItem });
      await handleAutoSync();
    }
  };

  // --- CRUD CHO LOẠI MÓN (CATEGORY) ---

  const addCategory = async (catInput) => {
    const s = schema;
    const name = (catInput[s.catName] || '').trim();
    if (!name) throw new Error('categoryNameEmpty');

    const newCat = {
      [s.catId]: `cat_${Date.now()}`,
      [s.catName]: name,
      [s.catDesc]: (catInput[s.catDesc] || '').trim(),
    };

    const updated = [...categories, newCat];
    setCategories(updated);
    await saveCategories(updated);
    await enqueueSyncAction({ type: 'CREATE_CATEGORY', payload: newCat });
    const queue = await getSyncQueue();
    setPendingSyncCount(queue.length);
    if (isOnline) await handleAutoSync();
    return newCat;
  };

  /**
   * Ràng buộc nghiệp vụ (Yêu cầu 4.4): Không cho xóa loại món đang được sử dụng!
   */
  const deleteCategory = async (catId) => {
    const s = schema;
    // Kiểm tra xem có món nào đang dùng loại này không
    const isInUse = dishes.some((d) => d[s.dishCatId] === catId);
    if (isInUse) {
      throw new Error('cannotDeleteCategoryInUse');
    }

    const updated = categories.filter((c) => c[s.catId] !== catId);
    setCategories(updated);
    await saveCategories(updated);
    await enqueueSyncAction({ type: 'DELETE_CATEGORY', payload: { categoryId: catId } });
    const queue = await getSyncQueue();
    setPendingSyncCount(queue.length);
    if (isOnline) await handleAutoSync();
  };

  // --- LỌC, TÌM KIẾM VÀ SẮP XẾP TỔNG HỢP (Yêu cầu 4.2) ---
  const filteredDishes = useMemo(() => {
    const s = schema;
    let list = [...dishes];

    // 1. Tìm theo một phần tên món (case-insensitive)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((d) => (d[s.dishName] || '').toLowerCase().includes(q));
    }

    // 2. Lọc theo loại món
    if (filterCategory !== 'ALL') {
      list = list.filter((d) => d[s.dishCatId] === filterCategory);
    }

    // 3. Lọc theo trạng thái đang bán (Yêu cầu 4.4: Món ngừng bán vẫn xuất hiện trong danh sách quản lý, nhưng không xuất hiện khi lọc trạng thái đang bán)
    if (filterStatus === 'AVAILABLE') {
      list = list.filter((d) => d[s.dishIsAvailable] === true);
    } else if (filterStatus === 'UNAVAILABLE') {
      list = list.filter((d) => d[s.dishIsAvailable] === false);
    }

    // 4. Lọc theo khoảng giá (min - max)
    const minVal = parseFloat(priceRange.min);
    const maxVal = parseFloat(priceRange.max);

    if (!isNaN(minVal) && minVal >= 0) {
      list = list.filter((d) => Number(d[s.dishPrice]) >= minVal);
    }
    if (!isNaN(maxVal) && maxVal >= 0) {
      list = list.filter((d) => Number(d[s.dishPrice]) <= maxVal);
    }

    // 5. Sắp xếp theo giá tăng/giảm hoặc thời gian chế biến tăng
    if (sortBy === 'price_asc') {
      list.sort((a, b) => Number(a[s.dishPrice]) - Number(b[s.dishPrice]));
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => Number(b[s.dishPrice]) - Number(a[s.dishPrice]));
    } else if (sortBy === 'prep_asc') {
      list.sort((a, b) => Number(a[s.dishPrepTime]) - Number(b[s.dishPrepTime]));
    }

    return list;
  }, [dishes, schema, searchQuery, filterCategory, filterStatus, priceRange, sortBy]);

  // Reset toàn bộ bộ lọc về mặc định
  const resetFilters = () => {
    setSearchQuery('');
    setFilterCategory('ALL');
    setFilterStatus('ALL');
    setPriceRange({ min: '', max: '' });
    setSortBy('default');
  };

  return (
    <FoodContext.Provider
      value={{
        mssv,
        schema,
        changeMSSV,
        categories,
        dishes,
        filteredDishes,
        isLoading,
        isOnline,
        isSyncing,
        pendingSyncCount,
        syncLogs,
        triggerAutoSync: handleAutoSync,
        // Filter states
        searchQuery,
        setSearchQuery,
        filterCategory,
        setFilterCategory,
        filterStatus,
        setFilterStatus,
        priceRange,
        setPriceRange,
        sortBy,
        setSortBy,
        resetFilters,
        // CRUD actions
        addDish,
        updateDish,
        deleteDish,
        setThumbnailImage,
        addCategory,
        deleteCategory,
        resetData,
        reloadData,
      }}
    >
      {children}
    </FoodContext.Provider>
  );
};

export const useFood = () => {
  const context = useContext(FoodContext);
  if (!context) {
    throw new Error('useFood must be used within a FoodProvider');
  }
  return context;
};
