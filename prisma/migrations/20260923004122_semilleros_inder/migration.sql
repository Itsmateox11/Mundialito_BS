-- CreateTable
CREATE TABLE "Semillero" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coach" TEXT,
    "venue" TEXT,
    "sportId" TEXT,
    "color" TEXT NOT NULL DEFAULT '#0B2545',
    "capacity" INTEGER,
    "openEnrollment" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Semillero_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SemilleroHorario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "semilleroId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "venue" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SemilleroHorario_semilleroId_fkey" FOREIGN KEY ("semilleroId") REFERENCES "Semillero" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SemilleroEnrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "semilleroId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canceledAt" DATETIME,
    CONSTRAINT "SemilleroEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SemilleroEnrollment_semilleroId_fkey" FOREIGN KEY ("semilleroId") REFERENCES "Semillero" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SemilleroHorario_semilleroId_idx" ON "SemilleroHorario"("semilleroId");

-- CreateIndex
CREATE INDEX "SemilleroEnrollment_semilleroId_status_idx" ON "SemilleroEnrollment"("semilleroId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SemilleroEnrollment_userId_semilleroId_key" ON "SemilleroEnrollment"("userId", "semilleroId");
