import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle, Clock, TrendingUp, TrendingDown, Cpu, MemoryStick } from 'lucide-react';
import { cn } from '@/lib/utils';

// 定义类型

export interface MPOStats {
  total_tasks: number;
  parallel_tasks: number;
  serial_tasks: number;
  successful_tasks: number;
  failed_tasks: number;
  average_duration: number;
  total_duration: number;
  success_rate: number;
  parallel_ratio: number;
}

export interface ExecutionRecord {
  id: string;
  task: string;
  timestamp: string;
  result: any;
  completed: boolean;
  duration?: number;
  mode?: 'serial' | 'parallel';
}

export interface AlertItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export const MPODashboard: React.FC = () => {
  // 状态管理

  const [stats, setStats] = useState<MPOStats>({
    total_tasks: 0,
    parallel_tasks: 0,
    serial_tasks: 0,
    successful_tasks: 0,
    failed_tasks: 0,
    average_duration: 0,
    total_duration: 0,
    success_rate: 0,
    parallel_ratio: 0
  });

  const [executionHistory, setExecutionHistory] = useState<ExecutionRecord[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<AlertItem[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

// 获取统计信息的 TRPC 查询

const statsQuery = trpc.mpo.getStats.useQuery(undefined, {
  refetchInterval: 5000, // 每5秒刷新
});

// 获取历史记录的查询

const historyQuery = trpc.mpo.getHistory.useQuery({
  limit: 10,
  offset: 0,
}, {
  refetchInterval: 10000, // 每10秒刷新

});

  // 实时监控更新

  useEffect(() => {
    if (statsQuery.data) {
      setStats(statsQuery.data);
      
      // 更新图表数据

      const newChartData = [...chartData];
      if (newChartData.length >= 20) {
        newChartData.shift();
      }

      newChartData.push({
        timestamp: new Date().toISOString(),
        success_rate: statsQuery.data.success_rate * 100,
        average_duration: statsQuery.data.average_duration,
        parallel_tasks: statsQuery.data.parallel_tasks,
        serial_tasks: statsQuery.data.serial_tasks,
      });

      setChartData(newChartData);

      // 检查告警

      checkAlerts(statsQuery.data);
    }
  }, [statsQuery.data]);

  // 加载历史记录

  useEffect(() => {
    if (historyQuery.data) {
      setExecutionHistory(historyQuery.data.records);
    }
  }, [historyQuery.data]);

  const checkAlerts = (currentStats: MPOStats) => {
    const alerts: AlertItem[] = [];

    // 成功率告警

    if (currentStats.success_rate < 0.7) {
      alerts.push({
        id: `alert_success_${Date.now()}`,
        severity: currentStats.success_rate < 0.5 ? 'critical' : 'warning',
        message: `成功率偏低: ${(currentStats.success_rate * 100).toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      });
    }

    // 失败任务数告警

    if (currentStats.failed_tasks > 10) {
      alerts.push({
        id: `alert_failed_${Date.now()}`,
        severity: 'warning',
        message: `失败任务数较多: ${currentStats.failed_tasks} 个`,
        timestamp: new Date().toISOSTRING(),
        acknowledged: false
      });
    }

    // 平均耗时告警

    if (currentStats.average_duration > 60) {
      alerts.push({
        id: `alert_duration_${Date.now()}`,
        severity: 'warning',
        message: `平均耗时较长: ${currentStats.average_duration.toFixed(1)}s`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      });
    }

    if (alerts.length > 0) {
      setActiveAlerts(prev => [...alerts, ...prev.slice(0, 20)]);
    }
  };

  const getStatusBadge = (record: ExecutionRecord) => {
    const { completed, result } = record;

    if (!completed) return <Badge variant="outline">运行中</Badge>;

    const isSuccess = result?.status === 'approved' || result?.success === true;
    
    return isSuccess ? (
      <Badge className="bg-green-500">✅ 成功</Badge>
    ) : (
      <Badge variant="destructive">❌ 失败</Badge>
    );

  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '--';
    return duration < 1 ? '<1s' : `${duration.toFixed(1)}s`;
  };

  // 计算指标卡样式

  const getCardClass = (value: number, thresholds: { low: number; high: number }) => {
    if (value < thresholds.low) return 'border-red-500 bg-red-50/50';
    if (value > thresholds.high) return 'border-orange-500 bg-orange-50/50';
    return 'border-green-500 bg-green-50/50';
  };

  // 渲染状态指标卡片

  const renderStatCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* 成功率卡片 */}

      <Card className={cn(
        'border-2 transition-all',
        getCardClass(stats.success_rate * 100, { low: 50, high: 70 })
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">成功率</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(stats.success_rate * 100).toFixed(1)}%</div>
          <Progress value={stats.success_rate * 100} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            已完成任务: {stats.successful_tasks} / {stats.total_tasks}
          </p>
        </CardContent>
      </Card>

      {/* 平均耗时卡片 */}

      <Card className={cn(
        'border-2 transition-all',
        getCardClass(stats.average_duration, { low: 30, high: 60 })
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">平均耗时</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatDuration(stats.average_duration)}</div>
          <Progress 
            value={Math.min(stats.average_duration / 2, 100)} 
            className="mt-2"
            indicatorClassName="bg-blue-500"
          />
          <p className="text-xs text-muted-foreground mt-2">
            总耗时: {formatDuration(stats.total_duration)}
          </p>
        </CardContent>
      </Card>

      {/* 并行任务卡片 */}

      <Card className={cn(
        'border-2 transition-all',
        getCardClass(stats.parallel_ratio * 100, { low: 10, high: 30 })
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">并行率</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(stats.parallel_ratio * 100).toFixed(1)}%</div>
          <div className="flex items-center mt-2">
            <Badge variant="outline" className="mr-2">
              并行: {stats.parallel_tasks}
            </Badge>
            <Badge variant="outline">
              串行: {stats.serial_tasks}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            最佳并发数: {Math.min(stats.total_tasks, 10)}
          </p>
        </CardContent>
      </Card>

      {/* 失败任务卡片 */}

      <Card className={cn(
        'border-2 transition-all',
        getCardClass(stats.failed_tasks, { low: 5, high: 15 })
      )}>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">失败任务</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.failed_tasks}</div>
          <Progress 
            value={Math.min(stats.failed_tasks * 10, 100)}
            className="mt-2"
            indicatorClassName="bg-red-500"
          />
          <p className="text-xs text-muted-foreground mt-2">
            失败率: {((stats.failed_tasks / Math.max(stats.total_tasks, 1)) * 100).toFixed(1)}%
          </p>
        </CardContent>
      </Card>
    </div>
  );

  // 渲染历史记录表格

  const renderHistoryTable = () => (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          最近执行记录
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">任务</th>
                <th className="text-left p-2">执行时间</th>
                <th className="text-left p-2">模式</th>
                <th className="text-left p-2">耗时</th>
                <th className="text-left p-2">状态</th>
              </tr>
            </thead>
            <tbody>
              {executionHistory.map(record => (
                <tr key={record.id} className="border-b hover:bg-muted/50">
                  <td className="p-2 max-w-md truncate">{record.task}</td>
                  <td className="p-2">
                    {new Date(record.timestamp).toLocaleString()}
                  </td>
                  <td className="p-2">
                    <Badge variant="outline">
                      {record.mode || 'serial'}
                    </Badge>
                  </td>
                  <td className="p-2">
                    {formatDuration(record.duration)}
                  </td>
                  <td className="p-2">
                    {getStatusBadge(record)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  // 渲染趋势图表

  const renderTrendChart = () => (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="mr-2 h-5 w-5" />
          性能趋势图
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp"
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value, name) => {
                  if (name === "success_rate") return [value.toFixed(1) + '%', '成功率'];
                  if (name === "average_duration") return [value.toFixed(1) + 's', '平均耗时'];
                  return [value, name];
                }}
              />
              <Legend />
              <Line 
                type="monotone"
                dataKey="success_rate"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="成功率"
              />
              <Line 
                type="monotone"
                dataKey="average_duration"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="平均耗时"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  // 渲染告警面板

  const renderAlertsPanel = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
          当前告警 ({activeAlerts.filter(a => !a.acknowledged).length} 个)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {activeAlerts.filter(a => !a.acknowledged).map(alert => (
            <div 
              key={alert.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border',
                alert.severity === 'critical' 
                  ? 'border-red-500 bg-red-50' 
                  : alert.severity === 'warning'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-blue-500 bg-blue-50'
              )}
            >
              <div className="flex items-center">
                {alert.severity === 'critical' && <AlertCircle className="mr-2 h-4 w-4 text-red-500" />}
                {alert.severity === 'warning' && <AlertCircle className="mr-2 h-4 w-4 text-orange-500" />}
                <div>
                  <p className="font-medium">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleAcknowledgeAlert(alert.id)}
              >
                确认
              </Button>
            </div>
          ))}
          
          {activeAlerts.filter(a => !a.acknowledged).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 opacity-50" />
              <p className="mt-2">一切正常，无活跃告警</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const handleAcknowledgeAlert = (alertId: string) => {
    setActiveAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? {...alert, acknowledged: true} : alert
      )
    );
  };

  // 加载状态

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">加载 MPO 监控数据...</p>
        </div>
    </div>
    );

  }

  return (
    <div className="container mx-auto p-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">MaoAI-MPO 监控仪表板</h1>
        <p className="text-muted-foreground mt-2">
          实时监控并行执行系统状态与性能指标
        </p>
      </header>
      
      {renderStatCards()}
      {renderTrendChart()}
      {renderHistoryTable()}
      {renderAlertsPanel()}
    </div>
  );
};

export default MPODashboard;