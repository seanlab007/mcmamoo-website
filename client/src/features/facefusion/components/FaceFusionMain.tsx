/**
 * FaceFusion 主组件
 * 猫眼内容平台 - AI 面部融合模块
 */

import React, { useCallback, useState } from 'react';
import { Upload, Image, Video, Play, RotateCcw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useFaceFusionStore } from '../store';
import type { FaceFusionMode, UploadedFile } from '../types';
import '../styles/facefusion.css';

// 模式配置
const MODE_CONFIG: Record<FaceFusionMode, { label: string; desc: string; icon: React.ReactNode }> = {
  face_swap: {
    label: '面部换脸',
    desc: '将源图片的脸部替换到目标图片或视频中',
    icon: <Image className="mode-icon" />,
  },
  face_enhance: {
    label: '脸部增强',
    desc: '提升脸部清晰度和质量',
    icon: <Image className="mode-icon" />,
  },
  lip_sync: {
    label: '唇形同步',
    desc: '让嘴唇动作匹配音频',
    icon: <Video className="mode-icon" />,
  },
  expression_restore: {
    label: '表情恢复',
    desc: '恢复被遮挡或模糊的表情',
    icon: <Image className="mode-icon" />,
  },
};

// 上传组件
interface UploadZoneProps {
  type: 'source' | 'target';
  file: UploadedFile | null;
  onUpload: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({
  type,
  file,
  onUpload,
  onClear,
  disabled,
}) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) onUpload(droppedFile);
    },
    [disabled, onUpload]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) onUpload(selectedFile);
    },
    [onUpload]
  );

  const isSource = type === 'source';

  return (
    <div
      className={`upload-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''} ${disabled ? 'disabled' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {file ? (
        <div className="preview-container">
          <img src={file.url} alt={file.name} className="preview-image" />
          <button
            className="clear-btn"
            onClick={onClear}
            disabled={disabled}
          >
            <RotateCcw size={14} />
          </button>
          <span className="file-name">{file.name}</span>
        </div>
      ) : (
        <label className="upload-label">
          <input
            type="file"
            accept={isSource ? 'image/*' : 'image/*,video/*'}
            onChange={handleChange}
            disabled={disabled}
          />
          <Upload className="upload-icon" size={32} />
          <span className="upload-text">
            {isSource ? '上传源图片' : '上传目标图片/视频'}
          </span>
          <span className="upload-hint">
            {isSource
              ? '提供将被替换的脸部'
              : '将被替换脸部的图片或视频'}
          </span>
        </label>
      )}
    </div>
  );
};

// 模式选择器
const ModeSelector: React.FC = () => {
  const { mode, setMode } = useFaceFusionStore();

  return (
    <div className="mode-selector">
      {(Object.keys(MODE_CONFIG) as FaceFusionMode[]).map((m) => (
        <button
          key={m}
          className={`mode-btn ${mode === m ? 'active' : ''}`}
          onClick={() => setMode(m)}
        >
          {MODE_CONFIG[m].icon}
          <span className="mode-label">{MODE_CONFIG[m].label}</span>
        </button>
      ))}
    </div>
  );
};

// 进度条
const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
  <div className="progress-container">
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${progress}%` }} />
    </div>
    <span className="progress-text">{progress}%</span>
  </div>
);

// 主组件
const FaceFusionMain: React.FC = () => {
  const {
    mode,
    sourceFile,
    targetFile,
    currentStatus,
    currentProgress,
    currentResult,
    currentError,
    setSourceFile,
    setTargetFile,
    submitTask,
    reset,
  } = useFaceFusionStore();

  // 本地状态
  const [uploadingSource, setUploadingSource] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState(false);

  // 处理上传
  const handleSourceUpload = async (file: File) => {
    setUploadingSource(true);
    try {
      const url = URL.createObjectURL(file);
      setSourceFile({
        id: crypto.randomUUID(),
        name: file.name,
        url,
        type: 'image',
        size: file.size,
        createdAt: new Date().toISOString(),
      });
    } finally {
      setUploadingSource(false);
    }
  };

  const handleTargetUpload = async (file: File) => {
    setUploadingTarget(true);
    try {
      const isVideo = file.type.startsWith('video/');
      const url = URL.createObjectURL(file);
      setTargetFile({
        id: crypto.randomUUID(),
        name: file.name,
        url,
        type: isVideo ? 'video' : 'image',
        size: file.size,
        createdAt: new Date().toISOString(),
      });
    } finally {
      setUploadingTarget(false);
    }
  };

  const isProcessing = currentStatus === 'preparing' || currentStatus === 'processing';

  return (
    <div className="facefusion-main">
      <div className="facefusion-header">
        <h2>AI 面部融合</h2>
        <p className="subtitle">{MODE_CONFIG[mode].desc}</p>
      </div>

      {/* 模式选择 */}
      <ModeSelector />

      {/* 上传区域 */}
      <div className="upload-sections">
        <div className="upload-section">
          <h3>
            <Image size={16} />
            源图片（提供脸部）
          </h3>
          <UploadZone
            type="source"
            file={sourceFile}
            onUpload={handleSourceUpload}
            onClear={() => setSourceFile(null)}
            disabled={isProcessing}
          />
        </div>

        <div className="upload-arrow">→</div>

        <div className="upload-section">
          <h3>
            <Image size={16} />
            目标图片/视频
          </h3>
          <UploadZone
            type="target"
            file={targetFile}
            onUpload={handleTargetUpload}
            onClear={() => setTargetFile(null)}
            disabled={isProcessing}
          />
        </div>
      </div>

      {/* 进度 */}
      {isProcessing && (
        <div className="progress-section">
          <Loader2 className="spin" size={20} />
          <ProgressBar progress={currentProgress} />
          <span className="status-text">
            {currentStatus === 'preparing' ? '准备中...' : '处理中...'}
          </span>
        </div>
      )}

      {/* 错误 */}
      {currentError && (
        <div className="error-message">
          <AlertCircle size={16} />
          {currentError}
        </div>
      )}

      {/* 结果预览 */}
      {currentResult && (
        <div className="result-section">
          <h3>
            <CheckCircle size={16} />
            生成完成
          </h3>
          <div className="result-preview">
            <img src={currentResult} alt="结果预览" />
            <a href={currentResult} download className="download-btn">
              下载结果
            </a>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="action-buttons">
        <button
          className="primary-btn"
          onClick={submitTask}
          disabled={
            isProcessing ||
            !sourceFile ||
            (mode !== 'face_enhance' && !targetFile)
          }
        >
          <Play size={16} />
          开始处理
        </button>
        <button className="secondary-btn" onClick={reset}>
          <RotateCcw size={16} />
          重置
        </button>
      </div>
    </div>
  );
};

export default FaceFusionMain;
