-- Databricks notebook source
-- MAGIC %md
-- MAGIC # 04 · La columna `_rescued_data` (lección 9)
-- MAGIC Archivos de prueba en `customers_bad_csv/`:
-- MAGIC - `customers_bad_01.csv`: `customer_id = 'abc'` y `signup_date = 'N/A'`
-- MAGIC - `customers_bad_02.csv`: trae una columna extra `phone`

-- COMMAND ----------

USE CATALOG workspace;
USE SCHEMA lakeflow_lab;

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## 1. Con esquema inferido
-- MAGIC ¿Qué tipos infirió? Como el archivo trae `'abc'` y `'N/A'`, lo más probable es que `customer_id` y `signup_date` queden como STRING. **Un dato sucio "contamina" el tipo inferido.**

-- COMMAND ----------

SELECT *, _metadata.file_name
FROM read_files(
  '/Volumes/workspace/lakeflow_lab/raw/customers_bad_csv/',
  format => 'csv',
  header => true
);

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## 2. Con esquema explícito + `rescuedDataColumn`
-- MAGIC Lo que no encaja queda en NULL en su columna, y el valor original se guarda en `_rescued_data` (JSON), junto con `_file_path`.

-- COMMAND ----------

SELECT *
FROM read_files(
  '/Volumes/workspace/lakeflow_lab/raw/customers_bad_csv/',
  format => 'csv',
  header => true,
  schema => 'customer_id INT, name STRING, email STRING, country STRING, signup_date DATE',
  rescuedDataColumn => '_rescued_data'
);

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## 3. Bronze completo + separar las filas rescatadas en cuarentena

-- COMMAND ----------

CREATE OR REPLACE TABLE bronze_customers_raw AS
SELECT *, _metadata.file_name AS source_file, current_timestamp() AS ingested_at
FROM read_files(
  '/Volumes/workspace/lakeflow_lab/raw/customers_bad_csv/',
  format => 'csv',
  header => true,
  schema => 'customer_id INT, name STRING, email STRING, country STRING, signup_date DATE',
  rescuedDataColumn => '_rescued_data'
);

CREATE OR REPLACE TABLE quarantine_customers AS
SELECT * FROM bronze_customers_raw WHERE _rescued_data IS NOT NULL;

SELECT
  (SELECT count(*) FROM bronze_customers_raw)                             AS total,
  (SELECT count(*) FROM bronze_customers_raw WHERE _rescued_data IS NULL) AS limpias,
  (SELECT count(*) FROM quarantine_customers)                             AS en_cuarentena;

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## 4. Extraer campos de `_rescued_data` con la sintaxis `:` (path de JSON)

-- COMMAND ----------

SELECT
  name,
  _rescued_data,
  _rescued_data:customer_id AS id_original,
  _rescued_data:signup_date AS fecha_original,
  _rescued_data:phone       AS phone_rescatado,
  _rescued_data:_file_path  AS archivo
FROM quarantine_customers;

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## 5. Comparar los modos de parseo
-- MAGIC Ejecuta cada celda y compara el resultado:
-- MAGIC - `DROPMALFORMED`: descarta las filas con tipos inválidos.
-- MAGIC - `FAILFAST`: la consulta **falla** (el error es esperado).

-- COMMAND ----------

SELECT *
FROM read_files(
  '/Volumes/workspace/lakeflow_lab/raw/customers_bad_csv/customers_bad_01.csv',
  format => 'csv', header => true,
  schema => 'customer_id INT, name STRING, email STRING, country STRING, signup_date DATE',
  mode => 'DROPMALFORMED'
);

-- COMMAND ----------

SELECT *
FROM read_files(
  '/Volumes/workspace/lakeflow_lab/raw/customers_bad_csv/customers_bad_01.csv',
  format => 'csv', header => true,
  schema => 'customer_id INT, name STRING, email STRING, country STRING, signup_date DATE',
  mode => 'FAILFAST'
);
