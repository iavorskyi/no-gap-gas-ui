import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, RefreshCw, Info } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Alert,
} from '../components/ui';
import { configApi, getErrorMessage } from '../lib/api';
import type { MonthlyIncrements } from '../types/api';

const configSchema = z.object({
  gasolina_email: z.string().email('Невірна адреса електронної пошти').or(z.literal('')),
  gasolina_password: z.string().optional(),
  account_number: z.string().optional(),
  check_url: z.string().url('Невірна URL-адреса').or(z.literal('')),
  cron_schedule: z.string().min(1, 'Розклад cron є обов\'язковим'),
  dry_run: z.boolean(),
});

type ConfigForm = z.infer<typeof configSchema>;

const monthNames = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
];

export const Configuration: React.FC = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [monthlyIncrements, setMonthlyIncrements] = useState<MonthlyIncrements>({});

  const { data: config, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: configApi.get,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ConfigForm>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      gasolina_email: '',
      gasolina_password: '',
      account_number: '',
      check_url: 'https://gasolina-online.com/indicator',
      cron_schedule: '0 0 1 * *',
      dry_run: true,
    },
  });

  useEffect(() => {
    if (config) {
      reset({
        gasolina_email: config.gasolina_email || '',
        gasolina_password: '',
        account_number: config.account_number || '',
        check_url: config.check_url || 'https://gasolina-online.com/indicator',
        cron_schedule: config.cron_schedule || '0 0 1 * *',
        dry_run: config.dry_run ?? true,
      });
      setMonthlyIncrements(config.monthly_increments || {});
    }
  }, [config, reset]);

  const updateMutation = useMutation({
    mutationFn: configApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
      queryClient.invalidateQueries({ queryKey: ['status'] });
      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err) => {
      setError(getErrorMessage(err));
      setSuccess(false);
    },
  });

  const onSubmit = (data: ConfigForm) => {
    const updateData: Record<string, unknown> = {
      gasolina_email: data.gasolina_email || undefined,
      account_number: data.account_number || undefined,
      check_url: data.check_url || undefined,
      cron_schedule: data.cron_schedule,
      dry_run: data.dry_run,
      monthly_increments: monthlyIncrements,
    };

    if (data.gasolina_password) {
      updateData.gasolina_password = data.gasolina_password;
    }

    updateMutation.mutate(updateData);
  };

  const handleIncrementChange = (month: number, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setMonthlyIncrements((prev) => ({
        ...prev,
        [month]: numValue,
      }));
    } else if (value === '') {
      setMonthlyIncrements((prev) => {
        const newIncrements = { ...prev };
        delete newIncrements[month.toString()];
        return newIncrements;
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Налаштування</h1>
          <p className="text-gray-600 mt-1">Керуйте налаштуваннями постачальника газу</p>
        </div>

        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success">
            Налаштування успішно збережено!
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Gasolina Credentials */}
          <Card>
            <CardHeader>
              <CardTitle>Облікові дані Gasolina</CardTitle>
              <CardDescription>
                Ваші облікові дані для входу на сайт Gasolina
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Email Gasolina"
                  type="email"
                  placeholder="ваш@email.com"
                  error={errors.gasolina_email?.message}
                  {...register('gasolina_email')}
                />
                <Input
                  label="Пароль Gasolina"
                  type="password"
                  placeholder="••••••••"
                  helperText="Залиште порожнім, щоб зберегти існуючий пароль"
                  error={errors.gasolina_password?.message}
                  {...register('gasolina_password')}
                />
              </div>
              <Input
                label="Номер рахунку"
                placeholder="12345678"
                error={errors.account_number?.message}
                {...register('account_number')}
              />
            </CardContent>
          </Card>

          {/* Automation Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Налаштування автоматизації</CardTitle>
              <CardDescription>
                Налаштуйте параметри автоматизації
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="URL перевірки"
                type="url"
                placeholder="https://gasolina-online.com/indicator"
                error={errors.check_url?.message}
                {...register('check_url')}
              />

              <Input
                label="Розклад Cron"
                placeholder="0 0 1 * *"
                helperText="Формат: хвилина година день місяць день-тижня (напр., '0 0 1 * *' = 1-е число місяця опівночі)"
                error={errors.cron_schedule?.message}
                {...register('cron_schedule')}
              />

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="dry_run"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  {...register('dry_run')}
                />
                <label htmlFor="dry_run" className="text-sm font-medium text-gray-700">
                  Тестовий режим
                </label>
              </div>
              <p className="text-sm text-gray-500 flex items-start space-x-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Коли увімкнено, автоматизація виконає всі кроки, але не буде фактично надсилати форми.
                  Рекомендується для тестування вашої конфігурації.
                </span>
              </p>
            </CardContent>
          </Card>

          {/* Monthly Increments */}
          <Card>
            <CardHeader>
              <CardTitle>Місячні приріости</CardTitle>
              <CardDescription>
                Встановіть значення приросту для кожного місяця (скільки додавати до поточного показника)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {monthNames.map((month, index) => (
                  <div key={index + 1}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {month}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={monthlyIncrements[(index + 1).toString()] ?? ''}
                      onChange={(e) => handleIncrementChange(index + 1, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                if (config) {
                  setMonthlyIncrements(config.monthly_increments || {});
                }
              }}
              disabled={!isDirty && Object.keys(monthlyIncrements).length === Object.keys(config?.monthly_increments || {}).length}
            >
              Скинути
            </Button>
            <Button type="submit" isLoading={updateMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              Зберегти налаштування
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
