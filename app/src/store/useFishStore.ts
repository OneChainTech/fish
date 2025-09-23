import { create } from "zustand";

export type RecognitionResult = {
  name_cn: string;
  name_lat?: string;
  family?: string;
  description?: string;
  confidence?: number;
  matchedFishId?: string;
};

type FishState = {
  userId: string | null;
  collectedFishIds: string[];
  currentRecognition: RecognitionResult | null;
  setUserId: (userId: string) => void;
  setCollection: (ids: string[]) => void;
  setCurrentRecognition: (result: RecognitionResult | null) => void;
  unlockFish: (fishId: string) => void;
  resetCollection: () => void;
};

export const useFishStore = create<FishState>((set) => ({
  userId: null,
  collectedFishIds: [],
  currentRecognition: null,
  setUserId: (userId) => set({ userId }),
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
}));
