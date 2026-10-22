import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthSlider } from "@/components/auth/auth-slider";
import { getSessionUser, homeFor } from "@/lib/auth";
import { listSports } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Ingreso institucional",
  description:
    "Accede con tu correo @colsantander.edu.co a la plataforma deportiva del Mundialito BS.",
};

export default async function LoginPage() {
  // Con sesión viva el ingreso no tiene nada que hacer: cada rol vuelve
  // a donde sí puede estar.
  const user = await getSessionUser();
  if (user) redirect(homeFor(user));

  // El registro vive en la misma tarjeta, y su formulario necesita las
  // disciplinas reales del catálogo.
  const sports = await listSports();

  return (
    <AuthSlider
      sports={sports.map((sport) => ({
        id: sport.id,
        name: sport.name,
        color: sport.color,
      }))}
    />
  );
}
