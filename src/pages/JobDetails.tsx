import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ArrowLeft,
  Image,
  Terminal,
  X,
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  Badge,
  Alert,
  AuthenticatedImage,
} from '../components/ui';
import { jobsApi, screenshotsApi } from '../lib/api';
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

export const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsApi.get(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === 'pending' || data?.status === 'running' ? 2000 : false;
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  if (error || !job) {
    return (
      <Layout>
        <div className="p-6 lg:p-8">
          <Alert variant="error">
            Job not found or failed to load.
          </Alert>
          <Link to="/jobs" className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Link>
        </div>
      </Layout>
    );
  }

  const statusInfo = statusConfig[job.status];
  const StatusIcon = statusInfo.icon;

  return (
    <Layout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/jobs"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {jobTypeLabels[job.type]}
              </h1>
              <p className="text-gray-500 text-sm font-mono">{job.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <StatusIcon
              className={`w-5 h-5 ${statusInfo.color} ${job.status === 'running' ? 'animate-spin' : ''}`}
            />
            <Badge variant={statusInfo.variant} className="text-sm">
              {job.status}
            </Badge>
          </div>
        </div>

        {/* Job Info */}
        <Card>
          <CardHeader>
            <CardTitle>Job Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="text-sm font-medium text-gray-900">{jobTypeLabels[job.type]}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="text-sm font-medium text-gray-900">
                  {format(new Date(job.created_at), 'MMM d, yyyy HH:mm:ss')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Started</p>
                <p className="text-sm font-medium text-gray-900">
                  {job.started_at
                    ? format(new Date(job.started_at), 'MMM d, yyyy HH:mm:ss')
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-sm font-medium text-gray-900">
                  {job.completed_at
                    ? format(new Date(job.completed_at), 'MMM d, yyyy HH:mm:ss')
                    : '-'}
                </p>
              </div>
            </div>

            {job.error && (
              <Alert variant="error" className="mt-6">
                <p className="font-medium">Error:</p>
                <p className="mt-1">{job.error}</p>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Logs */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-gray-500" />
              <CardTitle>Logs</CardTitle>
            </div>
            <CardDescription>
              {job.logs?.length || 0} log entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!job.logs?.length ? (
              <p className="text-gray-500 text-center py-4">No logs available</p>
            ) : (
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap">
                  {job.logs.map((log, index) => (
                    <div key={index} className="hover:bg-gray-800 px-2 py-0.5 rounded">
                      {log}
                    </div>
                  ))}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Screenshots */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Image className="w-5 h-5 text-gray-500" />
              <CardTitle>Screenshots</CardTitle>
            </div>
            <CardDescription>
              {job.screenshots?.length || 0} screenshots captured
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!job.screenshots?.length ? (
              <p className="text-gray-500 text-center py-4">No screenshots available</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {job.screenshots.map((screenshot) => (
                  <button
                    key={screenshot.id}
                    onClick={() => setSelectedScreenshot(screenshotsApi.getUrl(job.id, screenshot.filename))}
                    className="group relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors"
                  >
                    <AuthenticatedImage
                      src={screenshotsApi.getUrl(job.id, screenshot.filename)}
                      alt={screenshot.filename}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                        View
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 truncate">
                      {screenshot.filename}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Screenshot Modal */}
        {selectedScreenshot && (
          <div
            className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
            onClick={() => setSelectedScreenshot(null)}
          >
            <button
              onClick={() => setSelectedScreenshot(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <AuthenticatedImage
              src={selectedScreenshot}
              alt="Screenshot"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </Layout>
  );
};
