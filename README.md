# DeepWiki for GitLab

Réplica funcional de [DeepWiki](https://deepwiki.com) para repositorios de **GitLab**
(self-hosted o gitlab.com). Indexa un proyecto, analiza su estructura real (lenguajes,
dependencias, módulos) y genera un wiki navegable con páginas escritas por IA a partir
del código fuente real — overview, arquitectura con diagramas, una página por módulo
principal, y una guía de instalación/ejecución.

```
backend/    API en FastAPI: cliente GitLab, análisis estático, generación con IA, persistencia
frontend/   SPA en React + Vite: formulario de conexión, progreso de indexado, lector del wiki
```

## Cómo funciona

1. **Conectas** un proyecto GitLab dando la URL de la instancia, la ruta del proyecto
   (`grupo/proyecto`) y un Personal Access Token.
2. El backend **clona la metadata y el árbol de archivos** vía la API REST v4 de GitLab
   (no hace `git clone` real, lee archivos individuales vía API — funciona igual en
   self-hosted que en gitlab.com).
3. Un **analizador estático** (sin IA) detecta lenguajes, gestores de dependencias
   (package.json, requirements.txt, pom.xml, go.mod, etc.), agrupa archivos en módulos
   por carpeta y detecta puntos de entrada.
4. La capa de **IA (API de Claude)** recibe ese contexto estructurado más el contenido
   real de los archivos relevantes (README, manifiestos, muestras de cada módulo) y
   genera cada página del wiki en Markdown, incluyendo diagramas Mermaid cuando aplica.
5. Todo se persiste en SQLite. El **frontend hace polling** del progreso del job y,
   al terminar, muestra el wiki con sidebar de navegación, render de Markdown/Mermaid/código,
   y un panel de preguntas libres sobre el contenido ya generado.

## Requisitos

- Python 3.11+
- Node.js 18+
- Una API key de [Anthropic](https://console.anthropic.com/) (para la generación con IA)
- Un Personal Access Token de GitLab con scopes `read_api` y `read_repository`

## Backend

```bash
cd backend
pip install -r requirements.txt

cp .env.example .env
# Edita .env y pon tu ANTHROPIC_API_KEY

uvicorn app.main:app --reload --port 8000
```

La API queda en `http://localhost:8000`. Documentación interactiva automática en
`http://localhost:8000/docs`.

### Variables de entorno (`backend/.env`)

| Variable                | Descripción                                              | Default                              |
|--------------------------|-----------------------------------------------------------|---------------------------------------|
| `ANTHROPIC_API_KEY`     | Clave de la API de Anthropic (requerida)                  | —                                      |
| `ANTHROPIC_MODEL`       | Modelo a usar para generar el wiki                         | `claude-sonnet-4-6`                   |
| `DATABASE_URL`          | URL de conexión SQLAlchemy (SQLite por defecto)            | `sqlite+aiosqlite:///./deepwiki.db`   |
| `MAX_FILES_TO_INDEX`    | Tope de archivos a listar por repo (evita timeouts en monorepos) | `400`                          |
| `MAX_CHARS_PER_AI_CALL` | Presupuesto de contexto por llamada a IA                  | `60000`                               |

## Frontend

```bash
cd frontend
npm install

cp .env.example .env
# Por defecto ya apunta a http://localhost:8000, ajusta si tu backend corre en otro host

npm run dev
```

La app queda en `http://localhost:5173`.

## Uso

1. Abre el frontend, completa la URL de tu instancia GitLab (ej. `https://gitlab.com` o
   `https://gitlab.tuempresa.com`), la ruta del proyecto (`grupo/proyecto`) y tu token.
2. El indexado corre en segundo plano; verás el progreso etapa por etapa
   (conectando → analizando → generando con IA → listo).
3. Al terminar, navega el wiki generado desde el sidebar. Cada página muestra los
   archivos fuente que la IA usó para escribirla.
4. Usa el panel "¿preguntas sobre este repo?" en la esquina inferior derecha para
   hacer preguntas libres; las respuestas se basan únicamente en el wiki ya generado.

## Probar sin una instancia GitLab real

El proyecto incluye un **mock de la API de GitLab** (`backend/tests/mock_gitlab_server.py`)
que simula un proyecto pequeño en Node.js/Express. Es útil para probar el flujo completo
sin necesitar credenciales reales:

```bash
cd backend
python3 tests/mock_gitlab_server.py
# queda escuchando en http://127.0.0.1:9000
```

Luego, en el formulario de conexión del frontend:
- **URL de GitLab**: `http://127.0.0.1:9000`
- **Ruta del proyecto**: `demo-group/demo-project`
- **Token**: `test-token-123`

## Decisiones de diseño relevantes

- **Sin `git clone` real**: se lee el árbol y el contenido de archivos vía la API REST
  de GitLab. Esto evita tener que gestionar disco, autenticación de Git y limpieza de
  workspaces, y funciona igual de bien contra self-hosted que contra gitlab.com.
- **Análisis estático separado de la IA**: la detección de lenguajes, dependencias y
  módulos es pura heurística sin IA. Esto abarata el indexado (no se gastan tokens en
  tareas mecánicas) y le da a los prompts de IA contexto ya estructurado en vez de
  texto crudo.
- **Presupuesto de contexto explícito**: cada llamada a IA recorta el contenido de
  archivos a un límite de caracteres configurable, para que repos grandes no generen
  prompts inmanejables ni costos descontrolados.
- **Progreso real, no simulado**: el `IndexJob` se actualiza en cada etapa real del
  pipeline (no hay una barra de progreso falsa); si el job falla, el mensaje de error
  específico queda visible tanto en la API como en el frontend.
