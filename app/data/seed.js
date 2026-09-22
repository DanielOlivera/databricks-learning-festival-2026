// Contenido de estudio. Editable a mano: es la fuente de verdad del material.
// El avance personal (repeticiones, fechas, notas propias) vive en el navegador,
// separado de este archivo.
window.SEED = {
  version: 3,
  cursos: [
    { id: "1.1", ruta: "Associate DE", nombre: "Data Ingestion with Lakeflow Connect", lecciones: 14 },
    { id: "1.2", ruta: "Associate DE", nombre: "Deploy Workloads with Lakeflow Jobs", lecciones: 12 },
    { id: "1.3", ruta: "Associate DE", nombre: "Build Data Pipelines with SDP", lecciones: 15 },
    { id: "1.4", ruta: "Associate DE", nombre: "DevOps Essentials for Data Engineering", lecciones: 18 },
    { id: "2.1", ruta: "GenAI", nombre: "Building RAG Agents with Agent Bricks", lecciones: 10 },
    { id: "2.2", ruta: "GenAI", nombre: "Building Agentic Applications", lecciones: 10 },
    { id: "2.3", ruta: "GenAI", nombre: "Agent Evaluation on Databricks", lecciones: 14 },
    { id: "2.4", ruta: "GenAI", nombre: "Deploying and Monitoring Agent Apps", lecciones: 9 },
    { id: "3.1", ruta: "Professional DE", nombre: "Advanced Techniques with SDP", lecciones: 15 },
    { id: "3.2", ruta: "Professional DE", nombre: "Databricks Data Privacy", lecciones: 22 },
    { id: "3.3", ruta: "Professional DE", nombre: "Databricks Performance Optimization", lecciones: 19 },
    { id: "3.4", ruta: "Professional DE", nombre: "Declarative Automation Bundles", lecciones: 17 }
  ],

  tarjetas: [
    { id: "c101", curso: "1.1", tema: "Lakeflow", frente: "¿Cuáles son las tres piezas de Lakeflow y para qué sirve cada una?", reverso: "Lakeflow Connect: ingesta.\nLakeflow Spark Declarative Pipelines (antes DLT): transformación.\nLakeflow Jobs (antes Workflows): orquestación." },
    { id: "c102", curso: "1.1", tema: "Lakeflow", frente: "¿Qué diferencia hay entre un Standard connector y un Managed connector?", reverso: "Standard: tú escribes la ingesta en SQL o Python (read_files, COPY INTO, Auto Loader, streaming tables).\nManaged: conector administrado por Databricks, sin código y con CDC incremental (Salesforce, Workday, ServiceNow, SQL Server, SharePoint)." },
    { id: "c103", curso: "1.1", tema: "Ingesta", frente: "Las tres técnicas de ingesta y su herramienta típica", reverso: "Batch: relee todo. CREATE OR REPLACE TABLE AS SELECT con read_files.\nIncremental batch: solo archivos nuevos. COPY INTO, Auto Loader con availableNow.\nStreaming: continuo. Auto Loader o Structured Streaming." },
    { id: "c104", curso: "1.1", tema: "Ingesta", frente: "¿CTAS con read_files es idempotente al reprocesar?", reverso: "No. Vuelve a leer todos los archivos de la ruta en cada ejecución. El costo crece con cada archivo nuevo en la carpeta." },
    { id: "c105", curso: "1.1", tema: "Ingesta", frente: "¿Qué pasa si ejecutas dos veces el mismo COPY INTO sin archivos nuevos?", reverso: "La segunda vez carga 0 filas. COPY INTO lleva registro de los archivos ya cargados, así que es idempotente." },
    { id: "c106", curso: "1.1", tema: "Ingesta", frente: "¿Qué hace COPY_OPTIONS ('force' = 'true')?", reverso: "Ignora el registro de archivos cargados y recarga todo. Genera duplicados si las filas ya estaban en la tabla." },
    { id: "c107", curso: "1.1", tema: "Ingesta", frente: "¿Por qué SELECT * FROM csv.`/Volumes/...` es mala idea para CSV?", reverso: "No procesa el header: la primera fila entra como dato y las columnas quedan como _c0, _c1. Tampoco acepta opciones de lectura. Para eso está read_files()." },
    { id: "c108", curso: "1.1", tema: "Ingesta", frente: "Opciones más usadas de read_files()", reverso: "format, header, schema, schemaHints, rescuedDataColumn, mode.\nSoporta CSV, JSON, Parquet, Avro, ORC, XML y texto. Agrega _rescued_data por defecto cuando infiere el esquema." },
    { id: "c109", curso: "1.1", tema: "Ingesta", frente: "Diferencia entre schema y schemaHints en read_files", reverso: "schema: define el esquema completo, nada se infiere.\nschemaHints: fija el tipo de algunas columnas y deja que el resto se infiera." },
    { id: "c110", curso: "1.1", tema: "Metadatos", frente: "¿Qué campos trae la columna oculta _metadata?", reverso: "file_path, file_name, file_size, file_modification_time, file_block_start, file_block_length.\nSolo aparece si la seleccionas de forma explícita." },
    { id: "c111", curso: "1.1", tema: "Metadatos", frente: "Patrón de columnas de auditoría en una tabla Bronze", reverso: "_metadata.file_name AS source_file\n_metadata.file_modification_time AS file_mod_time\ncurrent_timestamp() AS ingested_at" },
    { id: "c112", curso: "1.1", tema: "Metadatos", frente: "¿Cómo agregas columnas de metadatos usando COPY INTO?", reverso: "Con una subconsulta sobre la ruta:\nCOPY INTO t FROM (SELECT *, _metadata.file_name AS source_file FROM '/Volumes/...') FILEFORMAT = CSV ..." },
    { id: "c113", curso: "1.1", tema: "Rescued data", frente: "¿Qué guarda la columna _rescued_data?", reverso: "Un JSON con lo que no encaja en el esquema: valores de tipo incorrecto, columnas que no existen en el esquema y columnas que difieren en mayúsculas o minúsculas. Incluye la clave _file_path con el archivo de origen." },
    { id: "c114", curso: "1.1", tema: "Rescued data", frente: "Los tres modos de parseo y qué hace cada uno", reverso: "PERMISSIVE (por defecto): pone NULL y rescata el valor.\nDROPMALFORMED: descarta la fila.\nFAILFAST: la consulta falla." },
    { id: "c115", curso: "1.1", tema: "Rescued data", frente: "CSV con esquema explícito y una columna extra que no está en el esquema. ¿Qué pasa en modo PERMISSIVE?", reverso: "La fila se carga y la columna extra se guarda dentro de _rescued_data. No se pierde el dato ni falla la carga." },
    { id: "c116", curso: "1.1", tema: "Rescued data", frente: "¿Cómo extraes un campo del JSON de _rescued_data?", reverso: "Con la sintaxis de dos puntos: _rescued_data:customer_id, _rescued_data:signup_date, _rescued_data:_file_path" },
    { id: "c117", curso: "1.1", tema: "Delta", frente: "¿De qué está hecha una tabla Delta?", reverso: "Archivos Parquet más el transaction log (_delta_log). De ahí salen ACID, time travel, DESCRIBE HISTORY, schema enforcement y schema evolution." },
    { id: "c118", curso: "1.1", tema: "Unity Catalog", frente: "¿Cómo es el namespace de tres niveles y dónde viven los archivos crudos?", reverso: "catalog.schema.table.\nLos archivos crudos van en Volumes: /Volumes/<catalog>/<schema>/<volume>/" },
    { id: "c119", curso: "1.1", tema: "Unity Catalog", frente: "Tabla managed vs external", reverso: "Managed: Unity Catalog administra datos y ciclo de vida; al borrar la tabla se borran los datos.\nExternal: los datos viven en una ubicación tuya y sobreviven al DROP." },
    { id: "c120", curso: "1.1", tema: "Medallion", frente: "¿Qué va en cada capa de la arquitectura Medallion?", reverso: "Bronze: datos crudos como llegan, más metadatos de ingesta.\nSilver: limpios, validados, deduplicados y tipados.\nGold: agregados listos para negocio y BI." },
    { id: "c121", curso: "1.1", tema: "Ingesta", frente: "¿Cuándo conviene Auto Loader en lugar de COPY INTO?", reverso: "COPY INTO sirve para miles de archivos. Con millones de archivos, o cuando necesitas streaming continuo y baja latencia, conviene Auto Loader (cloudFiles)." },
    { id: "c122", curso: "1.1", tema: "Ingesta", frente: "¿Se puede crear la tabla destino de un COPY INTO sin declarar esquema?", reverso: "Sí: CREATE TABLE mi_tabla; y luego COPY INTO con COPY_OPTIONS ('mergeSchema' = 'true'). El esquema se infiere en la primera carga." },
    { id: "c123", curso: "1.1", tema: "Delta", frente: "¿Cómo ves las versiones y operaciones de una tabla Delta?", reverso: "DESCRIBE HISTORY tabla. Cada CTAS, COPY INTO o MERGE queda como una versión, y puedes leer una anterior con SELECT * FROM tabla VERSION AS OF n." },
    { id: "c124", curso: "1.1", tema: "Rescued data", frente: "Un CSV trae 'abc' en una columna definida como INT. Sin esquema explícito, ¿qué tipo infiere read_files?", reverso: "STRING. Un solo valor sucio contamina el tipo inferido de toda la columna. Por eso conviene declarar el esquema o usar schemaHints." },
    { id: "c125", curso: "1.1", tema: "Festival", frente: "¿Qué exige el festival para que cuente una ruta?", reverso: "Completar el 100% de los módulos de la ruta dentro del 16-sep al 14-oct, incluidas las secciones de introducción (Before we get started y Course Logistics Review) y el Quiz." }
  ],

  gotchas: [
    { id: "g01", curso: "1.1", titulo: "La búsqueda muestra primero la versión de $750", texto: "Cada curso existe como E-learning gratis y como Instructor-led de 4 h a 750 USD, con el mismo nombre. En el catálogo aparece primero el pago. Usa siempre los enlaces de la página del festival.", tags: ["festival", "inscripcion"] },
    { id: "g02", curso: "1.1", titulo: "Abrir una lección la marca como completada", texto: "En la Academy, entrar a una lección de tipo Slides, HTML o SCORM la marca como Completed al instante. Navegar con Next lesson sin cargar el contenido solo la deja In progress.", tags: ["academy"] },
    { id: "g03", curso: "1.1", titulo: "El curso tiene 14 lecciones, no 16 ni 19", texto: "La vista de catálogo mezcla variantes por idioma y versiones viejas. El número real es el del reproductor: 14 lecciones para Data Ingestion with Lakeflow Connect.", tags: ["academy"] },
    { id: "g04", curso: "1.1", titulo: "CTAS no es incremental", texto: "Volver a ejecutar un CREATE OR REPLACE TABLE AS SELECT relee todos los archivos. No duplica filas porque reemplaza la tabla, pero el costo crece con cada archivo de la carpeta.", tags: ["ingesta", "examen"] },
    { id: "g05", curso: "1.1", titulo: "force = true sí duplica", texto: "COPY INTO es idempotente, salvo que uses force. Con force recarga archivos ya procesados y las filas quedan repetidas en la tabla.", tags: ["ingesta", "examen"] },
    { id: "g06", curso: "1.1", titulo: "_metadata no sale con SELECT *", texto: "Es una columna oculta: solo aparece si la nombras de forma explícita en el SELECT.", tags: ["metadatos", "examen"] },
    { id: "g07", curso: "1.1", titulo: "Un solo voucher por persona", texto: "Aunque completes las tres rutas, el festival entrega un único voucher del 50%. Los demás exámenes cuestan 200 USD.", tags: ["festival"] },
    { id: "g08", curso: "1.1", titulo: "Free Edition usa el catálogo workspace", texto: "En Databricks Free Edition el catálogo por defecto es workspace. Ahí creas el schema y el volumen del laboratorio.", tags: ["lab"] },
    { id: "g09", curso: "1.1", titulo: "El mismo correo en Academy y Webassessor", texto: "El voucher se genera por correo. Si las cuentas tienen correos distintos, hay que agregar el de la Academy como correo secundario en Webassessor.", tags: ["festival", "examen"] }
  ],

  snippets: [
    { id: "s01", curso: "1.1", titulo: "Leer con read_files e inferir esquema", lenguaje: "sql", codigo: "SELECT *\nFROM read_files(\n  '/Volumes/workspace/lakeflow_lab/raw/customers_csv/',\n  format => 'csv',\n  header => true\n);" },
    { id: "s02", curso: "1.1", titulo: "CTAS con schemaHints", lenguaje: "sql", codigo: "CREATE OR REPLACE TABLE bronze_customers AS\nSELECT *\nFROM read_files(\n  '/Volumes/workspace/lakeflow_lab/raw/customers_csv/',\n  format => 'csv',\n  header => true,\n  schemaHints => 'customer_id BIGINT, signup_date DATE'\n);" },
    { id: "s03", curso: "1.1", titulo: "COPY INTO incremental sobre tabla sin esquema", lenguaje: "sql", codigo: "CREATE TABLE IF NOT EXISTS bronze_customers_copy;\n\nCOPY INTO bronze_customers_copy\nFROM '/Volumes/workspace/lakeflow_lab/raw/customers_csv/'\nFILEFORMAT = CSV\nFORMAT_OPTIONS ('header' = 'true', 'inferSchema' = 'true')\nCOPY_OPTIONS ('mergeSchema' = 'true');" },
    { id: "s04", curso: "1.1", titulo: "Columnas de auditoría en Bronze", lenguaje: "sql", codigo: "SELECT\n  *,\n  _metadata.file_name              AS source_file,\n  _metadata.file_modification_time AS file_mod_time,\n  current_timestamp()              AS ingested_at\nFROM read_files('/Volumes/.../customers_csv/', format => 'csv', header => true);" },
    { id: "s05", curso: "1.1", titulo: "COPY INTO con metadatos", lenguaje: "sql", codigo: "COPY INTO bronze_customers_meta\nFROM (\n  SELECT *, _metadata.file_name AS source_file, current_timestamp() AS ingested_at\n  FROM '/Volumes/workspace/lakeflow_lab/raw/customers_csv/'\n)\nFILEFORMAT = CSV\nFORMAT_OPTIONS ('header' = 'true', 'inferSchema' = 'true')\nCOPY_OPTIONS ('mergeSchema' = 'true');" },
    { id: "s06", curso: "1.1", titulo: "Esquema explícito y rescued data", lenguaje: "sql", codigo: "SELECT *\nFROM read_files(\n  '/Volumes/workspace/lakeflow_lab/raw/customers_bad_csv/',\n  format => 'csv',\n  header => true,\n  schema => 'customer_id INT, name STRING, email STRING, country STRING, signup_date DATE',\n  rescuedDataColumn => '_rescued_data'\n);" },
    { id: "s07", curso: "1.1", titulo: "Tabla de cuarentena", lenguaje: "sql", codigo: "CREATE OR REPLACE TABLE quarantine_customers AS\nSELECT * FROM bronze_customers_raw WHERE _rescued_data IS NOT NULL;\n\nSELECT name,\n       _rescued_data:customer_id AS id_original,\n       _rescued_data:_file_path  AS archivo\nFROM quarantine_customers;" },
    { id: "s08", curso: "1.1", titulo: "Crear schema y volumen", lenguaje: "python", codigo: "spark.sql('CREATE SCHEMA IF NOT EXISTS workspace.lakeflow_lab')\nspark.sql('CREATE VOLUME IF NOT EXISTS workspace.lakeflow_lab.raw')\ndisplay(dbutils.fs.ls('/Volumes/workspace/lakeflow_lab/raw'))" },
    { id: "s09", curso: "1.1", titulo: "Listar archivos de un volumen en SQL", lenguaje: "sql", codigo: "LIST '/Volumes/workspace/lakeflow_lab/raw/customers_csv/';" },
    { id: "s10", curso: "1.1", titulo: "Historial y time travel", lenguaje: "sql", codigo: "DESCRIBE HISTORY bronze_customers;\n\nSELECT * FROM bronze_customers VERSION AS OF 1;" }
  ],

  examenes: [
    {
      id: "de-associate",
      nombre: "Data Engineer Associate",
      minutos: 90,
      preguntasReales: 45,
      temas: [
        { nombre: "Databricks Intelligence Platform", peso: 6 },
        { nombre: "Data Ingestion and Loading", peso: 21 },
        { nombre: "Data Transformation and Modeling", peso: 22 },
        { nombre: "Working with Lakeflow Jobs", peso: 16 },
        { nombre: "Implementing CI/CD", peso: 10 },
        { nombre: "Troubleshooting, Monitoring, Optimization", peso: 10 },
        { nombre: "Governance and Security", peso: 15 }
      ],
      preguntas: [
        { id: "q01", tema: "Data Ingestion and Loading", texto: "Un pipeline usa CREATE OR REPLACE TABLE ... AS SELECT * FROM read_files('/Volumes/cat/sch/vol/landing/'). Llegan dos archivos nuevos a la carpeta y se vuelve a ejecutar. ¿Qué ocurre?", opciones: ["Solo se procesan los dos archivos nuevos", "Se procesan todos los archivos de la carpeta", "La sentencia falla por conflicto de esquema", "Los dos archivos nuevos se ignoran hasta refrescar el esquema"], correcta: 1, explicacion: "CTAS es batch completo: relee toda la ruta en cada ejecución. No lleva registro de archivos procesados." },
        { id: "q02", tema: "Data Ingestion and Loading", texto: "Se ejecuta el mismo COPY INTO dos veces seguidas y no llegaron archivos nuevos. ¿Cuántas filas carga la segunda ejecución?", opciones: ["Todas otra vez, duplicando datos", "Ninguna", "Solo las filas modificadas", "Falla porque los archivos ya fueron cargados"], correcta: 1, explicacion: "COPY INTO es idempotente: registra los archivos ya cargados y omite los repetidos, salvo que se use force." },
        { id: "q03", tema: "Data Ingestion and Loading", texto: "¿Qué opción de COPY INTO recarga archivos ya procesados?", opciones: ["COPY_OPTIONS ('mergeSchema' = 'true')", "FORMAT_OPTIONS ('inferSchema' = 'true')", "COPY_OPTIONS ('force' = 'true')", "FORMAT_OPTIONS ('rescuedDataColumn' = 'true')"], correcta: 2, explicacion: "force ignora el registro de archivos cargados y puede generar duplicados." },
        { id: "q04", tema: "Data Ingestion and Loading", texto: "Se necesita registrar de qué archivo proviene cada fila de una tabla Bronze. ¿Qué se usa?", opciones: ["input_file_id()", "_rescued_data:_file_path", "_metadata.file_name", "current_source()"], correcta: 2, explicacion: "_metadata expone file_path, file_name, file_size y file_modification_time. Hay que seleccionarla de forma explícita." },
        { id: "q05", tema: "Data Ingestion and Loading", texto: "Un CSV trae la columna phone, que no existe en el esquema declarado, y la lectura está en modo PERMISSIVE. ¿Qué ocurre con ese dato?", opciones: ["Se descarta la fila completa", "La carga falla", "El valor se guarda en _rescued_data", "Se agrega automáticamente la columna a la tabla"], correcta: 2, explicacion: "_rescued_data captura columnas fuera del esquema y valores con tipo incorrecto, sin perder el dato ni romper la carga." },
        { id: "q06", tema: "Data Ingestion and Loading", texto: "¿Qué modo hace que la consulta falle ante una fila con tipo inválido?", opciones: ["PERMISSIVE", "DROPMALFORMED", "FAILFAST", "RESCUE"], correcta: 2, explicacion: "FAILFAST aborta. PERMISSIVE rescata y DROPMALFORMED descarta la fila." },
        { id: "q07", tema: "Data Ingestion and Loading", texto: "Se ingieren millones de archivos pequeños que llegan de forma continua. ¿Cuál es la opción adecuada?", opciones: ["COPY INTO en un job cada hora", "Auto Loader con cloudFiles", "CTAS programado", "Consulta directa con csv.`path`"], correcta: 1, explicacion: "COPY INTO escala bien hasta miles de archivos; para millones o baja latencia conviene Auto Loader." },
        { id: "q08", tema: "Databricks Intelligence Platform", texto: "¿Qué componente de Lakeflow se encarga de la orquestación?", opciones: ["Lakeflow Connect", "Lakeflow Jobs", "Lakeflow Spark Declarative Pipelines", "Unity Catalog"], correcta: 1, explicacion: "Connect ingiere, Spark Declarative Pipelines transforma y Jobs orquesta." },
        { id: "q09", tema: "Databricks Intelligence Platform", texto: "Se necesita traer datos de Salesforce sin escribir código y con captura incremental. ¿Qué se usa?", opciones: ["Un Standard connector con read_files", "Un Managed connector de Lakeflow Connect", "Auto Loader sobre un export en S3", "COPY INTO con FILEFORMAT = JSON"], correcta: 1, explicacion: "Los Managed connectors (Salesforce, Workday, ServiceNow, SQL Server) los administra Databricks y hacen CDC incremental." },
        { id: "q10", tema: "Data Transformation and Modeling", texto: "¿En qué capa Medallion van los datos crudos junto con sus metadatos de ingesta?", opciones: ["Bronze", "Silver", "Gold", "Staging"], correcta: 0, explicacion: "Bronze guarda el dato tal como llega más columnas de auditoría. Silver limpia y Gold agrega." },
        { id: "q11", tema: "Data Transformation and Modeling", texto: "¿Qué le da a Delta Lake las transacciones ACID y el time travel?", opciones: ["El formato Parquet", "El transaction log (_delta_log)", "Unity Catalog", "El cache del cluster"], correcta: 1, explicacion: "Delta = Parquet más transaction log. El log registra cada versión y permite VERSION AS OF." },
        { id: "q12", tema: "Governance and Security", texto: "¿Cómo se referencia una tabla en Unity Catalog?", opciones: ["database.table", "catalog.schema.table", "workspace.database.table", "schema.volume.table"], correcta: 1, explicacion: "Unity Catalog usa un namespace de tres niveles. Los archivos crudos viven en Volumes." },
        { id: "q13", tema: "Governance and Security", texto: "Se hace DROP TABLE de una tabla managed de Unity Catalog. ¿Qué pasa con los datos?", opciones: ["Quedan intactos en la ubicación externa", "Se borran junto con la tabla", "Pasan a una papelera por 90 días", "Se convierten en tabla external"], correcta: 1, explicacion: "En una tabla managed, Unity Catalog administra el ciclo de vida de los datos. En una external, los datos sobreviven." },
        { id: "q14", tema: "Troubleshooting, Monitoring, Optimization", texto: "¿Qué comando muestra las operaciones y versiones de una tabla Delta?", opciones: ["SHOW TABLES EXTENDED", "DESCRIBE HISTORY", "EXPLAIN FORMATTED", "SHOW VERSIONS"], correcta: 1, explicacion: "DESCRIBE HISTORY lista cada operación con su versión, timestamp y métricas." },
        { id: "q15", tema: "Data Ingestion and Loading", texto: "Al leer un CSV sin declarar esquema, una columna con valores numéricos y un 'abc' queda como STRING. ¿Cuál es la mejor solución si se quiere INT y no perder el valor sucio?", opciones: ["Usar mode => 'DROPMALFORMED'", "Declarar schema o schemaHints y revisar _rescued_data", "Cambiar el archivo de origen antes de ingerir", "Usar csv.`path` en lugar de read_files"], correcta: 1, explicacion: "Con el tipo declarado, el valor inválido queda NULL en la columna y se conserva dentro de _rescued_data para la tabla de cuarentena." }
      ]
    }
  ]
};
