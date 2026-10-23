import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest, getMockApiUrl } from './apiService';
import { getActiveMSSV, loadCategories, loadDishes, saveDishes } from './storageService';
import { createSchema } from '../config/mssvConfig';
import { normalizeCategory, normalizeDish, toApiCategory, toApiDish } from './dataModel';

const SYNC_QUEUE_KEY = '@app_sync_pending_queue';
const SYNC_LOGS_KEY = '@app_sync_activity_logs';
const INITIAL_SYNC_KEY_PREFIX = '@app_initial_mockapi_sync_v1';

// Queue local data once for each MSSV + endpoint. Bootstrap actions only create
// missing business IDs; they never overwrite existing MockAPI records.
export const ensureInitialSyncQueued = async () => {
  const mssv = await getActiveMSSV();
  const endpoint = (await getMockApiUrl()).replace(/\/+$/, '');
  const markerKey = `${INITIAL_SYNC_KEY_PREFIX}:${encodeURIComponent(mssv)}:${encodeURIComponent(endpoint)}`;
  if (await AsyncStorage.getItem(markerKey)) return false;

  const [categories, dishes] = await Promise.all([loadCategories(), loadDishes()]);
  for (const category of categories) {
    await enqueueSyncAction({ type: 'BOOTSTRAP_CATEGORY', payload: category });
  }
  for (const dish of dishes) {
    await enqueueSyncAction({ type: 'BOOTSTRAP_DISH', payload: dish });
  }

  await AsyncStorage.setItem(markerKey, new Date().toISOString());
  await addSyncLog(`[Bootstrap] Đã đưa ${categories.length} loại món và ${dishes.length} món local vào hàng đợi đồng bộ tới ${endpoint}.`, 'info');
  return true;
};

/**
 * Lấy hàng đợi các tác vụ offline đang chờ đồng bộ
 */
export const getSyncQueue = async () => {
  try {
    const raw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Lưu lại hàng đợi
 */
export const saveSyncQueue = async (queue) => {
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
};

/**
 * Thêm một bản ghi log đồng bộ để phục vụ thuyết minh Video 2
 */
export const addSyncLog = async (message, type = 'info') => {
  try {
    const raw = await AsyncStorage.getItem(SYNC_LOGS_KEY);
    const logs = raw ? JSON.parse(raw) : [];
    const newLog = {
      id: Date.now().toString() + Math.random().toString().slice(2, 6),
      time: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString(),
      message,
      type, // 'info' | 'success' | 'warning' | 'error'
    };
    const updated = [newLog, ...logs].slice(0, 50); // Lưu tối đa 50 log gần nhất
    await AsyncStorage.setItem(SYNC_LOGS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
};

export const getSyncLogs = async () => {
  try {
    const raw = await AsyncStorage.getItem(SYNC_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const clearSyncLogs = async () => {
  await AsyncStorage.removeItem(SYNC_LOGS_KEY);
};

/**
 * Thêm một thao tác vào hàng đợi offline
 * action = { type: 'CREATE_DISH' | 'UPDATE_DISH' | 'DELETE_DISH', payload: ... }
 */
export const enqueueSyncAction = async (action) => {
  const queue = await getSyncQueue();
  const queueItem = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...action,
    createdAt: new Date().toISOString(),
  };

  queue.push(queueItem);
  await saveSyncQueue(queue);
  await addSyncLog(`[Offline Queue] Thêm thao tác ${action.type}: "${action.payload?.name || action.payload?.id || ''}" vào hàng đợi đồng bộ.`, 'warning');
  return queueItem;
};

/**
 * Đồng bộ toàn bộ hàng đợi khi thiết bị có kết nối Internet trở lại
 * Không yêu cầu người dùng bấm nút, tự động đồng bộ theo đúng yêu cầu mục 5!
 */
export const processSyncQueue = async () => {
  const queue = await getSyncQueue();
  if (queue.length === 0) {
    return { success: true, processedCount: 0 };
  }

  const mssv = await getActiveMSSV();
  const s = createSchema(mssv);
  await addSyncLog(`[Auto-Sync] Bắt đầu đồng bộ tự động ${queue.length} tác vụ pending lên MockAPI...`, 'info');

  const remainingQueue = [];
  let successCount = 0;

  for (const item of queue) {
    try {
      const isCategory = item.type.endsWith('_CATEGORY');
      const isDelete = item.type.startsWith('DELETE_');
      const resource = isCategory ? s.categoryTable : s.dishTable;
      const businessIdField = isCategory ? s.catId : s.dishId;
      const nameField = isCategory ? s.catName : s.dishName;
      const payload = item.payload || {};
      const record = isCategory ? payload.category || payload : payload.dish || payload;
      const businessId = isDelete ? payload.categoryId || payload.dishId : record[businessIdField];
      const name = isDelete ? payload.name : record[nameField];

      // Only query the configured resource. Never treat the business ID or a
      // matching name as MockAPI's system ID, and never POST an unmatched update.
      const remoteRecords = await apiRequest(resource, 'GET');
      if (!Array.isArray(remoteRecords)) throw new Error(`Invalid ${resource} response`);
      const normalizedRecords = remoteRecords.map((entry) => (
        isCategory ? normalizeCategory(entry, mssv) : normalizeDish(entry, mssv)
      ));
      const match = normalizedRecords.find((entry) => String(entry[businessIdField]) === String(businessId));

      if (isDelete) {
        if (isCategory) {
          const remoteDishes = await apiRequest(s.dishTable, 'GET');
          if (!Array.isArray(remoteDishes)) throw new Error('Invalid Dish response while checking category usage');
          const categoryKeys = [businessId, match?.id, match?.Id].filter((value) => value !== undefined && value !== null).map(String);
          const categoryInUse = remoteDishes.some((dish) => {
            const normalizedId = normalizeDish(dish, mssv)[s.dishCatId];
            const rawId = dish[s.dishCatId] ?? dish.DishCategoryId;
            return categoryKeys.includes(String(normalizedId)) || categoryKeys.includes(String(rawId));
          });
          if (categoryInUse) throw new Error(`Cannot delete DishCategory ${businessId}: remote dishes still reference it`);
        }
        if (match?.id !== undefined && match?.id !== null) {
          await apiRequest(`${resource}/${encodeURIComponent(match.id)}`, 'DELETE');
        }
        await addSyncLog(`[Auto-Sync] Đã xử lý xóa ${isCategory ? 'loại món' : 'món'} "${name || businessId}" trên MockAPI.`, 'success');
        successCount++;
        continue;
      }

      const apiRecord = isCategory ? toApiCategory(record, mssv) : toApiDish(record, mssv);
      const action = item.type.startsWith('CREATE_') ? 'CREATE' : 'UPDATE';
      if (match?.id !== undefined && match?.id !== null) {
        if (item.type.startsWith('BOOTSTRAP_')) {
          // The bootstrap is additive: keep server data intact when the
          // business ID already exists, even if local values differ.
          await addSyncLog(`[Bootstrap] ${resource} business ID ${businessId} đã tồn tại trên MockAPI; giữ nguyên bản ghi máy chủ.`, 'info');
          successCount++;
          continue;
        }
        // PATCH preserves legacy, unprefixed fields already on a server record.
        await apiRequest(`${resource}/${encodeURIComponent(match.id)}`, 'PATCH', apiRecord);
      } else if (action === 'CREATE' || item.type.startsWith('BOOTSTRAP_')) {
        await apiRequest(resource, 'POST', apiRecord);
      } else {
        throw new Error(`Cannot update ${resource}: business ID ${businessId} was not found`);
      }
      await addSyncLog(`[Auto-Sync] Đã đồng bộ ${isCategory ? 'loại món' : 'món'} "${name || businessId}" lên MockAPI.`, 'success');
      successCount++;
    } catch (err) {
      console.warn('Sync item failed:', item, err);
      await addSyncLog(`[Auto-Sync] ${item.type} thất bại: ${err?.message || 'Lỗi không xác định'}`, 'error');
      // Giữ lại trong queue nếu thất bại do lỗi mạng
      remainingQueue.push(item);
    }
  }

  // Chỉ đánh dấu synced khi toàn bộ hàng đợi đã thành công. Nếu không, giữ
  // trạng thái pending cho những bản ghi còn nằm trong queue.
  try {
    const dishes = await loadDishes();
    const remainingBusinessIds = new Set(remainingQueue
      .filter((entry) => entry.type.endsWith('_DISH') || entry.type.endsWith('_CATEGORY'))
      .map((entry) => entry.payload?.dish?.[s.dishId] || entry.payload?.[s.dishId] || entry.payload?.category?.[s.catId] || entry.payload?.[s.catId] || entry.payload?.dishId));
    const updatedDishes = dishes.map((d) => ({
      ...d,
      _syncStatus: remainingBusinessIds.has(d[s.dishId]) ? 'pending_sync' : 'synced',
    }));
    await saveDishes(updatedDishes);
  } catch (e) {
    console.warn('Error updating local dish sync status:', e);
  }

  await saveSyncQueue(remainingQueue);
  await addSyncLog(`[Auto-Sync] Hoàn tất đồng bộ! Thành công: ${successCount}, Còn lại: ${remainingQueue.length}`, successCount > 0 ? 'success' : 'info');

  return {
    success: true,
    processedCount: successCount,
    remainingCount: remainingQueue.length,
  };
};
