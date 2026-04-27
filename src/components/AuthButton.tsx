'use client';

import { SignInButton, UserButton } from '@clerk/nextjs';
import { useT } from '@/i18n';

interface Props {
  isSignedIn: boolean;
}

export default function AuthButton({ isSignedIn }: Props) {
  const t = useT();

  if (isSignedIn) {
    return (
      <UserButton
        appearance={{
          elements: {
            avatarBox: 'w-7 h-7',
          },
        }}
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
