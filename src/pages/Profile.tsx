import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
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
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(6, 'New password must be at least 6 characters'),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
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
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account settings</p>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your basic account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium">Email</span>
                </div>
                <p className="text-lg font-medium text-gray-900">{user?.email}</p>
                {user?.created_at && (
                  <div className="flex items-center space-x-2 text-gray-500 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Member since {format(new Date(user.created_at), 'MMMM d, yyyy')}
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
              <CardTitle>Change Password</CardTitle>
            </div>
            <CardDescription>
              Update your password to keep your account secure
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
                Password changed successfully!
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                error={errors.current_password?.message}
                {...register('current_password')}
              />

              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                error={errors.new_password?.message}
                {...register('new_password')}
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                error={errors.confirm_password?.message}
                {...register('confirm_password')}
              />

              <Button type="submit" isLoading={changePasswordMutation.isPending}>
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Security Info */}
        <Card>
          <CardHeader>
            <CardTitle>Security Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Use a strong, unique password with at least 6 characters</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Include a mix of letters, numbers, and special characters</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Don't reuse passwords from other accounts</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Your Gasolina credentials are encrypted and stored securely</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
