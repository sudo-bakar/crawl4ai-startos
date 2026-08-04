import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.9.1:2',
  releaseNotes: {
    en_US: `Bumped the upstream image to \`unclecode/crawl4ai:0.9.1\` and patched two regressions. Fixes:
- The 0.9.1 image bakes the full \`chromium-1228\` binary but Playwright in 0.9.1 looks for \`chromium_headless_shell-1228\`, which upstream forgot to \`playwright install\`. Without this, the FastAPI worker crashes at startup with \`BrowserType.launch: Executable doesn't exist\` and the service never reaches \`ready\`. This package now symlinks the missing path to the existing full Chromium binary (which accepts \`--headless=new\`), so crawls, the API, and MCP all work.
- The 0.9.1 image bakes \`chromium-1228\` (not \`chromium-1223\`); the old docs referenced the wrong path.
- The "Open" button now opens \`/playground\` directly. The \`/monitor\` UI page was renamed to \`/dashboard\` upstream; docs updated to match.
- Redis no longer errors with \`Permission denied\` on every RDB save (background saving) — supervisord now passes \`--dir /var/lib/redis\`, so the snapshot lands in a writable directory the image pre-creates as \`appuser\`. Resolves the constant \`MISCONF Redis is configured to save RDB snapshots…\` log spam and the ~10 s SIGKILL wait on every stop.
- Supervisord pidfile moved to \`/tmp/supervisord.pid\` (was CWD-relative \`/app/supervisord.pid\`, which \`appuser\` cannot write because the image makes \`/app\` read-only on purpose).
- \`dashboard\`, \`playground\`, and \`/static\` now serve the UI shell through the auth gate without \`401\`, so they load through the StartOS reverse proxy without an \`Authorization\` header on the top-level navigation.
- \`page_timeout\` is now interpreted in seconds (was milliseconds, effectively disabling HTTP-mode timeouts).
- \`PruningContentFilter\` gained \`preserve_classes\` / \`preserve_tags\` (opt-in metadata whitelist).
- Several smaller Docker reliability fixes: rate-limit Redis storage auth, FastAPI pinned below 0.137, browser context cleanup, \`lxml\` ceiling widened to allow 6.x.

[Full upstream release notes](https://github.com/unclecode/crawl4ai/compare/v0.9.0...v0.9.1)`,
    es_ES: `Actualizada la imagen upstream a \`unclecode/crawl4ai:0.9.1\` y parcheadas dos regresiones. Correcciones:
- La imagen 0.9.1 incluye el binario completo \`chromium-1228\` pero Playwright en 0.9.1 busca \`chromium_headless_shell-1228\`, que upstream olvidó instalar con \`playwright install\`. Sin esto, el worker de FastAPI crashea al arrancar con \`BrowserType.launch: Executable doesn't exist\` y el servicio nunca alcanza el estado \`ready\`. Este paquete ahora crea un symlink desde la ruta faltante al binario completo de Chromium (que acepta \`--headless=new\`), por lo que los crawls, la API y MCP funcionan correctamente.
- La imagen 0.9.1 incluye \`chromium-1228\` (no \`chromium-1223\`); la documentación anterior referenciaba la ruta incorrecta.
- El botón "Open" ahora abre \`/playground\` directamente. La página UI \`/monitor\` fue renombrada a \`/dashboard\` upstream; la documentación fue actualizada para coincidir.
- Redis ya no responde con \`Permission denied\` en cada guardado RDB (background saving) — supervisord ahora pasa \`--dir /var/lib/redis\`, por lo que la instantánea cae en un directorio escribible que la imagen pre-crea como \`appuser\`. Resuelve el spam constante en logs de \`MISCONF Redis is configured to save RDB snapshots…\` y la espera de ~10 s por SIGKILL en cada parada.
- El pidfile de supervisord se trasladó a \`/tmp/supervisord.pid\` (antes relativo al CWD como \`/app/supervisord.pid\`, que \`appuser\` no podía escribir porque la imagen deja \`/app\` como solo lectura a propósito).
- \`dashboard\`, \`playground\` y \`/static\` ahora sirven el shell de la UI a través del auth gate sin \`401\`, por lo que cargan a través del proxy inverso de StartOS sin un encabezado \`Authorization\` en la navegación de nivel superior.
- \`page_timeout\` ahora se interpreta en segundos (antes en milisegundos, lo que en la práctica deshabilitaba los timeouts en modo HTTP).
- \`PruningContentFilter\` ganó \`preserve_classes\` / \`preserve_tags\` (lista blanca de metadatos opcional).
- Varias correcciones menores de confiabilidad de Docker: auth del almacenamiento Redis del rate limiter, FastAPI fijado por debajo de 0.137, limpieza del contexto del navegador, techo de \`lxml\` ampliado para permitir 6.x.

[Notas de la release upstream completas](https://github.com/unclecode/crawl4ai/compare/v0.9.0...v0.9.1)`,
    de_DE: `Upstream-Image auf \`unclecode/crawl4ai:0.9.1\` angehoben und zwei Regressionen gepatched. Fehlerbehebungen:
- Das 0.9.1-Image enthält das vollständige \`chromium-1228\`-Binary, aber Playwright in 0.9.1 sucht nach \`chromium_headless_shell-1228\`, das upstream vergessen hat, mit \`playwright install\` zu installieren. Ohne diesen Fix stürzt der FastAPI-Worker beim Start mit \`BrowserType.launch: Executable doesn't exist\` ab und der Dienst erreicht nie den Status \`ready\`. Dieses Paket erstellt nun einen Symlink vom fehlenden Pfad zum vorhandenen vollständigen Chromium-Binary (das \`--headless=new\` akzeptiert), sodass Crawls, API und MCP funktionieren.
- Das 0.9.1-Image enthält \`chromium-1228\` (nicht \`chromium-1223\`); die alte Dokumentation verwies auf den falschen Pfad.
- Der „Open"-Button öffnet nun direkt \`/playground\`. Die UI-Seite \`/monitor\` wurde upstream in \`/dashboard\` umbenannt; die Dokumentation wurde entsprechend angepasst.
- Redis reagiert nicht mehr bei jedem RDB-Speichern (Background Saving) mit \`Permission denied\` — supervisord übergibt nun \`--dir /var/lib/redis\`, sodass der Snapshot in einem beschreibbaren Verzeichnis landet, das das Image als \`appuser\` vorab anlegt. Behebt das ständige \`MISCONF Redis is configured to save RDB snapshots…\`-Log-Spam und das ~10 s SIGKILL-Warten bei jedem Stopp.
- Die supervisord-Pidfile wurde nach \`/tmp/supervisord.pid\` verschoben (zuvor CWD-relativ als \`/app/supervisord.pid\`, das \`appuser\` nicht schreiben konnte, weil das Image \`/app\` absichtlich schreibgeschützt hält).
- \`dashboard\`, \`playground\` und \`/static\` liefern das UI-Gerüst jetzt durch das Auth-Gate ohne \`401\` aus, sodass sie über den StartOS-Reverse-Proxy ohne \`Authorization\`-Header bei der Top-Level-Navigation laden.
- \`page_timeout\` wird jetzt in Sekunden interpretiert (vorher Millisekunden, was HTTP-Modus-Timeouts faktisch deaktivierte).
- \`PruningContentFilter\` erhielt \`preserve_classes\` / \`preserve_tags\` (opt-in Metadaten-Whitelist).
- Mehrere kleinere Docker-Zuverlässigkeitskorrekturen: Authentifizierung des Rate-Limiter-Redis-Storage, FastAPI unter 0.137 gepinnt, Browser-Kontext-Cleanup, \`lxml\`-Obergrenze erweitert für 6.x.

[Vollständige Upstream-Release-Notes](https://github.com/unclecode/crawl4ai/compare/v0.9.0...v0.9.1)`,
    pl_PL: `Zaktualizowano obraz upstream do \`unclecode/crawl4ai:0.9.1\` i załatano dwie regresje. Poprawki:
- Obraz 0.9.1 zawiera pełne binarium \`chromium-1228\`, ale Playwright w 0.9.1 szuka \`chromium_headless_shell-1228\`, które upstream zapomniał zainstalować przez \`playwright install\`. Bez tej poprawki worker FastAPI wysypuje się przy starcie z \`BrowserType.launch: Executable doesn't exist\` i usługa nigdy nie osiąga statusu \`ready\`. Ten pakiet tworzy teraz symlink z brakującej ścieżki do istniejącego pełnego binarium Chromium (które akceptuje \`--headless=new\`), dzięki czemu crawle, API i MCP działają.
- Obraz 0.9.1 zawiera \`chromium-1228\` (nie \`chromium-1223\`); poprzednia dokumentacja wskazywała błędną ścieżkę.
- Przycisk „Open" otwiera teraz bezpośrednio \`/playground\`. Strona UI \`/monitor\` została upstream przemianowana na \`/dashboard\`; dokumentacja została zaktualizowana, aby to odzwierciedlać.
- Redis nie zwraca już \`Permission denied\` przy każdym zapisie RDB (background saving) — supervisord przekazuje teraz \`--dir /var/lib/redis\`, więc snapshot trafia do katalogu z prawem zapisu, który obraz wstępnie tworzy jako \`appuser\`. Rozwiązuje ciągły spam w logach \`MISCONF Redis is configured to save RDB snapshots…\` oraz ~10 s oczekiwania na SIGKILL przy każdym zatrzymaniu.
- Plik pidfile supervisorda przeniesiono do \`/tmp/supervisord.pid\` (wcześniej względem CWD jako \`/app/supervisord.pid\`, którego \`appuser\` nie mógł zapisać, ponieważ obraz celowo czyni \`/app\` tylko do odczytu).
- \`dashboard\`, \`playground\` i \`/static\` teraz serwują szkielet UI przez auth gate bez \`401\`, więc ładują się przez odwrotny proxy StartOS bez nagłówka \`Authorization\` w nawigacji najwyższego poziomu.
- \`page_timeout\` jest teraz interpretowany w sekundach (wcześniej w milisekundach, co w praktyce wyłączało timeouty w trybie HTTP).
- \`PruningContentFilter\` zyskał \`preserve_classes\` / \`preserve_tags\` (opcjonalna biała lista metadanych).
- Kilka mniejszych poprawek niezawodności Dockera: auth magazynu Redis rate-limita, FastAPI przypięte poniżej 0.137, czyszczenie kontekstu przeglądarki, górny limit \`lxml\` rozszerzony o 6.x.

[Pełne notatki wydania upstream](https://github.com/unclecode/crawl4ai/compare/v0.9.0...v0.9.1)`,
    fr_FR: `Image amont mise à niveau vers \`unclecode/crawl4ai:0.9.1\` et correction de deux régressions. Corrections :
- L'image 0.9.1 intègre le binaire complet \`chromium-1228\` mais Playwright en 0.9.1 cherche \`chromium_headless_shell-1228\`, qu'upstream a oublié d'installer via \`playwright install\`. Sans cela, le worker FastAPI se bloque au démarrage avec \`BrowserType.launch: Executable doesn't exist\` et le service n'atteint jamais l'état \`ready\`. Ce paquet crée maintenant un symlink du chemin manquant vers le binaire Chromium complet existant (qui accepte \`--headless=new\`), afin que les crawls, l'API et MCP fonctionnent.
- L'image 0.9.1 intègre \`chromium-1228\` (et non \`chromium-1223\`) ; l'ancienne documentation indiquait le mauvais chemin.
- Le bouton « Open » ouvre désormais directement \`/playground\`. La page UI \`/monitor\` a été renommée en \`/dashboard\` côté upstream ; la documentation a été mise à jour en conséquence.
- Redis ne renvoie plus \`Permission denied\` à chaque sauvegarde RDB (background saving) — supervisord passe désormais \`--dir /var/lib/redis\`, donc le snapshot atterrit dans un répertoire inscriptible que l'image pré-crée pour \`appuser\`. Résout le spam continu dans les logs \`MISCONF Redis is configured to save RDB snapshots…\` et l'attente de ~10 s SIGKILL à chaque arrêt.
- Le pidfile supervisord a été déplacé vers \`/tmp/supervisord.pid\` (auparavant relatif au CWD comme \`/app/supervisord.pid\`, que \`appuser\` ne pouvait pas écrire car l'image rend \`/app\` intentionnellement en lecture seule).
- \`dashboard\`, \`playground\` et \`/static\` servent désormais la coque UI à travers le portail d'auth sans \`401\`, donc ils se chargent à travers le proxy inverse StartOS sans en-tête \`Authorization\` sur la navigation de premier niveau.
- \`page_timeout\` est désormais interprété en secondes (auparavant en millisecondes, ce qui désactivait en pratique les timeouts en mode HTTP).
- \`PruningContentFilter\` a gagné \`preserve_classes\` / \`preserve_tags\` (liste blanche de métadonnées optionnelle).
- Plusieurs corrections mineures de fiabilité Docker : auth du stockage Redis du rate limiter, FastAPI épinglé sous 0.137, nettoyage du contexte du navigateur, plafond \`lxml\` élargi pour permettre 6.x.

[Notes de version amont complètes](https://github.com/unclecode/crawl4ai/compare/v0.9.0...v0.9.1)`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
