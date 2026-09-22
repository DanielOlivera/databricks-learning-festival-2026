-- Databricks notebook source
-- MAGIC %md
-- MAGIC # 05 · Reto del día 1
-- MAGIC Resuélvelo sin mirar `soluciones/05_reto_soluciones.sql`. Usa los archivos de `orders_json/` y `products_parquet/`.

-- COMMAND ----------

USE CATALOG workspace;
USE SCHEMA lakeflow_lab;

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ### Reto 1
-- MAGIC Crea `bronze_orders` con **CTAS + `read_files`** a partir de `orders_json/`. Agrega `source_file` e `ingested_at`. ¿Cuántas filas tiene? ¿Qué tipo quedó en `items`?

-- COMMAND ----------

-- tu código aquí

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ### Reto 2
-- MAGIC Crea `bronze_orders_inc` vacía y cárgala con **`COPY INTO`** (FILEFORMAT = JSON). Vuelve a ejecutarlo y confirma que la segunda vez carga 0 filas.

-- COMMAND ----------

-- tu código aquí

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ### Reto 3
-- MAGIC Genera un archivo nuevo `orders_2026_09_03.json` con 5 pedidos (usa `dbutils.fs.put` en una celda `%python`), vuelve a ejecutar tu `COPY INTO` y verifica que solo entraron esos 5.

-- COMMAND ----------

-- tu código aquí

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ### Reto 4 (pregunta de examen)
-- MAGIC Sin ejecutar nada, responde en un comentario: si vuelves a ejecutar el CTAS del Reto 1 después del Reto 3, ¿cuántas filas tendrá `bronze_orders`? ¿Por qué?

-- COMMAND ----------

-- tu respuesta aquí
