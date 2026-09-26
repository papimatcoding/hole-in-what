# Hole in What?

Hole in What? es un minigolf arcade 2D mobile-first construido con Phaser 4.2.1 y TypeScript 7.

## Quick start

Prerequisito: **Node.js 22**, la misma versión usada por CI.

```bash
git clone https://github.com/papimatcoding/hole-in-what.git
cd hole-in-what
npm install
npm run dev
```

Para generar y probar una build local:

```bash
npm run build
npm run preview
```

## Scripts disponibles

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Inicia Vite en modo desarrollo accesible desde la red local. |
| `npm run build` | Ejecuta el typecheck de TypeScript y genera la build de producción con Vite. |
| `npm run preview` | Sirve localmente la build de producción generada por Vite. |
| `npm run typecheck` | Ejecuta TypeScript sin emitir archivos para detectar errores de tipos. |
| `npm run test:hole` | Ejecuta las comprobaciones de física del hoyo. |
| `npm run test:tutorial` | Valida la identidad y el comportamiento esperado del tutorial. |
| `npm run test:grassland` | Valida las reglas específicas del capítulo Grassland. |
| `npm run test:mechanics` | Comprueba la integridad de las mecánicas y las reglas de Grassland. |
| `npm run test:mechanic-behavior` | Ejecuta los contratos deterministas de comportamiento de las mecánicas. |
| `npm run test:geometry` | Comprueba la geometría de los campos authored. |
| `npm run test:clearance` | Comprueba márgenes y clearance de los campos y obstáculos. |
| `npm run audit:courses` | Ejecuta el audit de campos y el solver de rutas, bypasses y solvencia. |
| `npm run audit:originality` | Evalúa la originalidad estructural entre niveles. |
| `npm run audit:human` | Ejecuta el modelo humano sintético en modo rápido. |
| `npm run audit:human:full` | Ejecuta el modelo humano sintético en modo completo. |
| `npm run audit:human:strict` | Ejecuta el modelo humano completo con el gate estricto de Audit 2. |
| `npm run audit:design` | Ejecuta el análisis de diseño basado en Audit 2. |
| `npm run audit:3:core` | Ejecuta únicamente el núcleo de Audit 3. |
| `npm run audit:3` | Ejecuta el pipeline rápido de audit humano, diseño, originalidad y Audit 3. |
| `npm run audit:3:full` | Ejecuta el pipeline de Audit 3 usando el modelo humano completo. |
| `npm run audit:3:strict` | Ejecuta el pipeline completo de Audit 3 con su gate estricto activado. |

## Arquitectura

`src/main.ts` crea `Phaser.Game` y registra las escenas en este orden: `BootScene`, `MaintenanceScene`, `UpdateRequiredScene`, `MenuScene`, `PatchNotesScene`, `GlobalSurveyScene`, `PlayerProfileScene`, `AssistanceScene`, `LevelSelectScene`, `GameplayScene`, `ResultsScene`, `CosmeticsScene`, `ShopScene`, `RewardsScene`, `EditorScene`, `LevelPreviewScene`, `CommunityMapsScene`, `CommunityPublishScene` y `CommunityPlayScene`. Las Scenes controlan el flujo de pantallas, la interacción y la presentación del juego.

`src/systems/` concentra la lógica no visual y los servicios compartidos. La física y validación del golf viven en `GolfSimulation.ts` —autoridad del juego—, `CourseRenderer.ts`, `CourseValidation.ts`, `ShotInputSystem.ts`, `StarScoring.ts`, `MovingMechanicSemantics.ts`, `MechanicTutorialSystem.ts` y `AudioFeedback.ts`. Persistencia y estado de producto usan `SaveSystem.ts`, `LiveOpsSystem.ts`, `PatchNotesSystem.ts`, `ProductTelemetrySystem.ts` y `ProductPulseOverlay.ts`. La internacionalización se reparte entre `I18nSystem.ts`, `I18nDictionary.ts` e `I18nSurfaceDictionary.ts`; cosméticos usa `CosmeticRenderer.ts`; Community Maps usa `CommunityMapsSystem.ts` y `CommunityDraftSystem.ts`; y la beta usa `BetaTelemetrySystem.ts`, `BetaFeedbackSystem.ts` y `BetaReportOverlay.ts`.

`src/data/` contiene el contenido y la definición de campaña: `campaign.ts`, `cosmetics.ts`, `progression.ts` y `shopRotation.ts`. Los niveles diseñados a mano viven en `src/data/authored/` mediante `authoring.ts`, `classic.ts`, `classicBlock2.ts` y `hard.ts`; la generación/prototipado procedural vive en `src/data/procedural/` con `campaignGenerator.ts`, `courseUtils.ts` y `gateGrammar.ts`.

`src/config/` agrupa configuración transversal en `beta.ts`, `display.ts`, `product.ts` y `survey.ts`. El proyecto usa Phaser + TypeScript con Vite y no añade un framework de UI adicional.

## Flujo de ramas

El flujo normal es **`feature/**` → `dev` → `main`**. Las ramas `feature/**` contienen el trabajo activo y su validación; `dev` es la beta pública y la fuente de GitHub Pages; `main` representa el release oficial aceptado. El proceso completo, incluidos gates de promoción y rollback, está documentado en [docs/release-process.md](docs/release-process.md).

## Documentación adicional

- [docs/BLOCK_2_DESIGN.md](docs/BLOCK_2_DESIGN.md) — Plan de diseño y authoring de Block 2, con ice, booster, portal, pacing y criterios de aceptación.
- [docs/LEVEL_DESIGN.md](docs/LEVEL_DESIGN.md) — Reglas generales de diseño de niveles, pacing, acceptance gates y flujo de beta.
- [docs/audit-3-map-design.md](docs/audit-3-map-design.md) — Especificación del Map Design Advisor de Audit 3, sus métricas, outcomes y comandos.
- [docs/beta-telemetry.md](docs/beta-telemetry.md) — Contrato de telemetría anónima de beta, privacidad, métricas y calibración del audit.
- [docs/beta-ux-i18n-rc6.md](docs/beta-ux-i18n-rc6.md) — Alcance y validación del trabajo RC6 de DOM UI e internacionalización ES/EN.
- [docs/campaign-audit-2026-08-28.md](docs/campaign-audit-2026-08-28.md) — Certificación y resultados detallados del audit de campaña RC6 del 28 de agosto de 2026.
- [docs/campaign-progression.md](docs/campaign-progression.md) — Orden y progresión de campaña según roles de aprendizaje y pacing, en lugar de dificultad bruta.
- [docs/dev-beta-promotion-checklist.md](docs/dev-beta-promotion-checklist.md) — Checklist de promoción de una feature certificada a la beta pública en `dev`.
- [docs/rc7-product-validation.md](docs/rc7-product-validation.md) — Alcance, cohorte, telemetría, métricas y release gates de la validación de producto RC7.
- [docs/release-process.md](docs/release-process.md) — Proceso completo de ramas, promoción a beta/release, mantenimiento y rollback.
- [docs/repository-rename-2026-08-29.md](docs/repository-rename-2026-08-29.md) — Registro de la migración del repositorio de `troll-golf` a `hole-in-what` y sus compatibilidades.
- [docs/troll-identity-pass.md](docs/troll-identity-pass.md) — Estado del candidato de identidad troll, progresión/prestige, reversibilidad y gates pendientes.
- [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md) — Estado detallado e histórico de handoff trasladado desde el README anterior.

## Estado del proyecto

El estado/handoff detallado del proyecto se conserva en [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md).
