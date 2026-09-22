-- Databricks notebook source
-- MAGIC %md
-- MAGIC # 03 · Columnas de metadatos al ingerir (lecciones 7-8)
-- MAGIC La columna oculta `_metadata` existe en toda fuente de archivos, pero solo aparece si la seleccionas de forma explícita.

-- COMMAND ----------

USE CATALOG workspace;
USE SCHEMA lakeflow_lab;

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## 1. ¿Qué trae `_metadata`?

-- COMMAND ----------

SELECT
  customer_id,
  _metadata,                                   -- struct completo
  _metadata.file_path,
  _metadata.file_name,
  _metadata.file_size,
  _metadata.file_modification_time
FROM read_files(
  '/Volumes/workspace/lakeflow_lab/raw/customers_csv/',
  format => 'csv',
  header => true
);

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## 2. Tabla Bronze con metadatos de ingesta (CTAS)
-- MAGIC Patrón recomendado: `source_file`, `file_mod_time` e `ingested_at`.

-- COMMAND ----------

CREATE OR REPLACE TABLE bronze_customers_meta AS
SELECT
  *,
  _metadata.file_name              AS source_file,
  _metadata.file_modification_time AS file_mod_time,
  current_timestamp()              AS ingested_at
FROM read_files(
  '/Volumes/workspace/lakeflow_lab/raw/customers_csv/',
  format => 'csv',
  header => true,
  schemaHints => 'customer_id BIGINT, signup_date DATE'
);

SELECT source_file, count(*) AS filas, max(ingested_at) AS ingested_at
FROM bronze_customers_meta
GROUP BY source_file
ORDER BY source_file;

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## 3. Metadatos con `COPY INTO`: se usa una subconsulta `SELECT` sobre el path

-- COMMAND ----------

DROP TABLE IF EXISTS bronze_customers_copy_meta;
CREATE TABLE bronze_customers_copy_meta;

COPY INTO bronze_customers_copy_meta
FROM (
  SELECT
    *,
    _metadata.file_name AS source_file,
    current_timestamp() AS ingested_at
  FROM '/Volumes/workspace/lakeflow_lab/raw/customers_csv/'
)
FILEFORMAT = CSV
FORMAT_OPTIONS ('header' = 'true', 'inferSchema' = 'true')
COPY_OPTIONS ('mergeSchema' = 'true');

SELECT * FROM bronze_customers_copy_meta ORDER BY customer_id;

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## 4. Caso de uso: auditoría
-- MAGIC ¿Qué archivo trajo clientes de Bolivia y cuándo se ingirieron?

-- COMMAND ----------

SELECT source_file, ingested_at, collect_list(name) AS clientes_bo
FROM bronze_customers_meta
WHERE country = 'BO'
GROUP BY source_file, ingested_at;
