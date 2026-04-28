'use client';

import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { useT } from '@/i18n';

const userButtonAppearance = {
  elements: {
    avatarBox: 'w-7 h-7',
  },
} as const;

export default function AuthButton() {
  const t = useT();
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null;

  if (isSignedIn) {
    return (
      <UserButton
        appearance={userButtonAppearance}
      />
    );
  }

  return (
    <SignInButton mode="redirect">
      <button className="text-xs text-gray-300 border border-gray-600 rounded px-2 py-1 outline-none">
        {t.auth.login}
      </button>
    </SignInButton>
  );
}
