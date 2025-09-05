import { create } from "zustand";

type VideoRecognitionState = {
  videoElement: HTMLVideoElement | null;
  setVideoElement: (videoElement: HTMLVideoElement | null) => void;
  resultsCallback: ((results: any) => void) | null;
  setResultsCallback: (callback: ((results: any) => void) | null) => void;
};

export const useVideoRecognition = create<VideoRecognitionState>((set) => ({
  videoElement: null,
  setVideoElement: (videoElement: HTMLVideoElement | null) =>
    set({ videoElement }),
  resultsCallback: null,
  setResultsCallback: (callback: ((results: any) => void) | null) =>
    set({ resultsCallback: callback }),
}));
