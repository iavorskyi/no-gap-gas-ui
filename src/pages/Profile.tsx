import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { User, Lock, Calendar, Mail } from 'lucide-react';
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
import { useAuth } from '../contexts/AuthContext';
import { userApi, getErrorMessage } from '../lib/api';

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Поточний пароль є обов\'язковим'),
    new_password: z.string().min(6, 'Новий пароль має містити щонайменше 6 символів'),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Паролі не співпадають',
    path: ['confirm_password'],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const changePasswordMutation = useMutation({
    mutationFn: userApi.changePassword,
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      reset();
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err) => {
      setError(getErrorMessage(err));
      setSuccess(false);
    },
  });

  const onSubmit = (data: PasswordForm) => {
    changePasswordMutation.mutate({
      current_password: data.current_password,
      new_password: data.new_password,
    });
  };

  return (
    <Layout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Профіль</h1>
          <p className="text-gray-600 mt-1">Керуйте налаштуваннями облікового запису</p>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Інформація про обліковий запис</CardTitle>
            <CardDescription>Ваші основні дані облікового запису</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium">Електронна пошта</span>
                </div>
                <p className="text-lg font-medium text-gray-900">{user?.email}</p>
                {user?.created_at && (
                  <div className="flex items-center space-x-2 text-gray-500 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Учасник з {format(new Date(user.created_at), 'd MMMM yyyy', { locale: uk })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-gray-500" />
              <CardTitle>Змінити пароль</CardTitle>
            </div>
            <CardDescription>
              Оновіть пароль для захисту облікового запису
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="error" className="mb-6">
                {error}
              </Alert>
            )}

            {success && (
              <Alert variant="success" className="mb-6">
                Пароль успішно змінено!
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
              <Input
                label="Поточний пароль"
                type="password"
                placeholder="••••••••"
                error={errors.current_password?.message}
                {...register('current_password')}
              />

              <Input
                label="Новий пароль"
                type="password"
                placeholder="••••••••"
                error={errors.new_password?.message}
                {...register('new_password')}
              />

              <Input
                label="Підтвердження нового пароля"
                type="password"
                placeholder="••••••••"
                error={errors.confirm_password?.message}
                {...register('confirm_password')}
              />

              <Button type="submit" isLoading={changePasswordMutation.isPending}>
                Оновити пароль
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Security Info */}
        <Card>
          <CardHeader>
            <CardTitle>Поради з безпеки</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Використовуйте надійний унікальний пароль з щонайменше 6 символів</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Включіть комбінацію літер, цифр та спеціальних символів</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Не використовуйте паролі з інших облікових записів</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Ваші облікові дані Gasolina зашифровані та надійно зберігаються</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
