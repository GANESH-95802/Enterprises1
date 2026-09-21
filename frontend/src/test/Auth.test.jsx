
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import Login from '../pages/Login';
import Register from '../pages/Register';

// Mock the authService
vi.mock('../services/authService', () => ({
  default: {
    login: vi.fn().mockResolvedValue({
      _id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      token: 'mock-token',
      refreshToken: 'mock-refresh',
    }),
    register: vi.fn().mockResolvedValue({
      _id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      token: 'mock-token',
      refreshToken: 'mock-refresh',
    }),
    logout: vi.fn().mockResolvedValue({}),
    getProfile: vi.fn().mockResolvedValue({ _id: '1', name: 'Test User' }),
    updateProfile: vi.fn(),
  },
}));

vi.mock('../services/apiClient', () => ({
  default: { interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
  tokenStorage: {
    getAccess: () => 'mock-token',
    getRefresh: () => 'mock-refresh',
    getUser: () => JSON.parse(localStorage.getItem('ai_hub_user')),
    setTokens: vi.fn(),
    setUser: vi.fn(),
    setSession: (data) => {
      localStorage.setItem('ai_hub_token', data.token);
      localStorage.setItem('ai_hub_refresh', data.refreshToken);
      localStorage.setItem('ai_hub_user', JSON.stringify(data));
    },
    clear: () => {
      localStorage.clear();
    },
  },
}));

function TestHarness() {
  const { user, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="user-state">{user ? `Logged in as ${user.name}` : 'Not logged in'}</div>
      <button onClick={() => login('test@example.com', 'password123')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('Authentication', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render login form with validation', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty form', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    );
    await user.click(screen.getByRole('button', { name: /Sign In/i }));
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    );
    await user.type(screen.getByLabelText('Email'), 'invalid-email');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /Sign In/i }));
    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });

  it('should render register form', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Full name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
  });

  it('should validate matching passwords on register', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </MemoryRouter>
    );
    await user.type(screen.getByLabelText('Full name'), 'Test User');
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'Password123');
    await user.type(screen.getByLabelText('Confirm password'), 'Different123');
    await user.click(screen.getByText(/Register/i));
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('should handle login and logout state', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestHarness />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByTestId('user-state')).toHaveTextContent('Not logged in');
    await user.click(screen.getByText('Login'));
    await waitFor(() => {
      expect(screen.getByTestId('user-state')).toHaveTextContent('Logged in as Test User');
    });
    await user.click(screen.getByText('Logout'));
    await waitFor(() => {
      expect(screen.getByTestId('user-state')).toHaveTextContent('Not logged in');
    });
  });
});