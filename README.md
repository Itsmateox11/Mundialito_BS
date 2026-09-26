# 🏆 Mundialito BS — Plataforma Deportiva Institucional

Plataforma web para la **Institución Educativa Barrio Santander** que centraliza la
gestión deportiva escolar: deportes, equipos, inscripciones con anamnesis, anuncios,
perfiles y panel administrativo docente.

Implementa la dirección visual **1c "Vitrina clara"** diseñada en Claude Design:
crema institucional, profundidad con sombras en capas, y el escudo del IEBS flotando
con dos anillos en órbita.

## Stack

- **Next.js 14** (App Router, Server Components y Server Actions)
- **TypeScript**
- **Prisma 5** sobre **SQLite** — la base vive en un archivo, sin servicios externos
- **TailwindCSS** con la paleta institucional tokenizada
- Primitivas al estilo **shadcn/ui** (Radix Slot + cva)
- **lucide-react** (iconos)

Todo corre en local: no hace falta cuenta en ningún servicio ni conexión a
internet más allá de instalar las dependencias.

## Instalación

```bash
npm install          # instala y genera el cliente de Prisma
cp .env.example .env # DATABASE_URL apuntando a prisma/dev.db
npm run db:migrate   # crea la base y aplica las migraciones
npm run db:seed      # carga el torneo 2026 con sus cuentas
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Compila y sirve la versión de producción |
| `npm run lint` | ESLint con la configuración de Next |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Pruebas unitarias con Vitest |
| `npm run verify` | Lint + tipos + pruebas + build (lo mismo que CI) |
| `npm run db:migrate` | Crea o actualiza la base con las migraciones |
| `npm run db:seed` | Recarga los datos del torneo |
| `npm run db:reset` | Borra la base, migra y vuelve a sembrar |
| `npm run db:studio` | Abre Prisma Studio para inspeccionar los datos |

Si algo se desordena mientras pruebas, `npm run db:reset` deja el torneo como
recién instalado.

## Credenciales demo

Las credenciales se verifican **contra la base de datos**: el correo debe existir y
la contraseña se compara con su hash. Estas cuentas las crea el seed.

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Estudiante | `estudiante.demo@colsantander.edu.co` | `demo1234` |
| Docente / Admin | `docente.demo@colsantander.edu.co` | `demo1234` |
| Invitado | — | (botón directo, sin contraseña) |

El seed crea además 54 estudiantes con inscripciones aprobadas —son los que ocupan
los cupos de cada disciplina— y seis solicitudes esperando decisión del docente.

> **Aviso sobre el autorrelleno.** Por comodidad al sustentar el proyecto, el
> formulario escribe por ti el correo y la contraseña de la cuenta demo de cada
> ventana. Eso significa que pulsar **Docente → Entrar** da acceso de administrador a
> cualquiera que abra la página, sin saber ninguna credencial.
>
> Para una demostración pública, apágalo:
>
> ```
> NEXT_PUBLIC_DEMO_AUTOFILL=off
> ```
>
> Las tres ventanas quedan en blanco y desaparece el aviso de la contraseña. No hace
> falta tocar código. Todas las cuentas del seed comparten `demo1234`, así que en un
> despliegue real habría que darles contraseñas propias.

## Jerarquía de usuarios

Tres roles. Todos parten de lo que ve un visitante, y sobre esa base cada uno añade
lo suyo: el estudiante lo de **deportista**, el docente lo de **administración**.

No es una escalera en la que el de arriba hereda todo lo del de abajo. Un docente no
se inscribe en el torneo ni tiene ficha de anamnesis, así que no recibe esas
capacidades: si las recibiera, su menú sería el del estudiante con un enlace más y la
jerarquía no se vería por ninguna parte.

| | Visitante | Estudiante | Docente |
|---|:---:|:---:|:---:|
| Deportes, tabla, partidos, goleadores y anuncios | ✅ | ✅ | ✅ |
| Directorio de deportistas | — | ✅ | ✅ |
| Panel personal y perfil propio | — | ✅ | — |
| Inscribirse con anamnesis | — | ✅ | — |
| Usuarios y roles | — | — | ✅ |
| Equipos y jugadores | — | — | ✅ |
| Partidos y resultados | — | — | ✅ |
| Goleadores (estadísticas) | — | — | ✅ |
| Anuncios | — | — | ✅ |
| Aprobar inscripciones | — | — | ✅ |

Cada rol **empieza y vuelve a un sitio distinto** (`HOME_BY_ROLE`): el docente a
`/admin`, el estudiante a `/dashboard`, el visitante a `/deportes`. Es el mismo
destino que usa el ingreso y al que devuelve una guarda cuando alguien pide una
pantalla que no le toca.

El menú lateral está **agrupado por secciones** y cada rol lo abre por la suya:

| Rol | Secciones que ve |
|-----|------------------|
| Docente | **Administración** · El torneo · Comunidad |
| Estudiante | **Mi actividad** · El torneo · Comunidad |
| Visitante | **El torneo** |

Una sección sin entradas accesibles no se dibuja: el estudiante no ve un encabezado
"Administración" vacío, ni el docente uno de "Mi actividad".

### Cómo se implementa

El modelo es de **capacidades**, no de comparaciones de rol repartidas por el código
(`lib/permissions.ts`). Cada pantalla y cada acción declara *qué capacidad* exige;
el módulo dice qué capacidades tiene cada rol. Añadir un rol —un coordinador, un
acudiente— es añadir una fila a `ROLE_CAPABILITIES`.

La autorización ocurre **en el servidor, en cada punto de entrada**:

- `requireCapability(cap)` en las páginas. Se ejecuta antes de renderizar nada; si
  falta el permiso, redirige a donde esa persona sí puede estar.
- `authorize(cap)` en las acciones de servidor. Se repite aunque la página ya haya
  autorizado, porque **una acción es un punto de entrada propio**: se puede invocar
  con un POST sin pasar por su pantalla. Si falta el permiso, lanza antes de tocar
  la base de datos.
- El menú se filtra por capacidad, pero eso es **cortesía, no seguridad**: escribir
  la URL a mano o reproducir la petición no sirve de nada.

Está probado de las dos formas. El conjunto de pruebas cubre la matriz de permisos,
y una verificación en navegador comprueba que un estudiante y un visitante rebotan
de todas las rutas de administración y que, al **reproducir una petición real de
cambio de rol con su propia cookie**, la base queda intacta: el intento de ascenderse
a docente se rechaza en el servidor.

Cambiar el rol de alguien cierra sus sesiones abiertas, para que vuelva a entrar con
los permisos correctos. Y hay dos salvaguardas que no son cosméticas: nadie puede
cambiar su propio rol, y siempre debe quedar al menos un docente.

> El visitante entra por **"Continuar como invitado"**, que abre una sesión con rol
> `INVITADO`. Quien no ha entrado de ninguna forma solo ve la página de bienvenida.
>
> Cada ventana del ingreso solo admite su rol: las credenciales de un docente se
> rechazan en la ventana de estudiante (y viceversa) con un aviso que indica el rol
> real de la cuenta. El selector no es decorativo.

El **registro público** crea siempre cuentas de Estudiante: el rol no es un campo
del formulario ni un argumento que el servidor acepte. El correo debe pertenecer
exactamente a `@colsantander.edu.co` —comprobado con la misma regla en el
formulario y en la acción de servidor—, y si ya existe una cuenta con ese correo
el registro lo dice y remite al ingreso. El deporte es **una única opción o
"Ninguno"**: elegir una disciplina crea una solicitud de inscripción pendiente
(la misma relación `Enrollment` del wizard, sujeta al cupo), y "Ninguno" registra
sin participación deportiva. Enviar varios deportes no es posible —la acción
recibe un solo valor y rechaza cualquier otra cosa—. Promocionar una cuenta a
Docente solo es posible desde el panel de usuarios del administrador.

## Autenticación

Sin servicios externos y sin dependencias criptográficas nativas:

- **Contraseñas** con `scrypt` de la librería estándar de Node (`lib/password.ts`).
  Cada hash lleva su propia sal y sus parámetros de coste, así que endurecerlos más
  adelante no invalida las contraseñas ya guardadas. La comparación es en tiempo
  constante.
- **Sesiones** en tabla propia con token aleatorio de 256 bits y cookie `httpOnly`,
  `sameSite=lax` y `secure` en producción. Las vencidas se barren al iniciar sesión.
  **La duración depende del rol**: un día para el docente, siete para el estudiante,
  uno para el invitado. Cuanto más puede una sesión, menos debe durar olvidada en un
  computador compartido.
- **Freno a la fuerza bruta** (`lib/rate-limit.ts`): cinco intentos fallidos por
  correo dentro de una ventana de 15 minutos y el acceso queda bloqueado 10 minutos.
  El aviso dice cuántos intentos quedan antes del bloqueo. Un ingreso correcto borra
  la racha. El registro vive en memoria del proceso, que es lo que corresponde a un
  despliegue de una sola instancia con SQLite.
- **Guardas en el servidor**: ver la sección anterior sobre la jerarquía.

## Estructura del proyecto

```
prisma/
  schema.prisma             # Modelos: User, Session, Sport, Team, Player, Match…
  migrations/               # Historial versionado del esquema
  seed.ts · seed-data.ts    # Carga del torneo 2026
app/
  page.tsx                  # Landing pública (dirección 1c)
  login/                    # Ingreso + Server Actions de sesión
  register/                 # Registro público (solo correo @colsantander.edu.co)
  error.tsx · not-found.tsx # Límite de error y 404 con identidad propia
  robots.ts · sitemap.ts    # Metadatos de indexación
  (panel)/                  # Layout con guarda de sesión, sidebar y header
    loading.tsx             # Esqueleto de carga del panel
    dashboard/              # Estadísticas, próximo encuentro, tabla, anuncios
    deportes/               # Catálogo de 6 disciplinas
      [slug]/               # Ficha con escena animada, requisitos y calendario
    semilleros/             # Semilleros deportivos INDER (formación)
    equipos/                # Clasificación + plantilla
    inscripciones/          # Wizard de 4 pasos que escribe la anamnesis
    anuncios/               # Anuncios filtrables por categoría (filtro en la URL)
    perfil/                 # Perfil en pestañas
    partidos/               # Calendario y resultados del torneo
    goleadores/             # Tabla de goleadores
    deportistas/            # Directorio (requiere sesión de estudiante)
    admin/                  # Panel docente
      usuarios/             #   cuentas y roles
      equipos/              #   equipos, plantillas y estadísticas
      partidos/             #   calendario y marcadores
      anuncios/             #   publicación de anuncios
      semilleros/           #   semilleros INDER: actividades, horarios, cupos e inscritos
components/
  ui/                       # Button, Card, Input, Badge
  layout/                   # Sidebar, Header, NavDrawer, BottomNav, Logo, PanelShell
  shared/                   # StatCard, ResultPill, EscudoOrbit, ParallaxFrame
  sports/                   # Escenas animadas por disciplina
lib/
  auth.ts                   # Sesión en servidor: cookie, guardas, expiración
  session.ts                # Forma de la sesión, también usable en cliente
  password.ts               # Hash y verificación con scrypt
  credentials.ts            # Validación del correo institucional
  permissions.ts            # Capacidades de cada rol (puro, sin base de datos)
  queries.ts                # Consultas de lectura ya listas para pintar
  queries-admin.ts          # Consultas del panel docente
  domain.ts                 # Estados, roles y reglas del torneo
  prisma.ts                 # Cliente único de Prisma
  config.ts                 # Lectura de variables de entorno
  nav.ts                    # Definición de la navegación y sus títulos
  utils.ts                  # cn, initials, fechas, fillPercent
tests/                      # Pruebas unitarias (Vitest)
```

## Módulos incluidos

- **Landing:** héroe con escudo 3D y parallax al cursor, tres tarjetas con profundidad.
- **Login:** selector de rol que transforma el formulario, validación en vivo del
  dominio con corrección sugerida, mostrar/ocultar contraseña, aviso de Bloq Mayús,
  estado de verificación y confirmación animada antes de entrar. Cada ventana de
  acceso solo admite cuentas de su rol: la comprobación ocurre en el servidor, así
  que un docente no entra por la ventana de estudiante ni viceversa.
- **Registro:** cuenta pública con correo institucional. El dominio se valida en
  vivo en el formulario y de nuevo en el servidor con una regla exacta (nada de
  `@colsantander.edu.co.fake.com` ni dobles arrobas); el correo duplicado se
  rechaza con su mensaje propio; la contraseña usa el scrypt de siempre y la
  cuenta nace con rol **Estudiante** —el rol no se elige, y Docente solo lo
  concede un administrador—. Además se elige **un solo deporte o "Ninguno"**:
  el deporte crea la solicitud de inscripción pendiente con la relación
  existente, y "Ninguno" crea la cuenta sin ninguna inscripción (no es un
  deporte del catálogo, solo una opción del formulario). Al crear la cuenta la
  sesión queda abierta y se entra directo al panel.
- **Dashboard:** estadísticas, próximo encuentro, tabla rápida, anuncios y actividad.
- **Deportes:** las seis disciplinas del torneo —Futsal, Baloncesto, Voleibol,
  Balón mano, Ajedrez y Ping pong—, cada una con su propia escena animada y su ficha
  de detalle con requisitos, escenario, cupos y calendario de partidos.
- **Equipos:** clasificación con Pts, DG, GF, GC y forma reciente + panel del equipo.
- **Inscripciones:** wizard de 4 pasos que valida por paso, guarda la anamnesis en la
  ficha del estudiante y crea la solicitud.
- **Anuncios:** filtro por categoría; vive en la URL, así que el enlace se comparte.
- **Perfil:** pestañas institucional / médica / deportiva con los datos reales.
- **Partidos y goleadores:** calendario completo y tabla de goleadores, ambos públicos.
- **Panel docente:** inscripciones, usuarios y roles, equipos y plantillas, partidos
  con marcadores que recalculan la tabla, y publicación de anuncios.
- **Semilleros INDER:** formación deportiva en articulación con el INDER,
  independiente del Mundialito. El estudiante filtra el catálogo por deporte y
  día (filtros en la URL, compartibles), consulta actividades con sus horarios,
  lugares, entrenadores y cupos calculados, se inscribe o se retira, y ve lo
  suyo en "Mis semilleros"; el docente crea y edita semilleros, añade horarios
  por día, configura cupos, abre o cierra inscripciones y ve la lista real de
  inscritos. La inscripción nace como `INSCRITO` (sin aprobación) y el retiro
  la marca `CANCELADO`; elegir "Ninguno" en el Mundialito no impide participar
  aquí, y participar aquí no toca la inscripción del torneo.

## Animaciones por disciplina

Cada deporte tiene un gesto propio en `components/sports/sport-scene.tsx`: SVG plano
con animaciones CSS, sin librerías, sin JavaScript y sin coste de hidratación —son
componentes de servidor.

| Deporte | Gesto |
|---------|-------|
| Futsal | El balón cruza la cancha rodando sobre su eje |
| Baloncesto | Lanzamiento en parábola que entra al aro y agita la red |
| Voleibol | Saque que sobrevuela la red y cae en el otro campo |
| Balón mano | Disparo rasante que sacude la malla de la portería |
| Ajedrez | El caballo describe su salto en L sobre el tablero |
| Ping pong | Peloteo corto con botes bajos a ambos lados de la red |

## Paleta institucional

| Color | Hex | Uso |
|-------|-----|-----|
| Rojo institucional | `#C8102E` | Acentos, CTA principales |
| Azul oscuro | `#0B2545` | Tipografía, encabezados, sidebar |
| Crema | `#FAF8F4` | Fondo de la aplicación |

Tipografías: **Archivo** (títulos), **Public Sans** (texto), **Archivo Narrow**
(versalitas), cargadas con `next/font`.

## Diseño y accesibilidad

- Responsive de móvil a escritorio: la barra lateral se convierte en cajón deslizante
  más una barra inferior de accesos frecuentes; las tablas hacen scroll horizontal.
- Toda la animación (flotación, anillos, parallax, escenas deportivas) se detiene con
  `prefers-reduced-motion`, y el parallax solo se activa con puntero fino.
- Tablas semánticas, pestañas y selector de acceso con roles ARIA, foco visible,
  estados de error anunciados con `role="alert"` y textos alternativos en toda imagen.

## Calidad

`npm run verify` es la misma secuencia que corre CI en cada push y pull request
(`.github/workflows/ci.yml`): ESLint, comprobación de tipos, pruebas unitarias y build.

Las pruebas cubren lo que no debe romperse en silencio: la validación del correo
institucional, el hash de contraseñas —que verifique la correcta, rechace la
equivocada, no guarde nada en claro y use una sal distinta cada vez— y la coherencia
de los datos del torneo: slugs únicos, objetivos de inscripción por debajo del cupo,
tabla ordenada por puntos, reparto de victorias y empates que cuadra con los puntos,
y correos generados únicos y reproducibles. Y la matriz de permisos completa: que
cada rol tenga lo suyo y solo lo suyo —que el docente no herede las capacidades de
deportista ni el estudiante ninguna de administración—, que cada rol arranque en una
portada distinta, que el menú agrupado no pierda ni duplique entradas y que sin
sesión no haya ninguna capacidad. El freno de intentos tiene sus propias pruebas,
con reloj fijo: conteo, caducidad de la ventana, duración del bloqueo, separación
por origen y el caso de los intentos simultáneos.

## Estado actual

La aplicación es funcional de punta a punta contra la base de datos:

- **Entrar** verifica correo y contraseña contra `User`, abre una `Session` y planta
  la cookie. Cerrar sesión la borra de verdad.
- **Registrarse** valida el dominio institucional en ambos lados, rechaza correos
  duplicados, crea la cuenta como Estudiante con la contraseña hasheada, abre la
  sesión en el mismo paso y, si se eligió un deporte, deja la solicitud de
  inscripción pendiente (con "Ninguno" no se crea ninguna).
- **Inscribirse** escribe la anamnesis en la ficha del estudiante y crea una
  `Enrollment` pendiente. No deja inscribirse dos veces al mismo deporte ni superar
  el cupo.
- **Semillero INDER** inscribe al estudiante con su fecha y estado, cuenta los
  cupos ocupados contra el cupo máximo y bloquea nuevas inscripciones al
  agotarse; el retiro conserva la fila con estado cancelado para que pueda
  volver a inscribirse.
- **Aprobar o rechazar** persiste la decisión con su autor y su fecha, y recalcula
  los cupos: los "24 de 28" del catálogo son un `count` de inscripciones aprobadas,
  no un número escrito a mano.
- **La clasificación** se ordena por puntos, diferencia de gol y goles a favor; los
  puntos se calculan (3 por victoria, 1 por empate), no se almacenan.

Pendiente para un despliegue institucional:

- Las contraseñas del seed son todas `demo1234`; hace falta un alta real de usuarios
  (o importarlos del sistema académico) y un flujo de recuperación.
- SQLite aguanta de sobra un colegio, pero si se despliega en un entorno sin disco
  persistente hay que cambiar el `datasource` a PostgreSQL: es una línea en
  `prisma/schema.prisma` más una migración.
- La campana de notificaciones sigue siendo decorativa. El buscador de la
  cabecera busca de verdad (`/buscar` y `/api/buscar`) en deportes, equipos,
  partidos, anuncios y —para quien puede ver el directorio— deportistas.

## Origen del diseño

Este código implementa el prototipo exportado desde Claude Design. El material
original se conserva sin modificar como referencia:

- `chats/` — transcripción de la sesión de diseño.
- `project/` — prototipos HTML (`Mundialito BS - App.dc.html`, `Mundialito BS - Direcciones.dc.html`) y assets.

## Próximos pasos sugeridos

- Conectar Supabase para auth real con verificación de dominio institucional.
- Migrar mocks a tablas con RLS por rol (estudiante / docente / invitado).
- Subida de evidencias en los formularios de inscripción.
- Notificaciones push para aprobaciones y nuevos partidos.

---

© 2026 Institución Educativa Barrio Santander · Plataforma desarrollada para el torneo Mundialito BS.
# Mundialito-BS
