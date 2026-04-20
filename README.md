# Rendimiento de Cultivos en Colombia

Este proyecto es una aplicación web que permite visualizar el rendimiento de cultivos en Colombia utilizando datos abiertos del gobierno.

Se analizan variables como:
- Área sembrada
- Producción
- Cultivos por departamento

La aplicación presenta gráficos interactivos y tablas dinámicas para facilitar el análisis de la información agrícola del país.

 Funcionalidades: 
- Visualización de los cultivos más sembrados en Colombia
- Filtro por departamento
- Gráfico de área sembrada por cultivo
- Tabla con información detallada (producción, municipios, etc.)
- Indicadores generales (número de departamentos, cultivos y área total)



 Tecnologías utilizadas
- HTML
- CSS
- JavaScript
- Chart.js (para gráficos)
- API de datos abiertos de Colombia


Datos obtenidos de:
https://www.datos.gov.co/resource/2pnw-mmge.json


## Vista general
<img width="1286" height="589" alt="image" src="https://github.com/user-attachments/assets/d30e619b-ea08-40b9-889e-69d168a51594" />
<img width="1318" height="520" alt="image" src="https://github.com/user-attachments/assets/0f59d392-3b8a-4723-b593-6fd40b1e5e7f" />


# Deezer Explorer

Aplicación web de una sola página que consume la API REST pública de Deezer para explorar música, visualizar tendencias y jugar con el conocimiento musical del usuario. Desarrollada con HTML, CSS y JavaScript vanilla, sin frameworks ni dependencias de backend.

Proyecto académico - Materia: Tecnologías Web, séptimo semestre de Ingeniería de Sistemas.

---

## Tecnologías utilizadas

- HTML5, CSS3 y JavaScript ES6+
- [Plotly.js](https://plotly.com/javascript/) para visualización de datos
- [API REST de Deezer](https://developers.deezer.com/api) como fuente de datos
- [proxy.corsfix.com](https://corsfix.com) como proxy CORS para las peticiones al API
- Web Audio API para el visualizador de audio

---

## Estructura del proyecto

```
deezer-explorer/
├── index.html
├── styles.css
└── script.js
```

---

## Funcionalidades

### Buscar

Permite buscar en la base de datos de Deezer mediante tres filtros seleccionables:

- **Canciones** - muestra el título corto, artista y duración de cada resultado. Al hacer clic en una canción se abre un modal con información detallada: título completo, artista, álbum, duración, fecha de lanzamiento, BPM, rank y si contiene letras explícitas. El modal incluye un reproductor de audio con el preview de 30 segundos de la canción.
- **Artistas** - muestra nombre, número de álbumes y fans. Al hacer clic se abre un modal con la foto del artista y una galería de sus álbumes más recientes.
- **Álbumes** - muestra portada, título y artista. Al hacer clic se abre un modal con la lista completa de canciones del álbum y su duración.

La búsqueda se ejecuta automáticamente mientras el usuario escribe, con un debounce de 400ms para no saturar el API.

---

### Charts

Genera un gráfico de barras interactivo con las 10 canciones más populares según el filtro elegido:

- **Por género** - seleccionable entre 14 géneros: Pop, Rap/Hip-Hop, Rock, Dance, R&B/Soul, Electrónica, Reggaeton, Latino, K-Pop, Alternativo, Country, Jazz, Clásica y Todos los géneros. Usa playlists editoriales de Deezer para obtener los datos.
- **Por artista** - búsqueda de artista con autocompletado; genera el gráfico con su top 10 de canciones.

Al pasar el cursor sobre cada barra, el tooltip muestra el nombre de la canción, el artista y la posición en el ranking. La barra del primer lugar se resalta en color naranja.

---

### Torneo

Juego de eliminación directa entre 16 canciones elegidas por el usuario.

1. El usuario busca y selecciona 16 canciones mediante un buscador con autocompletado.
2. Al completar la selección se habilita el botón **Iniciar torneo**, que organiza las canciones en un bracket visual de 16 participantes (8 por lado más la final al centro).
3. El sistema empareja las canciones aleatoriamente. El usuario hace clic en la canción que prefiere en cada enfrentamiento para avanzarla a la siguiente ronda.
4. El torneo avanza por octavos (8 partidos), cuartos (4), semifinales (2) y final (1) hasta que queda una canción ganadora.
5. Al terminar se muestra un banner con la canción ganadora y el bracket completo permanece visible con los resultados de todas las rondas.

---

### Adivina

Juego de preguntas basado en fragmentos de audio.

- El usuario selecciona un género musical y el sistema carga una canción aleatoria de ese género.
- Se muestra un visualizador de audio animado que reacciona en tiempo real a las frecuencias del fragmento.
- El usuario debe adivinar cuatro campos de la canción escribiendo su respuesta:
  - Título
  - Artista
  - Álbum
  - Duración en segundos
- Cada campo puede verificarse individualmente con su botón **Verificar**, o todos a la vez con **Verificar todo**. Al verificar, se revela la respuesta real y el campo se marca en verde si es correcto o en rojo si no lo es.
- La comparación ignora mayúsculas, minúsculas, tildes y la letra ñ.
- **Puntaje** - cada campo correcto suma 0.25 puntos. Un intento perfecto vale 1.00 punto. Un campo no se cuenta dos veces aunque se verifique varias veces.
- **Intento** - contador que aumenta cada vez que el usuario avanza a la siguiente canción.
- El botón **Siguiente canción** carga un nuevo fragmento y reinicia los campos de respuesta.

---

## Instrucciones de uso

No requiere instalación ni servidor local. Basta con abrir `index.html` directamente en el navegador.

> Las peticiones al API de Deezer se realizan a través de un proxy CORS público. Es necesario tener conexión a internet para que la aplicación funcione.

---

## Autor

Samuel García y Laura Ortiz - Ingeniería de Sistemas, Universidad Simón Bolívar


