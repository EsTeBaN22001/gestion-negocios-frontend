# Sistema de Gestión de Negocios — Frontend

Aplicación cliente desarrollada en **Angular 18** (Standalone Components) y **Bootstrap 5** para el Sistema de Gestión de Negocios.

## Requisitos

- Node.js 20+
- npm 10+
- (Opcional) Docker

## Estructura del proyecto

```text
src/
├── app/
│   ├── core/           # Servicios técnicos e interceptores de infraestructura
│   │   └── services/   # ApiService (comunicación con backend)
│   ├── pages/          # Pantallas de la aplicación
│   │   └── home/       # Vista inicial de conectividad (Fase 0)
│   ├── shared/         # Componentes y pipes reutilizables
│   ├── app.component.* # Componente raíz
│   ├── app.config.ts   # Configuración de proveedores (HttpClient, Router)
│   └── app.routes.ts   # Definición de rutas
├── environments/       # Configuración por ambiente (URLs de API)
└── styles.css          # Estilos globales y Bootstrap
```

## Ejecución en desarrollo local

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Iniciar servidor de desarrollo:
   ```bash
   npm start
   # o
   npx ng serve
   ```

3. Abrir en el navegador: [http://localhost:4200](http://localhost:4200)

## Build para producción

```bash
npm run build
```

Los artefactos compilados se generan en `dist/gestion-negocios/browser`.

## Ejecución con Docker

El proyecto incluye un `Dockerfile` multi-stage con Nginx y su correspondiente `nginx.conf`:

```bash
docker build -t gestion-negocios-frontend .
docker run -p 4200:80 gestion-negocios-frontend
```

O integrado mediante Docker Compose en la raíz del workspace:

```bash
docker compose up frontend
```
