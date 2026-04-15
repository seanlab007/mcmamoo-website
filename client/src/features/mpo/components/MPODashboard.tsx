/**
 * MPODashboard.tsx
 * MaoAI MPO (Multi-Party Orchestration) 监控仪表板
 *
 * 功能：
 *  1. 统计概览（成功率、耗时、并行率、失败数）
 *  2. 任务提交面板（直接触发 MPO 执行）
 *  3. 实时执行状态轮询
 *  4. 历史记录表格
 *  5. 性能趋势图表
 *  6. 告警面板
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  AlertCircle, CheckCircle, Clock, TrendingUp, TrendingDown,
  PlayCircle, XCircle, RefreshCw, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── 类型 ─────────────────────────────────────────────────────────────────────

interface MPOStats {
  total_tasks: number;
  running_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  cancelled_tasks: number;
  success_rate: number;
  average_duration_ms: number;
}

interface AlertItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

interface ChartPoint {
  time: string;
  successRate: number;
  durationSec: number;
  total: number;
}

const MODE_LABELS: Record<string, string> = {
  auto: '自动', serial: '串行', parallel: '并行', triad: '三权分立',
};

const STATUS_COLORS: Record<string, string> = {
  running: 'bg-blue-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
  cancelled: 'bg-gray-400',
  unknown: 'bg-gray-300',
};

// ─── 辅助 ─────────────────────────────────────────────────────────────────────

function fmtMs(ms?: number | null) {
  if (!ms) return '--';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function fmtDate(iso?: string | Date | null) {
  if (!iso) return '--';
  return new Date(iso).toLocaleString('zh-CN', { hour12: false });
}

// ─── 子组件：统计卡片 ─────────────────────────────────────────────────────────

function StatCard({ title, value, sub, icon, color }: {
  title: string; value: string | number; sub?: string;
  icon: React.ReactNode; color?: string;
}) {
  return (
    <Card className={cn('border-2 transition-all', color)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── 子组件：任务提交面板 ─────────────────────────────────────────────────────

function TaskSubmitPanel({ onSubmitted }: { onSubmitted: (id: string) => void }) {
  const [task, setTask] = useState('');
  const [mode, setMode] = useState<'auto' | 'serial' | 'parallel' | 'triad'>('auto');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeMutation = trpc.mpo.execute.useMutation({
    onSuccess: (data) => {
      onSubmitted(data.executionId);
      setTask('');
      setError(null);
      setSubmitting(false);
    },
    onError: (err) => {
      setError(err.message);
      setSubmitting(false);
    },
  });

  const handleSubmit = () => {
    if (!task.trim()) return;
    setSubmitting(true);
    setError(null);
    executeMutation.mutate({ task, mode });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-blue-500" />
          提交 MPO 任务
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="输入任务描述，例如：分析并优化这段代码的性能瓶颈..."
          value={task}
          onChange={(e) => setTask(e.target.value)}
          rows={3}
          disabled={submitting}
        />
        <div className="flex items-center gap-3">
          <Select
            value={mode}
            onValueChange={(v) => setMode(v as typeof mode)}
            disabled={submitting}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MODE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleSubmit}
            disabled={!task.trim() || submitting}
            className="flex items-center gap-2"
          >
            {submitting ? (
              <><RefreshCw className="h-4 w-4 animate-spin" />执行中...</>
            ) : (
              <><PlayCircle className="h-4 w-4" />执行</>
            )}
          </Button>
        </div>
        {error && (
          <div className="text-sm text-red-500 flex items-center gap-1">
            <XCircle className="h-4 w-4" />{error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── 子组件：活跃任务状态 ─────────────────────────────────────────────────────

function ActiveTaskCard({ executionId, onComplete }: {
  executionId: string; onComplete: () => void;
}) {
  const { data, isLoading } = trpc.mpo.status.useQuery(
    { executionId },
    { refetchInterval: (data) => (data?.status === 'running' ? 2000 : false) }
  );
  const cancelMutation = trpc.mpo.cancel.useMutation();

  useEffect(() => {
    if (data?.status && data.status !== 'running') onComplete();
  }, [data?.status, onComplete]);

  if (isLoading || !data?.found) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-lg">
        <RefreshCw className="h-4 w-4 animate-spin" />
        正在加载任务 {executionId.slice(0, 16)}...
      </div>
    );
  }

  const statusColor = STATUS_COLORS[data.status ?? 'unknown'];

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
      <div className="flex items-center gap-3 min-w-0">
        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', statusColor,
          data.status === 'running' && 'animate-pulse'
        )} />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate max-w-xs">{data.task}</p>
          <p className="text-xs text-muted-foreground">
            {MODE_LABELS[data.status ?? ''] ?? data.status} · {fmtMs(data.durationMs)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant="outline">{data.status}</Badge>
        {data.status === 'running' && (
          <Button
            size="sm" variant="ghost"
            onClick={() => cancelMutation.mutate({ executionId })}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export const MPODashboard: React.FC = () => {
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<AlertItem[]>([]);
  const [pendingTasks, setPendingTasks] = useState<string[]>([]);
  const [completedCount, setCompletedCount] = useState(0);

  // ─── tRPC 查询 ───────────────────────────────────────────────────────────
  const statsQuery = trpc.mpo.stats.useQuery(undefined, { refetchInterval: 5000 });
  const historyQuery = trpc.mpo.history.useQuery({ limit: 15, offset: 0, status: 'all' }, {
    refetchInterval: 10_000,
  });
  const healthQuery = trpc.mpo.healthCheck.useQuery(undefined, { refetchInterval: 30_000 });

  const stats: MPOStats = statsQuery.data ?? {
    total_tasks: 0, running_tasks: 0, completed_tasks: 0,
    failed_tasks: 0, cancelled_tasks: 0, success_rate: 0, average_duration_ms: 0,
  };

  // ─── 图表数据累积 ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!statsQuery.data) return;
    setChartData(prev => {
      const next = [...prev, {
        time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
        successRate: +statsQuery.data!.success_rate.toFixed(1),
        durationSec: +(statsQuery.data!.average_duration_ms / 1000).toFixed(1),
        total: statsQuery.data!.total_tasks,
      }];
      return next.slice(-30); // 保留最近30个点
    });

    // 告警检测
    const s = statsQuery.data!;
    const newAlerts: AlertItem[] = [];
    if (s.success_rate < 70 && s.total_tasks > 0) {
      newAlerts.push({
        id: `sr-${Date.now()}`, severity: s.success_rate < 50 ? 'critical' : 'warning',
        message: `成功率偏低: ${s.success_rate.toFixed(1)}%`,
        timestamp: new Date().toISOString(), acknowledged: false,
      });
    }
    if (s.failed_tasks > 10) {
      newAlerts.push({
        id: `ft-${Date.now()}`, severity: 'warning',
        message: `失败任务较多: ${s.failed_tasks} 个`,
        timestamp: new Date().toISOString(), acknowledged: false,
      });
    }
    if (newAlerts.length > 0) {
      setActiveAlerts(prev => [...newAlerts, ...prev].slice(0, 30));
    }
  }, [statsQuery.data]);

  const handleTaskSubmitted = useCallback((id: string) => {
    setPendingTasks(prev => [id, ...prev]);
  }, []);

  const handleTaskComplete = useCallback((id: string) => {
    setCompletedCount(c => c + 1);
    setTimeout(() => {
      setPendingTasks(prev => prev.filter(t => t !== id));
    }, 5000); // 完成后5秒才从列表移除
  }, []);

  const handleAck = (alertId: string) => {
    setActiveAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
  };

  const unackedAlerts = activeAlerts.filter(a => !a.acknowledged);
  const history = historyQuery.data?.records ?? [];

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* ─── 标题 ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MaoAI-MPO 监控中枢</h1>
          <p className="text-muted-foreground mt-1">
            多方博弈并行编排系统 · 实时状态 &amp; 历史分析
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            'inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border',
            healthQuery.data?.available
              ? 'border-green-500 text-green-600 bg-green-50'
              : 'border-red-400 text-red-600 bg-red-50'
          )}>
            <Activity className="h-3 w-3" />
            {healthQuery.data?.available ? 'Python 引擎在线' : 'Python 引擎离线'}
          </span>
        </div>
      </div>

      {/* ─── 统计卡片 ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="成功率"
          value={`${stats.success_rate.toFixed(1)}%`}
          sub={`已完成 ${stats.completed_tasks} / ${stats.total_tasks} 个`}
          icon={<CheckCircle className="h-4 w-4" />}
          color={stats.success_rate >= 80
            ? 'border-green-500 bg-green-50/30'
            : stats.success_rate >= 50
              ? 'border-orange-400 bg-orange-50/30'
              : 'border-red-500 bg-red-50/30'
          }
        />
        <StatCard
          title="平均耗时"
          value={fmtMs(stats.average_duration_ms)}
          sub="近期执行平均时长"
          icon={<Clock className="h-4 w-4" />}
          color="border-blue-400 bg-blue-50/30"
        />
        <StatCard
          title="运行中"
          value={stats.running_tasks + pendingTasks.length}
          sub={`本地待确认 ${pendingTasks.length} 个`}
          icon={<TrendingUp className="h-4 w-4" />}
          color="border-violet-400 bg-violet-50/30"
        />
        <StatCard
          title="失败任务"
          value={stats.failed_tasks}
          sub={`失败率 ${stats.total_tasks > 0 ? ((stats.failed_tasks / stats.total_tasks) * 100).toFixed(1) : 0}%`}
          icon={<TrendingDown className="h-4 w-4" />}
          color={stats.failed_tasks > 5
            ? 'border-red-500 bg-red-50/30'
            : 'border-gray-300'}
        />
      </div>

      {/* ─── 任务提交 ────────────────────────────────────────────────── */}
      <TaskSubmitPanel onSubmitted={handleTaskSubmitted} />

      {/* ─── 活跃任务 ────────────────────────────────────────────────── */}
      {pendingTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
              活跃任务 ({pendingTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingTasks.map(id => (
              <ActiveTaskCard
                key={id}
                executionId={id}
                onComplete={() => handleTaskComplete(id)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* ─── 趋势图表 ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            性能趋势（最近 30 个采样点）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {chartData.length < 2 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                数据积累中，稍后显示...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone" dataKey="successRate"
                    stroke="#10b981" strokeWidth={2} dot={false} name="成功率 (%)"
                  />
                  <Line
                    type="monotone" dataKey="durationSec"
                    stroke="#3b82f6" strokeWidth={2} dot={false} name="平均耗时 (s)"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── 历史记录 ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            历史执行记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyQuery.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground p-4">
              <RefreshCw className="h-4 w-4 animate-spin" />加载中...
            </div>
          ) : history.length === 0 ? (
            <p className="text-muted-foreground text-sm p-4">暂无执行记录</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2 font-medium">任务</th>
                    <th className="p-2 font-medium">模式</th>
                    <th className="p-2 font-medium">耗时</th>
                    <th className="p-2 font-medium">状态</th>
                    <th className="p-2 font-medium">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(row => (
                    <tr key={row.id} className="border-b hover:bg-muted/40 transition-colors">
                      <td className="p-2 max-w-xs truncate">{row.task}</td>
                      <td className="p-2">
                        <Badge variant="outline">{MODE_LABELS[row.mode] ?? row.mode}</Badge>
                      </td>
                      <td className="p-2">{fmtMs(row.durationMs)}</td>
                      <td className="p-2">
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white',
                          STATUS_COLORS[row.status] ?? 'bg-gray-400'
                        )}>
                          {row.status}
                        </span>
                      </td>
                      <td className="p-2 text-muted-foreground">{fmtDate(row.startedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── 告警面板 ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className={cn('h-5 w-5', unackedAlerts.length > 0 ? 'text-red-500' : 'text-muted-foreground')} />
            告警中心 {unackedAlerts.length > 0 && <Badge variant="destructive">{unackedAlerts.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {unackedAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-10 w-10 mx-auto text-green-500 opacity-40 mb-2" />
              <p className="text-sm">无活跃告警</p>
            </div>
          ) : (
            unackedAlerts.map(alert => (
              <div
                key={alert.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border',
                  alert.severity === 'critical' ? 'border-red-400 bg-red-50/60' :
                    alert.severity === 'warning' ? 'border-orange-400 bg-orange-50/60' :
                      'border-blue-400 bg-blue-50/60'
                )}
              >
                <div>
                  <p className="font-medium text-sm">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(alert.timestamp)}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleAck(alert.id)}>
                  确认
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MPODashboard;
