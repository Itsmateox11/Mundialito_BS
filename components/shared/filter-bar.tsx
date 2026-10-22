"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { FilterOption } from "@/lib/filters";

export interface FilterField {
  /** Nombre del parámetro en la URL. */
  name: string;
  label: string;
  type: "select" | "search";
  /** Solo para `select`: las opciones reales, sin "Todos" (se añade aquí). */
  options?: FilterOption[];
  /** Valor activo; vacío es "Todos" o búsqueda en blanco. */
  value: string;
  placeholder?: string;
  /** Etiqueta de la opción vacía: "Todos", "Todas", "Cualquiera"… */
  allLabel?: string;
}

/**
 * Barra de filtros de un listado.
 *
 * No guarda estado propio del filtro: cada cambio reescribe la URL y la
 * página vuelve a resolverse en el servidor, igual que en anuncios y
 * semilleros. Así el enlace filtrado se puede compartir, "atrás" deshace un
 * filtro y la misma barra sirve para el catálogo público y para los módulos
 * del docente. Solo toca sus propios parámetros: lo que otro control haya
 * puesto en la dirección —la pestaña de disciplina, por ejemplo— se conserva.
 */
export function FilterBar({
  basePath,
  fields,
  label,
  summary,
}: {
  basePath: string;
  fields: FilterField[];
  /** Nombre accesible del formulario: "Filtrar partidos". */
  label: string;
  /** "3 de 16 partidos": lo que queda tras filtrar. */
  summary?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const id = useId();

  const searchField = fields.find((field) => field.type === "search");
  const [query, setQuery] = useState(searchField?.value ?? "");

  // Si la URL cambia por otra vía —"Limpiar", atrás—, la caja la sigue.
  useEffect(() => {
    setQuery(searchField?.value ?? "");
  }, [searchField?.value]);

  const go = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const queryString = next.toString();
    router.replace(queryString ? `${basePath}?${queryString}` : basePath, {
      scroll: false,
    });
  };

  const active = fields.some((field) => field.value);
  const clear = () => {
    // Lo tecleado y aún no enviado también se va: limpiar es limpiar.
    setQuery("");
    go(Object.fromEntries(fields.map((field) => [field.name, ""])));
  };

  return (
    <form
      role="search"
      aria-label={label}
      onSubmit={(event) => {
        event.preventDefault();
        if (searchField) go({ [searchField.name]: query.trim() });
      }}
      className="flex flex-wrap items-end gap-3 rounded-card border border-hairline bg-white p-4 md:p-5"
    >
      {fields.map((field) => {
        const fieldId = `${id}-${field.name}`;

        if (field.type === "select") {
          return (
            <div
              key={field.name}
              className="flex min-w-[160px] flex-1 flex-col gap-2"
            >
              <Label htmlFor={fieldId}>{field.label}</Label>
              <Select
                id={fieldId}
                name={field.name}
                value={field.value}
                onChange={(event) => go({ [field.name]: event.target.value })}
              >
                <option value="">{field.allLabel ?? "Todos"}</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          );
        }

        return (
          <div
            key={field.name}
            className="flex min-w-[220px] flex-[2] flex-col gap-2"
          >
            <Label htmlFor={fieldId}>{field.label}</Label>
            <div className="flex gap-2">
              <Input
                id={fieldId}
                name={field.name}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={field.placeholder}
                autoComplete="off"
                className="py-3"
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                aria-label="Buscar"
                className="shrink-0 px-3.5 py-3"
              >
                <Search aria-hidden className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}

      {summary || active ? (
        <div className="flex w-full flex-wrap items-center justify-between gap-2 text-[13px] text-ink-muted">
          <span aria-live="polite">{summary}</span>
          {active ? (
            <button
              type="button"
              onClick={clear}
              className="font-semibold text-red transition hover:text-red-dark"
            >
              Limpiar filtros
            </button>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
