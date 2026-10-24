"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { INSTITUTIONAL_DOMAIN, isInstitutionalEmail } from "@/lib/credentials";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!isInstitutionalEmail(cleanEmail)) {
      setError(`Debes ingresar un correo válido terminado en ${INSTITUTIONAL_DOMAIN}`);
      return;
    }

    setError(null);
    startTransition(async () => {
      // Simulación de envío de correo de restablecimiento
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSent(true);
    });
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
        <h2 className="text-xl font-bold text-navy">Enlace enviado</h2>
        <p className="mt-2 text-sm text-gray-600">
          Si la cuenta existe en nuestro sistema, hemos enviado las instrucciones a <strong>{email}</strong>.
        </p>
        <Link href="/login" className="mt-6 text-sm font-semibold text-red-600 hover:underline">
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Link href="/login" className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-navy">
        <ArrowLeft className="h-3.5 w-3.5" /> Volver al ingreso
      </Link>
      
      <div>
        <h1 className="text-2xl font-black text-navy">Recuperar contraseña</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ingresa tu correo institucional para recibir un enlace de restablecimiento.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reset-email">Correo institucional</Label>
        <Input
          id="reset-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={`usuario${INSTITUTIONAL_DOMAIN}`}
          required
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar instrucciones"}
      </Button>
    </form>
  );
}