import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  CheckCircle,
  XCircle,
  Clock,
  PlayCircle,
  Settings,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, Badge, Button, Alert } from '../components/ui';
import { statusApi, configApi } from '../lib/api';
import type { JobStatus } from '../types/api';

const statusConfig: Record<JobStatus, { icon: React.ElementType; color: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  pending: { icon: Clock, color: 'text-yellow-500', variant: 'warning' },
  running: { icon: Loader2, color: 'text-blue-500', variant: 'info' },
  completed: { icon: CheckCircle, color: 'text-green-500', variant: 'success' },
  failed: { icon: XCircle, color: 'text-red-500', variant: 'error' },
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

  const isLoading = statusLoading || configLoading;

  return (
    <Layout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Monitor your natural gas consumption</p>
          </div>
          <Link to="/jobs">
            <Button>
              <PlayCircle className="w-4 h-4 mr-2" />
              Run Job
            </Button>
          </Link>
        </div>

        {/* Configuration Alert */}
        {!configLoading && !status?.configured && (
          <Alert variant="warning" title="Configuration Required">
            <p>You need to configure your Gasolina credentials before running jobs.</p>
            <Link
              to="/config"
              className="inline-flex items-center mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900"
            >
              Go to Configuration
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Alert>
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
                <p className="text-sm text-gray-500">Configuration Status</p>
                <p className="text-lg font-semibold text-gray-900">
                  {isLoading ? 'Loading...' : status?.configured ? 'Configured' : 'Not Configured'}
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
                <p className="text-sm text-gray-500">Meter Submissions</p>
                <p className="text-lg font-semibold text-gray-900">
                  {isLoading ? 'Loading...' : status?.recent_jobs?.length || 0}
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
                <p className="text-sm text-gray-500">Dry Run Mode</p>
                <p className="text-lg font-semibold text-gray-900">
                  {isLoading ? 'Loading...' : config?.dry_run ? 'Enabled' : 'Disabled'}
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
                <CardTitle>Recent Jobs</CardTitle>
                <CardDescription>Your latest meter reading submissions</CardDescription>
              </div>
              <Link to="/jobs">
                <Button variant="outline" size="sm">
                  View All
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
                <p className="text-gray-500">No jobs yet</p>
                <p className="text-sm text-gray-400 mt-1">Run your first job to see results here</p>
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
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {job.type.replace('-', ' ')} Job
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(job.created_at), 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={statusInfo.variant}>{job.status}</Badge>
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
                  <CardTitle>Configuration Summary</CardTitle>
                  <CardDescription>Your current Gasolina settings</CardDescription>
                </div>
                <Link to="/config">
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Gasolina Email</p>
                  <p className="text-sm font-medium text-gray-900">{config.gasolina_email || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Account Number</p>
                  <p className="text-sm font-medium text-gray-900">{config.account_number || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cron Schedule</p>
                  <p className="text-sm font-medium text-gray-900 font-mono">{config.cron_schedule}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Check URL</p>
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
