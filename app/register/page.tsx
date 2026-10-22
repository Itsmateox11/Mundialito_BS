import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthSlider } from "@/components/auth/auth-slider";
import { getSessionUser, homeFor } from "@/lib/auth";
import { listSports } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Registro institucional",
  description:
    "Crea tu cuenta del Mundialito BS con tu correo @colsantander.edu.co.",
};

export default async function RegisterPage() {
  // Con sesión viva el registro no tiene nada que hacer: cada rol vuelve
  // a donde sí puede estar.
  const user = await getSessionUser();
  if (user) redirect(homeFor(user));

  // Las disciplinas reales del catálogo: la opción "Ninguno" no es un deporte
  // y vive solo en el formulario.
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
