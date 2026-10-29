# Mainframe 2.0 

## 1. Concepto General y Narrativa Visual

Un juego incremental/clicker donde el jugador toma el rol de un operador e ingeniero de sistemas Mainframe (z/OS). Combina la estética retro con interfaces técnicas reales (TSO, ISPF, SDSF, SYSVIEW) y mecánicas de *Riesgo/Recompensa* a través de una consola interactiva.

**Inicio del Juego:*

* **Recurso Principal:** `MIPS` (Millions of Instructions Per Second).
* **Recursos Secundarios (Límites y Cuellos de Botella):** 
  * `% CPU Utilization`: Si llega al 100%, ocurre *Thrashing* y la producción cae drásticamente.
  * `RAM / Paging Space`: Limita cuántas ventanas/sesiones puedes tener abiertas simultáneamente.
  * `DASD (Cilindros de Disco)`: Determina el tiempo máximo de almacenamiento de progreso *offline* antes de sufrir un Abend `x37` (Out of Space).

---

## 2. Ecosistema de Mecánicas (Traducción de z/OS a Gameplay)

### A. Procesamiento Batch (JCL e Iniciadores)
* **JCL (Jobs):** Son los generadores base. No producen nada en la cola de entrada hasta que son procesados.
* **Iniciadores (JES2 Initiators):** Son los "trabajadores" que ejecutan los JCLs. Tienen un límite estricto y cada iniciador activo drena un % de tu CPU principal como costo de mantenimiento (*Upkeep*).

### B. La Interfaz como Recurso (Window Manager & Upkeep)
* Inspirado en configuraciones reales multipantalla de operadores de sistemas (hasta 6 ventanas en un monitor ultrawide).
* El jugador compra **Licencias de Sesión (Split Screen)** para abrir paneles de SDSF, monitores de CICS, visores de SYSLOG, etc.
* **El Dilema Estratégico:** Cada ventana abierta consume un `Address Space (ASID)`, drenando MIPS por segundo y % de CPU/RAM. El jugador debe decidir entre tener visibilidad total para cazar bonos o cerrar ventanas para destinar toda la potencia bruta del CPU al procesamiento *batch*.

### C. Motores Especializados (zIIP / Monetización o Moneda Premium)
* **Motores zIIP (System z Integrated Information Processors):** Procesadores dedicados que permiten ejecutar cargas pesadas (como DB2 o Java JCLs) e iniciadores especiales **sin consumir % de la CPU principal**. Actúan como la mejora definitiva de eficiencia o ítem premium.

### D. Escalabilidad Horizontal (LPARs)
* En el *Mid-Game*, el jugador utiliza el hipervisor (PR/SM) para crear nuevas particiones lógicas (`ZOS1`, `ZOS2`, `CICSPLEX`). 
* Obliga a dividir porcentajes de hardware físico, pero permite aislar cargas de trabajo y desbloquear multiplicadores masivos de subsistemas (CICS, DB2).

### E. Mecánica Activa: Consola y Eventos (Risk/Reward)
* **El Atasco de JES2 (Printer Jam QTE):** Enviar reportes masivos a impresoras virtuales (`PR1`, `PR2`) otorga un *buff* gigante de MIPS (ej. +500%), pero tiene una probabilidad por segundo de atascarse (`*HASP190 PR1 INTERVENTION REQUIRED`).
* Si no se resuelve tecleando rápidamente `$C PR1` (Cancel) y `$S PR1` (Start), el *spool* se llena y penaliza toda la producción base.

---

## 3. Wireframes de Evolución de la Interfaz

### Fase 1: Early Game (A Ciegas)
```text
================================================================================
|       [Fondo Pixel Art: Data center oscuro, servidor z12 parpadeando]        |
|                 +------------------------------------------+                 |
|                 | TSO SESSION - LPAR1 (CPU: ???)      [-]X |                 |
|                 |------------------------------------------|                 |
|                 | > SUBMIT 'USER.JCL(BATCH01)'             |                 |
|                 | JOB BATCH01(JOB00001) SUBMITTED          |                 |
|                 | > D MIPS                                 |                 |
|                 | CURRENT MIPS: 15 / SEC                   |                 |
|                 +------------------------------------------+                 |
================================================================================
```

### Fase 3: Late Game (Centro de Control Ultrawide - 6 Ventanas)
```text
================================================================================
| GLOBAL MIPS: 1.2M/sec | MAIN CPU: [██████████] 99% | zIIP CPU: [███░░░] 30%  |
+--------------------------+-------------------------+-------------------------+
| [1] SYSVIEW DASHBOARD [X]| [2] JES2 SPOOL ALERTS[X]| [3] LPAR MANAGER    [X] |
|--------------------------|-------------------------|-------------------------|
| [Gráfico MIPS x Minuto]  | ! PR1: PAPER JAM (4s)   | LPAR1 (PROD): 60% WLM   |
|      /\    _             |   - PENALTY: -20% MIPS  | LPAR2 (TEST): 25% WLM   |
|   /\/  \  / \            | ! SPOOL CAPACITY: 85%   | LPAR3 (DEV) : 15% WLM   |
+--------------------------+-------------------------+-------------------------+
| [4] INITIATORS & zIIP [X]| [5] CICS REGIONS     [X]| [6] MASTER CONSOLE  [X] |
|--------------------------|-------------------------|-------------------------|
| INIT 1: BATCH01 (CPU)    | CICSPROD: 50,000 TX/s   | > $C PR1                |
| INIT 2: BATCH02 (CPU)    | CICSTEST:  5,000 TX/s   | $HASP000 PR1 CANCELLED  |
| INIT 3: JAVA01  (zIIP) $ | DB2 CALLS: 12M/sec      | > $S PR1                |
| INIT 4: JAVA02  (zIIP) $ | UPKEEP: -45,000 MIPS    | $HASP000 PR1 STARTED    |
+--------------------------+-------------------------+-------------------------+
```

---

## 4. Tabla de Progresión y Capas de "Eternidad"

Para que el juego escale desde $1$ MIPS hasta números que rompan el límite estándar de JavaScript ($1.79 \times 10^{308}$) usando `break_eternity.js`, la progresión se divide en etapas claras:

| Fase | Hito / Hardware | Escala de MIPS | Ventanas UI | Mecánica Principal / Desbloqueo |
| :--- | :--- | :--- | :--- | :--- |
| **1. Operador Junior** | IBM z114 / z12 | $10^0$ a $10^4$ | 1 (TSO Puro) | Comandos manuales (`SUBMIT`), primeros Iniciadores, atascos en `PR1`. |
| **2. Sysprog** | IBM z13 | $10^4$ a $10^9$ | 2 a 3 (ISPF / SDSF) | Gestión de % CPU, discos DASD (Mod 3 a Mod 27) para *offline*, automatización básica. |
| **3. Arquitecto (1er IPL)** | IBM z14 -> z15 | $10^9$ a $10^{21}$ | 4 a 5 (CICS / DB2) | **Prestigio 1 (IPL):** Reinicia recursos a cambio de *Chips Físicos* y motores **zIIP**. |
| **4. Director (Sysplex)** | IBM z16 Cluster | $10^{21}$ a $10^{100}$ | 6 (SYSVIEW Full) | **Prestigio 2 (Parallel Sysplex):** Conectar múltiples Mainframes mediante *Coupling Facility*. |
| **5. Eternidad** | Quantum zSystem | $10^{100}$ a $10^{10000+}$| UI Automatizada IA | **Prestigio 3 (Arquitectura Cuántica):** Automatización de IPLs, reescritura de microcódigo. |

### Recomendaciones para el Diseño de "Eternidad" (Late Game Profundo)
1. **Regla del Multiplicador de Prestigio:** El jugador nunca debe hacer un IPL por menos de un multiplicador $\times 3$ o $\times 5$ en su velocidad de recuperación. El primer IPL debe sentirse como derribar un muro.
2. **Automatización de Mecánicas Antiguas (QoL):** Lo que es divertido en la hora 1 es tedioso en la hora 20. En la Fase 3, el jugador debe poder comprar **Scripts REXX** o **NetView Auto-Operators** que resuelvan los atascos de `PR1` automáticamente (ej. con un 50% de eficiencia en comparación a hacerlo a mano).
3. **Escalado de Costos vs. Producción:** 
   * Costo de generadores: $\text{Costo} = \text{Base} \times 1.15^{\text{Nivel}}$
   * Si quieres crear "muros" que obliguen a usar la consola o hacer IPL, sube el multiplicador de costo a $1.25$ después del nivel 100 de cada edificio (escalado exponencial doble).

---

## 5. Estimación de Tiempos

### A. Tiempo para el Jugador (Duración del Juego)
En el género incremental en Steam (ej. *NGU Idle*, *Revolution Idle*, *Melvor Idle*), los jugadores buscan longevidad:
* **Campaña Base (Fases 1 a 3 - Primeros IPLs):** ~15 a 25 horas de juego (mezclando juego activo en consola y esperas *idle* limitadas por DASD).
* **Contenido Sysplex y Eternidad (Fases 4 y 5 - 100% Logros):** ~80 a 150+ horas.

### B. Tiempo de Desarrollo (Roadmap para 1 Desarrollador)
Considerando que ya dominas la lógica de z/OS y el stack web (React/TypeScript):

* **Mes 1 (Prototipo y Motor Matemático):** 2 a 3 semanas. Configuración de Zustand, bucle `requestAnimationFrame`, integración de `break_eternity.js` y parser básico de consola. Sin arte, solo cajas grises.
* **Mes 2 (Sistema de Ventanas y UI Retro):** 3 a 4 semanas. Crear el *Window Manager* (arrastrar/cerrar ventanas de SDSF/TSO), aplicar fuentes monoespaciadas, colores de terminal y el fondo Pixel Art del z12.
* **Mes 3 (Balance Matemático y Guardado):** 3 a 4 semanas. Ajustar hojas de cálculo para que el drenaje de CPU no rompa el juego, programar el cálculo offline (DASD) y el sistema de IPL.
* **Mes 4 (Pulido y Empaquetado para Steam):** 2 a 4 semanas. Empaquetar la web app usando **Electron** o **Tauri**, integrar sonidos (teclado mecánico, ventiladores de servidor, *beeps* de alerta en consola) y conectar la API de logros de Steam.
* **Total estimado para un Early Access sólido:** **3 a 4 meses** trabajando a medio tiempo.

---

## 6. Product Backlog (Organizado por Sprints/Épicas)

### Épica 1: El Motor Core (MVP)
- [ ] Inicializar repositorio con React + TypeScript + Vite + TailwindCSS.
- [ ] Integrar `break_eternity.js` y crear wrapper de formateo numérico (K, M, B, T, notación científica).
- [ ] Configurar `useGameStore` en Zustand con el bucle principal (`delta time`).
- [ ] Implementar recurso `MIPS` y el límite de `% CPU`.
- [ ] Crear componente `<Terminal />` capaz de leer strings, validar comandos (`SUBMIT`, `D MIPS`) y mostrar historial de logs.

### Épica 2: Mecánicas z/OS y Riesgo/Recompensa
- [ ] Programar sistema de **JCLs** (cola de espera) e **Iniciadores** (ejecución activa + drenaje de CPU).
- [ ] Desarrollar máquina de estados para Impresoras (`PR1`, `PR2`): estados `IDLE`, `PRINTING`, `JAMMED`.
- [ ] Conectar comandos `$C PRx` y `$S PRx` para limpiar atascos y restaurar producción.
- [ ] Implementar penalización de *Thrashing* si el consumo de CPU supera el 100%.

### Épica 3: El Window Manager (La Interfaz Comprable)
- [ ] Diseñar layout base con el arte del servidor z12 de fondo y secuencia de animación de *Logon* inicial.
- [ ] Crear sistema de ventanas flotantes o en grilla (hasta 6 paneles simultáneos).
- [ ] Programar la ventana **SDSF (Active Jobs)**: muestra tabla en tiempo real de iniciadores y consumo.
- [ ] Programar costo de mantenimiento (*Upkeep* de RAM y CPU) por cada ventana abierta.
- [ ] Añadir tienda de Hardware: compra de tarjetas RAM y volúmenes DASD (Mod 3, Mod 9, Mod 54).

### Épica 4: Metaprogresión, Offline y Eternidad
- [ ] Implementar guardado en `localStorage` y exportación/importación de partida en string Base64.
- [ ] Programar cálculo de progreso Offline al abrir el juego, limitado por la capacidad actual de cilindros DASD (Abend `x37` al llenarse).
- [ ] Desarrollar pantalla y lógica de **IPL (Prestigio 1)**: reseteo de estado y otorgamiento de *Chips/Arquitectura* (z12 -> z13 -> z14).
- [ ] Implementar tienda de **Motores zIIP** (iniciadores libres de mantenimiento de CPU) y scripts de automatización **REXX**.
