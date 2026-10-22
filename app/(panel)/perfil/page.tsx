import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProfileTabs } from "./profile-tabs";
import { CardNavy } from "@/components/ui/card";
import { requireCapability, roleLabel } from "@/lib/auth";
import { playerStatLabel } from "@/lib/domain";
import { CAPABILITIES, can } from "@/lib/permissions";
import { getProfile, listMySemilleroEnrollments } from "@/lib/queries";
import { formatDaysList, formatLongDate, formatTimeRange } from "@/lib/utils";

export const metadata: Metadata = { title: "Perfil" };

export default async function PerfilPage() {
  const session = await requireCapability(CAPABILITIES.VIEW_OWN_PROFILE);
  const profile = await getProfile(session.id);
  if (!profile) notFound();

  // Semilleros INDER del estudiante: otro sistema, otra lista.
  const mySemilleros = can(session, CAPABILITIES.ENROLL_SEMILLERO)
    ? await listMySemilleroEnrollments(session.id)
    : [];

  const { user, sports, player, playedMatches, anamnesisUpToDate } = profile;

  const summary = [
    { label: "Deportes inscritos", value: String(sports.length) },
    { label: "Partidos jugados", value: String(playedMatches) },
    {
      label: "Anamnesis",
      value: anamnesisUpToDate ? "Al día" : "Pendiente",
      highlight: anamnesisUpToDate,
    },
  ];

  const tabs = [
    {
      label: "Institucional",
      rows: [
        { label: "Nombre completo", value: user.name },
        { label: "Documento", value: user.document ?? "Sin registrar" },
        { label: "Correo institucional", value: user.email },
        { label: "Grado", value: user.grade ?? "—" },
        { label: "Jornada", value: user.shift ?? "Sin registrar" },
        { label: "Director de grupo", value: user.homeroom ?? "Sin asignar" },
      ],
    },
    {
      label: "Médica",
      rows: [
        { label: "EPS", value: user.insurer ?? "Sin registrar" },
        { label: "Tipo de sangre", value: user.bloodType ?? "Sin registrar" },
        { label: "Alergias", value: user.allergies ?? "Ninguna reportada" },
        { label: "Lesiones previas", value: user.injuries ?? "Ninguna" },
        { label: "Medicamentos", value: user.medications ?? "Ninguno" },
        {
          label: "Última actualización",
          value: user.anamnesisUpdatedAt
            ? formatLongDate(user.anamnesisUpdatedAt)
            : "Nunca",
        },
      ],
    },
    {
      label: "Deportiva",
      rows: [
        {
          label: "Deportes inscritos",
          value: sports.length > 0 ? sports.join(" · ") : "Ninguno todavía",
        },
        { label: "Equipo", value: player?.team.name ?? "Sin equipo" },
        { label: "Posición", value: player?.position ?? "—" },
        { label: "Dorsal", value: player?.number ?? "—" },
        { label: "Partidos jugados", value: String(playedMatches) },
        {
          label: "Registro",
          value: player ? playerStatLabel(player) : "—",
        },
      ],
    },
    {
      label: "Actividades",
      rows: [
        {
          label: "Mundialito",
          value: sports.length > 0 ? sports.join(" · ") : "Ninguno",
        },
        ...(mySemilleros.length > 0
          ? mySemilleros.map((semillero) => ({
              label: `Semillero INDER · ${semillero.name}`,
              value: [
                formatDaysList(semillero.days),
                semillero.horarios[0]
                  ? formatTimeRange(
                      semillero.horarios[0].startTime,
                      semillero.horarios[0].endTime,
                    )
                  : null,
                semillero.venue,
              ]
                .filter(Boolean)
                .join(" · "),
            }))
          : [{ label: "Semilleros INDER", value: "Sin inscripciones" }]),
      ],
    },
  ];

  return (
    <div className="grid items-start gap-[18px] lg:grid-cols-[340px_1fr]">
      <CardNavy glow="top" className="p-7 text-center">
        <div
          aria-hidden
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] bg-red font-display text-[32px] font-black text-white"
        >
          {session.initials}
        </div>
        <div className="mt-4 font-display text-[22px] font-black text-white">
          {user.name}
        </div>
        <div className="text-sm text-white/50">{roleLabel(session)}</div>

        <div className="mt-[22px] flex flex-col gap-2.5 text-left">
          {summary.map((row) => (
            <div
              key={row.label}
              className="flex justify-between gap-3 rounded-xl bg-white/[.07] px-4 py-[13px] text-sm text-white/75"
            >
              <span>{row.label}</span>
              <strong className={row.highlight ? "text-state-ok" : "text-white"}>
                {row.value}
              </strong>
            </div>
          ))}
        </div>
      </CardNavy>

      <ProfileTabs tabs={tabs} />
    </div>
  );
}
