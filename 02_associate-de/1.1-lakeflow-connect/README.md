# Lab 1.1 — Data Ingestion with Lakeflow Connect (día 1 · 22-sep)

Laboratorio práctico para las **lecciones 1-9** del curso [Data Ingestion with Lakeflow Connect](https://customer-academy.databricks.com/learn/courses/2963/data-ingestion-with-lakeflow-connect).
El curso gratuito no trae laboratorio (ese viene con Academy Labs, que es pago), así que este lo reemplaza usando **Databricks Free Edition**.

## Contenido
```
1.1-lakeflow-connect/
├── README.md                 ← estás aquí
├── teoria.md                 ← resumen de las lecciones 1-9 + preguntas tipo examen
├── notebooks/
│   ├── 00_setup.py           ← crea schema, volume y datos de ejemplo (ejecutar primero)
│   ├── 01_ctas_read_files.sql← lecciones 5-6: consulta directa, read_files, CTAS, Parquet, historial Delta
│   ├── 02_copy_into.sql      ← lección 6: COPY INTO incremental e idempotente, force
│   ├── 03_metadata_columns.sql ← lecciones 7-8: _metadata, source_file, ingested_at
│   ├── 04_rescued_data.sql   ← lección 9: _rescued_data, cuarentena, modos de parseo
│   └── 05_reto.sql           ← reto del día (JSON + COPY INTO)
├── soluciones/05_reto_soluciones.sql
└── lab_1.1_notebooks.zip     ← todos los notebooks, para importarlos de una vez
```

## Paso a paso

### 1. Crear la cuenta de Databricks Free Edition (una sola vez)
1. Entra a https://www.databricks.com/learn/free-edition y regístrate. Es gratis y no pide tarjeta.
2. Te crea un workspace con **cómputo serverless** y **Unity Catalog**, que incluye el catálogo `workspace`.

### 2. Importar los notebooks
1. En el workspace: **Workspace** → tu carpeta de usuario → botón **⋮ / Import**.
2. Sube `lab_1.1_notebooks.zip` (o los archivos `.py` y `.sql` sueltos).
3. Abre `00_setup` → conecta el cómputo **Serverless** → **Run all**.

### 3. Orden de estudio de hoy (19:00 a 21:30)
| Hora | Curso (Academy) | Laboratorio |
|---|---|---|
| 19:00 | Lecciones 1-2 (intro), **déjalas en OK** | — |
| 19:10 | Lección 3 Data Engineering in Databricks + lección 4 Demo | `00_setup` y explorar Catalog |
| 19:40 | Lección 5 Cloud Storage + lección 6 Demo CTAS/COPY INTO | `01_ctas_read_files`, `02_copy_into` |
| 20:30 | Lecciones 7-8 Metadata Columns | `03_metadata_columns` |
| 20:55 | Lección 9 Rescued Data | `04_rescued_data` |
| 21:15 | Reto + apuntes en `../apuntes.md` | `05_reto` |

### 4. Resultados esperados (para comprobar que vas bien)
| Notebook | Comprobación |
|---|---|
| 01 | `bronze_customers_ctas` = **10** filas; re-ejecutar el CTAS sigue dando 10 |
| 02 | 1ª carga: 10 · 2ª: **0** · con el archivo nuevo: **3** · total **13** · `force` genera duplicados |
| 03 | 2 archivos en `source_file` con 5 filas cada uno |
| 04 | 6 filas en total; en cuarentena quedan la fila con `abc`, la de `N/A` y las 2 que traen `phone` |
| 05 | `bronze_orders` = 40 · `COPY INTO` repetido = 0 · con el archivo nuevo = +5 |

### 5. Limpiar (opcional)
```sql
DROP SCHEMA workspace.lakeflow_lab CASCADE;
```

## Notas
- Todo corre en **serverless**. Si Free Edition no te deja crear el schema en `workspace`, cambia `CATALOG` en `00_setup` por uno donde tengas permisos.
- El notebook `02_copy_into` modifica la landing zone (copia un archivo). Para repetirlo desde cero, vuelve a ejecutar `00_setup`.
- La lección de JSON y la de **Lakeflow Connect managed connectors** (Salesforce, SQL Server, etc.) son de mañana (lecciones 10-16). Los managed connectors no suelen estar disponibles en Free Edition; esa parte es teórica.
