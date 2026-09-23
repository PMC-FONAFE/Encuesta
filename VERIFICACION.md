# Cambios y verificación

- Administración: cinco columnas agrupadas, aspectos desplegables y fichas en pantallas de hasta 800 px. Todos los campos siguen disponibles.
- Paginación de 10, 25 o 50 registros. La exportación conserva todos los resultados filtrados, no solo la página visible.
- Ordenamiento accesible desde un selector, también en móvil; filtros y búsqueda reinician la página.
- Tablas de empresa adaptables, campos con etiquetas accesibles y búsqueda de gerentes reiniciada al cargar otra empresa.
- Protección frente a solicitudes repetidas de actualización y guardado de revisión.
- El cierre de sesión comprueba errores, limpia el directorio mostrado y carga las opciones de acceso de empresas.

## Prueba local

Ejecutar `python preview_test.py` y abrir `http://127.0.0.1:8766/test`.
La vista utiliza 61 registros ficticios y no se conecta a Supabase. El archivo de prueba está fuera de la carpeta de publicación `directorio_fonafe`.

Verificado en navegador: sin desbordamiento horizontal en 320, 375, 768, 1024, 1366 y 1440 px; avance de página, cambio de cantidad, filtro de inactivos, búsqueda sin coincidencias, limpieza de filtros, selector de orden y despliegue de aspectos. Sin errores de consola. Sintaxis JavaScript válida.

No se probaron escrituras ni autenticación contra Supabase, ni la descarga real de Excel. Requieren validar con una sesión autorizada y el servicio disponible.

## Vista empresa

Prueba local: `http://127.0.0.1:8766/company-test`. Fichas de gerentes, campos amplios de alta dirección, enlaces a secciones, botones con texto, limpieza de búsqueda y contador de aspectos. Verificados búsqueda, limpieza, apertura y cancelación de edición, contador al desmarcar un aspecto y ausencia de desbordamiento en 320, 375, 768, 1024, 1366 y 1440 px. Sin errores de consola. No se realizaron escrituras en Supabase.

## Mejoras de empresas — 23/09/2026

- Navegación por secciones visible; tablas en escritorio y campos apilados hasta 800 px.
- Filtro por aspecto, opción sin asignación y búsqueda por código de aspecto; limpiar restablece ambos filtros.
- Explicación del guardado inmediato de gerentes y de la confirmación final de revisión.
- Protección al cerrar una ficha modificada, incluso con Escape; aviso al abandonar la página.
- Validación de correos duplicados nuevos, sin impedir editar registros preexistentes con correo compartido.
- Conservación del ID recién creado para reintentar un guardado de aspectos fallido sin crear otro gerente.
- Errores del formulario visibles dentro del diálogo.

Verificación local con datos ficticios: carga de página, filtro sin asignación (0 de 4), limpieza de filtros, búsqueda A1 (4 de 4), apertura de edición y aparición de confirmación al cancelar una ficha modificada. El navegador se bloqueó al gestionar la confirmación; no se completó la verificación visual móvil de esta actualización. No se probaron escrituras reales ni recuperación de fallos contra Supabase. La actualización está en archivos locales, no publicada.
