import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_MOCKAPI_URL } from '../config/mssvConfig';

const MOCKAPI_URL_KEY = '@app_mockapi_endpoint';

export const getMockApiUrl = async () => {
  try {
    const custom = await AsyncStorage.getItem(MOCKAPI_URL_KEY);
    if (!custom || custom.includes('67b57b5607ba6e59083d091e')) {
      return DEFAULT_MOCKAPI_URL;
    }
    return custom || DEFAULT_MOCKAPI_URL;
  } catch {
    return DEFAULT_MOCKAPI_URL;
  }
};

export const setMockApiUrl = async (url) => {
  await AsyncStorage.setItem(MOCKAPI_URL_KEY, url.trim());
};

/**
 * Gọi REST API tới MockAPI
 */
export const apiRequest = async (endpoint, method = 'GET', data = null) => {
  const baseUrl = await getMockApiUrl();
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  const url = `${cleanBase}/${cleanEndpoint}`;

  const headers = {
    'Content-Type': 'application/json',
  };

  const options = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  let timeoutId = null;
  if (typeof AbortController !== 'undefined') {
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => {
        try { controller.abort(); } catch {}
      }, 8000);
      options.signal = controller.signal;
    } catch {}
  }

  try {
    const res = await fetch(url, options);
    if (timeoutId) clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText || res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};
