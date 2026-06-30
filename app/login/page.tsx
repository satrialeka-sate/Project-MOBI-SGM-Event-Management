"use client";

import { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Loader2,
  LogIn,
  Eye,
  EyeOff,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fff8f8] px-4">

      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#fff7f7] via-white to-[#ffeaea]" />

      {/* Blur Decoration */}
      <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-red-100 blur-3xl opacity-40" />

      <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-red-100 blur-3xl opacity-50" />

      {/* Bottom Wave */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
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

      {/* Login Card */}
      <div className="relative w-full max-w-[360px] rounded-xl border border-gray-200 bg-white p-8 shadow-lg">

        {/* Logo */}
        <div className="mb-7 flex flex-col items-center">
          <Image
            src="/SGM_logo.svg"
            alt="SGM Logo"
            width={90}
            height={90}
            priority
          />

          <p className="mt-3 text-sm text-gray-500">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm">
              Email
            </Label>

            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 border-gray-300 focus-visible:border-red-500 focus-visible:ring-red-200"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm">
              Password
            </Label>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 pr-10 border-gray-300 focus-visible:border-red-500 focus-visible:ring-red-200"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-md bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Button */}
          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-md bg-red-600 text-white hover:bg-red-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </>
            )}
          </Button>

        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] text-gray-400">
          SGM Event Management
        </p>

      </div>
    </div>
  );
}