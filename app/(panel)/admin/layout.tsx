import { redirect } from "next/navigation";

import { AdminNav } from "./admin-nav";
import { getSessionUser, homeFor } from "@/lib/auth";
import { adminNavFor } from "@/lib/nav";
import { isAdmin } from "@/lib/permissions";

/**
 * Guarda de toda la sección de administración.
 *
 * Se comprueba una vez aquí y otra vez en cada página y acción: el layout
 * evita renderizar lo que no corresponde, y las guardas de dentro impiden
 * que alguien llegue por una ruta o una acción sin pasar por aquí.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect(homeFor(user));

  const sections = adminNavFor(user).map((item) => ({
    href: item.href,
    label: item.label,
  }));

  return (
    <>
      <AdminNav sections={sections} />
      {children}
    </>
  );
}
