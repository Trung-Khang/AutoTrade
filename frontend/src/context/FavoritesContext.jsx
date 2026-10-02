import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const FavoritesContext = createContext();

const STORAGE_KEY = 'autotrade_favorites';

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Không thể đọc danh sách xe yêu thích từ localStorage:', e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error('Không thể lưu danh sách xe yêu thích vào localStorage:', e);
    }
  }, [favorites]);

  const isFavorite = useCallback((id) => {
    if (!id) return false;
    return favorites.some((item) => String(item.id) === String(id));
  }, [favorites]);

  const addFavorite = useCallback((vehicle) => {
    if (!vehicle || !vehicle.id) return;
    setFavorites((prev) => {
      if (prev.some((item) => String(item.id) === String(vehicle.id))) {
        return prev;
      }
      return [vehicle, ...prev];
    });
  }, []);

  const removeFavorite = useCallback((id) => {
    if (!id) return;
    setFavorites((prev) => prev.filter((item) => String(item.id) !== String(id)));
  }, []);

  const toggleFavorite = useCallback((vehicle) => {
    if (!vehicle || !vehicle.id) return false;
    const exists = favorites.some((item) => String(item.id) === String(vehicle.id));
    if (exists) {
      removeFavorite(vehicle.id);
      return false;
    } else {
      addFavorite(vehicle);
      return true;
    }
  }, [favorites, addFavorite, removeFavorite]);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  const value = {
    favorites,
    favoritesCount: favorites.length,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    clearFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
