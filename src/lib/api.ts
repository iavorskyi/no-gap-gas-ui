import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RefreshRequest,
  RefreshResponse,
  ChangePasswordRequest,
  UserConfig,
  UpdateConfigRequest,
  Job,
  JobsResponse,
  CreateJobRequest,
  Screenshot,
  ServiceStatus,
  ApiError,
  GasolinaUserInfo,
} from '../types/api';

const API_BASE = '/api';

// Token storage
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest.url?.includes('/auth/')) {
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const response = await authApi.refresh({ refresh_token: refreshToken });
          const { access_token } = response;
          localStorage.setItem(TOKEN_KEY, access_token);
          isRefreshing = false;
          onTokenRefreshed(access_token);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch {
          isRefreshing = false;
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }

      return new Promise((resolve) => {
        subscribeTokenRefresh((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post<User>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  refresh: async (data: RefreshRequest): Promise<RefreshResponse> => {
    const response = await axios.post<RefreshResponse>(`${API_BASE}/auth/refresh`, data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = getRefreshToken();
    await api.post('/auth/logout', { refresh_token: refreshToken });
    clearTokens();
  },
};

// User API
export const userApi = {
  me: async (): Promise<User> => {
    const response = await api.get<User>('/me');
    return response.data;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.put('/me/password', data);
  },
};

// Config API
export const configApi = {
  get: async (): Promise<UserConfig> => {
    const response = await api.get<UserConfig>('/config');
    return response.data;
  },

  update: async (data: UpdateConfigRequest): Promise<void> => {
    await api.put('/config', data);
  },
};

// Jobs API
export const jobsApi = {
  list: async (params?: { limit?: number; status?: string }): Promise<JobsResponse> => {
    const response = await api.get<JobsResponse>('/jobs', { params });
    return response.data;
  },

  get: async (id: string): Promise<Job> => {
    const response = await api.get<Job>(`/jobs/${id}`);
    return response.data;
  },

  create: async (data: CreateJobRequest): Promise<Job> => {
    const response = await api.post<Job>('/jobs', data);
    return response.data;
  },
};

// Screenshots API
export const screenshotsApi = {
  list: async (jobId: string): Promise<Screenshot[]> => {
    const response = await api.get<Screenshot[]>(`/screenshots/${jobId}`);
    return response.data;
  },

  getUrl: (jobId: string, filename: string): string => {
    return `/screenshots/${jobId}/${filename}`;
  },
};

// Status API
export const statusApi = {
  get: async (): Promise<ServiceStatus> => {
    const response = await api.get<ServiceStatus>('/status');
    return response.data;
  },
};

// Gasolina Info API (scrapes data from gasolina-online.com)
export const gasolinaInfoApi = {
  get: async (): Promise<GasolinaUserInfo> => {
    const response = await api.get<GasolinaUserInfo>('/gasolina-info');
    return response.data;
  },
};

// Health API (public)
export const healthApi = {
  check: async (): Promise<{ status: string }> => {
    const response = await axios.get('/health');
    return response.data;
  },
};

// Helper to extract error message
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    return axiosError.response?.data?.error || axiosError.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Виникла неочікувана помилка';
};

export default api;
