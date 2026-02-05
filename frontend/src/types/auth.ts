export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt?: string;
}
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}
export interface ResetPasswordData {
  email: string;
}
export interface NewPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}