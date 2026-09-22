-- Databricks notebook source
-- MAGIC %md
-- MAGIC # 05 · Soluciones del reto del día 1

-- COMMAND ----------

USE CATALOG workspace;
USE SCHEMA lakeflow_lab;

-- COMMAND ----------

-- Reto 1: CTAS + read_files sobre JSON
CREATE OR REPLACE TABLE bronze_orders AS
SELECT
  *,
  _metadata.file_name AS source_file,
  current_timestamp() AS ingested_at
FROM read_files('/Volumes/workspace/lakeflow_lab/raw/orders_json/', format => 'json');

SELECT count(*) FROM bronze_orders;          -- 40
DESCRIBE TABLE bronze_orders;                -- items: ARRAY<STRUCT<qty: BIGINT, sku: STRING>>

-- COMMAND ----------

-- Reto 2: COPY INTO idempotente
DROP TABLE IF EXISTS bronze_orders_inc;
CREATE TABLE bronze_orders_inc;

COPY INTO bronze_orders_inc
FROM '/Volumes/workspace/lakeflow_lab/raw/orders_json/'
FILEFORMAT = JSON
COPY_OPTIONS ('mergeSchema' = 'true');       -- 1ª vez: 40 filas · 2ª vez: 0 filas

-- COMMAND ----------

-- MAGIC %python
-- MAGIC # Reto 3: llega un archivo nuevo
-- MAGIC import json
-- MAGIC rows = [json.dumps({"order_id": 2000 + i, "customer_id": i + 1,
-- MAGIC                     "order_ts": f"2026-09-03T10:0{i}:00", "status": "created",
-- MAGIC                     "items": [{"sku": "SKU-100", "qty": 1}]}) for i in range(5)]
-- MAGIC dbutils.fs.put("/Volumes/workspace/lakeflow_lab/raw/orders_json/orders_2026_09_03.json",
-- MAGIC                "\n".join(rows) + "\n", True)

-- COMMAND ----------

COPY INTO bronze_orders_inc
FROM '/Volumes/workspace/lakeflow_lab/raw/orders_json/'
FILEFORMAT = JSON
COPY_OPTIONS ('mergeSchema' = 'true');       -- solo 5 filas nuevas

SELECT count(*) FROM bronze_orders_inc;      -- 45

-- COMMAND ----------

-- Reto 4: el CTAS relee TODOS los archivos de la carpeta (batch completo), así que
-- bronze_orders pasa a tener 45 filas: las 40 originales + las 5 nuevas, sin duplicados,
-- porque CREATE OR REPLACE reemplaza la tabla entera. No es incremental: el costo
-- crece con cada archivo que se agrega a la carpeta.
