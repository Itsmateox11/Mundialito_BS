/*
  Warnings:

  - You are about to drop the column `minute` on the `MatchEvent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Match" ADD COLUMN "refereeName" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MatchEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MatchEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MatchEvent_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MatchEvent_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MatchEvent" ("createdAt", "id", "matchId", "playerId", "teamId", "type") SELECT "createdAt", "id", "matchId", "playerId", "teamId", "type" FROM "MatchEvent";
DROP TABLE "MatchEvent";
ALTER TABLE "new_MatchEvent" RENAME TO "MatchEvent";
CREATE INDEX "MatchEvent_matchId_idx" ON "MatchEvent"("matchId");
CREATE INDEX "MatchEvent_playerId_idx" ON "MatchEvent"("playerId");
CREATE INDEX "MatchEvent_teamId_idx" ON "MatchEvent"("teamId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
