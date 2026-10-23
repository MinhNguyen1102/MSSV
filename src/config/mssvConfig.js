// Cấu hình mã số sinh viên (MSSV) cho toàn bộ ứng dụng
// Bạn có thể sửa MSSV_DEFAULT tại đây hoặc thay đổi trực tiếp trong màn hình Cài đặt của ứng dụng
export const MSSV_DEFAULT = 'BIT240105';

// MockAPI URL mặc định (bạn có thể thay endpoint MockAPI cá nhân của bạn vào đây)
export const DEFAULT_MOCKAPI_URL = 'https://6ad8323195e98f36aef2fe8f.mockapi.io';

/**
 * Hàm lấy tên Bảng theo quy định: {MSSV}_{TableName}
 */
export const getTableName = (mssv, tableName) => {
  return `${mssv}_${tableName}`;
};

/**
 * Hàm lấy tên Trường dữ liệu theo quy định: {MSSV}_{FieldName}
 */
export const getFieldName = (mssv, fieldName) => {
  return `${mssv}_${fieldName}`;
};

/**
 * Khởi tạo định danh các trường dữ liệu theo MSSV
 */
export const createSchema = (mssv) => {
  return {
    categoryTable: `${mssv}_DishCategory`,
    dishTable: `${mssv}_Dish`,
    // Category fields
    catId: `${mssv}_Id`,
    catName: `${mssv}_Name`,
    catDesc: `${mssv}_Description`,
    // Dish fields
    dishId: `${mssv}_Id`,
    dishName: `${mssv}_Name`,
    dishPrice: `${mssv}_Price`,
    dishPrepTime: `${mssv}_PreparationTime`,
    dishIsAvailable: `${mssv}_IsAvailable`,
    dishDesc: `${mssv}_Description`,
    dishCatId: `${mssv}_DishCategoryId`,
    dishImage: `${mssv}_DishImage`,
    // DishImage item fields
    imgUrl: `${mssv}_ImageUrl`,
    imgIsThumbnail: `${mssv}_IsThumbnail`,
  };
};
