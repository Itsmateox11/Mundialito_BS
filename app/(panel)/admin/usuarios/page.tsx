import type { Metadata } from "next";

import { UsersManager } from "./users-manager";
import { FilterBar } from "@/components/shared/filter-bar";
import { AdminStat } from "@/components/shared/stat-card";
import { requireCapability } from "@/lib/auth";
import { ROLES, type Role } from "@/lib/domain";
import { filterUsers, optionsFrom, pickParam, pickQuery } from "@/lib/filters";
import { CAPABILITIES, ROLE_LABELS } from "@/lib/permissions";
import { countUsersByRole, listGrades, listUsers } from "@/lib/queries-admin";

export const metadata: Metadata = { title: "Usuarios" };

const ROLE_OPTIONS = [ROLES.DOCENTE, ROLES.ESTUDIANTE, ROLES.INVITADO].map(
  (role) => ({ value: role, label: ROLE_LABELS[role] }),
);

/**
 * Los filtros viven en la URL. Rol y grado se acotan en la consulta; el
 * texto se compara aquí con la misma regla del buscador, sin tildes.
 */
export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: { q?: string; rol?: string; grado?: string };
}) {
  const actor = await requireCapability(CAPABILITIES.MANAGE_USERS);

  const grades = await listGrades();
  const q = pickQuery(searchParams.q);
  const role = pickParam(searchParams.rol, ROLE_OPTIONS) as Role | null;
  const grade = pickParam(searchParams.grado, grades);

  const [accounts, counts] = await Promise.all([
    listUsers({ role, grade }),
    countUsersByRole(),
  ]);
  const users = filterUsers(accounts, q);

  const filtered = Boolean(q || role || grade);

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {[ROLES.DOCENTE, ROLES.ESTUDIANTE, ROLES.INVITADO].map((role) => (
          <AdminStat
            key={role}
            label={ROLE_LABELS[role]}
            value={String(counts[role] ?? 0)}
            tone={role === ROLES.DOCENTE ? "navy" : "plain"}
          />
        ))}
      </div>

      <FilterBar
        basePath="/admin/usuarios"
        label="Filtrar cuentas"
        summary={
          filtered
            ? `${users.length} ${users.length === 1 ? "cuenta coincide" : "cuentas coinciden"}`
            : undefined
        }
        fields={[
          {
            name: "q",
            label: "Buscar cuenta",
            type: "search",
            value: q,
            placeholder: "Nombre o correo",
          },
          {
            name: "rol",
            label: "Rol",
            type: "select",
            value: role ?? "",
            options: ROLE_OPTIONS,
          },
          {
            name: "grado",
            label: "Grado",
            type: "select",
            value: grade ?? "",
            options: optionsFrom(grades),
          },
        ]}
      />

      <UsersManager users={users} actorId={actor.id} />
    </>
  );
}
