"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Plus, Trash2 } from "lucide-react";

import { changeRole, createUser, deleteUser } from "./actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { ROLES, type Role } from "@/lib/domain";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/permissions";
import { cn } from "@/lib/utils";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  grade: string | null;
  enrollments: number;
}

const ROLE_ORDER: Role[] = [ROLES.DOCENTE, ROLES.ESTUDIANTE, ROLES.INVITADO];

const ROLE_TONE: Record<Role, string> = {
  DOCENTE: "bg-navy text-white",
  ESTUDIANTE: "bg-[rgba(30,58,138,.1)] text-[#1E3A8A]",
  INVITADO: "bg-[rgba(11,37,69,.06)] text-ink-muted",
};

export function UsersManager({
  users,
  actorId,
}: {
  users: UserRow[];
  actorId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState<
    { kind: "ok" | "error"; text: string } | null
  >(null);

  const run = (action: () => Promise<{ ok: boolean; error?: string; message?: string }>) => {
    startTransition(async () => {
      const result = await action();
      setFeedback(
        result.ok
          ? { kind: "ok", text: result.message ?? "Hecho" }
          : { kind: "error", text: result.error ?? "No fue posible" },
      );
      if (result.ok) router.refresh();
    });
  };

  return (
    <>
      {feedback ? (
        <div
          role="status"
          className={cn(
            "flex items-start gap-2.5 rounded-field border px-4 py-3",
            feedback.kind === "ok"
              ? "border-[rgba(31,157,85,.3)] bg-[rgba(31,157,85,.08)]"
              : "border-[rgba(200,16,46,.3)] bg-[rgba(200,16,46,.06)]",
          )}
        >
          {feedback.kind === "ok" ? (
            <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[#136B39]" />
          ) : (
            <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-red" />
          )}
          <p
            className={cn(
              "text-sm font-medium",
              feedback.kind === "ok" ? "text-[#136B39]" : "text-red",
            )}
          >
            {feedback.text}
          </p>
        </div>
      ) : null}

      <Card className="px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-extrabold text-navy">
              Cuentas
            </h2>
            <p className="mt-1 text-[13px] text-ink-muted">
              Crea cuentas con contraseña inicial; el rol decide qué puede abrir cada una.
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            className="py-3"
            onClick={() => setCreating((v) => !v)}
          >
            <Plus aria-hidden className="h-4 w-4" />
            {creating ? "Cancelar" : "Nueva cuenta"}
          </Button>
        </div>

        {creating ? (
          <form
            action={(formData) => {
              run(() => createUser(formData));
              setCreating(false);
            }}
            className="anim-field-in mt-5 grid gap-4 border-t border-hairline pt-5 md:grid-cols-2"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-name">Nombre completo</Label>
              <Input id="new-name" name="name" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-email">Correo institucional</Label>
              <Input
                id="new-email"
                name="email"
                type="email"
                placeholder="nombre.apellido@colsantander.edu.co"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-role">Rol</Label>
              <select
                id="new-role"
                name="role"
                defaultValue={ROLES.ESTUDIANTE}
                className="rounded-field border border-hairline-strong bg-white px-4 py-[15px] text-[15px] text-navy outline-none focus:border-red"
              >
                {ROLE_ORDER.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-grade">Grado (opcional)</Label>
              <Input id="new-grade" name="grade" placeholder="10-B" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-password">Contraseña inicial</Label>
              <Input
                id="new-password"
                name="password"
                type="text"
                defaultValue="demo1234"
                minLength={4}
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={pending} className="w-full py-3">
                Crear cuenta
              </Button>
            </div>
          </form>
        ) : null}
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-hairline px-6 py-5">
          <h2 className="font-display text-lg font-extrabold text-navy">
            Cuentas y permisos
          </h2>
          <p className="mt-1 text-[13px] text-ink-muted">
            Cambiar el rol cierra las sesiones abiertas de esa persona, para que
            vuelva a entrar con los permisos correctos.
          </p>
        </div>

        <div className="overflow-x-auto scrollbar-slim">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <caption className="sr-only">Cuentas de la plataforma</caption>
            <thead>
              <tr className="bg-[rgba(11,37,69,.04)] font-narrow text-xs uppercase tracking-[.12em] text-ink-muted">
                <th scope="col" className="px-6 py-3 font-semibold">
                  Persona
                </th>
                <th scope="col" className="px-2 py-3 font-semibold">
                  Grado
                </th>
                <th scope="col" className="px-2 py-3 text-center font-semibold">
                  Inscripciones
                </th>
                <th scope="col" className="w-[190px] px-2 py-3 font-semibold">
                  Rol
                </th>
                <th scope="col" className="w-[90px] px-6 py-3 text-right font-semibold">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = user.id === actorId;

                return (
                  <tr
                    key={user.id}
                    className="border-b border-hairline-soft last:border-b-0 hover:bg-[rgba(11,37,69,.02)]"
                  >
                    <th scope="row" className="px-6 py-3.5 text-left">
                      <span className="block text-[15px] font-semibold text-navy">
                        {user.name}
                        {isSelf ? (
                          <span className="ml-2 rounded-full bg-[rgba(200,16,46,.09)] px-2 py-0.5 text-[11px] font-semibold text-red">
                            tú
                          </span>
                        ) : null}
                      </span>
                      <span className="block text-xs font-normal text-ink-muted">
                        {user.email}
                      </span>
                    </th>
                    <td className="px-2 py-3.5 text-sm text-ink-soft">
                      {user.grade ?? "—"}
                    </td>
                    <td className="px-2 py-3.5 text-center text-sm text-ink-soft">
                      {user.enrollments}
                    </td>
                    <td className="px-2 py-3.5">
                      {isSelf ? (
                        <span
                          className={cn(
                            "inline-block rounded-full px-3 py-1.5 text-xs font-semibold",
                            ROLE_TONE[user.role],
                          )}
                          title={ROLE_DESCRIPTIONS[user.role]}
                        >
                          {ROLE_LABELS[user.role]}
                        </span>
                      ) : (
                        <select
                          aria-label={`Rol de ${user.name}`}
                          value={user.role}
                          disabled={pending}
                          onChange={(e) =>
                            run(() => changeRole(user.id, e.target.value))
                          }
                          title={ROLE_DESCRIPTIONS[user.role]}
                          className="w-full rounded-lg border border-hairline bg-white px-3 py-2 text-[13px] font-semibold text-navy outline-none focus:border-red disabled:opacity-60"
                        >
                          {ROLE_ORDER.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        aria-label={`Eliminar la cuenta de ${user.name}`}
                        disabled={pending || isSelf}
                        onClick={() => run(() => deleteUser(user.id))}
                        className="rounded-lg p-2 text-ink-muted transition hover:bg-[rgba(200,16,46,.07)] hover:text-red disabled:pointer-events-none disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {users.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-ink-muted">
            Ninguna cuenta coincide con los filtros.
          </p>
        ) : null}
      </Card>
    </>
  );
}
