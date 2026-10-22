import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "Juan Camilo Rojas" → "JC" */
export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

/** Fecha corta en español: "25 ago". */
export function formatDate(date: Date) {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** Fecha larga: "25 ago 2026". */
export function formatLongDate(date: Date) {
  return `${formatDate(date)} ${date.getFullYear()}`;
}

/** Hora en formato de 12 horas: "2:00 pm". */
export function formatTime(date: Date) {
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const suffix = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${minutes} ${suffix}`;
}

/** "HOY 2:00 PM" cuando el partido es hoy; si no, "26 AGO 2:00 PM". */
export function formatKickoff(date: Date) {
  const today = new Date();
  const sameDay =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const when = sameDay ? "HOY" : formatDate(date).toUpperCase();
  return `${when} ${formatTime(date).toUpperCase()}`;
}

/** "15:00" (texto HH:mm) → "3:00 pm". */
export function formatHourText(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
  const suffix = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

/** "15:00" y "17:00" → "3:00 pm - 5:00 pm". */
export function formatTimeRange(start: string, end: string) {
  return `${formatHourText(start)} - ${formatHourText(end)}`;
}

/** ["Martes", "Jueves"] → "Martes y jueves". */
export function formatDaysList(days: string[]) {
  if (days.length === 0) return "";
  if (days.length === 1) return days[0];
  const allButLast = days.slice(0, -1).join(", ");
  return `${allButLast} y ${days[days.length - 1]}`;
}

/** "hace 2 h", "ayer", o la fecha corta si ya pasó una semana. */
export function relativeTime(date: Date) {
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);

  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.round(hours / 24);
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;

  return formatDate(date);
}

/** Porcentaje de ocupación de cupos, acotado a 0–100. */
export function fillPercent(taken: number, capacity: number) {
  if (capacity <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((taken / capacity) * 100)));
}

/**
 * Pesos colombianos, sin decimales.
 *
 * El proyecto es de una institución de Santander y ya declara `es_CO` en sus
 * metadatos; el peso no usa céntimos en la práctica, así que el valor se
 * guarda como entero y aquí solo se le pone el formato de lectura.
 */
export function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}
