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
  gasolina_email: z.string().email('Invalid email address').or(z.literal('')),
  gasolina_password: z.string().optional(),
  account_number: z.string().optional(),
  check_url: z.string().url('Invalid URL').or(z.literal('')),
  cron_schedule: z.string().min(1, 'Cron schedule is required'),
  dry_run: z.boolean(),
});

type ConfigForm = z.infer<typeof configSchema>;

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
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
          <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
          <p className="text-gray-600 mt-1">Manage your gas provider settings</p>
        </div>

        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success">
            Configuration saved successfully!
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Gasolina Credentials */}
          <Card>
            <CardHeader>
              <CardTitle>Gasolina Credentials</CardTitle>
              <CardDescription>
                Your login credentials for the Gasolina website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Gasolina Email"
                  type="email"
                  placeholder="your@email.com"
                  error={errors.gasolina_email?.message}
                  {...register('gasolina_email')}
                />
                <Input
                  label="Gasolina Password"
                  type="password"
                  placeholder="••••••••"
                  helperText="Leave empty to keep existing password"
                  error={errors.gasolina_password?.message}
                  {...register('gasolina_password')}
                />
              </div>
              <Input
                label="Account Number"
                placeholder="12345678"
                error={errors.account_number?.message}
                {...register('account_number')}
              />
            </CardContent>
          </Card>

          {/* Automation Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Automation Settings</CardTitle>
              <CardDescription>
                Configure how the automation runs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Check URL"
                type="url"
                placeholder="https://gasolina-online.com/indicator"
                error={errors.check_url?.message}
                {...register('check_url')}
              />

              <Input
                label="Cron Schedule"
                placeholder="0 0 1 * *"
                helperText="Format: minute hour day month day-of-week (e.g., '0 0 1 * *' = 1st day of month at midnight)"
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
                  Dry Run Mode
                </label>
              </div>
              <p className="text-sm text-gray-500 flex items-start space-x-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  When enabled, the automation will perform all steps but won't actually submit any forms.
                  Recommended for testing your configuration.
                </span>
              </p>
            </CardContent>
          </Card>

          {/* Monthly Increments */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Increments</CardTitle>
              <CardDescription>
                Set the increment value for each month (how much to add to the current reading)
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
              Reset
            </Button>
            <Button type="submit" isLoading={updateMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
