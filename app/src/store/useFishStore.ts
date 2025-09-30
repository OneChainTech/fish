import { create } from "zustand";

export type RecognitionResult = {
  name_cn: string;
  name_lat?: string;
  family?: string;
  description?: string;
  confidence?: number;
  matchedFishId?: string;
};

export type LocationMark = {
  id: string;
  address: string;
  recordedAt: string;
};

export type PendingMark = {
  id: string;
  fishId: string;
  address: string;
  recordedAt: string;
  isPending: boolean;
};

type FishState = {
  userId: string | null;
  userPhone: string | null;
  isLoggedIn: boolean;
  collectedFishIds: string[];
  currentRecognition: RecognitionResult | null;
  // 全局标记缓存：fishId -> LocationMark[]
  marksCache: Record<string, LocationMark[]>;
  marksCacheLoaded: boolean;
  // 待保存的标记
  pendingMarks: PendingMark[];
  setUserId: (userId: string) => void;
  setUserPhone: (phone: string | null) => void;
  setIsLoggedIn: (loggedIn: boolean) => void;
  setCollection: (ids: string[]) => void;
  setCurrentRecognition: (result: RecognitionResult | null) => void;
  unlockFish: (fishId: string) => void;
  resetCollection: () => void;
  resetUser: () => void;
  // 标记缓存相关方法
  setMarksCache: (fishId: string, marks: LocationMark[]) => void;
  addMarkToCache: (fishId: string, mark: LocationMark) => void;
  clearMarksCache: () => void;
  setMarksCacheLoaded: (loaded: boolean) => void;
  // 待保存标记相关方法
  addPendingMark: (mark: PendingMark) => void;
  removePendingMark: (markId: string) => void;
  clearPendingMarks: () => void;
  savePendingMarks: () => Promise<void>;
};

export const useFishStore = create<FishState>((set) => ({
  userId: null,
  userPhone: null,
  isLoggedIn: false,
  collectedFishIds: [],
  currentRecognition: null,
  marksCache: {},
  marksCacheLoaded: false,
  pendingMarks: [],
  setUserId: (userId) => set({ userId }),
  setUserPhone: (userPhone) => set({ userPhone }),
  setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
  setCollection: (ids) => set({ collectedFishIds: Array.from(new Set(ids)) }),
  setCurrentRecognition: (result) => set({ currentRecognition: result }),
  unlockFish: (fishId) =>
    set((state) => {
      if (state.collectedFishIds.includes(fishId)) {
        return state;
      }
      return { collectedFishIds: [...state.collectedFishIds, fishId] };
    }),
  resetCollection: () =>
    set({ collectedFishIds: [], currentRecognition: null }),
  resetUser: () =>
    set({ userId: null, userPhone: null, isLoggedIn: false }),
  // 标记缓存相关方法
  setMarksCache: (fishId, marks) =>
    set((state) => ({
      marksCache: { ...state.marksCache, [fishId]: marks }
    })),
  addMarkToCache: (fishId, mark) =>
    set((state) => {
      const existingMarks = state.marksCache[fishId] || [];
      const newMarks = [mark, ...existingMarks].slice(0, 3); // 保持最多3个
      return {
        marksCache: { ...state.marksCache, [fishId]: newMarks }
      };
    }),
  clearMarksCache: () => set({ marksCache: {}, marksCacheLoaded: false }),
  setMarksCacheLoaded: (loaded) => set({ marksCacheLoaded: loaded }),
  // 待保存标记相关方法
  addPendingMark: (mark) =>
    set((state) => ({
      pendingMarks: [...state.pendingMarks, mark]
    })),
  removePendingMark: (markId) =>
    set((state) => ({
      pendingMarks: state.pendingMarks.filter(mark => mark.id !== markId)
    })),
  clearPendingMarks: () => set({ pendingMarks: [] }),
  savePendingMarks: async () => {
    const state = useFishStore.getState();
    const { userId, pendingMarks } = state;
    
    if (!userId || pendingMarks.length === 0) return;

    try {
      const response = await fetch("/api/user/marks/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, marks: pendingMarks })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 清空待保存标记
          useFishStore.getState().clearPendingMarks();
          
          // 更新缓存
          const { setMarksCache } = useFishStore.getState();
          data.marks?.forEach((mark: { id: string; fishId: string; address: string; recordedAt: string }) => {
            const existingMarks = state.marksCache[mark.fishId] || [];
            const newMarks = [mark, ...existingMarks].slice(0, 3);
            setMarksCache(mark.fishId, newMarks);
          });
        }
      }
    } catch (error) {
      console.warn("批量保存标记失败", error);
    }
  },
}));
