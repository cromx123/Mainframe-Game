# Despliegue

| Canal               | Para qué                                                          | Cómo                              |
| ------------------- | ----------------------------------------------------------------- | --------------------------------- |
| **itch.io** (web)   | Demo gratis, feedback temprano, comunidad de juegos incrementales | `npm run build` → subir `dist/`   |
| **GitHub Pages**    | Build de pruebas para amigos y testers                            | GitHub Actions                    |
| **Steam** (desktop) | Venta                                                             | Electron + Steamworks + SteamPipe |

Todos parten del mismo build: `npm run build` genera `dist/`, un sitio estático. Como
`vite.config.ts` usa `base: './'`, las rutas son relativas y el mismo `dist/` funciona en una
subcarpeta, en itch.io y dentro de Electron (`file://`).

---

## 1. itch.io

1. Crea el proyecto con _Kind of project: HTML_.
2. Comprime el **contenido** de `dist/`, con `index.html` en la raíz del zip:
   ```bash
   npm run build && (cd dist && zip -r ../mainframe-web.zip .)
   ```
3. Súbelo, marca _This file will be played in the browser_ y define el viewport (≥ 1280×800) o
   activa el botón de pantalla completa.
4. Para automatizar, usa [butler](https://itch.io/docs/butler/), la CLI de itch:
   ```bash
   butler push dist <usuario>/<juego>:html5 --userversion 0.1.0
   ```

Para un incremental, una versión web gratis es el mejor marketing: r/incremental_games, itch y
Galaxy.click son donde está la audiencia, y el feedback que juntes ahí sirve para balancear antes
de Steam.

## 2. GitHub Pages

En _Settings → Pages → Source_ elige **GitHub Actions** y usa el workflow de ejemplo de la guía
oficial de Vite (_Deploying a Static Site → GitHub Pages_). Con `base: './'` no hace falta
configurar el nombre del repositorio.

---

## 3. Steam con Electron (camino recomendado si sigues en web)

Electron empaqueta el mismo `dist/` con un Chromium propio, así que lo que pruebas en el navegador
es exactamente lo que se envía. Tauri pesa menos, pero usa el webview del sistema operativo
(WebKitGTK en Linux y Steam Deck), con diferencias de rendimiento y renderizado entre plataformas.

### Estructura a agregar

```
electron/
  main.ts      crea la ventana, carga dist/index.html, inicializa Steamworks
  preload.ts   expone saveRead / saveWrite al juego vía contextBridge
```

### Pasos

1. **Cuenta de Steamworks y Steam Direct.** Se paga una tarifa por aplicación (USD 100, que se
   recupera tras las primeras ventas; confirma el monto actual en partner.steamgames.com). Te dan
   un **AppID** y los **depots** (uno por sistema operativo).
2. **Ventana de Electron:**
   ```ts
   new BrowserWindow({
     webPreferences: { preload, contextIsolation: true, backgroundThrottling: false },
   }).loadFile('dist/index.html');
   ```
   `backgroundThrottling: false` mantiene el loop a ritmo completo con la ventana minimizada.
   Chromium frena los timers en segundo plano; el juego igual recupera el tiempo, pero así no hay
   saltos.
3. **Guardado en archivo.** Reemplaza `src/platform/storage.ts` por una versión que llame al
   preload y escriba en `app.getPath('userData')`. Después, en Steamworks → _Steam Cloud_ →
   **Auto-Cloud**, apunta a esa carpeta y Steam sincroniza la partida entre PCs y Steam Deck sin
   código extra.
4. **API de Steam:** [`steamworks.js`](https://github.com/ceifa/steamworks.js) da logros, overlay
   y datos del usuario. En desarrollo usa el AppID de prueba **480** (_Spacewar_) con un archivo
   `steam_appid.txt`.
5. **Empaquetado:** `electron-builder` con target `dir` (Steam instala una carpeta, no necesitas
   instalador) para **Windows x64** y **Linux x64**. macOS exige firma y notarización con cuenta de
   Apple Developer, así que conviene dejarlo para después.
6. **Subida con SteamPipe:**
   ```bash
   steamcmd +login <cuenta_builder> +run_app_build ../scripts/app_build_<AppID>.vdf +quit
   ```
   El `.vdf` indica qué carpeta va a cada depot. Después, en Steamworks, publicas el build en la
   rama `default`, o en una rama beta con contraseña para testers.
7. **Steam Deck:** el build de Linux corre nativo y el de Windows corre con Proton. La consola
   necesita teclado; el Deck tiene teclado en pantalla, pero conviene que cada comando importante
   tenga también un botón (los _Quick Macros_ ya cubren la mayoría).

---

## 4. Steam con Godot

- Instala los _export templates_, crea presets de Windows y Linux, e integra
  [GodotSteam](https://godotsteam.com/) para logros y overlay. La subida es igual: SteamPipe.
- **Qué se reutiliza:** `src/core` no depende de React, así que el port es mecánico. `content.ts` y
  `balance.ts` pasan a recursos o JSON, y cada función de `actions.ts`, `stats.ts` y
  `simulation.ts` pasa a GDScript con la misma firma. Los tests actuales sirven como
  especificación para verificar que el port da los mismos números.
- **Qué no:** Godot no tiene `break_eternity`. Hace falta una clase mantisa/exponente (hay
  implementaciones de la comunidad), suficiente para números de hasta ~10^(10^15).

---

## 5. Calendario de Steam (lo que más se subestima)

Las reglas cambian, así que verifícalas en la documentación de Steamworks antes de fijar fechas.

- Entre el pago de Steam Direct y el lanzamiento debe pasar un período mínimo (hoy, 30 días).
- La página **"Próximamente"** tiene que estar publicada al menos **2 semanas** antes del
  lanzamiento. Tanto la página como el build pasan una revisión de Valve que tarda algunos días
  hábiles.
- Las **wishlists** deciden la visibilidad del lanzamiento: conviene publicar la página lo antes
  posible y llevar una demo gratuita (es una app separada) a un **Steam Next Fest**.
- Assets de la tienda: cápsulas en varios tamaños, al menos 5 capturas y un tráiler corto.
