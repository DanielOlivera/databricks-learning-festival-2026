-- Databricks notebook source
-- MAGIC %md
-- MAGIC # 02 · Ingesta incremental con `COPY INTO` (lección 6)
-- MAGIC Objetivo: comprobar que `COPY INTO` es **idempotente** y carga **solo los archivos nuevos**.

-- COMMAND ----------

USE CATALOG workspace;
USE SCHEMA lakeflow_lab;

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## 1. Tabla destino vacía y sin esquema
-- MAGIC Con `mergeSchema`, el esquema se infiere en la primera carga.

-- COMMAND ----------

DROP TABLE IF EXISTS bronze_customers_copy;
CREATE TABLE bronze_customers_copy;

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## 2. Primera carga
-- MAGIC Revisa la salida: `num_affected_rows` y `num_inserted_rows` deberían ser 10.

-- COMMAND ----------

COPY INTO bronze_customers_copy
FROM '/Volumes/workspace/lakeflow_lab/raw/customers_csv/'
FILEFORMAT = CSV
FORMAT_OPTIONS ('header' = 'true', 'inferSchema' = 'true')
COPY_OPTIONS ('mergeSchema' = 'true');

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## 3. Vuelve a ejecutar exactamente lo mismo
-- MAGIC Resultado esperado: **0 filas**. COPY INTO recuerda qué archivos ya cargó.

-- COMMAND ----------

COPY INTO bronze_customers_copy
FROM '/Volumes/workspace/lakeflow_lab/raw/customers_csv/'
FILEFORMAT = CSV
FORMAT_OPTIONS ('header' = 'true', 'inferSchema' = 'true')
COPY_OPTIONS ('mergeSchema' = 'true');

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## 4. Llega un archivo nuevo a la landing zone

-- COMMAND ----------

-- MAGIC %python
-- MAGIC BASE = "/Volumes/workspace/lakeflow_lab/raw"
-- MAGIC dbutils.fs.cp(f"{BASE}/landing_extra/customers_2026_09_03.csv",
-- MAGIC               f"{BASE}/customers_csv/customers_2026_09_03.csv")
-- MAGIC display(dbutils.fs.ls(f"{BASE}/customers_csv"))

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## 5. Carga incremental
-- MAGIC Resultado esperado: **3 filas**, solo las del archivo nuevo.

-- COMMAND ----------

COPY INTO bronze_customers_copy
FROM '/Volumes/workspace/lakeflow_lab/raw/customers_csv/'
FILEFORMAT = CSV
FORMAT_OPTIONS ('header' = 'true', 'inferSchema' = 'true')
COPY_OPTIONS ('mergeSchema' = 'true');

SELECT count(*) AS filas FROM bronze_customers_copy;   -- esperado: 13

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## 6. Atencion: `force = true` recarga todo y genera duplicados

-- COMMAND ----------

COPY INTO bronze_customers_copy
FROM '/Volumes/workspace/lakeflow_lab/raw/customers_csv/'
FILEFORMAT = CSV
FORMAT_OPTIONS ('header' = 'true', 'inferSchema' = 'true')
COPY_OPTIONS ('mergeSchema' = 'true', 'force' = 'true');

SELECT customer_id, count(*) AS veces
FROM bronze_customers_copy
GROUP BY customer_id
HAVING count(*) > 1
ORDER BY customer_id;

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## 7. Cada COPY INTO queda registrado como una operación en el historial Delta

-- COMMAND ----------

DESCRIBE HISTORY bronze_customers_copy;

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ### Clave: Para recordar
-- MAGIC | | CTAS + `read_files` | `COPY INTO` |
-- MAGIC |---|---|---|
-- MAGIC | Tipo | Batch completo | Batch incremental |
-- MAGIC | Re-ejecutar | Relee todo | Solo archivos nuevos (idempotente) |
-- MAGIC | Tabla | La crea o la reemplaza | Carga en una tabla existente (puede no tener esquema) |
-- MAGIC | Escala | Pocos archivos | Miles de archivos (para millones o streaming → Auto Loader) |
-- MAGIC
-- MAGIC Atencion: **Si vuelves a ejecutar este notebook:** el paso 1 recrea la tabla, pero el archivo del paso 4 ya queda copiado en `customers_csv/`. Entonces la primera carga traerá 13 filas y el paso 5 cargará 0. Para repetir el ejercicio tal cual, ejecuta `00_setup` otra vez.
