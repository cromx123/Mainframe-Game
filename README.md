# Mainframe 2.0

Idle/incremental sobre un mainframe IBM z/OS: generas MIPS con jobs batch, administras iniciadores
JES2 y zIIPs, peleas contra atascos de la impresora PR1 y el spool, y haces **IPL** (prestigio)
para subir de generación de hardware (z12 → z13 → … → zQ).

Documento de diseño: [`Ideas2.md`](Ideas2.md) · Despliegue (web y Steam): [`docs/DEPLOY.md`](docs/DEPLOY.md)

## Stack

React 19 · TypeScript 6 (strict) · Vite 8 · Tailwind CSS 4 · Zustand 5 · `break_eternity.js`
(números enormes) · Vitest · ESLint · Prettier.

## Comandos

```bash
npm install
npm run dev          # http://localhost:5173 (incluye botón DEV "Offline +1h")
npm run check        # typecheck + lint + tests + formato (lo mismo que corre CI)
npm run build        # build estático en dist/
npm run preview      # sirve dist/ localmente
```

Requiere Node ≥ 22.12 (ver `.nvmrc`).

## Arquitectura

```
src/
  core/        Lógica del juego. TypeScript puro: sin React, sin DOM, sin Date.now ni Math.random.
    content.ts   Definiciones: hardware, ventanas, jobs, subsistemas, DASD.
    balance.ts   Todos los números ajustables de la economía.
    state.ts     Modelo de estado: `run` (se borra en el IPL) y `meta` (persiste).
    stats.ts     Valores derivados (CPU, RAM, slots, multiplicadores, MIPS/s). Nunca se guardan.
    actions.ts   Acciones del jugador: (estado) → { estado nuevo, mensajes de consola }.
    commands.ts  Parser de la consola TSO ($P, D A,L, S PR1, ...).
    simulation.ts Tick de paso fijo (0.1 s) y progreso offline limitado por el DASD.
    save.ts      Guardado versionado y validado campo por campo.
  platform/    Frontera con el entorno (hoy localStorage; en Steam, archivo en disco).
  store/       Zustand: conecta el core con React y maneja el loop y el autosave.
  ui/          Componentes: header, barra de sesiones, una ventana por archivo, modales.
```

Reglas que mantienen el proyecto sano:

- **Toda regla de juego vive en `src/core`** y tiene tests. La UI solo lee estado y despacha
  acciones. Eso hace la lógica testeable y portable (por ejemplo, a Godot).
- **Balancear = editar `balance.ts` / `content.ts`.** El guardado almacena niveles, no
  definiciones, así que cambiar un costo afecta también a las partidas existentes.
- **Cambiar la forma del guardado = subir `SAVE_VERSION`** en `save.ts` y agregar la migración.
- La aleatoriedad y el reloj se inyectan (`Rng`, `now`), por eso los tests son deterministas.
