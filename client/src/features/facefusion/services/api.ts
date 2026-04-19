/**
 * FaceFusion API 服务
 * 猫眼内容平台 - AI 面部融合模块
 */

import type {
  FaceFusionSubmitRequest,
  FaceFusionStatusResponse,
  FaceFusionSystemStatus,
  FaceFusionAPIResponse,
} from '../types';

const API_BASE = '/api/facefusion';

class FaceFusionService {
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }

  /**
   * 获取系统状态
   */
  async getSystemStatus(): Promise<FaceFusionAPIResponse<FaceFusionSystemStatus>> {
    try {
      const res = await fetch(`${API_BASE}/status`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return await res.json();
    } catch (error) {
      console.error('FaceFusion status check failed:', error);
      return {
        success: false,
        error: '无法连接到 FaceFusion 服务',
      };
    }
  }

  /**
   * 提交面部融合任务
   */
  async submitTask(
    task: FaceFusionSubmitRequest
  ): Promise<FaceFusionAPIResponse<{ taskId: string }>> {
    try {
      const res = await fetch(`${API_BASE}/submit`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(task),
      });
      return await res.json();
    } catch (error) {
      console.error('FaceFusion task submit failed:', error);
      return {
        success: false,
        error: '提交任务失败，请重试',
      };
    }
  }

  /**
   * 获取任务状态
   */
  async getTaskStatus(
    taskId: string
  ): Promise<FaceFusionAPIResponse<FaceFusionStatusResponse>> {
    try {
      const res = await fetch(`${API_BASE}/status/${taskId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return await res.json();
    } catch (error) {
      console.error('FaceFusion status check failed:', error);
      return {
        success: false,
        error: '获取任务状态失败',
      };
    }
  }

  /**
   * 轮询任务状态
   */
  async pollTaskStatus(
    taskId: string,
    onProgress?: (status: FaceFusionStatusResponse) => void,
    maxAttempts = 60,
    interval = 2000
  ): Promise<FaceFusionStatusResponse | null> {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await this.getTaskStatus(taskId);
      if (response.success && response.data) {
        const status = response.data;
        onProgress?.(status);

        if (status.status === 'completed' || status.status === 'failed') {
          return status;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    return null;
  }

  /**
   * 取消任务
   */
  async cancelTask(
    taskId: string
  ): Promise<FaceFusionAPIResponse<null>> {
    try {
      const res = await fetch(`${API_BASE}/cancel/${taskId}`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      return await res.json();
    } catch (error) {
      console.error('FaceFusion cancel failed:', error);
      return {
        success: false,
        error: '取消任务失败',
      };
    }
  }

  /**
   * 获取任务列表
   */
  async getTaskList(): Promise<FaceFusionAPIResponse<FaceFusionStatusResponse[]>> {
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return await res.json();
    } catch (error) {
      console.error('FaceFusion task list failed:', error);
      return {
        success: false,
        error: '获取任务列表失败',
      };
    }
  }

  /**
   * 删除任务
   */
  async deleteTask(
    taskId: string
  ): Promise<FaceFusionAPIResponse<null>> {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      return await res.json();
    } catch (error) {
      console.error('FaceFusion delete failed:', error);
      return {
        success: false,
        error: '删除任务失败',
      };
    }
  }

  /**
   * 上传图片
   */
  async uploadImage(file: File): Promise<FaceFusionAPIResponse<{ url: string; id: string }>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/upload/image`, {
        method: 'POST',
        body: formData,
      });
      return await res.json();
    } catch (error) {
      console.error('FaceFusion upload failed:', error);
      return {
        success: false,
        error: '上传图片失败',
      };
    }
  }

  /**
   * 上传视频
   */
  async uploadVideo(file: File): Promise<FaceFusionAPIResponse<{ url: string; id: string }>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/upload/video`, {
        method: 'POST',
        body: formData,
      });
      return await res.json();
    } catch (error) {
      console.error('FaceFusion upload failed:', error);
      return {
        success: false,
        error: '上传视频失败',
      };
    }
  }
}

export const faceFusionService = new FaceFusionService();
export default faceFusionService;
