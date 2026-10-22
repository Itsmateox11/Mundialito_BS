"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Search } from "lucide-react";

import type { SearchGroup, SearchHit } from "@/lib/search-core";
import { cn } from "@/lib/utils";

const SEARCH_PATH = "/buscar";
/** Con menos letras la lista de sugerencias es ruido, no ayuda. */
const MIN_CHARS = 2;
const DEBOUNCE_MS = 220;

/**
 * La caja de búsqueda de la cabecera.
 *
 * Es un formulario de verdad: Intro lleva a `/buscar?q=`, y mientras se
 * escribe pide sugerencias a `/api/buscar`, que aplica los mismos permisos
 * que la página. La lista sigue el patrón combobox de ARIA —flechas, Intro,
 * Escape— y no captura el clic hasta que el ratón lo suelta sobre una
 * opción, para que el desenfoque del campo no la cierre antes de tiempo.
 */
export function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const listId = useId();

  const initial = pathname === SEARCH_PATH ? (params.get("q") ?? "") : "";
  const [value, setValue] = useState(initial);
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const abortRef = useRef<AbortController | null>(null);

  // Al llegar a otra página la caja se vacía; en /buscar conserva la consulta.
  useEffect(() => {
    setValue(initial);
    setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Sugerencias con retardo, cancelando la petición anterior si aún vuela.
  // Solo con la lista abierta: al llegar a /buscar con una consulta en la
  // caja no hay que pedir nada hasta que la persona vuelva a escribir.
  useEffect(() => {
    const term = value.trim();
    if (!open || term.length < MIN_CHARS) {
      if (term.length < MIN_CHARS) setGroups([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(
          `/api/buscar?q=${encodeURIComponent(term)}`,
          { signal: controller.signal },
        );
        if (!response.ok) return;
        const data = (await response.json()) as { groups: SearchGroup[] };
        setGroups(data.groups);
        setActive(-1);
      } catch {
        // Cancelada o sin red: la lista simplemente no cambia.
      }
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [value, open]);

  const flat: SearchHit[] = groups.flatMap((group) => group.hits);
  const showList = open && value.trim().length >= MIN_CHARS && flat.length > 0;

  const submit = () => {
    const term = value.trim();
    setOpen(false);
    router.push(term ? `${SEARCH_PATH}?q=${encodeURIComponent(term)}` : SEARCH_PATH);
  };

  const pick = (hit: SearchHit) => {
    setOpen(false);
    router.push(hit.href);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && flat.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActive((index) => (index + 1) % flat.length);
    } else if (event.key === "ArrowUp" && flat.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActive((index) => (index <= 0 ? flat.length - 1 : index - 1));
    } else if (event.key === "Escape") {
      setOpen(false);
      setActive(-1);
    } else if (event.key === "Enter" && showList && active >= 0) {
      event.preventDefault();
      pick(flat[active]);
    }
  };

  let optionIndex = -1;

  return (
    <>
      <form
        role="search"
        action={SEARCH_PATH}
        method="get"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="relative hidden md:block md:w-[250px] xl:w-[290px]"
      >
        <label className="flex items-center gap-2.5 rounded-full border border-hairline bg-white px-4 py-2.5 text-sm text-ink-muted transition focus-within:border-red focus-within:shadow-[0_0_0_4px_rgba(200,16,46,.12)]">
          <Search aria-hidden className="h-4 w-4 shrink-0" />
          <span className="sr-only">Buscar</span>
          <input
            type="search"
            name="q"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onKeyDown}
            placeholder="Buscar equipo, deporte o anuncio"
            autoComplete="off"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              showList && active >= 0 ? `${listId}-${active}` : undefined
            }
            className="w-full min-w-0 bg-transparent text-sm text-navy outline-none placeholder:text-ink-muted"
          />
        </label>

        {showList ? (
          <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-[min(92vw,380px)] overflow-hidden rounded-card border border-hairline bg-white shadow-card animate-in fade-in slide-in-from-top-1 duration-150">
          <ul
            id={listId}
            role="listbox"
            aria-label="Sugerencias"
            className="max-h-[55vh] overflow-y-auto py-1 scrollbar-slim"
          >
            {groups.map((group) => (
              <li key={group.kind} role="group" aria-label={group.label}>
                <div aria-hidden className="eyebrow px-4 pb-1 pt-3 text-ink-soft">
                  {group.label}
                </div>
                <ul role="presentation">
                  {group.hits.map((hit) => {
                    optionIndex += 1;
                    const index = optionIndex;
                    const selected = index === active;
                    return (
                      <li
                        key={hit.id}
                        id={`${listId}-${index}`}
                        role="option"
                        aria-selected={selected}
                        onMouseDown={(event) => event.preventDefault()}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => pick(hit)}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 px-4 py-2.5",
                          selected &&
                            "bg-[rgba(11,37,69,.07)] shadow-[inset_3px_0_0_#C8102E]",
                        )}
                      >
                        <span
                          aria-hidden
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: hit.color ?? "#9AA8B6" }}
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-navy">
                            {hit.title}
                          </span>
                          <span className="block truncate text-xs text-ink-soft">
                            {hit.subtitle}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
          {/* Fuera del listbox: no es una opción, es el camino a la página */}
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={submit}
            className="flex w-full items-center gap-2 border-t border-hairline px-4 py-2.5 text-[13px] font-semibold text-red transition hover:text-red-dark"
          >
            <Search aria-hidden className="h-3.5 w-3.5" />
            Ver todos los resultados
          </button>
          </div>
        ) : null}
      </form>

      {/* En móvil no cabe la caja: el icono lleva a la página de resultados. */}
      <Link
        href={SEARCH_PATH}
        aria-label="Buscar"
        className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-hairline bg-white text-navy transition hover:border-hairline-strong md:hidden"
      >
        <Search aria-hidden className="h-[18px] w-[18px]" />
      </Link>
    </>
  );
}
