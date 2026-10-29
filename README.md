# Soluciones · Tickets

Aplicación web estática para crear y consultar solicitudes, buscar por ID, título, descripción o solicitante, filtrar por estado y prioridad, y cambiar entre Abierto, En Progreso y Resuelto.

## Ejecutar

Con Python 3 instalado:

```bash
npm start
```

Abre http://localhost:5173. También puedes ejecutar `python3 -m http.server 5173` directamente. No requiere instalar dependencias. `npm run check` valida la sintaxis de JavaScript con Node.js.

## Datos

Los tickets se guardan en `localStorage` bajo la clave `soluciones.tickets.v1`, en el navegador y origen utilizados. La aplicación inicia vacía. Se conservan al recargar y se sincroniza la vista entre pestañas del mismo origen. Si falla la escritura, se informa del error sin confirmar el cambio.

Esta versión es local: no incluye servidor de datos, autenticación ni colaboración entre usuarios o dispositivos. Borrar los datos del navegador elimina los tickets. Para uso compartido en producción, se requiere una base de datos y un backend con control de acceso.

La interfaz utiliza Google Fonts cuando hay conexión y fuentes del sistema como alternativa.
