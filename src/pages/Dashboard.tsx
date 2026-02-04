import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import {
  CheckCircle,
  XCircle,
  Clock,
  PlayCircle,
  Settings,
  AlertTriangle,
  ArrowRight,
  Loader2,
  User,
  Gauge,
  Banknote,
  RefreshCw,
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, Badge, Button, Alert } from '../components/ui';
import { statusApi, configApi, gasolinaInfoApi } from '../lib/api';
import type { JobStatus } from '../types/api';

const statusConfig: Record<JobStatus, { icon: React.ElementType; color: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info'; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-500', variant: 'warning', label: 'Очікує' },
  running: { icon: Loader2, color: 'text-blue-500', variant: 'info', label: 'Виконується' },
  completed: { icon: CheckCircle, color: 'text-green-500', variant: 'success', label: 'Завершено' },
  failed: { icon: XCircle, color: 'text-red-500', variant: 'error', label: 'Помилка' },
};

const jobTypeLabels: Record<string, string> = {
  'full': 'Повне завдання',
  'test-login': 'Тест входу',
  'test-check': 'Тест перевірки',
};

export const Dashboard: React.FC = () => {
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['status'],
    queryFn: statusApi.get,
    refetchInterval: 5000,
  });

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['config'],
    queryFn: configApi.get,
  });

  const { data: gasolinaInfo, isLoading: gasolinaInfoLoading, refetch: refetchGasolinaInfo, isFetching: gasolinaInfoFetching } = useQuery({
    queryKey: ['gasolinaInfo'],
    queryFn: gasolinaInfoApi.get,
    enabled: !!status?.configured,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const isLoading = statusLoading || configLoading;

  return (
    <Layout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Головна</h1>
            <p className="text-gray-600 mt-1">Моніторинг споживання газу</p>
          </div>
          <Link to="/jobs">
            <Button>
              <PlayCircle className="w-4 h-4 mr-2" />
              Запустити
            </Button>
          </Link>
        </div>

        {/* Configuration Alert */}
        {!configLoading && !status?.configured && (
          <Alert variant="warning" title="Потрібна конфігурація">
            <p>Вам потрібно налаштувати облікові дані Gasolina перед запуском завдань.</p>
            <Link
              to="/config"
              className="inline-flex items-center mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900"
            >
              Перейти до налаштувань
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Alert>
        )}

        {/* Gasolina Account Info */}
        {status?.configured && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-blue-100">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Обліковий запис Gasolina</CardTitle>
                    <CardDescription>
                      {gasolinaInfo?.fetched_at ? `Оновлено: ${gasolinaInfo.fetched_at}` : 'Дані з gasolina-online.com'}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchGasolinaInfo()}
                  disabled={gasolinaInfoFetching}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${gasolinaInfoFetching ? 'animate-spin' : ''}`} />
                  Оновити
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {gasolinaInfoLoading || gasolinaInfoFetching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-500">Завантаження даних з Gasolina...</span>
                </div>
              ) : gasolinaInfo ? (
                <div className="space-y-6">
                  {/* User Info */}
                  <div className="flex items-start space-x-4 pb-4 border-b border-gray-100">
                    <div className="p-3 rounded-full bg-gray-100">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{gasolinaInfo.user_name}</p>
                      <p className="text-sm text-gray-500">{gasolinaInfo.user_address}</p>
                    </div>
                  </div>

                  {/* Counter Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <Gauge className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="text-xs text-gray-500">№ лічильника</p>
                        <p className="text-lg font-bold text-gray-900">{gasolinaInfo.counter_number}</p>
                        <p className="text-xs text-gray-400">{gasolinaInfo.counter_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl">📊</div>
                      <div>
                        <p className="text-xs text-gray-500">Попередній показник</p>
                        <p className="text-2xl font-bold text-blue-600">{gasolinaInfo.previous_reading}</p>
                        <p className="text-xs text-gray-400">м³</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                      <Banknote className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="text-xs text-gray-500">Ціна за газ</p>
                        <p className="text-lg font-bold text-green-600">{gasolinaInfo.gas_distribution_price} грн</p>
                        <p className="text-xs text-gray-400">за м³</p>
                      </div>
                    </div>
                  </div>

                  {/* Debts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-800">Борг за розподіл газу</p>
                          <p className="text-xs text-orange-600">станом на {gasolinaInfo.gas_distribution_date}</p>
                        </div>
                        <p className="text-xl font-bold text-orange-700">{gasolinaInfo.gas_distribution_debt}</p>
                      </div>
                    </div>
                    <div className="p-4 border border-purple-200 bg-purple-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-800">Борг за тех. обслуговування</p>
                          <p className="text-xs text-purple-600">станом на {gasolinaInfo.tech_service_date}</p>
                        </div>
                        <p className="text-xl font-bold text-purple-700">{gasolinaInfo.tech_service_debt}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Не вдалося завантажити дані Gasolina</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => refetchGasolinaInfo()}>
                    Спробувати знову
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="flex items-center space-x-4 py-6">
              <div className={`p-3 rounded-full ${status?.configured ? 'bg-green-100' : 'bg-yellow-100'}`}>
                {status?.configured ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Статус конфігурації</p>
                <p className="text-lg font-semibold text-gray-900">
                  {isLoading ? 'Завантаження...' : status?.configured ? 'Налаштовано' : 'Не налаштовано'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center space-x-4 py-6">
              <div className="p-3 rounded-full bg-blue-100">
                <PlayCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Подання показників</p>
                <p className="text-lg font-semibold text-gray-900">
                  {isLoading ? 'Завантаження...' : status?.recent_jobs?.length || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center space-x-4 py-6">
              <div className="p-3 rounded-full bg-purple-100">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Тестовий режим</p>
                <p className="text-lg font-semibold text-gray-900">
                  {isLoading ? 'Завантаження...' : config?.dry_run ? 'Увімкнено' : 'Вимкнено'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Останні завдання</CardTitle>
                <CardDescription>Ваші останні подання показників лічильника</CardDescription>
              </div>
              <Link to="/jobs">
                <Button variant="outline" size="sm">
                  Переглянути всі
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : !status?.recent_jobs?.length ? (
              <div className="text-center py-8">
                <PlayCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Завдань ще немає</p>
                <p className="text-sm text-gray-400 mt-1">Запустіть перше завдання, щоб побачити результати</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {status.recent_jobs.map((job) => {
                  const statusInfo = statusConfig[job.status];
                  const StatusIcon = statusInfo.icon;

                  return (
                    <Link
                      key={job.id}
                      to={`/jobs/${job.id}`}
                      className="flex items-center justify-between py-4 hover:bg-gray-50 -mx-6 px-6 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <StatusIcon
                          className={`w-5 h-5 ${statusInfo.color} ${job.status === 'running' ? 'animate-spin' : ''}`}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {jobTypeLabels[job.type] || job.type}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(job.created_at), 'd MMM yyyy, HH:mm', { locale: uk })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration Summary */}
        {config && status?.configured && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Налаштування</CardTitle>
                  <CardDescription>Ваші поточні налаштування Gasolina</CardDescription>
                </div>
                <Link to="/config">
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Редагувати
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Email Gasolina</p>
                  <p className="text-sm font-medium text-gray-900">{config.gasolina_email || 'Не вказано'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Номер рахунку</p>
                  <p className="text-sm font-medium text-gray-900">{config.account_number || 'Не вказано'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Розклад (Cron)</p>
                  <p className="text-sm font-medium text-gray-900 font-mono">{config.cron_schedule}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">URL перевірки</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{config.check_url}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};
