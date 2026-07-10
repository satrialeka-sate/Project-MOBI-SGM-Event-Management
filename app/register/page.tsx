"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
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
  console.log("[RegisterPage] regions from hook:", regions, "isLoading:", isLoading, "isError:", isError);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

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

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-xl border bg-white p-8 text-center shadow-lg">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Pendaftaran Berhasil!
          </h2>
          <p className="mt-2 text-gray-600">
            Akun Anda sedang menunggu persetujuan ADMIN PO.
            Anda akan mendapat notifikasi setelah disetujui.
          </p>
          <Button
            className="mt-6 h-11 w-full text-white"
            onClick={() => router.push("/login")}
          >
            Kembali ke Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => router.push("/login")}
          className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Login
        </button>

        {/* Card */}
        <div className="rounded-xl border bg-white p-6 shadow-lg md:p-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-gray-900">
              Daftar Akun Baru
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Isi data Anda untuk mendaftar
            </p>
          </div>

          {/* Error */}
          {submitError && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Masukkan nama lengkap"
                className="h-11"
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="email@example.com"
                className="h-11"
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone">Nomor HP (opsional)</Label>
              <Input
                id="phone"
                type="tel"
                {...register("phone")}
                placeholder="08123456789"
                className="h-11"
              />
              {errors.phone && (
                <p className="text-xs text-red-500">{errors.phone.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Minimal 8 karakter"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  placeholder="Ulangi password"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label htmlFor="role">Role yang Diinginkan</Label>
              <select
                id="role"
                {...register("role")}
                className="h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:border-sgm-red focus:ring-2 focus:ring-sgm-red-light"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="text-xs text-red-500">{errors.role.message}</p>
              )}
            </div>

            {/* Region */}
            <div className="space-y-1.5">
              <Label htmlFor="regionId">Region</Label>
              <select
                id="regionId"
                {...register("regionId")}
                className="h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:border-sgm-red focus:ring-2 focus:ring-sgm-red-light"
              >
                <option value="">Pilih Region</option>
                {regions?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              {errors.regionId && (
                <p className="text-xs text-red-500">
                  {errors.regionId.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="mt-2 h-11 w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mendaftarkan...
                </>
              ) : (
                "Daftar"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
