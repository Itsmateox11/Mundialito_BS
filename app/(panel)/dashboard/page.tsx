import type { Metadata } from "next";
import Link from "next/link";

import { StatCard } from "@/components/shared/stat-card";
import { Card, CardNavy, CardTitle } from "@/components/ui/card";
import { requireCapability } from "@/lib/auth";
import { CAPABILITIES } from "@/lib/permissions";
import { CATEGORY_PRESENTATION } from "@/lib/domain";
import {
  getDashboardStats,
  getNextMatch,
  getStandings,
  listActivity,
  listNews,
} from "@/lib/queries";
import { formatDate, formatKickoff, relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireCapability(CAPABILITIES.VIEW_DASHBOARD);

  const [stats, nextMatch, standings, news, activity] = await Promise.all([
    getDashboardStats(user.id),
    getNextMatch(),
    getStandings(),
    listNews(),
    listActivity(),
  ]);

  const topTeams = standings.slice(0, 5);
  const recentNews = news.slice(0, 3);

  return (
    <div className="animate-page-enter space-y-[18px]">
      {/* TARJETAS DE ESTADÍSTICAS */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* PRÓXIMO ENCUENTRO Y TABLA RÁPIDA */}
      <div className="grid gap-[18px] lg:grid-cols-[1.35fr_1fr]">
        {nextMatch ? (
          <CardNavy className="p-6 md:px-7 md:py-[26px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="eyebrow text-white/50">
                Próximo encuentro · {nextMatch.sportName}
              </div>
              <div className="flex items-center gap-2 font-narrow text-xs tracking-[.14em] text-red-soft">
                <span
                  aria-hidden
                  className="h-[7px] w-[7px] animate-tick-fast rounded-full bg-red-live"
                />
                {formatKickoff(nextMatch.kickoff)}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div
                  aria-hidden
                  className="h-11 w-11 shrink-0 rounded-[14px] md:h-[52px] md:w-[52px]"
                  style={{ background: nextMatch.home.color }}
                />
                <div>
                  <div className="font-display text-base font-extrabold text-white md:text-xl">
                    {nextMatch.home.name}
                  </div>
                  <div className="text-[13px] text-white/45">
                    {nextMatch.home.detail ?? nextMatch.sportName}
                  </div>
                </div>
              </div>

              <div className="font-display text-xl font-black text-white/35 md:text-[26px]">
                VS
              </div>

              <div className="flex items-center gap-3.5">
                <div className="text-right">
                  <div className="font-display text-base font-extrabold text-white md:text-xl">
                    {nextMatch.away.name}
                  </div>
                  <div className="text-[13px] text-white/45">
                    {nextMatch.away.detail ?? nextMatch.sportName}
                  </div>
                </div>
                <div
                  aria-hidden
                  className="h-11 w-11 shrink-0 rounded-[14px] md:h-[52px] md:w-[52px]"
                  style={{ background: nextMatch.away.color }}
                />
              </div>
            </div>

            <div className="mt-auto flex flex-wrap gap-x-8 gap-y-2 border-t border-on-navy pt-[18px] text-[13px] text-white/55">
              <span>{nextMatch.venue}</span>
              {nextMatch.round ? <span>{nextMatch.round}</span> : null}
              <span>{formatDate(nextMatch.kickoff)}</span>
            </div>
          </CardNavy>
        ) : (
          <Card className="flex items-center justify-center p-10 text-sm text-ink-muted">
            No hay partidos programados por ahora.
          </Card>
        )}

        <Card className="px-6 py-[22px]">
          <div className="flex items-center justify-between">
            <CardTitle>Tabla rápida</CardTitle>
            <Link
              href="/equipos"
              className="text-[13px] font-semibold text-red hover:text-red-dark"
            >
              Ver todo
            </Link>
          </div>
          <div className="mt-3.5 flex flex-col">
            {topTeams.map((team) => (
              <div
                key={team.id}
                className="flex items-center gap-3 border-b border-hairline-soft py-[11px] last:border-b-0"
              >
                <span
                  className="w-5 font-display font-black"
                  style={{ color: team.pos <= 3 ? "#C8102E" : "#9AA8B6" }}
                >
                  {team.pos}
                </span>
                <span
                  aria-hidden
                  className="h-[26px] w-[26px] shrink-0 rounded-lg"
                  style={{ background: team.color }}
                />
                <span className="flex-1 truncate text-sm font-semibold text-navy">
                  {team.name}
                </span>
                <span className="font-display text-[15px] font-extrabold text-navy">
                  {team.points}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ANUNCIOS Y ACTIVIDAD RECIENTE */}
      <div className="grid gap-[18px] lg:grid-cols-2">
        <Card className="px-6 py-[22px]">
          <CardTitle>Anuncios recientes</CardTitle>
          <div className="mt-3.5 flex flex-col gap-3.5">
            {recentNews.map((item) => (
              <Link
                key={item.id}
                href="/anuncios"
                className="flex gap-3.5 transition-opacity hover:opacity-75"
              >
                <span
                  aria-hidden
                  className="w-1 shrink-0 rounded"
                  style={{
                    background: CATEGORY_PRESENTATION[item.category].color,
                  }}
                />
                <span className="block">
                  <span className="eyebrow block tracking-[.14em] text-ink-muted">
                    {item.category} · {formatDate(item.publishedAt)}
                  </span>
                  <span className="mt-[3px] block text-[15px] font-semibold text-navy">
                    {item.title}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="px-6 py-[22px]">
          <CardTitle>Actividad reciente</CardTitle>
          <div className="mt-3.5 flex flex-col gap-[13px]">
            {activity.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div
                  aria-hidden
                  className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-[rgba(11,37,69,.06)] font-display text-xs font-extrabold text-navy"
                >
                  {item.initials}
                </div>
                <div className="flex-1 text-sm text-ink-body">{item.text}</div>
                <div className="shrink-0 text-xs text-ink-faint">
                  {relativeTime(item.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}