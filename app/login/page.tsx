"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    EmailNotFound: "Akun email tidak terdaftar. Hubungi administrator.",
    AccountDisabled: "Akun Anda telah dinonaktifkan. Hubungi administrator.",
    AccessDenied: "Akses ditolak. Hubungi administrator.",
    OAuthSignIn: "Terjadi kesalahan saat masuk dengan Google. Coba lagi.",
    default: "Terjadi kesalahan. Silakan coba lagi.",
  };

  const errorMessage = error
    ? errorMessages[error] || errorMessages.default
    : null;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fff8f8] px-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#fff7f7] via-white to-[#ffeaea]" />

      {/* Blur decorations */}
      <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-red-100 blur-3xl opacity-40" />
      <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-red-100 blur-3xl opacity-50" />

      {/* Bottom wave */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          fill="#ffd7d7"
          d="M0,256L80,240C160,224,320,192,480,202.7C640,213,800,267,960,266.7C1120,267,1280,213,1360,186.7L1440,160L1440,320L0,320Z"
        />
        <path
          fill="#ffbcbc"
          d="M0,288L60,277.3C120,267,240,245,360,245.3C480,245,600,267,720,272C840,277,960,267,1080,250.7C1200,235,1320,213,1380,202.7L1440,192L1440,320L0,320Z"
        />
      </svg>

      {/* Login card */}
      <div className="relative w-full max-w-[360px] rounded-xl border border-gray-200 bg-white p-8 shadow-lg">
        {/* Logo */}
        <div className="mb-7 flex flex-col items-center">
          <Image
            src="/SGM_logo.svg"
            alt="SGM Logo"
            width={160}
            height={160}
            priority
          />
          <p className="mt-4 text-sm text-gray-500">
            Sign in to your account
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-5 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={() => signIn("google", { redirectTo: "/dashboard" })}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow active:scale-[0.98]"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] text-gray-400">
          SGM Event Management
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
