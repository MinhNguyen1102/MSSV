import { createSchema } from '../config/mssvConfig';

const readField = (record, field, legacyName, fallback) => {
  if (record?.[field] !== undefined && record[field] !== null) return record[field];
  if (legacyName && record?.[legacyName] !== undefined && record[legacyName] !== null) {
    return record[legacyName];
  }
  return fallback;
};

const businessId = (record, field, legacyName, label) => {
  const current = readField(record, field, legacyName, undefined);
  if (current !== undefined && current !== '') return current;
  // MockAPI's `id` remains on the record as its system identifier; this is a
  // separate, deterministic business key used for the app's relationships.
  if (record?.id !== undefined) return `mockapi_${record.id}`;
  return `legacy_${encodeURIComponent(String(label || 'record'))}`;
};

export const normalizeCategory = (category, mssv) => {
  const s = createSchema(mssv);
  const record = category && typeof category === 'object' ? category : {};
  return {
    ...record,
    [s.catId]: businessId(record, s.catId, 'Id', readField(record, s.catName, 'Name', 'category')),
    [s.catName]: readField(record, s.catName, 'Name', ''),
    [s.catDesc]: readField(record, s.catDesc, 'Description', ''),
  };
};

export const normalizeDish = (dish, mssv, categories = []) => {
  const s = createSchema(mssv);
  const record = dish && typeof dish === 'object' ? dish : {};
  const rawImages = readField(record, s.dishImage, 'DishImage', []);
  let thumbnailAssigned = false;
  const images = (Array.isArray(rawImages) ? rawImages : []).map((image) => {
    const item = image && typeof image === 'object' ? image : {};
    const isThumbnail = readField(item, s.imgIsThumbnail, 'IsThumbnail', false) === true;
    const normalizedThumbnail = isThumbnail && !thumbnailAssigned;
    if (normalizedThumbnail) thumbnailAssigned = true;
    return {
      ...item,
      [s.imgUrl]: readField(item, s.imgUrl, 'ImageUrl', ''),
      [s.imgIsThumbnail]: normalizedThumbnail,
    };
  });

  const rawCategoryId = readField(record, s.dishCatId, 'DishCategoryId', '');
  const matchingCategory = categories.find((category) => (
    String(category[s.catId]) === String(rawCategoryId)
    || (category.id !== undefined && String(category.id) === String(rawCategoryId))
    || (category.Id !== undefined && String(category.Id) === String(rawCategoryId))
  ));

  return {
    ...record,
    [s.dishId]: businessId(record, s.dishId, 'Id', readField(record, s.dishName, 'Name', 'dish')),
    [s.dishName]: readField(record, s.dishName, 'Name', ''),
    [s.dishPrice]: readField(record, s.dishPrice, 'Price', 0),
    [s.dishPrepTime]: readField(record, s.dishPrepTime, 'PreparationTime', 0),
    [s.dishIsAvailable]: readField(record, s.dishIsAvailable, 'IsAvailable', false),
    [s.dishDesc]: readField(record, s.dishDesc, 'Description', ''),
    [s.dishCatId]: matchingCategory ? matchingCategory[s.catId] : rawCategoryId,
    [s.dishImage]: images,
  };
};

// Only the assignment-defined fields go to MockAPI. System `id`, local sync
// metadata, and legacy aliases must never be sent as business fields.
export const toApiDish = (dish, mssv) => {
  const s = createSchema(mssv);
  const normalized = normalizeDish(dish, mssv);
  return {
    [s.dishId]: normalized[s.dishId],
    [s.dishName]: normalized[s.dishName],
    [s.dishPrice]: normalized[s.dishPrice],
    [s.dishPrepTime]: normalized[s.dishPrepTime],
    [s.dishIsAvailable]: normalized[s.dishIsAvailable],
    [s.dishDesc]: normalized[s.dishDesc],
    [s.dishCatId]: normalized[s.dishCatId],
    [s.dishImage]: normalized[s.dishImage].map((image) => ({
      [s.imgUrl]: image[s.imgUrl],
      [s.imgIsThumbnail]: image[s.imgIsThumbnail],
    })),
  };
};

export const toApiCategory = (category, mssv) => {
  const s = createSchema(mssv);
  const normalized = normalizeCategory(category, mssv);
  return {
    [s.catId]: normalized[s.catId],
    [s.catName]: normalized[s.catName],
    [s.catDesc]: normalized[s.catDesc],
  };
};
