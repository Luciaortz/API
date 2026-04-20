// proxy para evitar CORS con la API de Deezer
const PROXY = 'https://proxy.corsfix.com/?';
const DEEZER = 'https://api.deezer.com';

const GENRE_CHART_IDS = {
  '0':   { name: 'Todos los géneros', id: '3155776842' },
  '132': { name: 'Pop',               id: '1313621735' },
  '116': { name: 'Rap / Hip-Hop',     id: '1116190921' },
  '152': { name: 'Rock',              id: '1109890291' },
  '144': { name: 'Latino',            id: '2098660064' },
  '464': { name: 'Alternativo',       id: '1116189941' },
  '169': { name: 'Country',           id: '1116189501' },
  '75':  { name: 'Jazz',              id: '1116187861' },
  '98':  { name: 'Clásica',           id: '1116187421' },
};

async function fetchDeezer(path) {
  const res = await fetch(`${PROXY}${DEEZER}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function normalize(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}

function fmtTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── NAVEGACIÓN ───────────────────────────────────────────
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const page = link.dataset.page;
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    link.classList.add('active');
    document.getElementById('page-' + page).classList.add('active');
  });
});

// ─── MODAL ────────────────────────────────────────────────
const modalOverlay = document.getElementById('modal-overlay');
const modalContent = document.getElementById('modal-content');

function openModal(html) {
  modalContent.innerHTML = html;
  modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  // detener audio del modal si existe
  const mAudio = modalContent.querySelector('audio');
  if (mAudio) { mAudio.pause(); mAudio.src = ''; }
  modalOverlay.classList.add('hidden');
  modalContent.innerHTML = '';
  document.body.style.overflow = '';
}

document.getElementById('modal-close').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ─── BUSCAR ───────────────────────────────────────────────
let searchType = 'track';
const searchInput = document.getElementById('search-input');
const resultsGrid = document.getElementById('search-results');

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    searchType = btn.dataset.type;
    if (searchInput.value.trim().length > 1) doSearch(searchInput.value.trim());
  });
});

const doSearch = debounce(async (q) => {
  resultsGrid.innerHTML = '<div class="state-msg">Buscando...</div>';
  try {
    const data = await fetchDeezer(`/search/${searchType}?q=${encodeURIComponent(q)}&limit=24`);
    renderSearchResults(data.data || []);
  } catch {
    resultsGrid.innerHTML = '<div class="state-msg">Error al conectar con Deezer.</div>';
  }
}, 400);

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim();
  if (q.length < 2) { resultsGrid.innerHTML = ''; return; }
  doSearch(q);
});

function renderSearchResults(items) {
  if (!items.length) { resultsGrid.innerHTML = '<div class="state-msg">Sin resultados.</div>'; return; }
  resultsGrid.innerHTML = items.map(item => {
    if (searchType === 'track') {
      const shortTitle = item.title_short || item.title;
      return `<div class="result-card clickable" data-id="${item.id}" data-type="track">
        <img src="${item.album?.cover_small || ''}" alt="" loading="lazy" />
        <div class="result-info">
          <div class="result-title">${shortTitle}</div>
          <div class="result-sub">${item.artist?.name || ''}</div>
          <div class="result-extra">${fmtTime(item.duration)}</div>
        </div>
      </div>`;
    } else if (searchType === 'artist') {
      return `<div class="result-card clickable" data-id="${item.id}" data-type="artist">
        <img src="${item.picture_small || ''}" alt="" loading="lazy" />
        <div class="result-info">
          <div class="result-title">${item.name}</div>
          <div class="result-sub">${item.nb_album ? item.nb_album + ' álbumes' : ''}</div>
          <div class="result-extra">${item.nb_fan ? item.nb_fan.toLocaleString() + ' fans' : ''}</div>
        </div>
      </div>`;
    } else {
      return `<div class="result-card clickable" data-id="${item.id}" data-type="album">
        <img src="${item.cover_small || ''}" alt="" loading="lazy" />
        <div class="result-info">
          <div class="result-title">${item.title}</div>
          <div class="result-sub">${item.artist?.name || ''}</div>
          <div class="result-extra">${item.nb_tracks ? item.nb_tracks + ' canciones' : ''}</div>
        </div>
      </div>`;
    }
  }).join('');

  // eventos de clic para modales
  resultsGrid.querySelectorAll('.result-card.clickable').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const type = card.dataset.type;
      if (type === 'track') openTrackModal(id);
      else if (type === 'artist') openArtistModal(id);
      else if (type === 'album') openAlbumModal(id);
    });
  });
}

// modal de canción
async function openTrackModal(id) {
  openModal('<div class="state-msg">Cargando...</div>');
  try {
    const t = await fetchDeezer(`/track/${id}`);
    const explicit = t.explicit_lyrics ? 'Sí' : 'No';
    const preview = t.preview || '';
    openModal(`
      <div class="modal-track">
        <div class="modal-track-hero">
          <img src="${t.album?.cover_medium || t.album?.cover_small || ''}" alt="" class="modal-album-cover" />
          <div class="modal-track-main">
            <div class="modal-track-title">${t.title}</div>
            <div class="modal-track-artist">${t.artist?.name || ''}</div>
            <div class="modal-track-album">${t.album?.title || ''}</div>
          </div>
        </div>
        <div class="modal-track-grid">
          <div class="modal-info-item">
            <span class="modal-info-label">Duración</span>
            <span class="modal-info-val">${fmtTime(t.duration)} <span class="modal-info-sub">(${t.duration} seg)</span></span>
          </div>
          <div class="modal-info-item">
            <span class="modal-info-label">Fecha de lanzamiento</span>
            <span class="modal-info-val">${t.release_date || t.album?.release_date || '—'}</span>
          </div>
          <div class="modal-info-item">
            <span class="modal-info-label">BPM</span>
            <span class="modal-info-val">${t.bpm > 0 ? t.bpm : '—'}</span>
          </div>
          <div class="modal-info-item">
            <span class="modal-info-label">Rank</span>
            <span class="modal-info-val">${t.rank?.toLocaleString() || '—'}</span>
          </div>
          <div class="modal-info-item">
            <span class="modal-info-label">Letras explícitas</span>
            <span class="modal-info-val">${explicit}</span>
          </div>
        </div>
        ${preview ? `
        <div class="modal-player">
          <div class="modal-player-label">Vista previa</div>
          <audio controls src="${preview}" class="modal-audio"></audio>
        </div>` : '<div class="modal-player"><div class="modal-player-label" style="color:var(--gray)">Sin vista previa disponible</div></div>'}
      </div>
    `);
  } catch {
    openModal('<div class="state-msg">Error al cargar la canción.</div>');
  }
}

// modal de artista
async function openArtistModal(id) {
  openModal('<div class="state-msg">Cargando álbumes...</div>');
  try {
    const data = await fetchDeezer(`/artist/${id}/albums?limit=20`);
    const albums = data.data || [];
    const artist = albums[0] ? '' : '';
    const artistData = await fetchDeezer(`/artist/${id}`);
    openModal(`
      <div class="modal-artist">
        <div class="modal-artist-header">
          <img src="${artistData.picture_medium || ''}" alt="" class="modal-artist-pic" />
          <div>
            <div class="modal-track-title">${artistData.name}</div>
            <div class="modal-track-artist">${artistData.nb_fan?.toLocaleString() || ''} fans</div>
          </div>
        </div>
        <div class="modal-section-label">Álbumes recientes</div>
        <div class="modal-albums-grid">
          ${albums.map(a => `
            <div class="modal-album-card">
              <img src="${a.cover_small || ''}" alt="" />
              <div class="modal-album-name">${a.title}</div>
              <div class="modal-album-year">${a.release_date?.slice(0,4) || ''}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `);
  } catch {
    openModal('<div class="state-msg">Error al cargar los álbumes.</div>');
  }
}

// modal de álbum
async function openAlbumModal(id) {
  openModal('<div class="state-msg">Cargando álbum...</div>');
  try {
    const a = await fetchDeezer(`/album/${id}`);
    const tracks = a.tracks?.data || [];
    openModal(`
      <div class="modal-album">
        <div class="modal-track-hero">
          <img src="${a.cover_medium || a.cover_small || ''}" alt="" class="modal-album-cover" />
          <div class="modal-track-main">
            <div class="modal-track-title">${a.title}</div>
            <div class="modal-track-artist">${a.artist?.name || ''}</div>
            <div class="modal-track-album">${a.nb_tracks} canciones &middot; ${a.release_date?.slice(0,4) || ''}</div>
          </div>
        </div>
        <div class="modal-section-label">Canciones</div>
        <div class="modal-tracklist">
          ${tracks.map((t, i) => `
            <div class="modal-track-row">
              <span class="modal-track-num">${i + 1}</span>
              <span class="modal-track-name">${t.title}</span>
              <span class="modal-track-dur">${fmtTime(t.duration)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `);
  } catch {
    openModal('<div class="state-msg">Error al cargar el álbum.</div>');
  }
}

// ─── CHARTS ───────────────────────────────────────────────
const chartFilterRadios = document.querySelectorAll('input[name="chart-filter"]');
const genreSelectorWrap = document.getElementById('genre-selector-wrap');
const artistSearchWrap = document.getElementById('artist-search-wrap');
const chartArtistInput = document.getElementById('chart-artist-input');
const chartArtistSuggestions = document.getElementById('chart-artist-suggestions');
let selectedChartArtistId = null;

chartFilterRadios.forEach(r => {
  r.addEventListener('change', () => {
    if (r.value === 'genre') {
      genreSelectorWrap.classList.remove('hidden');
      artistSearchWrap.classList.add('hidden');
    } else {
      genreSelectorWrap.classList.add('hidden');
      artistSearchWrap.classList.remove('hidden');
    }
  });
});

const doChartArtistSearch = debounce(async (q) => {
  if (q.length < 2) { chartArtistSuggestions.innerHTML = ''; return; }
  const data = await fetchDeezer(`/search/artist?q=${encodeURIComponent(q)}&limit=6`);
  chartArtistSuggestions.innerHTML = (data.data || []).map(a =>
    `<div class="suggestion-item" data-id="${a.id}" data-name="${a.name}">
      <img src="${a.picture_small}" alt="" />
      <div class="suggestion-item-info">
        <div class="suggestion-item-title">${a.name}</div>
      </div>
    </div>`
  ).join('');
  chartArtistSuggestions.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      selectedChartArtistId = item.dataset.id;
      chartArtistInput.value = item.dataset.name;
      chartArtistSuggestions.innerHTML = '';
    });
  });
}, 350);

chartArtistInput.addEventListener('input', () => doChartArtistSearch(chartArtistInput.value.trim()));

document.getElementById('btn-generate-chart').addEventListener('click', async () => {
  const filterType = document.querySelector('input[name="chart-filter"]:checked').value;
  const container = document.getElementById('chart-container');
  container.innerHTML = '<div class="state-msg">Cargando datos...</div>';

  try {
    let tracks = [];
    if (filterType === 'genre') {
      const genreId = document.getElementById('genre-select').value;
      const genreInfo = GENRE_CHART_IDS[genreId];
      const data = await fetchDeezer(`/playlist/${genreInfo.id}/tracks?limit=10`);
      tracks = data.data || [];
    } else {
      if (!selectedChartArtistId) { container.innerHTML = '<div class="state-msg">Selecciona un artista.</div>'; return; }
      const data = await fetchDeezer(`/artist/${selectedChartArtistId}/top?limit=10`);
      tracks = data.data || [];
    }

    if (!tracks.length) { container.innerHTML = '<div class="state-msg">Sin datos.</div>'; return; }

    const names = tracks.map(t => t.title.length > 22 ? t.title.slice(0, 22) + '...' : t.title);
    const artists = tracks.map(t => t.artist?.name || '');
    const ranks = tracks.map((_, i) => 10 - i);
    const colors = tracks.map((_, i) => i === 0 ? '#f97316' : '#7c3aed');

    container.innerHTML = '';
    Plotly.newPlot(container, [{
      type: 'bar',
      x: names,
      y: ranks,
      marker: { color: colors, line: { width: 0 } },
      hovertemplate: '<b>%{x}</b><br>Artista: %{customdata[0]}<br>Posición: %{customdata[1]}<extra></extra>',
      customdata: tracks.map((_, i) => [artists[i], `#${i + 1}`])
    }], {
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { family: 'DM Sans, sans-serif', color: '#888', size: 12 },
      xaxis: { tickangle: -30, gridcolor: '#2a2a2a', linecolor: '#2a2a2a' },
      yaxis: { title: 'Popularidad', gridcolor: '#2a2a2a', linecolor: '#2a2a2a' },
      margin: { t: 20, b: 80, l: 50, r: 20 },
      bargap: 0.25
    }, { responsive: true, displayModeBar: false });
  } catch {
    container.innerHTML = '<div class="state-msg">Error al cargar los datos.</div>';
  }
});

// ─── TORNEO ───────────────────────────────────────────────
let torneoSongs = [];
const torneoSearchInput = document.getElementById('torneo-search-input');
const torneoSuggestions = document.getElementById('torneo-search-suggestions');
const torneoCount = document.getElementById('torneo-count');
const torneoSelectedList = document.getElementById('torneo-selected-list');
const btnStartTorneo = document.getElementById('btn-start-torneo');

const doTorneoSearch = debounce(async (q) => {
  if (q.length < 2) { torneoSuggestions.innerHTML = ''; return; }
  const data = await fetchDeezer(`/search/track?q=${encodeURIComponent(q)}&limit=8`);
  torneoSuggestions.innerHTML = (data.data || []).map(t =>
    `<div class="suggestion-item" data-id="${t.id}" data-title="${encodeURIComponent(t.title)}" data-artist="${encodeURIComponent(t.artist?.name || '')}" data-img="${t.album?.cover_small || ''}">
      <img src="${t.album?.cover_small || ''}" alt="" />
      <div class="suggestion-item-info">
        <div class="suggestion-item-title">${t.title}</div>
        <div class="suggestion-item-sub">${t.artist?.name || ''}</div>
      </div>
    </div>`
  ).join('');
  torneoSuggestions.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      if (torneoSongs.length >= 16) return;
      const id = item.dataset.id;
      if (torneoSongs.find(s => s.id === id)) return;
      torneoSongs.push({
        id,
        title: decodeURIComponent(item.dataset.title),
        artist: decodeURIComponent(item.dataset.artist),
        img: item.dataset.img
      });
      torneoSuggestions.innerHTML = '';
      torneoSearchInput.value = '';
      renderTorneoChips();
    });
  });
}, 350);

torneoSearchInput.addEventListener('input', () => doTorneoSearch(torneoSearchInput.value.trim()));

function renderTorneoChips() {
  torneoCount.textContent = `${torneoSongs.length} / 16 canciones seleccionadas`;
  btnStartTorneo.disabled = torneoSongs.length < 16;
  torneoSelectedList.innerHTML = torneoSongs.map((s, i) =>
    `<div class="torneo-song-chip">
      <img src="${s.img}" alt="" />
      <span title="${s.title}">${s.title}</span>
      <button class="remove-chip" data-index="${i}" title="Quitar">x</button>
    </div>`
  ).join('');
  torneoSelectedList.querySelectorAll('.remove-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      torneoSongs.splice(parseInt(btn.dataset.index), 1);
      renderTorneoChips();
    });
  });
}

btnStartTorneo.addEventListener('click', initTorneo);

let bracket = [];
let bracketWinners = [];

function initTorneo() {
  const shuffled = [...torneoSongs].sort(() => Math.random() - 0.5);
  bracket = [];
  bracketWinners = [];
  const r1 = [];
  for (let i = 0; i < 16; i += 2) r1.push([shuffled[i], shuffled[i + 1]]);
  bracket.push(r1);
  bracketWinners.push(new Array(8).fill(null));
  for (let r = 1; r < 4; r++) {
    const matchCount = 8 / Math.pow(2, r);
    bracket.push(new Array(matchCount).fill(null).map(() => [null, null]));
    bracketWinners.push(new Array(matchCount).fill(null));
  }
  document.getElementById('torneo-selection-phase').classList.add('hidden');
  document.getElementById('torneo-bracket-phase').classList.remove('hidden');
  renderBracket();
}

function renderBracket() {
  const container = document.getElementById('torneo-bracket');
  container.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:flex;align-items:center;gap:0;width:max-content;';

  const leftSide = document.createElement('div');
  leftSide.style.cssText = 'display:flex;gap:0;align-items:center;';
  [{ ronda: 0, matches: [0,1,2,3] }, { ronda: 1, matches: [0,1] }, { ronda: 2, matches: [0] }]
    .forEach(({ ronda, matches }) => leftSide.appendChild(buildRoundEl(ronda, matches)));

  const center = buildCenterEl();

  const rightSide = document.createElement('div');
  rightSide.style.cssText = 'display:flex;flex-direction:row-reverse;gap:0;align-items:center;';
  [{ ronda: 0, matches: [4,5,6,7] }, { ronda: 1, matches: [2,3] }, { ronda: 2, matches: [1] }]
    .forEach(({ ronda, matches }) => rightSide.appendChild(buildRoundEl(ronda, matches)));

  wrapper.appendChild(leftSide);
  wrapper.appendChild(center);
  wrapper.appendChild(rightSide);
  container.appendChild(wrapper);
}

function buildRoundEl(ronda, matchIndices) {
  const roundEl = document.createElement('div');
  roundEl.style.cssText = 'display:flex;flex-direction:column;justify-content:space-around;';
  matchIndices.forEach(mIdx => {
    const matchEl = document.createElement('div');
    matchEl.style.cssText = 'display:flex;flex-direction:column;gap:3px;margin:8px 0;';
    const match = bracket[ronda][mIdx];
    const winner = bracketWinners[ronda][mIdx];
    [0, 1].forEach(slot => {
      const song = match ? match[slot] : null;
      const slotEl = document.createElement('div');
      slotEl.className = 'bracket-slot';
      if (!song) {
        slotEl.classList.add('empty');
        slotEl.textContent = '—';
      } else {
        slotEl.innerHTML = `<img src="${song.img}" alt="" /><span title="${song.title}">${song.title}</span>`;
        if (winner && winner.id === song.id) slotEl.classList.add('winner');
        else if (winner && winner.id !== song.id) slotEl.classList.add('eliminated');
        if (!winner) slotEl.addEventListener('click', () => selectWinner(ronda, mIdx, song));
      }
      matchEl.appendChild(slotEl);
    });
    roundEl.appendChild(matchEl);
  });
  return roundEl;
}

function buildCenterEl() {
  const center = document.createElement('div');
  center.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:0 16px;flex-shrink:0;';
  const label = document.createElement('div');
  label.className = 'bracket-final-label';
  label.textContent = 'Final';
  center.appendChild(label);
  const finalSlot = document.createElement('div');
  finalSlot.id = 'bracket-final-slot';
  finalSlot.className = 'bracket-final-slot';
  const finalWinner = bracketWinners[3][0];
  if (finalWinner) {
    finalSlot.innerHTML = `<img src="${finalWinner.img}" alt="" /><span>${finalWinner.title}</span>`;
    finalSlot.classList.add('winner');
  } else {
    const leftReady = bracketWinners[2][0];
    const rightReady = bracketWinners[2][1];
    if (leftReady && rightReady) {
      finalSlot.innerHTML = `<span>${leftReady.title} vs ${rightReady.title}</span>`;
      finalSlot.addEventListener('click', () => showFinalPicker(leftReady, rightReady));
    } else {
      finalSlot.innerHTML = '<span style="color:var(--gray);font-size:10px;">Por definir</span>';
    }
  }
  center.appendChild(finalSlot);
  return center;
}

function showFinalPicker(songA, songB) {
  const slot = document.getElementById('bracket-final-slot');
  if (!slot) return;
  slot.innerHTML = `
    <div style="font-size:10px;color:var(--gray);margin-bottom:6px;">Elige el ganador</div>
    <div style="display:flex;gap:6px;flex-direction:column;width:100%;">
      <div class="bracket-slot" id="fp-a" style="width:100%;justify-content:center;">
        <img src="${songA.img}" /><span>${songA.title}</span>
      </div>
      <div class="bracket-slot" id="fp-b" style="width:100%;justify-content:center;">
        <img src="${songB.img}" /><span>${songB.title}</span>
      </div>
    </div>`;
  document.getElementById('fp-a').addEventListener('click', () => selectWinner(3, 0, songA));
  document.getElementById('fp-b').addEventListener('click', () => selectWinner(3, 0, songB));
}

function selectWinner(ronda, matchIdx, song) {
  bracketWinners[ronda][matchIdx] = song;
  const nextRonda = ronda + 1;
  if (nextRonda < 4) {
    const nextMatchIdx = Math.floor(matchIdx / 2);
    if (!bracket[nextRonda][nextMatchIdx]) bracket[nextRonda][nextMatchIdx] = [null, null];
    bracket[nextRonda][nextMatchIdx][matchIdx % 2] = song;
  }
  renderBracket();
  if (ronda === 3) showWinner(song);
}

function showWinner(song) {
  const banner = document.getElementById('torneo-winner-banner');
  document.getElementById('winner-img').src = song.img;
  document.getElementById('winner-title').textContent = song.title;
  document.getElementById('winner-artist').textContent = song.artist;
  banner.classList.remove('hidden');
  banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ─── ADIVINA ──────────────────────────────────────────────
let currentAdivinaTrack = null;
let audioCtx = null;
let analyser = null;
let animFrame = null;
let intentos = 0;
let puntaje = 0;
// rastrear qué campos ya fueron verificados correctamente en el intento actual
let fieldsVerified = { title: false, artist: false, album: false, duration: false };

const adivinaAudio = document.getElementById('adivina-audio');
const btnPlay = document.getElementById('btn-play-adivina');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const canvas = document.getElementById('visualizer-canvas');
const canvasCtx = canvas.getContext('2d');
const progressFill = document.getElementById('adivina-progress-fill');
const timeLabel = document.getElementById('adivina-time');

function setupAudioContext() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  const source = audioCtx.createMediaElementSource(adivinaAudio);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
}

btnPlay.addEventListener('click', () => {
  if (!currentAdivinaTrack) { loadRandomTrack(); return; }
  setupAudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (adivinaAudio.paused) {
    adivinaAudio.play();
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
    drawVisualizer();
  } else {
    adivinaAudio.pause();
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
  }
});

adivinaAudio.addEventListener('timeupdate', () => {
  if (!adivinaAudio.duration) return;
  progressFill.style.width = (adivinaAudio.currentTime / adivinaAudio.duration * 100) + '%';
  timeLabel.textContent = fmtTime(adivinaAudio.currentTime);
});

adivinaAudio.addEventListener('ended', () => {
  playIcon.classList.remove('hidden');
  pauseIcon.classList.add('hidden');
  cancelAnimationFrame(animFrame);
  clearCanvas();
});

function drawVisualizer() {
  if (!analyser) return;
  const bufLen = analyser.frequencyBinCount;
  const dataArr = new Uint8Array(bufLen);
  const w = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
  const h = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
  function draw() {
    animFrame = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArr);
    canvasCtx.clearRect(0, 0, w, h);
    canvasCtx.fillStyle = '#0d0d0d';
    canvasCtx.fillRect(0, 0, w, h);
    const barW = (w / bufLen) * 2;
    let x = 0;
    dataArr.forEach(val => {
      const barH = (val / 255) * h * 0.9;
      const t = val / 255;
      const r = Math.round(124 + (249 - 124) * t);
      const g = Math.round(58 + (115 - 58) * t);
      const b = Math.round(237 + (22 - 237) * t);
      canvasCtx.fillStyle = `rgb(${r},${g},${b})`;
      canvasCtx.fillRect(x, h - barH, barW - 1, barH);
      x += barW;
    });
  }
  draw();
}

function clearCanvas() {
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  canvasCtx.fillStyle = '#0d0d0d';
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
}

async function loadRandomTrack() {
  const genreId = document.getElementById('adivina-genre-select').value;
  try {
    const genreInfo = GENRE_CHART_IDS[genreId];
    const data = await fetchDeezer(`/playlist/${genreInfo.id}/tracks?limit=50`);
    const tracks = (data.data || []).filter(t => t.preview);
    if (!tracks.length) { alert('No hay canciones disponibles para este género.'); return; }
    setAdivinaTrack(tracks[Math.floor(Math.random() * tracks.length)]);
  } catch {
    alert('Error al cargar la canción.');
  }
}

function setAdivinaTrack(track) {
  currentAdivinaTrack = track;
  adivinaAudio.src = track.preview;
  adivinaAudio.load();
  progressFill.style.width = '0%';
  timeLabel.textContent = '0:00';
  document.getElementById('real-title').textContent = track.title;
  document.getElementById('real-artist').textContent = track.artist?.name || '';
  document.getElementById('real-album').textContent = track.album?.title || '';
  document.getElementById('real-duration').textContent = track.duration;
  document.querySelectorAll('.real-value').forEach(el => {
    el.classList.remove('revealed');
    el.classList.add('hidden');
  });
  document.querySelectorAll('.adivina-input').forEach(inp => {
    inp.value = '';
    inp.classList.remove('correct', 'wrong');
    inp.disabled = false;
  });
  // reset del estado de verificación
  fieldsVerified = { title: false, artist: false, album: false, duration: false };
  setupAudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  adivinaAudio.play();
  playIcon.classList.add('hidden');
  pauseIcon.classList.remove('hidden');
  drawVisualizer();
}

function revealField(fieldId) {
  const el = document.getElementById('real-' + fieldId);
  el.classList.remove('hidden');
  el.classList.add('revealed');
}

// checkField devuelve true/false Y solo suma puntos si el campo no había sido verificado correctamente antes
function checkField(fieldId, addScore) {
  const realEl = document.getElementById('real-' + fieldId);
  const inp = document.getElementById('ans-' + fieldId);
  const realVal = realEl.textContent.trim();
  const userVal = inp.value.trim();
  const correct = normalize(realVal) === normalize(userVal);
  inp.classList.toggle('correct', correct);
  inp.classList.toggle('wrong', !correct);
  revealField(fieldId);
  if (addScore && correct && !fieldsVerified[fieldId]) {
    fieldsVerified[fieldId] = true;
    puntaje = Math.round((puntaje + 0.25) * 100) / 100;
    document.getElementById('counter-puntaje').textContent = puntaje.toFixed(2);
  }
  return correct;
}

document.querySelectorAll('.btn-verificar').forEach(btn => {
  btn.addEventListener('click', () => checkField(btn.dataset.field, true));
});

document.getElementById('btn-verificar-todo').addEventListener('click', () => {
  ['title', 'artist', 'album', 'duration'].forEach(f => checkField(f, true));
});

document.getElementById('btn-siguiente-cancion').addEventListener('click', () => {
  intentos++;
  document.getElementById('counter-intentos').textContent = intentos;
  adivinaAudio.pause();
  cancelAnimationFrame(animFrame);
  clearCanvas();
  playIcon.classList.remove('hidden');
  pauseIcon.classList.add('hidden');
  loadRandomTrack();
});

document.querySelector('[data-page="adivina"]').addEventListener('click', () => {
  if (!currentAdivinaTrack) loadRandomTrack();
});