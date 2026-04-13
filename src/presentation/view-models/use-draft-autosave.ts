import { useState, useEffect } from "react";

export function useDraftAutosave<T>(storageKey: string, initialValue: T) {
  const [draft, setDraft] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setDraft(JSON.parse(stored));
      }
    } catch (error) {
      console.warn("Failed to load draft from localStorage", error);
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey]);

  // Update draft and local storage
  const updateDraft = (newDraft: T) => {
    setDraft(newDraft);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newDraft));
    } catch (error) {
      console.warn("Failed to save draft to localStorage", error);
    }
  };

  // Clear draft
  const clearDraft = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn("Failed to clear draft from localStorage", error);
    }
  };

  return { draft, updateDraft, clearDraft, isLoaded };
}
