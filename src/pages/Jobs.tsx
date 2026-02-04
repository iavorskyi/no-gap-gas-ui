import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import {
  CheckCircle,
  XCircle,
  Clock,
  PlayCircle,
  Loader2,
  ArrowRight,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  Badge,
  Button,
  Alert,
} from '../components/ui';
import { jobsApi, statusApi, getErrorMessage } from '../lib/api';
import type { JobStatus, JobType } from '../types/api';

const statusConfig: Record<JobStatus, { icon: React.ElementType; color: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  pending: { icon: Clock, color: 'text-yellow-500', variant: 'warning' },
  running: { icon: Loader2, color: 'text-blue-500', variant: 'info' },
  completed: { icon: CheckCircle, color: 'text-green-500', variant: 'success' },
  failed: { icon: XCircle, color: 'text-red-500', variant: 'error' },
};

const jobTypeLabels: Record<JobType, string> = {
  full: 'Повна автоматизація',
  'test-login': 'Тест входу',
  'test-check': 'Тест перевірки',
};

export const Jobs: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [selectedJobType, setSelectedJobType] = useState<JobType>('full');

  const { data: status } = useQuery({
    queryKey: ['status'],
    queryFn: statusApi.get,
  });

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['jobs', statusFilter],
    queryFn: () => jobsApi.list({ limit: 50, status: statusFilter || undefined }),
    refetchInterval: 5000,
  });

  const createJobMutation = useMutation({
    mutationFn: (type: JobType) => jobsApi.create({ type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['status'] });
      setError(null);
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const handleCreateJob = () => {
    createJobMutation.mutate(selectedJobType);
  };

  return (
    <Layout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Завдання</h1>
            <p className="text-gray-600 mt-1">Відстежуйте подання показників лічильника газу</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Оновити
            </Button>
          </div>
        </div>

        {/* Create Job Card */}
        <Card>
          <CardHeader>
            <CardTitle>Створити нове завдання</CardTitle>
            <CardDescription>Запустити нове завдання автоматизації</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="error" className="mb-4">
                {error}
              </Alert>
            )}

            {!status?.configured && (
              <Alert variant="warning" className="mb-4">
                <p>Налаштуйте облікові дані Gasolina перед запуском завдань.</p>
                <Link
                  to="/config"
                  className="inline-flex items-center mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900"
                >
                  Перейти до налаштувань
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип завдання
                </label>
                <select
                  value={selectedJobType}
                  onChange={(e) => setSelectedJobType(e.target.value as JobType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!status?.configured}
                >
                  <option value="full">Повна автоматизація - Вхід, перевірка та оновлення</option>
                  <option value="test-login">Тест входу - Тільки перевірка облікових даних</option>
                  <option value="test-check">Тест перевірки - Вхід та перевірка сторінки</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleCreateJob}
                  isLoading={createJobMutation.isPending}
                  disabled={!status?.configured}
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Запустити
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Історія завдань</CardTitle>
                <CardDescription>
                  Всього завдань: {jobs?.total || 0}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Всі статуси</option>
                  <option value="pending">Очікує</option>
                  <option value="running">Виконується</option>
                  <option value="completed">Завершено</option>
                  <option value="failed">Помилка</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : !jobs?.jobs?.length ? (
              <div className="text-center py-8">
                <PlayCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Завдань не знайдено</p>
                <p className="text-sm text-gray-400 mt-1">
                  {statusFilter ? 'Спробуйте очистити фільтр' : 'Створіть своє перше завдання вище'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Статус</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Тип</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Створено</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Завершено</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Дії</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {jobs.jobs.map((job) => {
                      const statusInfo = statusConfig[job.status];
                      const StatusIcon = statusInfo.icon;

                      return (
                        <tr key={job.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <StatusIcon
                                className={`w-4 h-4 ${statusInfo.color} ${job.status === 'running' ? 'animate-spin' : ''}`}
                              />
                              <Badge variant={statusInfo.variant}>{job.status}</Badge>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-900">
                              {jobTypeLabels[job.type]}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-500">
                              {format(new Date(job.created_at), 'd MMM, HH:mm', { locale: uk })}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-500">
                              {job.completed_at
                                ? format(new Date(job.completed_at), 'd MMM, HH:mm', { locale: uk })
                                : '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Link
                              to={`/jobs/${job.id}`}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Деталі
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
