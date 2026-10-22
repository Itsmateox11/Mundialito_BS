import type { Metadata } from "next";

import { EnrollmentWizard } from "./wizard";
import { Card } from "@/components/ui/card";
import { requireCapability } from "@/lib/auth";
import { CAPABILITIES } from "@/lib/permissions";
import { STATUS_PRESENTATION } from "@/lib/domain";
import { getProfile, listMyEnrollments, listSports } from "@/lib/queries";
import { StatusBadge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Inscripciones" };

export default async function InscripcionesPage({
  searchParams,
}: {
  searchParams: { deporte?: string };
}) {
  const session = await requireCapability(CAPABILITIES.ENROLL);
  const [sports, mine, profile] = await Promise.all([
    listSports(),
    listMyEnrollments(session.id),
    getProfile(session.id),
  ]);

  const enrolledSlugs = mine.map((enrollment) => enrollment.sportSlug);

  // Solo se ofrecen disciplinas con cupo en las que no esté ya inscrito.
  const available = sports.filter(
    (sport) =>
      !enrolledSlugs.includes(sport.slug) && sport.taken < sport.capacity,
  );

  const user = profile?.user;

  return (
    <>
      {mine.length > 0 ? (
        <Card className="px-6 py-5">
          <h2 className="font-display text-[17px] font-extrabold text-navy">
            Mis inscripciones
          </h2>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {mine.map((enrollment) => {
              const tone = STATUS_PRESENTATION[enrollment.status];
              return (
                <span
                  key={enrollment.id}
                  className="flex items-center gap-2.5 rounded-full border border-hairline bg-white py-1.5 pl-2 pr-3"
                >
                  <span
                    aria-hidden
                    className="h-5 w-5 shrink-0 rounded-full"
                    style={{ background: enrollment.sportColor }}
                  />
                  <span className="text-sm font-semibold text-navy">
                    {enrollment.sportName}
                  </span>
                  <StatusBadge color={tone.color} bg={tone.bg}>
                    {tone.label}
                  </StatusBadge>
                </span>
              );
            })}
          </div>
        </Card>
      ) : null}

      <EnrollmentWizard
        sports={available.map((sport) => ({
          slug: sport.slug,
          name: sport.name,
          color: sport.color,
          left: sport.capacity - sport.taken,
        }))}
        preselected={searchParams.deporte}
        canEnroll={session.role !== "INVITADO"}
        defaults={{
          name: session.name,
          grade: session.grade ?? "—",
          birthDate: user?.birthDate ?? null,
          document: user?.document ?? "",
          guardianName: user?.guardianName ?? "",
          guardianPhone: user?.guardianPhone ?? "",
          insurer: user?.insurer ?? "",
          bloodType: user?.bloodType ?? "",
          allergies: user?.allergies ?? "",
          injuries: user?.injuries ?? "",
          medications: user?.medications ?? "",
          emergencyPhone: user?.emergencyPhone ?? "",
        }}
      />
    </>
  );
}
