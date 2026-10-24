import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { INSTITUTIONAL_DOMAIN } from "@/lib/credentials";

export const metadata: Metadata = {
  title: "Recuperar contraseña | Mundialito BS",
  description: "Instrucciones para restablecer la contraseña institucional.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 dark:bg-navy-950">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-navy-900">
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
            <KeyRound className="h-7 w-7" />
          </div>
        </div>

        <h1 className="text-center font-display text-2xl font-black text-navy dark:text-white">
          ¿Olvidaste tu contraseña?
        </h1>
        
        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          Ingresa tu correo institucional registrado (<b>{INSTITUTIONAL_DOMAIN}</b>) y te enviaremos las instrucciones de recuperación.
        </p>

        <form className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reset-email">Correo institucional</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder={`estudiante${INSTITUTIONAL_DOMAIN}`}
              required
            />
          </div>

          <Button type="submit" className="w-full py-3 font-bold">
            Enviar correo de recuperación
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
