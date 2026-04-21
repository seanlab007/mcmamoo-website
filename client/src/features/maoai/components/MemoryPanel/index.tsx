/**
<<<<<<< HEAD
 * 记忆面板组件
 * 
 * 展示和管理用户的长期记忆
 */

import React, { useState, useEffect } from 'react';

interface Memory {
  id: string;
  content: string;
  entities: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  metadata: {
    createdAt: string;
    type: string;
    tags: string[];
  };
}

interface MemoryPanelProps {
  userId?: string;
  onMemoryClick?: (memory: Memory) => void;
  className?: string;
}

export function MemoryPanel({
  userId = 'default',
  onMemoryClick,
  className = '',
}: MemoryPanelProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMemory, setNewMemory] = useState('');
  const [filter, setFilter] = useState<'all' | 'conversation' | 'document' | 'meeting'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 加载记忆
  const loadMemories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rowboat/memories?userId=${userId}&limit=50`);
      const data = await res.json();
      setMemories(data.memories || []);
    } catch (error) {
      console.error('加载记忆失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, [userId]);

  // 添加新记忆
  const handleAddMemory = async () => {
    if (!newMemory.trim()) return;

    try {
      const res = await fetch('/api/rowboat/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMemory,
          userId,
          type: 'note',
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setNewMemory('');
        await loadMemories();
      }
    } catch (error) {
      console.error('添加记忆失败:', error);
    }
  };

  // 获取所有标签
  const allTags = Array.from(
    new Set(memories.flatMap(m => m.metadata.tags))
  ).sort();

  // 过滤记忆
  const filteredMemories = memories.filter(m => {
    if (filter !== 'all' && m.metadata.type !== filter) return false;
    if (selectedTags.length > 0 && !selectedTags.some(t => m.metadata.tags.includes(t))) {
      return false;
    }
    return true;
  });

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 记忆类型图标
  const typeIcons: Record<string, string> = {
    conversation: '💬',
    document: '📄',
    meeting: '📅',
    note: '📝',
    email: '📧',
  };

  return (
    <div className={`memory-panel bg-white rounded-lg shadow-md ${className}`}>
      {/* 头部 */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          🧠 记忆面板
          <span className="text-sm font-normal text-gray-500">
            ({memories.length} 条记忆)
          </span>
        </h2>
      </div>

      {/* 添加新记忆 */}
      <div className="p-4 border-b bg-gray-50">
        <textarea
          value={newMemory}
          onChange={(e) => setNewMemory(e.target.value)}
          placeholder="记录新记忆..."
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={handleAddMemory}
            disabled={!newMemory.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            添加记忆
=======
 * MemoryPanel 组件
 * 语义记忆面板 - 显示最近的记忆条目
 *
 * 对标 rowboat 真实源码: apps/rowboat/src/app/memory
 *
 * 集成方式:
 * - 在 MaoAI Chat 页面侧边栏显示
 * - 从 /api/rowboat/memories 获取记忆列表
 * - 支持关键词搜索记忆
 */

import React, { useEffect, useState, useCallback } from "react";

const BACKEND = import.meta.env.VITE_MAOAI_BACKEND_URL || "";

interface MemoryItem {
  id: string;
  content: string;
  userId: string;
  sessionId: string;
  entities: Array<{ name: string; type: string; confidence: number }>;
  metadata: Record<string, any>;
  createdAt: string;
  similarity?: number;
}

interface MemoryPanelProps {
  /** 外部控制是否展开 */
  defaultExpanded?: boolean;
  /** 最大显示条目数 */
  maxItems?: number;
}

const ENTITY_TYPE_COLORS: Record<string, string> = {
  person: "bg-red-100 text-red-700",
  organization: "bg-blue-100 text-blue-700",
  technology: "bg-green-100 text-green-700",
  date: "bg-yellow-100 text-yellow-700",
  concept: "bg-purple-100 text-purple-700",
  other: "bg-gray-100 text-gray-600",
};

export default function MemoryPanel({ defaultExpanded = false, maxItems = 20 }: MemoryPanelProps) {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [expanded, setExpanded] = useState(defaultExpanded);

  // ── 获取记忆列表 ─────────────────────────────────────────
  const fetchMemories = useCallback(async (searchQuery?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        userId: "default",
        limit: String(maxItems),
      });
      if (searchQuery) params.set("query", searchQuery);

      const resp = await fetch(`${BACKEND}/api/rowboat/memories?${params}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setMemories(data.memories || []);
    } catch (err: any) {
      setError("记忆加载失败：" + err.message);
    } finally {
      setLoading(false);
    }
  }, [maxItems]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  // ── 搜索 ─────────────────────────────────────────────────
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput);
    fetchMemories(searchInput);
  };

  // ── 格式化时间 ───────────────────────────────────────────
  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      if (diff < 60000) return "刚刚";
      if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
      return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  // ── 截断内容 ─────────────────────────────────────────────
  const truncate = (text: string, max = 120) =>
    text.length > max ? text.slice(0, max) + "…" : text;

  return (
    <div className="flex flex-col gap-2 p-3 bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🧠</span>
          <span className="font-semibold text-gray-800 text-sm">语义记忆</span>
          <span className="text-xs text-gray-400">({memories.length})</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
          >
            {expanded ? "收起" : "展开"}
          </button>
          <button
            onClick={() => fetchMemories(query)}
            disabled={loading}
            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50"
          >
            {loading ? "⏳" : "🔄"}
>>>>>>> 9ea237c (feat: Rowboat知识图谱 + 记忆面板 + Token优化 + 毛选语料路由 + maoCorpusRouter)
          </button>
        </div>
      </div>

<<<<<<< HEAD
      {/* 过滤 */}
      <div className="p-4 border-b">
        <div className="flex gap-2 mb-2">
          {(['all', 'conversation', 'document', 'meeting'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type === 'all' ? '全部' : typeIcons[type] + ' ' + type}
            </button>
          ))}
        </div>

        {/* 标签过滤 */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {allTags.slice(0, 10).map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTags(prev =>
                  prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                )}
                className={`px-2 py-0.5 text-xs rounded ${
                  selectedTags.includes(tag)
                    ? 'bg-purple-500 text-white'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 记忆列表 */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : filteredMemories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无记忆，记录你的第一条吧！
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMemories.map(memory => (
              <div
                key={memory.id}
                onClick={() => onMemoryClick?.(memory)}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm line-clamp-2">{memory.content}</p>
                    
                    {/* 实体 */}
                    {memory.entities.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {memory.entities.slice(0, 3).map(entity => (
                          <span
                            key={entity.id}
                            className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
                          >
                            {entity.name}
                          </span>
                        ))}
                        {memory.entities.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{memory.entities.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 标签 */}
                    {memory.metadata.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {memory.metadata.tags.slice(0, 5).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <span className="text-lg ml-2">
                    {typeIcons[memory.metadata.type] || '📝'}
                  </span>
                </div>
                
                <div className="mt-2 text-xs text-gray-400">
                  {formatDate(memory.metadata.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部统计 */}
      <div className="p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="flex justify-between text-sm text-gray-500">
          <span>记忆总数: {memories.length}</span>
          <span>实体总数: {memories.reduce((sum, m) => sum + m.entities.length, 0)}</span>
        </div>
      </div>
    </div>
  );
}

export default MemoryPanel;
=======
      {/* 搜索框 */}
      <form onSubmit={handleSearch} className="flex gap-1">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="搜索记忆…"
          className="flex-1 text-xs px-2 py-1.5 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <button
          type="submit"
          className="text-xs px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600"
        >
          搜索
        </button>
      </form>

      {/* 记忆列表 */}
      {expanded && (
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {error && (
            <div className="text-xs text-red-500 text-center py-2">{error}</div>
          )}

          {!error && memories.length === 0 && !loading && (
            <div className="text-xs text-gray-400 text-center py-4">
              暂无记忆{query ? `（搜索: "${query}"）` : "，开始聊天后自动记录"}
            </div>
          )}

          {memories.map((mem) => (
            <div key={mem.id} className="group relative p-2 rounded bg-gray-50 hover:bg-gray-100 transition-colors">
              {/* 时间戳 */}
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs text-gray-400">{formatTime(mem.createdAt)}</span>
                {mem.similarity !== undefined && (
                  <span className="text-xs text-blue-400">
                    {Math.round(mem.similarity * 100)}% 匹配
                  </span>
                )}
              </div>

              {/* 内容 */}
              <p className="text-xs text-gray-700 leading-relaxed">
                {truncate(mem.content, 150)}
              </p>

              {/* 实体标签 */}
              {mem.entities && mem.entities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {mem.entities.slice(0, 4).map((entity, i) => (
                    <span
                      key={i}
                      className={`text-xs px-1.5 py-0.5 rounded ${ENTITY_TYPE_COLORS[entity.type] || ENTITY_TYPE_COLORS.other}`}
                    >
                      {entity.name}
                    </span>
                  ))}
                  {mem.entities.length > 4 && (
                    <span className="text-xs text-gray-400">
                      +{mem.entities.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 底部统计 */}
      {expanded && memories.length > 0 && (
        <div className="text-xs text-gray-400 text-center pt-1 border-t border-gray-100">
          共 {memories.length} 条记忆
          {query && <button onClick={() => { setQuery(""); setSearchInput(""); fetchMemories(); }} className="ml-1 text-blue-500 hover:underline">清除搜索</button>}
        </div>
      )}
    </div>
  );
}
>>>>>>> 9ea237c (feat: Rowboat知识图谱 + 记忆面板 + Token优化 + 毛选语料路由 + maoCorpusRouter)
