"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  User,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegions } from "@/hooks/use-regions";
import api from "@/lib/axios";

const formSchema = z
  .object({
    name: z.string().min(1, "Nama wajib diisi").max(100),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
    phone: z
      .string()
      .regex(/^[0-9+\-\s()]+$/, "Nomor HP tidak valid")
      .optional()
      .or(z.literal("")),
    role: z.enum(["SPG", "TL", "PERMITTER"] as const),
    regionId: z.string().min(1, "Region wajib dipilih"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof formSchema>;

const ROLE_OPTIONS = [
  { value: "SPG", label: "SPG" },
  { value: "TL", label: "Team Leader" },
  { value: "PERMITTER", label: "Permitter" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { data: regions = [], isLoading, isError } = useRegions();
  console.log(
    "[RegisterPage] regions from hook:",
    regions,
    "isLoading:",
    isLoading,
    "isError:",
    isError
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      role: "SPG",
      regionId: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setSubmitError("");
    try {
      await api.post("/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone || undefined,
        role: data.role,
        regionId: data.regionId,
      });
      setIsSuccess(true);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Gagal mendaftar. Silakan coba lagi.";
      setSubmitError(message);
    }
  };

  // ── Success State ──
  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sgm-red to-sgm-red-dark px-6">
        <div
          className={`w-full max-w-sm text-center transition-all duration-700 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* Success icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm shadow-lg">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>

          <h2 className="mt-6 text-2xl font-bold text-white">
            Pendaftaran Berhasil!
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/80">
            Akun Anda sedang menunggu persetujuan ADMIN PO.
            <br />
            Anda akan mendapat notifikasi setelah disetujui.
          </p>

          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-white/30" />

          <Button
            className="mt-8 h-13 w-full rounded-xl bg-white text-sgm-red font-semibold shadow-lg shadow-black/10 transition-all duration-300 hover:bg-white/90 hover:shadow-xl active:scale-[0.98]"
            onClick={() => router.push("/login")}
          >
            Kembali ke Login
          </Button>
        </div>
      </div>
    );
  }

  // ── Register Form (Mobile-First) ──
  return (
    <div className="relative min-h-screen bg-[#f5f7fa]">
      {/* ── Subtle decorative background ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-sgm-red/5 to-sgm-red/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-sgm-red/5 to-sgm-red-secondary/5 blur-3xl" />
      </div>

      {/* ── Scrollable content ── */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[440px] flex-col px-5 py-8">
        {/* ── Logo & Branding ── */}
        <div
          className={`mb-8 text-center transition-all duration-700 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* SGM Logo Badge */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sgm-red to-sgm-red-dark shadow-lg shadow-sgm-red/20">
            <Sparkles className="h-7 w-7 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900">Buat Akun Baru</h1>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
            Daftarkan akun Anda untuk mulai menggunakan Sistem Event Management
            SGM.
          </p>
        </div>

        {/* ── Form Card ── */}
        <div
          className={`rounded-2xl bg-white px-6 py-7 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.02)] transition-all duration-700 delay-100 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* Error Alert */}
          {submitError && (
            <div className="mb-5 animate-[fadeIn_0.3s_ease-out] flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm text-red-600">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-200 text-[11px] font-bold text-red-600">
                !
              </span>
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className="text-xs font-semibold uppercase tracking-wider text-gray-600"
              >
                Nama Lengkap
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Masukkan nama lengkap"
                  className="h-14 w-full rounded-xl border border-gray-200 bg-gray-50/60 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-sgm-red/60 focus:bg-white focus:ring-2 focus:ring-sgm-red/10"
                />
              </div>
              {errors.name && (
                <p className="animate-[fadeIn_0.2s_ease-out] text-xs font-medium text-red-500 pl-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider text-gray-600"
              >
                Email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="email@example.com"
                  className="h-14 w-full rounded-xl border border-gray-200 bg-gray-50/60 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-sgm-red/60 focus:bg-white focus:ring-2 focus:ring-sgm-red/10"
                />
              </div>
              {errors.email && (
                <p className="animate-[fadeIn_0.2s_ease-out] text-xs font-medium text-red-500 pl-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label
                htmlFor="phone"
                className="text-xs font-semibold uppercase tracking-wider text-gray-600"
              >
                Nomor HP{" "}
                <span className="font-normal normal-case text-gray-400">
                  (opsional)
                </span>
              </Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  {...register("phone")}
                  placeholder="08123456789"
                  className="h-14 w-full rounded-xl border border-gray-200 bg-gray-50/60 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-sgm-red/60 focus:bg-white focus:ring-2 focus:ring-sgm-red/10"
                />
              </div>
              {errors.phone && (
                <p className="animate-[fadeIn_0.2s_ease-out] text-xs font-medium text-red-500 pl-1">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-gray-600"
              >
                Password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Minimal 8 karakter"
                  className="h-14 w-full rounded-xl border border-gray-200 bg-gray-50/60 pl-11 pr-12 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-sgm-red/60 focus:bg-white focus:ring-2 focus:ring-sgm-red/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                  tabIndex={-1}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="animate-[fadeIn_0.2s_ease-out] text-xs font-medium text-red-500 pl-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="confirmPassword"
                className="text-xs font-semibold uppercase tracking-wider text-gray-600"
              >
                Konfirmasi Password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  placeholder="Ulangi password"
                  className="h-14 w-full rounded-xl border border-gray-200 bg-gray-50/60 pl-11 pr-12 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-sgm-red/60 focus:bg-white focus:ring-2 focus:ring-sgm-red/10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                  tabIndex={-1}
                  aria-label={
                    showConfirmPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="animate-[fadeIn_0.2s_ease-out] text-xs font-medium text-red-500 pl-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label
                htmlFor="role"
                className="text-xs font-semibold uppercase tracking-wider text-gray-600"
              >
                Role yang Diinginkan
              </Label>
              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  id="role"
                  {...register("role")}
                  className="h-14 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/60 pl-11 pr-11 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-sgm-red/60 focus:bg-white focus:ring-2 focus:ring-sgm-red/10"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              {errors.role && (
                <p className="animate-[fadeIn_0.2s_ease-out] text-xs font-medium text-red-500 pl-1">
                  {errors.role.message}
                </p>
              )}
            </div>

            {/* Region */}
            <div className="space-y-1.5">
              <Label
                htmlFor="regionId"
                className="text-xs font-semibold uppercase tracking-wider text-gray-600"
              >
                Region
              </Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  id="regionId"
                  {...register("regionId")}
                  className="h-14 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/60 pl-11 pr-11 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-sgm-red/60 focus:bg-white focus:ring-2 focus:ring-sgm-red/10"
                >
                  <option value="">Pilih Region</option>
                  {regions?.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              {errors.regionId && (
                <p className="animate-[fadeIn_0.2s_ease-out] text-xs font-medium text-red-500 pl-1">
                  {errors.regionId.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <Button
                type="submit"
                className="h-14 w-full rounded-xl bg-sgm-red text-sm font-semibold text-white shadow-lg shadow-sgm-red/25 transition-all duration-300 hover:bg-sgm-red-secondary active:scale-[0.98] active:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Mendaftarkan...
                  </>
                ) : (
                  "Daftar"
                )}
              </Button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Sudah punya akun?{" "}
              <a
                href="/login"
                className="font-semibold text-sgm-red transition-colors hover:text-sgm-red-secondary"
              >
                Masuk
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          SGM Event Management &copy; 2026
        </p>
      </div>
    </div>
  );
}
