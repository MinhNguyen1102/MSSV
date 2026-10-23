import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en';
import vi from './vi';

const LANGUAGE_STORAGE_KEY = '@app_language_preference';

const translations = {
  en,
  vi,
};

const LanguageContext = createContext({
  language: 'en',
  t: (key) => key,
  setLanguage: () => { },
  toggleLanguage: () => { },
});

export const LanguageProvider = ({ children }) => {
  // Yêu cầu đề bài 4.5: "Giao diện mặc định tiếng Anh (English)"
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    // Tải ngôn ngữ đã lưu để giữ nguyên khi khởi động lại
    const loadSavedLanguage = async () => {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (saved && (saved === 'en' || saved === 'vi')) {
          setLanguageState(saved);
        }
      } catch (err) {
        console.warn('Failed to load saved language', err);
      }
    };
    loadSavedLanguage();
  }, []);

  const setLanguage = async (newLang) => {
    try {
      setLanguageState(newLang);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
    } catch (err) {
      console.warn('Failed to persist language', err);
    }
  };

  const toggleLanguage = async () => {
    const nextLang = language === 'en' ? 'vi' : 'en';
    await setLanguage(nextLang);
  };

  // Helper hàm dịch chuỗi, fallback về English nếu không tìm thấy key
  const t = (key) => {
    const currentDict = translations[language] || translations.en;
    if (currentDict && currentDict[key] !== undefined) {
      return currentDict[key];
    }
    return translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
