import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.9.4:0',
  releaseNotes: {
    en_US: `Updated Crawl4AI to 0.9.4.

**Security**

- 0.9.4 patches three coordinated-disclosure issues: two SSRF paths that bypassed the server's egress controls, and a trust-boundary bypass that let a non-admin client read server environment variables.
- 0.9.3 patches five issues in the PDF path and the playground, including arbitrary file write via PDF image fields, SSRF via PDF redirects, and a playground XSS that could steal the API token.

**Changes**

- Content pruning is about 10x faster.
- A crawl now fails with a timeout after 5 minutes by default (upstream's new limit).
- Browser contexts are recycled after 200 pages for steadier performance under load.

[Full changelog](https://github.com/unclecode/crawl4ai/blob/v0.9.4/CHANGELOG.md)`,
    es_ES: `Crawl4AI actualizado a 0.9.4.

**Seguridad**

- 0.9.4 corrige tres vulnerabilidades divulgadas de forma coordinada: dos rutas de SSRF que eludían los controles de salida del servidor y un bypass de la frontera de confianza que permitía a un cliente sin privilegios de administrador leer variables de entorno del servidor.
- 0.9.3 corrige cinco problemas en la ruta de PDF y el playground, entre ellos escritura arbitraria de archivos mediante campos de imagen de PDF, SSRF a través de redirecciones de PDF y un XSS en el playground que podía robar el token de la API.

**Cambios**

- La poda de contenido es unas 10 veces más rápida.
- Un rastreo ahora falla por tiempo de espera después de 5 minutos de forma predeterminada (nuevo límite de upstream).
- Los contextos del navegador se reciclan tras 200 páginas para un rendimiento más estable bajo carga.

[Registro de cambios completo](https://github.com/unclecode/crawl4ai/blob/v0.9.4/CHANGELOG.md)`,
    de_DE: `Crawl4AI auf 0.9.4 aktualisiert.

**Sicherheit**

- 0.9.4 behebt drei koordiniert gemeldete Schwachstellen: zwei SSRF-Pfade, die die Egress-Kontrollen des Servers umgingen, und eine Umgehung der Vertrauensgrenze, durch die ein Client ohne Admin-Rechte Server-Umgebungsvariablen lesen konnte.
- 0.9.3 behebt fünf Probleme im PDF-Pfad und im Playground, darunter beliebiges Schreiben von Dateien über PDF-Bildfelder, SSRF über PDF-Weiterleitungen und ein XSS im Playground, mit dem das API-Token gestohlen werden konnte.

**Änderungen**

- Das Pruning von Inhalten ist jetzt etwa 10-mal schneller.
- Ein Crawl schlägt jetzt standardmäßig nach 5 Minuten mit einer Zeitüberschreitung fehl (neues Limit von Upstream).
- Browser-Kontexte werden nach 200 Seiten recycelt, für stabilere Leistung unter Last.

[Vollständiges Changelog](https://github.com/unclecode/crawl4ai/blob/v0.9.4/CHANGELOG.md)`,
    pl_PL: `Crawl4AI zaktualizowany do 0.9.4.

**Bezpieczeństwo**

- 0.9.4 naprawia trzy podatności zgłoszone w trybie skoordynowanym: dwie ścieżki SSRF omijające kontrole ruchu wychodzącego serwera oraz obejście granicy zaufania pozwalające klientowi bez uprawnień administratora odczytać zmienne środowiskowe serwera.
- 0.9.3 naprawia pięć problemów w ścieżce PDF i playgroundzie, w tym dowolny zapis plików przez pola obrazów PDF, SSRF przez przekierowania PDF oraz XSS w playgroundzie umożliwiający kradzież tokena API.

**Zmiany**

- Przycinanie treści jest teraz około 10 razy szybsze.
- Indeksowanie kończy się teraz domyślnie przekroczeniem limitu czasu po 5 minutach (nowy limit upstream).
- Konteksty przeglądarki są odtwarzane po 200 stronach, co daje stabilniejszą wydajność pod obciążeniem.

[Pełny dziennik zmian](https://github.com/unclecode/crawl4ai/blob/v0.9.4/CHANGELOG.md)`,
    fr_FR: `Crawl4AI mis à jour vers 0.9.4.

**Sécurité**

- 0.9.4 corrige trois vulnérabilités divulguées de manière coordonnée : deux chemins SSRF contournant les contrôles de sortie du serveur et un contournement de la frontière de confiance permettant à un client sans privilèges d'administrateur de lire les variables d'environnement du serveur.
- 0.9.3 corrige cinq problèmes dans le chemin PDF et le playground, notamment l'écriture arbitraire de fichiers via les champs d'image PDF, une SSRF via les redirections PDF et une XSS dans le playground pouvant dérober le jeton d'API.

**Changements**

- L'élagage du contenu est désormais environ 10 fois plus rapide.
- Un crawl échoue désormais par dépassement de délai après 5 minutes par défaut (nouvelle limite d'amont).
- Les contextes de navigateur sont recyclés après 200 pages pour des performances plus stables sous charge.

[Journal des modifications complet](https://github.com/unclecode/crawl4ai/blob/v0.9.4/CHANGELOG.md)`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
