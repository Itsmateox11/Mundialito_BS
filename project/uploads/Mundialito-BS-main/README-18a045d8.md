# 🏆 Mundialito BS — Plataforma Deportiva Institucional

Plataforma web moderna para la **Institución Educativa Barrio Santander** que centraliza la gestión deportiva escolar: deportes, equipos, inscripciones con anamnesis, anuncios, perfiles y panel administrativo docente.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS** con paleta institucional (rojo, blanco, azul oscuro)
- **shadcn/ui** (Radix + cva)
- **lucide-react** (iconos)

> Es un **prototipo frontend** con datos mock. No requiere backend para funcionar.

## Instalación

Desde la raíz del proyecto:

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Credenciales demo

El login valida que el correo termine en **`@colsantander.edu.co`**. Cualquier correo con ese dominio y contraseña de mínimo 4 caracteres funciona.

| Rol | Correo sugerido | Contraseña |
|-----|-----------------|------------|
| Estudiante | `estudiante.demo@colsantander.edu.co` | `demo1234` |
| Docente / Admin | `docente.demo@colsantander.edu.co` | `demo1234` |
| Invitado | — | (botón directo) |

## Estructura del proyecto

```
app/
  page.tsx                  # Landing pública
  login/page.tsx            # Login institucional
  (panel)/                  # Layout con sidebar + header
    layout.tsx
    dashboard/              # Inicio: estadísticas, deportes, tabla, anuncios
    deportes/               # Catálogo de 6 disciplinas
    equipos/                # Clasificación + plantillas + jugadores
    inscripciones/          # Wizard de inscripción con anamnesis
    anuncios/               # Anuncios cronológicos por categoría
    perfil/                 # Perfil del usuario
    admin/                  # Panel docente (solo rol docente)
components/
  ui/                       # Componentes shadcn (Button, Card, Table, …)
  layout/                   # Sidebar, Header, MobileNav, Logo
  shared/                   # StatCard, PageHeader, ResultPill
lib/
  auth-context.tsx          # Auth mock con localStorage
  mock-data.ts              # Deportes, equipos, anuncios, inscripciones
  types.ts                  # Tipos de dominio
  utils.ts                  # cn, formatDate, initials
```

## Módulos incluidos

- **Dashboard:** estadísticas, próximos encuentros, tabla rápida de posiciones, anuncios y actividad reciente.
- **Deportes:** Fútbol sala, Ajedrez, Balón Mano, Básquetbol, Voleibol y Tennis con cupos, horarios, entrenador y requisitos.
- **Equipos:** tabla de clasificación estilo torneo profesional (Pts, DG, GF, GC, forma reciente), panel interno del equipo y estadísticas individuales por jugador.
- **Inscripciones:** wizard de 4 pasos con anamnesis completa (datos personales · información médica · información deportiva · confirmación con términos).
- **Anuncios:** noticias, eventos, comunicados y resultados con filtro por categoría y búsqueda.
- **Perfil:** información institucional, médica y deportiva en pestañas + deportes inscritos.
- **Panel docente:** gestión de inscripciones (aprobar/rechazar), deportes, equipos, anuncios y usuarios con tablas dinámicas.

## Paleta institucional

| Color | Hex | Uso |
|-------|-----|-----|
| Rojo institucional | `#C8102E` | Acentos, CTA principales |
| Azul oscuro | `#0B2545` | Tipografía, encabezados, sidebar |
| Blanco / crema | `#FFFFFF / #FAFAFA` | Fondo |

## Próximos pasos sugeridos

- Conectar Supabase para auth real con verificación de dominio institucional.
- Migrar mocks a tablas con RLS por rol (estudiante / docente / invitado).
- Subida de evidencias en formularios de inscripción.
- Notificaciones push para aprobaciones y nuevos partidos.

---

© 2026 Institución Educativa Barrio Santander · Plataforma desarrollada para el torneo Mundialito BS.
# Mundialito-BS
# Mundialito-BS
