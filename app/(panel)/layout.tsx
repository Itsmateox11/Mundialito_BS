import { PanelShell } from "@/components/layout/panel-shell";
import { requireUser } from "@/lib/auth";
import { listSports } from "@/lib/queries";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // La guarda vive en el servidor: sin sesión no se renderiza nada del panel.
  const user = await requireUser();
  const sports = await listSports();

  const sportNames = Object.fromEntries(
    sports.map((sport) => [sport.slug, sport.name]),
  );

  return (
    <PanelShell user={user} sportNames={sportNames}>
      {children}
    </PanelShell>
  );
}
