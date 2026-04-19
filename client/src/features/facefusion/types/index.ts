/**
 * FaceFusion 类型定义
 * 猫眼内容平台 - AI 面部融合模块
 */

// 任务状态
export type FaceFusionStatus = 'idle' | 'preparing' | 'processing' | 'completed' | 'failed';

// 处理模式
export type FaceFusionMode = 'face_swap' | 'face_enhance' | 'lip_sync' | 'expression_restore';

// 面部交换任务配置
export interface FaceFusionTask {
  id: string;
  sourceImage: string; // 目标图片URL（将被替换脸部）
  targetImage?: string; // 源图片URL（提供脸部）
  targetVideo?: string; // 目标视频URL
  mode: FaceFusionMode;
  faceMasker?: 'box' | 'occlusion' | 'region';
  faceEnhancerModel?: 'gfpgan' | 'codeformer' | 'restoreformer';
  lipSyncerModel?: 'wav2lip' | 'rhVoice';
  executionProviders: ('cpu' | 'cuda' | 'directml')[];
  outputPath?: string;
  webhookUrl?: string;
}

// 任务状态响应
export interface FaceFusionStatusResponse {
  taskId: string;
  status: FaceFusionStatus;
  progress: number; // 0-100
  resultUrl?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

// 提交任务请求
export interface FaceFusionSubmitRequest {
  sourceImage: string;
  targetImage?: string;
  targetVideo?: string;
  mode: FaceFusionMode;
  faceMasker?: FaceFusionTask['faceMasker'];
  faceEnhancerModel?: FaceFusionTask['faceEnhancerModel'];
  lipSyncerModel?: FaceFusionTask['lipSyncerModel'];
  webhookUrl?: string;
}

// API 响应
export interface FaceFusionAPIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 模型信息
export interface FaceFusionModelInfo {
  name: string;
  size: string;
  downloaded: boolean;
  downloadUrl?: string;
}

// 系统状态
export interface FaceFusionSystemStatus {
  gpuAvailable: boolean;
  gpuName?: string;
  gpuMemory?: string;
  modelsReady: boolean;
  modelsCount: number;
  version: string;
}

// 预览区域坐标
export interface FaceRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 上传文件信息
export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  type: 'image' | 'video';
  size: number;
  createdAt: string;
}
