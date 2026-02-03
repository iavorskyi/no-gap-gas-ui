import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
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
  full: 'Full Automation',
  'test-login': 'Test Login',
  'test-check': 'Test Check',
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
            <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
            <p className="text-gray-600 mt-1">Manage your automation jobs</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Create Job Card */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Job</CardTitle>
            <CardDescription>Run a new automation task</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="error" className="mb-4">
                {error}
              </Alert>
            )}

            {!status?.configured && (
              <Alert variant="warning" className="mb-4">
                <p>Configure your Gasolina credentials before running jobs.</p>
                <Link
                  to="/config"
                  className="inline-flex items-center mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900"
                >
                  Go to Configuration
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type
                </label>
                <select
                  value={selectedJobType}
                  onChange={(e) => setSelectedJobType(e.target.value as JobType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!status?.configured}
                >
                  <option value="full">Full Automation - Complete login, check, and update</option>
                  <option value="test-login">Test Login - Test credentials only</option>
                  <option value="test-check">Test Check - Test login and page checking</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleCreateJob}
                  isLoading={createJobMutation.isPending}
                  disabled={!status?.configured}
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Run Job
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
                <CardTitle>Job History</CardTitle>
                <CardDescription>
                  {jobs?.total || 0} total jobs
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="running">Running</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
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
                <p className="text-gray-500">No jobs found</p>
                <p className="text-sm text-gray-400 mt-1">
                  {statusFilter ? 'Try clearing the filter' : 'Create your first job above'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Created</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Completed</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
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
                              {format(new Date(job.created_at), 'MMM d, HH:mm')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-500">
                              {job.completed_at
                                ? format(new Date(job.completed_at), 'MMM d, HH:mm')
                                : '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Link
                              to={`/jobs/${job.id}`}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              View Details
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
