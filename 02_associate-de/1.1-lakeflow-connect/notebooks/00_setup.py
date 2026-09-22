# Databricks notebook source
# MAGIC %md
# MAGIC # 00 · Setup del laboratorio — Lakeflow Connect (lecciones 3-4)
# MAGIC
# MAGIC Este notebook crea todo lo que necesitan los demás:
# MAGIC - Schema `workspace.lakeflow_lab`
# MAGIC - Volume `workspace.lakeflow_lab.raw`, la "landing zone" con los archivos crudos
# MAGIC - Archivos de ejemplo de una tienda online: **customers (CSV)**, **orders (JSON)**, **products (Parquet)** y un **CSV con errores** para practicar `_rescued_data`
# MAGIC
# MAGIC **Cómputo:** Serverless. Se puede re-ejecutar: borra y regenera los archivos.

# COMMAND ----------

CATALOG = "workspace"   # catálogo por defecto en Databricks Free Edition
SCHEMA  = "lakeflow_lab"
VOLUME  = "raw"
BASE    = f"/Volumes/{CATALOG}/{SCHEMA}/{VOLUME}"

spark.sql(f"CREATE SCHEMA IF NOT EXISTS {CATALOG}.{SCHEMA}")
spark.sql(f"CREATE VOLUME IF NOT EXISTS {CATALOG}.{SCHEMA}.{VOLUME}")
print("Landing zone:", BASE)

# COMMAND ----------

# Limpieza para poder re-ejecutar el setup desde cero
for d in ["customers_csv", "customers_bad_csv", "orders_json", "products_parquet", "landing_extra"]:
    dbutils.fs.rm(f"{BASE}/{d}", True)

# COMMAND ----------

# MAGIC %md
# MAGIC ## Customers (CSV): 2 archivos iniciales + 1 que "llega después"
# MAGIC El tercero queda en `landing_extra/`. En `02_copy_into` lo moverás a la carpeta de ingesta para simular la llegada de un archivo nuevo.

# COMMAND ----------

header = "customer_id,name,email,country,signup_date\n"

customers_1 = header + """1,Ana Pérez,ana.perez@example.com,BO,2026-01-15
2,Luis Gómez,luis.gomez@example.com,AR,2026-02-03
3,María Rojas,maria.rojas@example.com,CL,2026-02-20
4,Jorge Vargas,jorge.vargas@example.com,PE,2026-03-11
5,Sofía Méndez,sofia.mendez@example.com,MX,2026-03-28
"""

customers_2 = header + """6,Carlos Ruiz,carlos.ruiz@example.com,CO,2026-04-02
7,Valeria Soto,valeria.soto@example.com,BO,2026-04-19
8,Diego Flores,diego.flores@example.com,UY,2026-05-07
9,Camila Torres,camila.torres@example.com,ES,2026-05-30
10,Mateo Castro,mateo.castro@example.com,BO,2026-06-14
"""

customers_3 = header + """11,Lucía Herrera,lucia.herrera@example.com,AR,2026-07-01
12,Andrés Molina,andres.molina@example.com,CL,2026-07-22
13,Paula Navarro,paula.navarro@example.com,MX,2026-08-09
"""

dbutils.fs.put(f"{BASE}/customers_csv/customers_2026_09_01.csv", customers_1, True)
dbutils.fs.put(f"{BASE}/customers_csv/customers_2026_09_02.csv", customers_2, True)
dbutils.fs.put(f"{BASE}/landing_extra/customers_2026_09_03.csv", customers_3, True)

# COMMAND ----------

# MAGIC %md
# MAGIC ## Customers con errores (CSV) para la lección 9 · Rescued Data
# MAGIC Trae a propósito: un ID que no es número, una fecha inválida y una **columna extra** (`phone`) en un segundo archivo.

# COMMAND ----------

bad_1 = header + """14,Rosa Aguilar,rosa.aguilar@example.com,BO,2026-08-15
abc,Pedro Salinas,pedro.salinas@example.com,PE,2026-08-16
16,Elena Ríos,elena.rios@example.com,AR,N/A
17,Tomás Vega,tomas.vega@example.com,CL,2026-08-18
"""

bad_2 = "customer_id,name,email,country,signup_date,phone\n" + """18,Irene Luna,irene.luna@example.com,MX,2026-08-20,+591-70000001
19,Hugo Paz,hugo.paz@example.com,BO,2026-08-21,+591-70000002
"""

dbutils.fs.put(f"{BASE}/customers_bad_csv/customers_bad_01.csv", bad_1, True)
dbutils.fs.put(f"{BASE}/customers_bad_csv/customers_bad_02.csv", bad_2, True)

# COMMAND ----------

# MAGIC %md
# MAGIC ## Orders (JSON por líneas, con arreglo anidado) para mañana (lección 10+) y el reto

# COMMAND ----------

import json, random
from datetime import datetime, timedelta

random.seed(42)
skus = ["SKU-100", "SKU-200", "SKU-300", "SKU-400", "SKU-500"]

def make_orders(start_id, n, day):
    rows = []
    for i in range(n):
        items = [{"sku": random.choice(skus), "qty": random.randint(1, 3)} for _ in range(random.randint(1, 3))]
        rows.append(json.dumps({
            "order_id": start_id + i,
            "customer_id": random.randint(1, 13),
            "order_ts": (datetime(2026, 9, day, 9) + timedelta(minutes=37 * i)).isoformat(),
            "status": random.choice(["created", "paid", "shipped"]),
            "items": items,
        }, ensure_ascii=False))
    return "\n".join(rows) + "\n"

dbutils.fs.put(f"{BASE}/orders_json/orders_2026_09_01.json", make_orders(1000, 20, 1), True)
dbutils.fs.put(f"{BASE}/orders_json/orders_2026_09_02.json", make_orders(1020, 20, 2), True)

# COMMAND ----------

# MAGIC %md
# MAGIC ## Products (Parquet)

# COMMAND ----------

products = spark.createDataFrame(
    [("SKU-100", "Teclado mecánico", "periféricos", 89.90),
     ("SKU-200", "Mouse inalámbrico", "periféricos", 29.50),
     ("SKU-300", "Monitor 27\"", "pantallas", 319.00),
     ("SKU-400", "Laptop stand", "accesorios", 45.00),
     ("SKU-500", "Webcam HD", "video", 59.99)],
    "sku STRING, product_name STRING, category STRING, price DOUBLE",
)
products.write.mode("overwrite").parquet(f"{BASE}/products_parquet")

# COMMAND ----------

# MAGIC %md
# MAGIC ## Lección 4 · Explorar el entorno
# MAGIC 1. Abre **Catalog** (barra lateral) → `workspace` → `lakeflow_lab` → Volumes → `raw` y revisa las carpetas.
# MAGIC 2. Ejecuta las celdas de abajo: listan los archivos con Python y con SQL.

# COMMAND ----------

display(dbutils.fs.ls(BASE))

# COMMAND ----------

# MAGIC %sql
# MAGIC LIST '/Volumes/workspace/lakeflow_lab/raw/customers_csv/'

# COMMAND ----------

# MAGIC %md
# MAGIC OK Setup listo. Sigue con **`01_ctas_read_files`**.
