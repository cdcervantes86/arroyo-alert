"use client";
import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "arroyo-favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState(new Set());

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setFavorites(new Set(JSON.parse(saved)));
    } catch (e) {}
  }, []);

  const save = useCallback((newSet) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...newSet]));
    } catch (e) {}
  }, []);

  const toggle = useCallback((zoneId) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(zoneId)) next.delete(zoneId);
      else next.add(zoneId);
      save(next);
      if (navigator.vibrate) navigator.vibrate(30);
      return next;
    });
  }, [save]);

  const isFavorite = useCallback((zoneId) => favorites.has(zoneId), [favorites]);

  // Sort zones: favorites first, then rest
  const sortZones = useCallback((zones) => {
    const favs = zones.filter(z => favorites.has(z.id));
    const rest = zones.filter(z => !favorites.has(z.id));
    return [...favs, ...rest];
  }, [favorites]);

  return { favorites, toggle, isFavorite, sortZones, count: favorites.size };
}
