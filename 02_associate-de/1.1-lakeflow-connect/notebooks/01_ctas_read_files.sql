-- Databricks notebook source
-- MAGIC %md
-- MAGIC # 01 · Ingesta batch con consulta directa, `read_files` y CTAS (lecciones 5-6)
-- MAGIC Requisito: haber ejecutado `00_setup`.

-- COMMAND ----------

USE CATALOG workspace;
USE SCHEMA lakeflow_lab;

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## 1. Consulta directa al path
-- MAGIC Fíjate en el problema: la fila del header aparece como dato y las columnas se llaman `_c0`, `_c1`…

-- COMMAND ----------

SELECT * FROM csv.`/Volumes/workspace/lakeflow_lab/raw/customers_csv/`;

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## 2. `read_files()` (la opción recomendada)
-- MAGIC Maneja el header, infiere los tipos y agrega `_rescued_data`.

-- COMMAND ----------

SELECT *
FROM read_files(
  '/Volumes/workspace/lakeflow_lab/raw/customers_csv/',
  format => 'csv',
  header => true
);

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ### `schemaHints`: fuerza el tipo de algunas columnas y deja que el resto se infiera

-- COMMAND ----------

DESCRIBE QUERY
SELECT *
FROM read_files(
  '/Volumes/workspace/lakeflow_lab/raw/customers_csv/',
  format => 'csv',
  header => true,
  schemaHints => 'customer_id BIGINT, signup_date DATE'
);

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## 3. CTAS: crear una tabla Delta Bronze en una sola sentencia

-- COMMAND ----------

CREATE OR REPLACE TABLE bronze_customers_ctas AS
SELECT *
FROM read_files(
  '/Volumes/workspace/lakeflow_lab/raw/customers_csv/',
  format => 'csv',
  header => true,
  schemaHints => 'customer_id BIGINT, signup_date DATE'
);

SELECT count(*) AS filas FROM bronze_customers_ctas;   -- esperado: 10

-- COMMAND ----------

DESCRIBE TABLE EXTENDED bronze_customers_ctas;   -- tabla MANAGED, formato delta, ubicación administrada por UC

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## 4. Parquet: el esquema viene dentro del archivo, no hay que inferirlo

-- COMMAND ----------

CREATE OR REPLACE TABLE bronze_products AS
SELECT * FROM read_files('/Volumes/workspace/lakeflow_lab/raw/products_parquet/', format => 'parquet');

SELECT * FROM bronze_products;

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## 5. Delta: historial y time travel
-- MAGIC Cada `CREATE OR REPLACE` genera una versión nueva de la tabla.

-- COMMAND ----------

DESCRIBE HISTORY bronze_customers_ctas;

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ###  Experimento: ¿el CTAS es incremental?
-- MAGIC Vuelve a ejecutar la celda del punto 3. El conteo sigue en 10 porque **relee todo** cada vez (batch completo). En `02_copy_into` vas a ver la diferencia con una carga incremental.
