# Databricks Advanced Learning Festival 2026

Laboratorio personal de preparación para tres rutas de aprendizaje del [Databricks Advanced Learning Festival](https://community.databricks.com/t5/learning-events/databricks-advanced-learning-festival-september-16-october-14/ev-p/166157) (16 de septiembre al 14 de octubre de 2026) y sus certificaciones.

Los cursos oficiales gratuitos son teóricos: incluyen lecturas y demos en video, pero el entorno práctico solo viene con la suscripción de pago Databricks Academy Labs. Este repositorio reemplaza esa parte con laboratorios propios reproducibles en **Databricks Free Edition**, más los apuntes y el plan de estudio.

## Rutas y certificaciones

| Ruta | Módulos | Certificación asociada |
|---|---|---|
| Associate Data Engineering | 4 | Databricks Certified Data Engineer Associate |
| Generative AI Engineering | 4 | Databricks Certified Generative AI Engineer Associate |
| Professional Data Engineering | 4 | Databricks Certified Data Engineer Professional |

Son 12 cursos y 177 lecciones. Temario completo, calendario y temario de cada examen en [`01_plan/plan-estudio.md`](01_plan/plan-estudio.md).

## Estructura

```
.
├── 00_docs/              Documentación del festival
├── 01_plan/              Plan de estudio: rutas, calendario y temario de exámenes
├── 02_associate-de/      Ruta Associate Data Engineering
│   └── 1.1-lakeflow-connect/
├── 03_professional-de/   Ruta Professional Data Engineering
├── 04_genai-eng/         Ruta Generative AI Engineering
└── notebooks/            Práctica libre
```

Cada curso tiene su carpeta numerada según el plan, con esta forma:

```
X.Y-nombre-del-curso/
├── README.md       Cómo correr el laboratorio y resultados esperados
├── teoria.md       Resumen de las lecciones y preguntas tipo examen
├── notebooks/      Notebooks en formato fuente de Databricks
└── soluciones/     Soluciones de los retos
```

## Laboratorios disponibles

### [1.1 Data Ingestion with Lakeflow Connect](02_associate-de/1.1-lakeflow-connect/)

Ingesta desde almacenamiento en la nube hacia tablas Delta de Unity Catalog.

- Consulta directa al path, `read_files()` y CTAS
- `COPY INTO` incremental e idempotente, y el efecto de `force`
- Columnas de metadatos: `_metadata.file_name`, `file_modification_time`, `ingested_at`
- Columna `_rescued_data`, tabla de cuarentena y modos `PERMISSIVE`, `DROPMALFORMED` y `FAILFAST`
- Datos de ejemplo generados en un Volume: CSV, JSON anidado, Parquet y un CSV con errores a propósito

## Cómo usar los laboratorios

1. Crear una cuenta gratuita en [Databricks Free Edition](https://www.databricks.com/learn/free-edition). Incluye cómputo serverless y Unity Catalog, y no pide tarjeta.
2. En el workspace: **Workspace**, luego **Import**, y subir los archivos de `notebooks/` (o el zip que genera cada laboratorio).
3. Ejecutar `00_setup` con cómputo serverless. Crea el schema, el volumen y los datos de ejemplo.
4. Seguir los notebooks en orden. El README de cada laboratorio indica los resultados esperados para verificar cada paso.

Para limpiar todo al terminar:

```sql
DROP SCHEMA workspace.lakeflow_lab CASCADE;
```

## Stack

Databricks Free Edition, Unity Catalog, Delta Lake, Lakeflow Connect, Spark SQL y PySpark.

## Seguimiento del progreso

`tools/track.py` lleva el avance leccion por leccion en `01_plan/progreso.csv`, que no se versiona porque es personal.

```
python tools/track.py              estado general y siguiente leccion pendiente
python tools/track.py next         abre en el navegador la siguiente pendiente
python tools/track.py done next    marca la actual y muestra la que sigue
python tools/track.py done 2963-05 marca una leccion concreta
python tools/track.py open 2963-07 abre una leccion por id
python tools/track.py list 2963    lista las lecciones de un curso
python tools/track.py nota 2963-05 "repasar COPY INTO"
```
