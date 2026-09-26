# Auditoría de identidad troll — bloqueada

**Rama:** `feature/troll-identity-audit-pass`  
**Base verificada:** `dev` y esta rama apuntaban a `88ee0bd1d29d234f8ec4ff2a9747733e97ef8869` al inicio.  
**Fecha:** 2026-09-26

## Tabla resumen

La campaña cargada por `src/data/campaign.ts` contiene 21 niveles: Classic C01–C16 y Troll/HARD H01–H05. No hay una colección independiente de niveles Grassland en ese punto de carga; Grassland aparece como capítulo/progresión y como identidad de algunos niveles Classic. La clasificación siguiente no es una decisión de rediseño: queda pendiente porque no pudo producirse la auditoría obligatoria sobre el estado actual.

| Nivel | Categoría | Motivo |
| --- | --- | --- |
| C01 | PENDIENTE DE DECISIÓN HUMANA | No existe salida de la auditoría actual: `audit:courses` no pudo arrancar por falta de `tsx`. |
| C02 | PENDIENTE DE DECISIÓN HUMANA | No existe salida de la auditoría actual: `audit:courses` no pudo arrancar por falta de `tsx`. |
| C03 | PENDIENTE DE DECISIÓN HUMANA | No existe salida de la auditoría actual: `audit:courses` no pudo arrancar por falta de `tsx`. |
| C04 | PENDIENTE DE DECISIÓN HUMANA | No existe salida de la auditoría actual: `audit:courses` no pudo arrancar por falta de `tsx`. |
| C05 | PENDIENTE DE DECISIÓN HUMANA | No existe salida de la auditoría actual: `audit:courses` no pudo arrancar por falta de `tsx`. |
| C06 | PENDIENTE DE DECISIÓN HUMANA | No existe salida de la auditoría actual: `audit:courses` no pudo arrancar por falta de `tsx`. |
| C07 | PENDIENTE DE DECISIÓN HUMANA | No existe salida de la auditoría actual: `audit:courses` no pudo arrancar por falta de `tsx`. |
| C08 | PENDIENTE DE DECISIÓN HUMANA | No existe salida de la auditoría actual: `audit:courses` no pudo arrancar por falta de `tsx`. |
| C09 | PENDIENTE DE DECISIÓN HUMANA | No existe salida de la auditoría actual: `audit:courses` no pudo arrancar por falta de `tsx`. |
| C10 | PENDIENTE DE DECISIÓN HUMANA | No existe salida de la auditoría actual: `audit:courses` no pudo arrancar por falta de `tsx`. |
| C11 | PENDIENTE DE DECISIÓN HUMANA | No existe salida de la auditoría actual: `audit:courses` no pudo arrancar por falta de `tsx`. |
| C12 | PENDIENTE DE DECISIÓN HUMANA | No existe salida de la auditoría actual: `audit:courses` no pudo arrancar por falta de `tsx`. |
| C13 | PENDIENTE DE DECISIÓN HUMANA | No existe salida de la auditoría actual: `audit:courses` no pudo arrancar por falta de `tsx`. |
| C14 | PENDIENTE DE DECISIÓN HUMANA | No existe salida de la auditoría actual: `audit:courses` no pudo arrancar por falta de `tsx`. |
| C15 | PENDIENTE DE DECISIÓN HUMANA | No existe salida de la auditoría actual: `audit:courses` no pudo arrancar por falta de `tsx`. |
| C16 | PENDIENTE DE DECISIÓN HUMANA | No existe salida de la auditoría actual: `audit:courses` no pudo arrancar por falta de `tsx`. |
| H01 | PENDIENTE DE DECISIÓN HUMANA | No existe salida de la auditoría actual: `audit:courses` no pudo arrancar por falta de `tsx`. |
| H02 | PENDIENTE DE DECISIÓN HUMANA | No existe salida de la auditoría actual: `audit:courses` no pudo arrancar por falta de `tsx`. |
| H03 | PENDIENTE DE DECISIÓN HUMANA | No existe salida de la auditoría actual: `audit:courses` no pudo arrancar por falta de `tsx`. |
| H04 | PENDIENTE DE DECISIÓN HUMANA | No existe salida de la auditoría actual: `audit:courses` no pudo arrancar por falta de `tsx`. |
| H05 | PENDIENTE DE DECISIÓN HUMANA | No existe salida de la auditoría actual: `audit:courses` no pudo arrancar por falta de `tsx`. |

| Categoría | Niveles |
| --- | ---: |
| MANTENER | 0 |
| PULIDO MENOR | 0 |
| REWORK MAYOR | 0 |
| PENDIENTE DE DECISIÓN HUMANA | 21 |

## Bloqueo del pipeline obligatorio

El pipeline se detuvo en su primer comando, ejecutado con `FULL_AUDIT=1` en la sesión de PowerShell:

```text
> hole-in-what@0.1.0 audit:courses
> tsx scripts/courseAudit.ts

"tsx" no se reconoce como un comando interno o externo,
programa o archivo por lotes ejecutable.
```

Comprobaciones de solo lectura posteriores:

- `package.json` declara `tsx` en `devDependencies` con versión `4.20.3`.
- No existen `node_modules` ni `node_modules/.bin/tsx` en este checkout.
- `npm install --package-lock=false` terminó sin salida y no creó `node_modules`; no se aplicó ningún método alternativo ni cambio de configuración.

Por la instrucción de parar ante un fallo, **no se ejecutaron** estos comandos:

```text
npm run audit:human:full
npm run audit:design
npm run audit:originality
npm run test:geometry
npm run test:clearance
npm run test:mechanics
npm run test:mechanic-behavior
```

### Pendiente de decisión humana

Restaurar una instalación de dependencias que proporcione `tsx` en este checkout y autorizar la repetición completa del pipeline desde `FULL_AUDIT=1 npm run audit:courses`. Hasta entonces no hay evidencia actual suficiente para asignar MANTENER, PULIDO MENOR o REWORK MAYOR a ningún nivel.

## PRs de contenido abiertas solicitadas

No se inspeccionaron los diffs de las PR #35 (`feature/grassland-trap-audit-v2`) ni #28 (`feature/geometry-variety-pass-1`). La regla de parada se activó antes de esa revisión; por tanto, este informe no atribuye cobertura ni conclusiones a ninguna de las dos y no duplica su análisis.

## Cruce limitado con `docs/PROJECT_STATE.md`

El estado documenta feedback externo histórico no-DEV en el que C01–C03 se percibían demasiado planos y C06 era original pero con baja diversión; C04/C05/C07 y H04/H05 eran referencias más sanas. También documenta reworks y certificaciones de candidatos anteriores para C01–C03 y C06.

Ese material no sustituye las salidas del pipeline exigido sobre `88ee0bd`: contiene datos de snapshots/candidatos anteriores y el propio documento exige una auditoría completa antes de aceptar cambios de niveles. Por ello se conserva como señal de priorización, no como base para clasificar el estado actual.

## Prioridad limitada por datos disponibles

Cuando se repare el entorno de auditoría, los primeros cuatro niveles a revisar con sus resultados actuales son **C01, C02, C03 y C06**. Es la única prioridad respaldada por el feedback externo documentado; no implica todavía modificar geometría, mecánicas ni datos.

## Integridad de esta tarea

No se modificaron geometría, mecánicas ni datos de niveles. El único archivo creado o modificado para esta tarea es este informe.
