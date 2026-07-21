<script>
  import { onMount, onDestroy } from "svelte";

  const isBrowser = typeof window !== "undefined" && typeof window.addEventListener === "function";

  let playlist = [];
  let currentIndex = -1;
  let currentTrack = null;
  let isPlaying = false;
  let currentTime = 0;
  let duration = 0;
  let progress = 0;
  let volume = 0.7;
  let playMode = 0;
  let initialized = false;
  let managerReady = isBrowser && !!window.__fireflyMusic;
  let retryTimer = null;
  let hoverPct = -1;
  let searchQuery = "";
  let lyrics = [];
  let currentLrcIndex = -1;
  let lyricsStatus = "none";

  $: filteredPlaylist = searchQuery.trim()
    ? playlist.filter(s =>
        (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.artist || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : playlist;

  let currentPage = 1;
  let ww = 1024;
  $: pageSize = ww < 768 ? 5 : 20;
  $: totalPages = Math.ceil(filteredPlaylist.length / pageSize) || 1;
  $: pagedSongs = filteredPlaylist.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  $: if (currentPage > totalPages) currentPage = totalPages;
  $: hoverTime = hoverPct >= 0 ? hoverPct / 100 * duration : 0;

  function fmt(sec) {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function syncState() {
    const m = window.__fireflyMusic;
    if (!m) return;
    const s = m.getState();
    playlist = s.playlist || [];
    currentIndex = s.currentIndex;
    currentTrack = s.track;
    isPlaying = s.isPlaying;
    currentTime = s.currentTime || 0;
    duration = s.duration || 0;
    progress = s.progress || 0;
    volume = s.volume;
    playMode = s.playMode;
    initialized = s.initialized;
    lyrics = s.lyrics || [];
    currentLrcIndex = s.currentLrcIndex;
  }

  function initManager() {
    if (!isBrowser) return;
    const m = window.__fireflyMusic;
    if (m && m.getState) {
      managerReady = true;
      syncState();
      bindEvents();
      return;
    }
    // 音乐管理器还未就绪，轮询等待
    retryTimer = setTimeout(initManager, 200);
  }

  function bindEvents() {
    window.addEventListener("fm:init", onFmInit);
    window.addEventListener("fm:track", onFmTrack);
    window.addEventListener("fm:play-state", onFmPlayState);
    window.addEventListener("fm:time", onFmTime);
    window.addEventListener("fm:volume", onFmVolume);
    window.addEventListener("fm:mode", onFmMode);
    window.addEventListener("fm:error", onFmError);
    window.addEventListener("fm:lrc-index", onLrcIndex);
    window.addEventListener("fm:lyrics", onLyrics);
  }

  function onFmInit() { syncState(); }
  function onFmTrack(e) { currentIndex = e.detail.index; currentTrack = e.detail.track; syncState(); }
  function onFmPlayState(e) { isPlaying = e.detail.isPlaying; }
  function onFmTime(e) { currentTime = e.detail.currentTime; duration = e.detail.duration; progress = e.detail.progress; }
  function onFmVolume(e) { volume = e.detail.volume; }
  function onFmMode(e) { playMode = e.detail.playMode; }
  function onFmError(e) {} // noop
  let lyricsEl;
  function onLrcIndex(e) { currentLrcIndex = e.detail.index; }
  function onLyrics(e) { lyrics = e.detail.lyrics || []; lyricsStatus = e.detail.status || "none"; }

  // 歌词自动居中滚动（只滚歌词面板，不滚页面）
  $: if (currentLrcIndex >= 0 && lyricsEl) {
    const active = lyricsEl.querySelector('.lrc-line.active');
    if (active) {
      const ch = lyricsEl.clientHeight;
      const top = active.offsetTop + active.offsetHeight / 2 - ch / 2;
      lyricsEl.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  }

  function play(i) {
    const idx = playlist.indexOf(filteredPlaylist[i]);
    if (idx >= 0) window.__fireflyMusic?.playTrackByIndex(idx);
  }
  function togglePlay() { window.__fireflyMusic?.togglePlay(); }
  function next() { window.__fireflyMusic?.playNext(); }
  function prev() { window.__fireflyMusic?.playPrev(); }
  function setVol(v) { window.__fireflyMusic?.setVolume(v); }
  function seek(pct) { window.__fireflyMusic?.seek(pct); }
  function cycleMode() { window.__fireflyMusic?.cyclePlayMode(); }

let resizeHandler;
  onMount(() => {
    ww = window.innerWidth;
    resizeHandler = () => ww = window.innerWidth;
    window.addEventListener("resize", resizeHandler);
    initManager();
  });
  onDestroy(() => {
    if (!isBrowser) return;
    clearTimeout(retryTimer);
    if (resizeHandler) window.removeEventListener("resize", resizeHandler);
    window.removeEventListener("fm:init", onFmInit);
    window.removeEventListener("fm:track", onFmTrack);
    window.removeEventListener("fm:play-state", onFmPlayState);
    window.removeEventListener("fm:time", onFmTime);
    window.removeEventListener("fm:volume", onFmVolume);
    window.removeEventListener("fm:mode", onFmMode);
    window.removeEventListener("fm:error", onFmError);
    window.removeEventListener("fm:lrc-index", onLrcIndex);
    window.removeEventListener("fm:lyrics", onLyrics);
  });
</script>

<div class="music-app" style={currentTrack?.pic ? "background-image:url("+currentTrack.pic+")" : ""}>
  {#if !managerReady}
    <div class="loading">加载中...</div>
  {:else if playlist.length === 0}
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="empty-icon">
        <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
      </svg>
      <p>暂无歌曲，请在侧边栏加载歌单</p>
    </div>
  {:else}
    <!-- ====== 左：歌单 ====== -->
    <aside class="panel playlist-panel">
      <div class="panel-head">
        <h3>歌单</h3>
        <span class="count">{playlist.length} 首</span>
      </div>
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" bind:value={searchQuery} placeholder="搜索歌曲..." />
        {#if searchQuery}
          <button class="search-clear" on:click={() => searchQuery = ""}>&times;</button>
        {/if}
      </div>
      <div class="song-list">
        {#each pagedSongs as song, i}
          {@const realIdx = playlist.indexOf(song)}
          <div class="song-row" class:active={realIdx === currentIndex} on:click={() => { const fi = filteredPlaylist.indexOf(song); if (fi >= 0) play(fi); }} tabindex="0" role="button">
            <div class="song-img" style={song.pic ? "background-image:url("+song.pic+")" : ""}>
              {#if !song.pic}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              {/if}
              {#if realIdx === currentIndex && isPlaying}
                <div class="eq"><span/><span/><span/></div>
              {/if}
            </div>
            <div class="song-text">
              <span class="s-name" class:hl={realIdx === currentIndex}>{song.name}</span>
              <span class="s-artist">{song.artist || "未知"}</span>
            </div>
          </div>
        {/each}
        {#if filteredPlaylist.length === 0}
          <p class="no-result">无匹配歌曲</p>
        {/if}
      </div>
      {#if totalPages > 1}
        <div class="page-controls">
          <button class="page-btn" on:click={() => currentPage = 1} disabled={currentPage === 1}>«</button>
          <button class="page-btn" on:click={() => currentPage--} disabled={currentPage === 1}>‹</button>
          <span class="page-info">{currentPage} / {totalPages}</span>
          <button class="page-btn" on:click={() => currentPage++} disabled={currentPage === totalPages}>›</button>
          <button class="page-btn" on:click={() => currentPage = totalPages} disabled={currentPage === totalPages}>»</button>
        </div>
      {/if}
    </aside>

    <!-- ====== 中：播放器 ====== -->
    <main class="panel player-panel">
      <!-- 封面 -->
      <div class="cover-wrap">
        <div class="cover" style={currentTrack?.pic ? "background-image:url("+currentTrack.pic+")" : ""}>
          {#if !currentTrack?.pic}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
          {/if}
          <div class="cover-shine"></div>
        </div>
      </div>

      <!-- 歌曲信息 -->
      <div class="track-info">
        <span class="now-label">NOW PLAYING</span>
        <h2 class="track-title" title={currentTrack?.name}>{currentTrack?.name || "——"}</h2>
        <p class="track-artist">{currentTrack?.artist || ""}</p>
      </div>

      <!-- 进度条 -->
      <div class="progress-wrap">
        <div class="progress-bar"
          on:pointerdown={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            seek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
          }}
          on:pointermove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            hoverPct = ((e.clientX - r.left) / r.width) * 100;
          }}
          on:pointerleave={() => { hoverPct = -1; }}>
          <div class="progress-bg"></div>
          <div class="progress-fg" style="width:{progress}%"></div>
          {#if hoverPct >= 0}
            <div class="hover-tip" style="left:{hoverPct}%">{fmt(hoverTime)}</div>
          {/if}
        </div>
        <div class="time-row">
          <span>{fmt(currentTime)}</span><span>{fmt(duration)}</span>
        </div>
      </div>

      <!-- 控制 -->
      <div class="controls">
        <button class="c-btn" on:click={cycleMode} title="切换播放模式">
          {#if playMode === 1}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
            <span class="badge">1</span>
          {:else if playMode === 2}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
          {:else}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
          {/if}
        </button>
        <button class="c-btn" on:click={prev}>
          <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="7,12 16,4 16,20"/><rect x="3" y="5" width="3" height="14" rx="1"/></svg>
        </button>
        <button class="p-btn" class:is-playing={isPlaying} on:click={togglePlay}>
          {#if isPlaying}
            <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
          {:else}
            <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="8,5 20,12 8,19"/></svg>
          {/if}
        </button>
        <button class="c-btn" on:click={next}>
          <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="8,4 18,12 8,20"/><rect x="19" y="5" width="3" height="14" rx="1"/></svg>
        </button>
        <div class="vol">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>
          <input type="range" min="0" max="1" step="0.05" value={volume} on:input={(e) => setVol(parseFloat(e.target.value))} />
        </div>
      </div>
    </main>

    <!-- ====== 右：歌词 ====== -->
    <aside class="panel lyrics-panel">
      <div class="panel-head"><h3>歌词</h3></div>
      <div class="lyrics-body" class:has-lyrics={lyrics.length > 0} bind:this={lyricsEl}>
        {#if lyrics.length > 0}
          {#each lyrics as line, i}
            <p class="lrc-line" class:active={i === currentLrcIndex} class:past={i < currentLrcIndex}>
              {line.text}
            </p>
          {/each}
        {:else}
          <p class="lrc-empty">
            {lyricsStatus === "loading" ? "加载歌词中..." :
             currentTrack?.lrc ? "解析歌词中..." : "暂无歌词"}
          </p>
        {/if}
      </div>
    </aside>
  {/if}
</div>

<style>
  .music-app {
    display: flex; gap: 0; height: calc(100vh - 180px); min-height: 520px;
    border-radius: 20px; border: 1px solid #d1d5db;
    overflow: hidden; position: relative; isolation: isolate;
    background-color: rgba(220,222,230,.7);
    background-size: cover; background-position: center;
  }
  .music-app::before {
    content: ''; position: absolute; inset: 0; z-index: -1;
    background: inherit; background-size: cover; background-position: center;
    filter: blur(60px) brightness(.6) saturate(.8);
    transform: scale(1.15);
  }
  .loading, .empty-state {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; color: #4b5563; gap: 12px;
  }
  .empty-icon { width: 48px; height: 48px; opacity: .3; }

  /* ====== 面板通用 ====== */
  .panel { display: flex; flex-direction: column; overflow: hidden; }
  .panel-head {
    display: flex; align-items: baseline; justify-content: space-between;
    padding: 18px 16px 12px; border-bottom: 1px solid rgba(0,0,0,.05);
    flex-shrink: 0;
  }
  .panel-head h3 { font-size: .9rem; font-weight: 700; color: #1f2937; margin: 0; }
  .count { font-size: .75rem; color: #4b5563; }

  /* ====== 左侧：歌单 ====== */
  .playlist-panel { width: 260px; min-width: 260px; border-right: 1px solid rgba(0,0,0,.05); }
  .search-box {
    position: relative; margin: 10px 12px; flex-shrink: 0;
  }
  .search-icon {
    position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
    width: 15px; height: 15px; color: #6b7280;
  }
  .search-box input {
    width: 100%; padding: 8px 32px 8px 32px; border-radius: 8px;
    border: 1px solid rgba(0,0,0,.06); background: rgba(0,0,0,.03);
    color: #1f2937; font-size: .8rem; outline: none; transition: border .2s;
  }
  .search-box input::placeholder { color: #6b7280; }
  .search-box input:focus { border-color: rgba(99,102,241,.4); }
  .search-clear {
    position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
    background: none; border: 1px solid #d1d5db; color: #4b5563; cursor: pointer; font-size: 1rem;
  }
  .song-list { flex: 1; overflow-y: auto; padding: 2px 8px; }
  .song-list::-webkit-scrollbar { width: 4px; }
  .song-list::-webkit-scrollbar-track { background: transparent; }
  .song-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15);  }
  .song-list::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.25); }
  .song-list { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.15) transparent; }
  .song-row {
    display: flex; align-items: center; gap: 10px; padding: 8px 8px;
    border-radius: 8px; cursor: pointer; transition: background .12s; border: 1px solid transparent;
  }
  .song-row:hover { background: rgba(0,0,0,.04); }
  .song-row.active { background: rgba(99,102,241,.1); border-color: rgba(99,102,241,.15); }
  .song-img {
    width: 38px; height: 38px; min-width: 38px; border-radius: 5px;
    background-size: cover; background-position: center; background-color: #f3f4f6;
    display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden; color: #6b7280;
  }
  .song-img svg { width: 16px; height: 16px; }
  .eq {
    position: absolute; inset: 0; background: rgba(255,255,255,.5);
    display: flex; align-items: flex-end; justify-content: center; gap: 2px; padding-bottom: 6px;
  }
  .eq span { width: 2px; background: #818cf8; border-radius: 1px; animation: eq-bounce .5s ease-in-out infinite alternate; }
  .eq span:nth-child(2) { animation-delay: .15s; }
  .eq span:nth-child(3) { animation-delay: .3s; }
  @keyframes eq-bounce { 0% { transform: scaleY(.3); } 100% { transform: scaleY(1); } }
  .song-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
  .s-name { font-size: .82rem; color: #1f2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .s-name.hl { color: #818cf8; font-weight: 600; }
  .s-artist { font-size: .72rem; color: #4b5563; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .no-result { text-align: center; padding: 24px; color: #6b7280; font-size: .8rem; }

  /* 翻页 */
  .page-controls {
    display: flex; align-items: center; justify-content: center; gap: 4px;
    padding: 10px 12px; border-top: 1px solid rgba(0,0,0,.05); flex-shrink: 0;
  }
  .page-btn {
    width: 28px; height: 28px; border-radius: 6px; border: 1px solid rgba(0,0,0,.08);
    background: transparent; color: #6b7280; font-size: .8rem; cursor: pointer;
    display: flex; align-items: center; justify-content: center; transition: all .15s;
  }
  .page-btn:hover:not(:disabled) { border-color: rgba(99,102,241,.3); color: #6366f1; }
  .page-btn:disabled { opacity: .3; cursor: default; }
  .page-info { font-size: .75rem; color: #6b7280; padding: 0 8px; font-variant-numeric: tabular-nums; }

  /* ====== 中间：播放器 ====== */
  .player-panel {
    flex: 1; align-items: center; justify-content: center; padding: 32px 24px;
  }
  .cover-wrap { margin-bottom: 24px; }
  .cover {
    width: 200px; height: 200px; border-radius: 14px;
    background-size: cover; background-position: center; background-color: #f3f4f6;
    box-shadow: 0 20px 60px rgba(0,0,0,.6);
    display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden;
  }
  .cover svg { width: 56px; height: 56px; color: #6b7280; }
  .cover-shine {
    position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(135deg, rgba(0,0,0,.06) 0%, transparent 60%);
    border-radius: 14px;
  }
  .track-info { text-align: center; max-width: 100%; margin-bottom: 20px; }
  .now-label { font-size: 9px; letter-spacing: 4px; color: #4b5563; font-weight: 600; }
  .track-title {
    font-size: 1.2rem; font-weight: 700; color: #111827; margin: 4px 0 2px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 320px;
  }
  .track-artist { font-size: .85rem; color: #4b5563; margin: 0; }

  /* 进度 */
  .progress-wrap { width: 100%; max-width: 360px; margin-bottom: 20px; }
  .progress-bar {
    position: relative; height: 24px; display: flex; align-items: center;
    cursor: pointer; margin-bottom: 2px;
  }
  .progress-bg {
    position: absolute; width: 100%; height: 5px;
    background: #d1d5db; border-radius: 3px;
  }
  .progress-fg {
    position: absolute; height: 5px; border-radius: 3px;
    background: linear-gradient(90deg, #6366f1, #818cf8);
    transition: width .15s linear;
  }
  .hover-tip {
    position: absolute; top: -20px; transform: translateX(-50%);
    padding: 2px 7px; border-radius: 4px; background: #374151;
    color: #f9fafb; font-size: .65rem; font-variant-numeric: tabular-nums;
    white-space: nowrap; pointer-events: none;
  }
  .time-row {
    display: flex; justify-content: space-between; font-size: .7rem;
    color: #4b5563; font-variant-numeric: tabular-nums;
  }

    /* 控制 */
  .controls { display: flex; align-items: center; justify-content: center; gap: 12px; }
  .c-btn {
    width: 30px; height: 30px; border-radius: 50%; border: none;
    background: transparent; color: rgba(255,255,255,.55); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all .2s; position: relative;
  }
  .c-btn svg { width: 16px; height: 16px; }
  .c-btn:hover { background: rgba(255,255,255,.12); color: #f9fafb; transform: scale(1.1); }
  .c-btn:active { transform: scale(.9); }
  .badge { position: absolute; bottom: 0; right: 0; font-size: 7px; font-weight: 900; color: #6366f1; }
  .p-btn {
    width: 45px; height: 45px; border-radius: 50%; border: none;
    background: #374151; color: #f9fafb; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all .2s; box-shadow: 0 2px 12px rgba(0,0,0,.12);
  }
  .p-btn svg { width: 20px; height: 20px; }
  .p-btn:hover { transform: scale(1.06); box-shadow: 0 4px 20px rgba(0,0,0,.2); }
  .p-btn:active { transform: scale(.94); }
  .p-btn.is-playing { background: #6366f1; animation: pulse 2s ease-out infinite; }
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(99,102,241,.4); }
    100% { box-shadow: 0 0 0 14px rgba(99,102,241,0); }
  }
  .vol { display: flex; align-items: center; gap: 6px; color: #6b7280; margin-left: 6px; }
  .vol svg { width: 15px; height: 15px; flex-shrink: 0; }
  .vol input[type=range] { width: 72px; accent-color: #374151; }

/* ====== 右侧：歌词 ====== */
  .lyrics-panel { width: 280px;  min-width: 280px; border-left: 1px solid rgba(0,0,0,.05); }
  .lyrics-body {
    flex: 1; overflow-y: auto; padding: 12px 20px 24px;
    mask-image: linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%);
  }
  .lyrics-body::-webkit-scrollbar { width: 4px; }
  .lyrics-body::-webkit-scrollbar-track { background: transparent; }
  .lyrics-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12);  }
  .lyrics-body::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.2); }
  .lyrics-body { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.12) transparent; }
  .lrc-line {
    padding: 7px 0; margin: 0; font-size: .95rem; color: rgba(255,255,255,.15);
    transition: all .4s ease; line-height: 1.6;
  }
  .lrc-line.active { color: #fff; font-size: 1.1rem; font-weight: 600; }
  .lrc-line.past { color: #9ca3af; }
  .lrc-empty { text-align: center; padding: 40px 12px; color: #6b7280; font-size: .8rem; }

  /* Responsive */
  @media (max-width: 768px) {
    .music-app { flex-direction: column; height: auto; min-height: 100vh; }
    .playlist-panel,
    .lyrics-panel { width: 100%; min-width: 0; }
    .playlist-panel {
      border-right: none; border-top: 1px solid rgba(255,255,255,.06);
    }
    .lyrics-panel {
      border-left: none; border-top: 1px solid rgba(255,255,255,.06);
      flex: 1; min-height: 40vh;
    }
    .player-panel { padding: 16px 12px; flex: none; }
    .cover { width: 180px; height: 180px; }
    .cover-wrap { margin-bottom: 16px; }
    .track-info { margin-bottom: 12px; }
    .track-title { font-size: 1.1rem; }
    .controls { gap: 8px; }
    .progress-wrap { max-width: 100%; }
    .lyrics-body {
      max-height: none; flex: 1; overflow-y: auto;
    }
    .vol input[type=range] { width: 56px; }
  }
</style>
