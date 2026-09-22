# 1.1 Data Ingestion with Lakeflow Connect — Teoría (lecciones 1-9)

> Curso: https://customer-academy.databricks.com/learn/courses/2963/data-ingestion-with-lakeflow-connect
> Versión actual del curso: **16 lecciones** (antes eran 19; se quitaron las demos de Auto Loader, JSON y MERGE).
> Hoy (22-sep): lecciones 1-9 · Mañana (23-sep): lecciones 10-16 (JSON, Enterprise/Lakeflow Connect, UC tables, Quiz).

| # | Lección | Tipo | Laboratorio |
|---|---|---|---|
| 1 | Before we get started | Slides | — |
| 2 | Course Logistics Review | HTML | — |
| 3 | Data Engineering in Databricks | Lectura | `00_setup` |
| 4 | Demo: Exploring the Lab Environment | Video | `00_setup` |
| 5 | Data Ingestion from Cloud Storage | Lectura | `01_ctas_read_files` |
| 6 | Demo: Data Ingestion with CREATE TABLE AS and COPY INTO | Video | `01_ctas_read_files`, `02_copy_into` |
| 7 | Appending Metadata Columns on Ingest | Lectura | `03_metadata_columns` |
| 8 | Demo: Adding Metadata Columns During Ingestion | Video | `03_metadata_columns` |
| 9 | Working with the Rescued Data Column | Lectura | `04_rescued_data` |

---

## Lecciones 1-2: Introducción (sirven para el registro del festival)
- **Before we get started:** aviso de que los nombres de producto o de la interfaz pueden haber cambiado. Si ves diferencias, se reportan en help.databricks.com.
- **Course Logistics Review:** el curso trae lecturas y demos. El laboratorio práctico oficial solo viene con la suscripción paga de **Databricks Academy Labs** (con el festival tienes 20% de descuento). Por eso armamos este laboratorio propio en **Databricks Free Edition**.
- Estas dos lecciones **tienen que quedar en ✅**, porque la regla del festival exige que cada parte del curso esté completa.

## Lección 3: Data Engineering in Databricks
**Objetivos de aprendizaje (tomados del curso):**
1. Describir el propósito y los beneficios de **Lakeflow Connect** para ingerir datos a escala en Databricks.
2. Identificar los tipos de conectores: **Standard** y **Managed**.
3. Explicar las técnicas de ingesta: **batch**, **incremental batch** y **streaming**.
4. Elegir el método de ingesta adecuado según los datos y el caso de uso.
5. Repasar los beneficios de las **tablas de Unity Catalog (Delta)** y la **arquitectura Medallion**.

### Lakeflow Connect
Es la capa de ingesta de **Lakeflow**, que tiene tres piezas:
- **Lakeflow Connect**: ingesta.
- **Lakeflow Spark Declarative Pipelines** (antes DLT): transformación.
- **Lakeflow Jobs** (antes Workflows): orquestación.

Lakeflow Connect unifica la ingesta desde archivos, bases de datos y aplicaciones SaaS hacia la **Data Intelligence Platform**, con gobierno de Unity Catalog.

### Tipos de conectores
| Tipo | Qué es | Ejemplos |
|---|---|---|
| **Standard connectors** | Tú escribes la ingesta (SQL o Python) desde almacenamiento en la nube u otras fuentes | `CREATE TABLE AS` + `read_files`, `COPY INTO`, **Auto Loader** (`cloudFiles`), streaming tables, carga de archivos por la interfaz |
| **Managed connectors** | Conectores administrados por Databricks, sin código, con CDC incremental | Salesforce, Workday, ServiceNow, Google Analytics, SQL Server, SharePoint… |

### Técnicas de ingesta
| Técnica | Cómo funciona | Herramienta típica | Cuándo conviene |
|---|---|---|---|
| **Batch** | Relee **todo** en cada ejecución | `CREATE OR REPLACE TABLE AS SELECT … read_files()` | Datos chicos, recargas completas, exploración |
| **Incremental batch** | Carga **solo los archivos nuevos** en cada ejecución (lleva registro de lo ya cargado) | `COPY INTO`, Auto Loader con trigger `availableNow`, streaming tables programadas | Llegan archivos nuevos periódicamente (el caso más común) |
| **Streaming** | Procesa continuamente a medida que llegan los datos | Auto Loader / Structured Streaming con trigger continuo | Baja latencia |

**Idea clave para el examen:** `CTAS` **no es idempotente** en lo incremental: vuelve a leer todo. `COPY INTO` **sí es idempotente**: lleva registro de los archivos cargados y no los repite, salvo que uses `'force'='true'`.

### Delta Lake y tablas de Unity Catalog
- **Delta Lake** = archivos Parquet + **transaction log** (`_delta_log`). Da transacciones ACID, *time travel* (`VERSION AS OF`), `DESCRIBE HISTORY`, *schema enforcement* y *schema evolution*.
- **Namespace de 3 niveles:** `catalog.schema.table`. Los archivos crudos viven en **Volumes**: `/Volumes/<catalog>/<schema>/<volume>/…`.
- Tablas **managed** (UC administra los datos) vs **external** (los datos están en una ubicación tuya).

### Arquitectura Medallion
- 🥉 **Bronze**: datos crudos tal como llegan, más metadatos de ingesta (archivo de origen, timestamp).
- 🥈 **Silver**: datos limpios, validados y deduplicados, con tipos correctos.
- 🥇 **Gold**: agregados listos para negocio y BI.

Este curso trabaja casi todo en la capa **Bronze**.

## Lección 4: Demo — Exploring the Lab Environment
- **Catalog Explorer**: navegar catálogos, schemas, tablas y volúmenes.
- Subir y listar archivos en un **Volume** (`LIST '/Volumes/…'` o `dbutils.fs.ls`).
- Cómputo **serverless** para notebooks y SQL.
- 👉 Para practicarlo: `notebooks/00_setup.py` y explorar lo que crea en Catalog Explorer.

## Lección 5: Data Ingestion from Cloud Storage
Hay tres formas de leer archivos desde almacenamiento en la nube o Volumes:

1. **Consulta directa al path**: `SELECT * FROM csv.\`/Volumes/.../\`` es rápida pero limitada. En CSV no maneja el header, así que aparecen columnas `_c0`, `_c1`…
2. **`read_files()`** (función de tabla, **la recomendada**):
   - Infiere el esquema y acepta opciones: `format`, `header`, `schema`, `schemaHints`, `rescuedDataColumn`, `mode`…
   - Soporta CSV, JSON, Parquet, Avro, ORC, XML y texto.
   - Agrega por defecto la columna `_rescued_data` cuando infiere el esquema.
3. **CTAS** (`CREATE TABLE … AS SELECT … FROM read_files(...)`): crea una tabla Delta en una sola sentencia. El esquema se deriva de la consulta. Es batch: hace una lectura completa en cada ejecución.

**COPY INTO:**
```sql
CREATE TABLE IF NOT EXISTS mi_tabla;          -- se puede crear sin esquema
COPY INTO mi_tabla
FROM '/Volumes/cat/sch/vol/carpeta/'
FILEFORMAT = CSV
FORMAT_OPTIONS ('header' = 'true', 'inferSchema' = 'true')
COPY_OPTIONS ('mergeSchema' = 'true');        -- evolución de esquema
```
- Es **idempotente**: si lo vuelves a ejecutar, carga 0 filas si no hay archivos nuevos.
- `COPY_OPTIONS ('force' = 'true')` recarga todo y puede generar duplicados.
- Sirve para miles de archivos. Para millones, o para streaming, conviene **Auto Loader**.

## Lección 6: Demo — CTAS y COPY INTO
👉 `notebooks/01_ctas_read_files.sql` y `notebooks/02_copy_into.sql`.

## Lección 7: Appending Metadata Columns on Ingest
- Todas las fuentes basadas en archivos exponen la columna oculta **`_metadata`** (un struct). Aparece solo si la seleccionas de forma explícita.
  - `_metadata.file_path`, `_metadata.file_name`, `_metadata.file_size`, `_metadata.file_modification_time`, `_metadata.file_block_start`, `_metadata.file_block_length`.
- Es buena práctica en Bronze agregar:
  - `_metadata.file_name AS source_file`
  - `_metadata.file_modification_time AS file_mod_time`
  - `current_timestamp() AS ingested_at`
- Sirve para **linaje**, auditoría, depuración ("¿de qué archivo vino esta fila rota?") y deduplicación.
- En `COPY INTO` se usa con una subconsulta: `COPY INTO t FROM (SELECT *, _metadata.file_name AS source_file FROM '/path')`.

## Lección 8: Demo — Adding Metadata Columns During Ingestion
👉 `notebooks/03_metadata_columns.sql`.

## Lección 9: Working with the Rescued Data Column
- **`_rescued_data`** es una columna STRING en formato JSON. Guarda lo que **no encaja** con el esquema, en lugar de perderlo o hacer fallar la carga:
  - Valores con **tipo incorrecto**, por ejemplo `"abc"` en una columna INT.
  - **Columnas que no existen** en el esquema definido.
  - Columnas cuyo nombre coincide pero con distinto uso de mayúsculas y minúsculas.
- Incluye la clave `_file_path` con el archivo de origen.
- Viene activada por defecto en `read_files` y Auto Loader cuando se infiere el esquema. Con un esquema explícito se activa con `rescuedDataColumn => '_rescued_data'`.
- Modos de parseo:
  - `PERMISSIVE` (por defecto): pone null y rescata el valor.
  - `DROPMALFORMED`: descarta la fila.
  - `FAILFAST`: falla la carga.
- Patrón típico:
  1. Filtrar `WHERE _rescued_data IS NOT NULL` y mandar esas filas a una tabla de **cuarentena**.
  2. Extraer valores con `_rescued_data:campo`.
  3. Corregir y reprocesar.

---

## Preguntas tipo examen (DE Associate)
1. **Recargas un CTAS con `read_files` y llegan 2 archivos nuevos. ¿Qué pasa?** Vuelve a leer **todos** los archivos (batch completo).
2. **Ejecutas `COPY INTO` dos veces seguidas sin archivos nuevos. ¿Cuántas filas carga la segunda vez?** **0**, porque es idempotente.
3. **¿Cómo registras de qué archivo viene cada fila?** Con `_metadata.file_name` o `_metadata.file_path`.
4. **Un CSV trae `"N/A"` en una columna DATE, con esquema explícito y modo PERMISSIVE. ¿Qué pasa?** La columna queda `NULL` y el valor original va a `_rescued_data`.
5. **Standard vs Managed connector para traer datos de Salesforce sin código:** **Managed**.
6. **¿En qué capa Medallion van los datos crudos con metadatos de ingesta?** En **Bronze**.
