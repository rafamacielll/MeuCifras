function filteredSongs(){
  const q=els.search.value.trim().toLowerCase();
  const artist=els.artistFilter.value,genre=els.genreFilter.value,playlist=currentPlaylist();
  return songs.filter(s=>{
    const text=`${s.title} ${s.artist} ${s.genre}`.toLowerCase();
    return(!q||text.includes(q))&&(!artist||s.artist===artist)&&(!genre||s.genre===genre)&&(!playlist||(playlist.songIds||[]).includes(s.id));
  }).sort((a,b)=>a.title.localeCompare(b.title,"pt-BR"));
}

function updateFilters(){
  const oldArtist=els.artistFilter.value,oldGenre=els.genreFilter.value;
  const artists=[...new Set(songs.map(s=>s.artist).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
  const genres=[...new Set(songs.map(s=>s.genre).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
  els.artistFilter.innerHTML='<option value="">Todos</option>'+artists.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("");
  els.genreFilter.innerHTML='<option value="">Todos</option>'+genres.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("");
  if(artists.includes(oldArtist))els.artistFilter.value=oldArtist;
  if(genres.includes(oldGenre))els.genreFilter.value=oldGenre;
}
function updatePlaylistUI(){
  const selected=els.playlistFilter.value;
  els.playlistFilter.innerHTML='<option value="">Todas</option>'+playlists.slice().sort((a,b)=>a.name.localeCompare(b.name,"pt-BR")).map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("");
  if(playlists.some(p=>p.id===selected))els.playlistFilter.value=selected;
  const p=currentPlaylist();els.renamePlaylistBtn.disabled=!p;els.deletePlaylistBtn.disabled=!p;
  els.songsHeadLabel.textContent=p?p.name:"Minhas músicas";
}
function renderList(){
  const list=filteredSongs();els.count.textContent=list.length;
  if(!list.length){els.list.innerHTML='<div style="padding:17px 9px;color:var(--muted);text-align:center;font-size:10px">Nenhuma música encontrada.</div>';return}
  els.list.innerHTML=list.map(s=>`<button class="song-row ${s.id===currentSongId?"active":""}" data-id="${s.id}"><div><div class="song-title">${esc(s.title)}</div><div class="song-meta">${esc(s.artist)} · ${esc(s.genre)}</div></div><span class="more">⋮</span></button>`).join("");
}

function noteIndex(note){return notesSharp.indexOf(flatToSharp[note]||note)}
function transposeRoot(root,steps){const index=noteIndex(root);return index<0?root:notesSharp[(index+steps+120)%12]}
function transposeToken(token,steps){
  const m=token.match(/^([(\[]?)([A-G](?:#|b)?)([^\/\s\])}]*)(?:\/([A-G](?:#|b)?))?([)\],.;:]?)$/);
  if(!m)return token;
  return`${m[1]}${transposeRoot(m[2],steps)}${m[3]}${m[4]?"/"+transposeRoot(m[4],steps):""}${m[5]}`;
}
function transposeText(text,steps){
  if(!steps)return text||"";
  return(text||"").split("\n").map(line=>line.split(/(\s+)/).map(part=>/^\s+$/.test(part)?part:transposeToken(part,steps)).join("")).join("\n");
}
function renderSheet(song){
  const text=transposeText(song.chords,transposeSteps);
  els.sheetBody.innerHTML=(text||"Sem cifra cadastrada.").split("\n").map(line=>{
    const safe=esc(line),trimmed=line.trim();
    if(/^\[.*\]$/.test(trimmed))return`<div class="section-line">${safe}</div>`;
    const chordLine=trimmed&&/^[A-G#bm\s/0-9()|.\-]+$/i.test(trimmed)&&/[A-G]/.test(trimmed);
    if(chordLine)return`<div class="chord-line">${safe}</div>`;
    return`<div>${safe||"&nbsp;"}</div>`;
  }).join("");
  els.sheetBody.style.fontSize=fontSizePx+"px";
}
function updatePlaylistButton(){
  const song=currentSong(),playlist=currentPlaylist();
  if(!song||!playlist){els.togglePlaylistSongBtn.disabled=true;els.togglePlaylistSongBtn.innerHTML='<svg class="icon" viewBox="0 0 24 24"><path d="M4 6h10M4 12h10M4 18h6"/><path d="M18 14v6M15 17h6"/></svg>Playlist';return}
  const inside=(playlist.songIds||[]).includes(song.id);
  els.togglePlaylistSongBtn.disabled=false;
  els.togglePlaylistSongBtn.innerHTML=inside?'<svg class="icon" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>Na playlist':'<svg class="icon" viewBox="0 0 24 24"><path d="M4 6h10M4 12h10M4 18h6"/><path d="M18 14v6M15 17h6"/></svg>Playlist';
}
function renderViewer(){
  const song=currentSong(),enabled=!!song;
  [els.editBtn,els.printBtn,els.deleteBtn,els.toneDownBtn,els.toneCurrentBtn,els.toneUpBtn,els.toneResetBtn,els.fontDecBtn,els.fontBaseBtn,els.fontIncBtn].forEach(b=>b.disabled=!enabled);
  updatePlaylistButton();
  if(!song){els.heroSongName.textContent="Escolha uma música";els.heroSongArtist.textContent="Selecione uma cifra à esquerda";els.heroPills.innerHTML="";els.sheetBody.textContent="Selecione uma cifra para visualizar.";els.toneCurrentBtn.textContent="—";return}
  els.heroSongName.textContent=song.title;els.heroSongArtist.textContent=song.artist;
  els.heroPills.innerHTML=`
    <span class="pill"><svg class="icon" viewBox="0 0 24 24"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>${esc(song.genre||"Sem gênero")}</span>
    <span class="pill"><svg class="icon" viewBox="0 0 24 24"><circle cx="8" cy="15" r="4"/><path d="m11 12 8-8M15 4l5 5"/></svg>Tom original: ${esc(song.song_key||"—")}</span>
    ${song.bpm?`<span class="pill"><svg class="icon" viewBox="0 0 24 24"><path d="M4 19V9M10 19V5M16 19v-7M22 19V3"/></svg>${esc(song.bpm)} BPM</span>`:""}
  `;
  els.toneCurrentBtn.textContent=song.song_key?transposeRoot(song.song_key,transposeSteps):"—";
  renderSheet(song);
}
function refreshUI(){updateFilters();updatePlaylistUI();renderList();renderViewer()}
function selectSong(id){currentSongId=id;transposeSteps=0;renderList();renderViewer()}

function openEditor(song=null){
  els.form.reset();els.id.value=song?.id||"";els.title.value=song?.title||"";els.artist.value=song?.artist||"";els.genre.value=song?.genre||"";els.key.value=song?.song_key||"";els.bpm.value=song?.bpm||"";els.notes.value=song?.notes||"";els.chords.value=song?.chords||"";
  els.formTitle.textContent=song?"Editar Cifra":"Incluir Cifra";els.editDialog.showModal();setTimeout(()=>els.title.focus(),50);
}
function openPlaylistDialog(p=null){editingPlaylistId=p?.id||null;els.playlistFormTitle.textContent=p?"Renomear Playlist":"Criar Playlist";els.playlistName.value=p?.name||"";els.playlistDialog.showModal();setTimeout(()=>els.playlistName.focus(),50)}
