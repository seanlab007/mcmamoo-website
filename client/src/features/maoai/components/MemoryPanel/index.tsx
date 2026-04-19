/**
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
          </button>
        </div>
      </div>

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
