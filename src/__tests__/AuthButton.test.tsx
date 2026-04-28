import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuthButton from '@/components/AuthButton';

// Mock @clerk/nextjs
vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(),
  SignInButton: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sign-in-button">{children}</div>
  ),
  UserButton: ({ appearance }: { appearance?: unknown }) => (
    <div data-testid="user-button" />
  ),
}));

// Mock i18n
vi.mock('@/i18n', () => ({
  useT: () => ({
    auth: { login: 'ログイン' },
  }),
}));

import { useUser } from '@clerk/nextjs';

describe('AuthButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing while Clerk is loading (isLoaded=false)', () => {
    vi.mocked(useUser).mockReturnValue({
      isLoaded: false,
      isSignedIn: undefined,
      user: null,
    } as ReturnType<typeof useUser>);

    const { container } = render(<AuthButton />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the login button when signed out', () => {
    vi.mocked(useUser).mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      user: null,
    } as ReturnType<typeof useUser>);

    render(<AuthButton />);
    expect(screen.getByTestId('sign-in-button')).toBeInTheDocument();
    expect(screen.getByText('ログイン')).toBeInTheDocument();
    expect(screen.queryByTestId('user-button')).toBeNull();
  });

  it('renders UserButton when signed in', () => {
    vi.mocked(useUser).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: { id: 'user_test' } as ReturnType<typeof useUser>['user'],
    } as ReturnType<typeof useUser>);

    render(<AuthButton />);
    expect(screen.getByTestId('user-button')).toBeInTheDocument();
    expect(screen.queryByTestId('sign-in-button')).toBeNull();
  });
});
