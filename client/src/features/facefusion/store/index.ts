/**
 * FaceFusion Zustand Store
 * 猫眼内容平台 - AI 面部融合模块
 */

import { create } from 'zustand';
import type {
  FaceFusionStatus,
  FaceFusionMode,
  FaceFusionStatusResponse,
  UploadedFile,
} from '../types';
import { faceFusionService } from '../services/api';

interface FaceFusionState {
  // 当前模式
  mode: FaceFusionMode;
  setMode: (mode: FaceFusionMode) => void;

  // 源文件（提供脸部）
  sourceFile: UploadedFile | null;
  setSourceFile: (file: UploadedFile | null) => void;

  // 目标文件（被替换的图片/视频）
  targetFile: UploadedFile | null;
  setTargetFile: (file: UploadedFile | null) => void;

  // 当前任务
  currentTaskId: string | null;
  currentStatus: FaceFusionStatus;
  currentProgress: number;
  currentResult: string | null;
  currentError: string | null;

  // 历史任务
  taskHistory: FaceFusionStatusResponse[];
  addTaskToHistory: (task: FaceFusionStatusResponse) => void;

  // 系统状态
  systemReady: boolean;
  gpuAvailable: boolean;

  // 操作方法
  submitTask: () => Promise<void>;
  checkStatus: () => Promise<void>;
  reset: () => void;
}

export const useFaceFusionStore = create<FaceFusionState>((set, get) => ({
  // 初始状态
  mode: 'face_swap',
  setMode: (mode) => set({ mode }),

  sourceFile: null,
  setSourceFile: (file) => set({ sourceFile: file }),

  targetFile: null,
  setTargetFile: (file) => set({ targetFile: file }),

  currentTaskId: null,
  currentStatus: 'idle',
  currentProgress: 0,
  currentResult: null,
  currentError: null,

  taskHistory: [],
  addTaskToHistory: (task) =>
    set((state) => ({
      taskHistory: [task, ...state.taskHistory].slice(0, 50), // 保留最近50个
    })),

  systemReady: false,
  gpuAvailable: false,

  submitTask: async () => {
    const { sourceFile, targetFile, mode } = get();

    if (!sourceFile) {
      set({ currentError: '请上传源图片（提供脸部）' });
      return;
    }

    if (!targetFile && mode !== 'face_enhance') {
      set({ currentError: '请上传目标图片或视频' });
      return;
    }

    set({
      currentStatus: 'preparing',
      currentProgress: 0,
      currentError: null,
    });

    const response = await faceFusionService.submitTask({
      sourceImage: sourceFile.url,
      targetImage: targetFile?.type === 'image' ? targetFile.url : undefined,
      targetVideo: targetFile?.type === 'video' ? targetFile.url : undefined,
      mode,
    });

    if (response.success && response.data) {
      set({
        currentTaskId: response.data.taskId,
        currentStatus: 'processing',
      });

      // 开始轮询状态
      const finalStatus = await faceFusionService.pollTaskStatus(
        response.data.taskId,
        (status) => {
          set({
            currentStatus: status.status,
            currentProgress: status.progress,
            currentResult: status.resultUrl ?? null,
            currentError: status.error ?? null,
          });
        }
      );

      if (finalStatus) {
        get().addTaskToHistory(finalStatus);
      }
    } else {
      set({
        currentStatus: 'failed',
        currentError: response.error || '提交任务失败',
      });
    }
  },

  checkStatus: async () => {
    const { currentTaskId } = get();
    if (!currentTaskId) return;

    const response = await faceFusionService.getTaskStatus(currentTaskId);
    if (response.success && response.data) {
      set({
        currentStatus: response.data.status,
        currentProgress: response.data.progress,
        currentResult: response.data.resultUrl ?? null,
        currentError: response.data.error ?? null,
      });
    }
  },

  reset: () =>
    set({
      mode: 'face_swap',
      sourceFile: null,
      targetFile: null,
      currentTaskId: null,
      currentStatus: 'idle',
      currentProgress: 0,
      currentResult: null,
      currentError: null,
    }),
}));
