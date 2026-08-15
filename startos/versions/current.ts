import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.9.2:0',
  releaseNotes: {
    en_US: `Bumped the upstream image to \`unclecode/crawl4ai:0.9.2\`, a maintenance release with no breaking changes. Fixes:
- The image now ships Playwright's \`chrome-headless-shell\` binary, which 0.9.1 omitted. This package's symlink workaround for that regression has been removed — the real binary is used instead.
- The playground's "Advanced Config" no longer fails with \`400\`; \`/config/dump\` requests now send the config \`type\` alongside the code.
- The dashboard's monitor WebSocket (\`/monitor/ws\`) no longer fails with \`500\` under token auth; authentication is handled by the auth-gate middleware, and destructive monitor actions keep their admin-scope check.
- Closing a streaming crawl mid-flight no longer leaks background tasks, browser contexts, and pages, which could produce stray \`TargetClosedError\`s on a later crawl.

[Full upstream release notes](https://github.com/unclecode/crawl4ai/releases/tag/v0.9.2)`,
    es_ES: `Actualizada la imagen upstream a \`unclecode/crawl4ai:0.9.2\`, una versión de mantenimiento sin cambios incompatibles. Correcciones:
- La imagen ahora incluye el binario \`chrome-headless-shell\` de Playwright, que 0.9.1 omitía. Se eliminó el symlink que este paquete usaba como solución temporal — ahora se usa el binario real.
- La "Configuración avanzada" del playground ya no falla con \`400\`; las peticiones a \`/config/dump\` ahora envían el \`type\` de configuración junto con el código.
- El WebSocket del monitor del dashboard (\`/monitor/ws\`) ya no falla con \`500\` bajo autenticación por token; la autenticación la gestiona el middleware del auth gate, y las acciones destructivas del monitor mantienen su comprobación de ámbito admin.
- Cerrar un crawl en streaming a mitad de ejecución ya no deja tareas en segundo plano, contextos de navegador ni páginas colgadas, lo que podía producir \`TargetClosedError\` espurios en un crawl posterior.

[Notas de la release upstream completas](https://github.com/unclecode/crawl4ai/releases/tag/v0.9.2)`,
    de_DE: `Upstream-Image auf \`unclecode/crawl4ai:0.9.2\` angehoben, ein Wartungsrelease ohne Breaking Changes. Fehlerbehebungen:
- Das Image enthält jetzt Playwrights \`chrome-headless-shell\`-Binary, das in 0.9.1 fehlte. Der Symlink-Workaround dieses Pakets wurde entfernt — es wird nun das echte Binary verwendet.
- Die „Erweiterte Konfiguration" des Playgrounds schlägt nicht mehr mit \`400\` fehl; \`/config/dump\`-Anfragen senden jetzt den Konfigurations-\`type\` zusammen mit dem Code.
- Der Monitor-WebSocket des Dashboards (\`/monitor/ws\`) schlägt unter Token-Authentifizierung nicht mehr mit \`500\` fehl; die Authentifizierung übernimmt die Auth-Gate-Middleware, destruktive Monitor-Aktionen behalten ihre Admin-Scope-Prüfung.
- Das Schließen eines laufenden Streaming-Crawls hinterlässt keine Hintergrund-Tasks, Browser-Kontexte und Seiten mehr, was bei einem späteren Crawl vereinzelt \`TargetClosedError\` verursachen konnte.

[Vollständige Upstream-Release-Notes](https://github.com/unclecode/crawl4ai/releases/tag/v0.9.2)`,
    pl_PL: `Zaktualizowano obraz upstream do \`unclecode/crawl4ai:0.9.2\`, wydania konserwacyjnego bez zmian łamiących zgodność. Poprawki:
- Obraz zawiera teraz binarium \`chrome-headless-shell\` Playwrighta, którego brakowało w 0.9.1. Obejście z symlinkiem stosowane przez ten pakiet zostało usunięte — używane jest prawdziwe binarium.
- „Zaawansowana konfiguracja" w playgroundzie nie zwraca już \`400\`; żądania do \`/config/dump\` przesyłają teraz \`type\` konfiguracji razem z kodem.
- WebSocket monitora w dashboardzie (\`/monitor/ws\`) nie zwraca już \`500\` przy uwierzytelnianiu tokenem; uwierzytelnianie obsługuje middleware auth gate, a destrukcyjne akcje monitora zachowują sprawdzanie zakresu admin.
- Zamknięcie strumieniowego crawla w trakcie działania nie pozostawia już zadań w tle, kontekstów przeglądarki ani stron, co mogło powodować przypadkowe \`TargetClosedError\` przy kolejnym crawlu.

[Pełne notatki wydania upstream](https://github.com/unclecode/crawl4ai/releases/tag/v0.9.2)`,
    fr_FR: `Image amont mise à niveau vers \`unclecode/crawl4ai:0.9.2\`, une version de maintenance sans changement incompatible. Corrections :
- L'image intègre désormais le binaire \`chrome-headless-shell\` de Playwright, absent en 0.9.1. Le contournement par symlink de ce paquet a été supprimé — le vrai binaire est utilisé.
- La « Configuration avancée » du playground ne renvoie plus \`400\` ; les requêtes \`/config/dump\` envoient maintenant le \`type\` de configuration avec le code.
- Le WebSocket du moniteur du dashboard (\`/monitor/ws\`) ne renvoie plus \`500\` avec l'authentification par jeton ; l'authentification est assurée par le middleware du portail d'auth, et les actions destructrices du moniteur conservent leur contrôle de portée admin.
- Fermer un crawl en streaming en cours ne laisse plus de tâches d'arrière-plan, de contextes de navigateur ni de pages actifs, ce qui pouvait produire des \`TargetClosedError\` parasites lors d'un crawl ultérieur.

[Notes de version amont complètes](https://github.com/unclecode/crawl4ai/releases/tag/v0.9.2)`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
