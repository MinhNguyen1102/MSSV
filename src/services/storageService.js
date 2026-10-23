import AsyncStorage from '@react-native-async-storage/async-storage';
import { MSSV_DEFAULT, createSchema } from '../config/mssvConfig';
import { normalizeCategory, normalizeDish } from './dataModel';

export { createSchema };

const MSSV_KEY = '@app_current_mssv';

// Lấy MSSV đang active
export const getActiveMSSV = async () => {
  try {
    const saved = await AsyncStorage.getItem(MSSV_KEY);
    return saved || MSSV_DEFAULT;
  } catch {
    return MSSV_DEFAULT;
  }
};

// Đổi MSSV nếu người dùng cập nhật
export const setActiveMSSV = async (newMSSV) => {
  await AsyncStorage.setItem(MSSV_KEY, newMSSV.trim());
};

/**
 * Dữ liệu hạt giống ban đầu (Seed Data)
 * Đảm bảo tối thiểu: 3 loại món ăn, 5 món ăn (ở đây cung cấp 6 món phong phú)
 * Đầy đủ tiền tố {MSSV}_ cho tên bảng và tất cả các trường dữ liệu!
 */
export const getInitialSeedData = (mssv) => {
  const s = createSchema(mssv);

  const categories = [
    {
      [s.catId]: 'cat_1',
      [s.catName]: 'Khai Vị (Appetizers)',
      [s.catDesc]: 'Các món nhẹ nhàng khai vị tươi mát chuẩn vị Việt',
    },
    {
      [s.catId]: 'cat_2',
      [s.catName]: 'Món Chính (Main Courses)',
      [s.catDesc]: 'Các món ăn chính đậm đà giàu dinh dưỡng',
    },
    {
      [s.catId]: 'cat_3',
      [s.catName]: 'Tráng Miệng & Nước (Desserts & Drinks)',
      [s.catDesc]: 'Đồ uống đặc sắc và món tráng miệng thanh mát',
    },
  ];

  const dishes = [
    {
      [s.dishId]: 'dish_1',
      [s.dishName]: 'Gỏi Cuốn Tôm Thịt',
      [s.dishPrice]: 35000,
      [s.dishPrepTime]: 10, // <= 15 phút => Quick / Nhanh
      [s.dishIsAvailable]: true,
      [s.dishDesc]: 'Tôm tươi, thịt ba chỉ luộc, bún tươi và rau thơm cuốn bánh tráng, chấm tương đen đậu phộng.',
      [s.dishCatId]: 'cat_1',
      [s.dishImage]: [
        {
          [s.imgUrl]: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
          [s.imgIsThumbnail]: true,
        },
        {
          [s.imgUrl]: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
          [s.imgIsThumbnail]: false,
        },
      ],
      _syncStatus: 'synced',
    },
    {
      [s.dishId]: 'dish_2',
      [s.dishName]: 'Phở Bò Tái Lăn Hà Nội',
      [s.dishPrice]: 65000,
      [s.dishPrepTime]: 15, // <= 15 phút => Quick / Nhanh
      [s.dishIsAvailable]: true,
      [s.dishDesc]: 'Bò xào lăn thơm phức tỏi gừng, nước dùng hầm xương ống 24 giờ thơm mùi hoa hồi, thảo quả.',
      [s.dishCatId]: 'cat_2',
      [s.dishImage]: [
        {
          [s.imgUrl]: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80',
          [s.imgIsThumbnail]: true,
        },
        {
          [s.imgUrl]: 'https://images.unsplash.com/photo-1576577445504-6af96477db52?w=600&auto=format&fit=crop&q=80',
          [s.imgIsThumbnail]: false,
        },
      ],
      _syncStatus: 'synced',
    },
    {
      [s.dishId]: 'dish_3',
      [s.dishName]: 'Cơm Tấm Sườn Bì Chả',
      [s.dishPrice]: 70000,
      [s.dishPrepTime]: 20, // > 15 phút => Regular / Thông thường
      [s.dishIsAvailable]: true,
      [s.dishDesc]: 'Cơm tấm dẻo thơm, sườn nướng than hoa mật ong, chả trứng hấp béo ngậy, bì giòn thơm.',
      [s.dishCatId]: 'cat_2',
      [s.dishImage]: [
        {
          [s.imgUrl]: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=600&auto=format&fit=crop&q=80',
          [s.imgIsThumbnail]: true,
        },
        {
          [s.imgUrl]: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop&q=80',
          [s.imgIsThumbnail]: false,
        },
      ],
      _syncStatus: 'synced',
    },
    {
      [s.dishId]: 'dish_4',
      [s.dishName]: 'Bún Chả Nướng Than Hoa',
      [s.dishPrice]: 60000,
      [s.dishPrepTime]: 25, // > 15 phút => Regular / Thông thường
      [s.dishIsAvailable]: true,
      [s.dishDesc]: 'Chả miếng và chả viên nướng quạt than thơm lừng, nước mắm đu đủ cà rốt chua ngọt chuẩn phố cổ.',
      [s.dishCatId]: 'cat_2',
      [s.dishImage]: [
        {
          [s.imgUrl]: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&auto=format&fit=crop&q=80',
          [s.imgIsThumbnail]: true,
        },
      ],
      _syncStatus: 'synced',
    },
    {
      [s.dishId]: 'dish_5',
      [s.dishName]: 'Chè Hạt Sen Long Nhãn',
      [s.dishPrice]: 30000,
      [s.dishPrepTime]: 12, // <= 15 phút => Quick / Nhanh
      [s.dishIsAvailable]: true,
      [s.dishDesc]: 'Hạt sen Huế bùi bùi lồng trong cùi nhãn giòn ngọt thanh, nước đường phèn hoa bưởi thanh khiết.',
      [s.dishCatId]: 'cat_3',
      [s.dishImage]: [
        {
          [s.imgUrl]: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&auto=format&fit=crop&q=80',
          [s.imgIsThumbnail]: true,
        },
      ],
      _syncStatus: 'synced',
    },
    {
      [s.dishId]: 'dish_6',
      [s.dishName]: 'Cà Phê Trứng Hà Nội',
      [s.dishPrice]: 45000,
      [s.dishPrepTime]: 8, // <= 15 phút => Quick / Nhanh
      [s.dishIsAvailable]: false, // Ngừng bán (để test lọc trạng thái!)
      [s.dishDesc]: 'Cà phê Robusta đậm đặc với lớp kem trứng đánh bông mịn ngậy ngọt lịm đặc trưng.',
      [s.dishCatId]: 'cat_3',
      [s.dishImage]: [
        {
          [s.imgUrl]: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
          [s.imgIsThumbnail]: true,
        },
      ],
      _syncStatus: 'synced',
    },
  ];

  return { categories, dishes };
};

/**
 * Khởi tạo dữ liệu vào AsyncStorage nếu chưa có
 */
export const initializeStorage = async (forced = false) => {
  const mssv = await getActiveMSSV();
  const s = createSchema(mssv);
  const categoryTableKey = `@${s.categoryTable}`;
  const dishTableKey = `@${s.dishTable}`;

  const existingCats = await AsyncStorage.getItem(categoryTableKey);
  const existingDishes = await AsyncStorage.getItem(dishTableKey);

  if (forced || !existingCats || !existingDishes) {
    const seed = getInitialSeedData(mssv);
    // Initialize missing tables independently so a partially populated local
    // database is never overwritten during a normal application launch.
    if (forced || !existingCats) await AsyncStorage.setItem(categoryTableKey, JSON.stringify(seed.categories));
    if (forced || !existingDishes) await AsyncStorage.setItem(dishTableKey, JSON.stringify(seed.dishes));
    if (forced) return seed;
  }

  const categoriesRaw = await AsyncStorage.getItem(categoryTableKey);
  const dishesRaw = await AsyncStorage.getItem(dishTableKey);
  const categories = (categoriesRaw ? JSON.parse(categoriesRaw) : []).map((item) => normalizeCategory(item, mssv));
  return {
    categories,
    dishes: (dishesRaw ? JSON.parse(dishesRaw) : []).map((item) => normalizeDish(item, mssv, categories)),
  };
};

/**
 * Đọc toàn bộ danh sách Category
 */
export const loadCategories = async () => {
  const mssv = await getActiveMSSV();
  const s = createSchema(mssv);
  const raw = await AsyncStorage.getItem(`@${s.categoryTable}`);
  return (raw ? JSON.parse(raw) : []).map((item) => normalizeCategory(item, mssv));
};

/**
 * Lưu danh sách Category
 */
export const saveCategories = async (categories) => {
  const mssv = await getActiveMSSV();
  const s = createSchema(mssv);
  await AsyncStorage.setItem(`@${s.categoryTable}`, JSON.stringify(categories.map((item) => normalizeCategory(item, mssv))));
};

/**
 * Đọc toàn bộ danh sách Dish
 */
export const loadDishes = async () => {
  const mssv = await getActiveMSSV();
  const s = createSchema(mssv);
  const raw = await AsyncStorage.getItem(`@${s.dishTable}`);
  const categoryRaw = await AsyncStorage.getItem(`@${s.categoryTable}`);
  const categories = (categoryRaw ? JSON.parse(categoryRaw) : []).map((item) => normalizeCategory(item, mssv));
  return (raw ? JSON.parse(raw) : []).map((item) => normalizeDish(item, mssv, categories));
};

/**
 * Lưu danh sách Dish
 */
export const saveDishes = async (dishes) => {
  const mssv = await getActiveMSSV();
  const s = createSchema(mssv);
  const categoryRaw = await AsyncStorage.getItem(`@${s.categoryTable}`);
  const categories = (categoryRaw ? JSON.parse(categoryRaw) : []).map((item) => normalizeCategory(item, mssv));
  await AsyncStorage.setItem(`@${s.dishTable}`, JSON.stringify(dishes.map((item) => normalizeDish(item, mssv, categories))));
};
