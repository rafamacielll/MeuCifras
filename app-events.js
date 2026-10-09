els.list.addEventListener("click",e=>{const b=e.target.closest(".song-row");if(b)selectSong(b.dataset.id)});
[els.search,els.artistFilter,els.genreFilter].forEach(el=>{
  const update=()=>{const visible=filteredSongs();if(currentSongId&&!visible.some(s=>s.id===currentSongId)){currentSongId=visible[0]?.id||null;transposeSteps=0}renderList();renderViewer()};
  el.addEventListener("input",update);el.addEventListener("change",update);
});
$("#newBtn").addEventListener("click",()=>openEditor());
els.editBtn.addEventListener("click",()=>{const s=currentSong();if(s)openEditor(s)});
els.printBtn.addEventListener("click",()=>{if(currentSong())window.print()});
els.deleteBtn.addEventListener("click",async()=>{
  const s=currentSong();if(!s||!confirm(`Excluir "${s.title}"?`))return;
  try{await removeSong(s.id);currentSongId=filteredSongs()[0]?.id||songs[0]?.id||null;transposeSteps=0;refreshUI()}catch(err){alert("Não foi possível excluir a cifra.")}
});

$("#createPlaylistBtn").addEventListener("click",()=>openPlaylistDialog());
els.playlistForm.addEventListener("submit",async e=>{
  e.preventDefault();const name=els.playlistName.value.trim();if(!name)return;
  try{
    if(editingPlaylistId)await renamePlaylist(editingPlaylistId,name);
    else{const id=await createPlaylist(name);els.playlistFilter.value=id}
    els.playlistDialog.close();updatePlaylistUI();renderList();renderViewer();
  }catch(err){alert("Não foi possível salvar a playlist.")}
});
els.playlistFilter.addEventListener("change",()=>{const visible=filteredSongs();if(currentSongId&&!visible.some(s=>s.id===currentSongId)){currentSongId=visible[0]?.id||null;transposeSteps=0}updatePlaylistUI();renderList();renderViewer()});
els.renamePlaylistBtn.addEventListener("click",()=>{const p=currentPlaylist();if(p)openPlaylistDialog(p)});
els.deletePlaylistBtn.addEventListener("click",async()=>{const p=currentPlaylist();if(!p||!confirm(`Excluir a playlist "${p.name}"? As músicas não serão apagadas.`))return;try{await deletePlaylist(p.id);els.playlistFilter.value="";refreshUI()}catch(err){alert("Não foi possível excluir a playlist.")}});
els.togglePlaylistSongBtn.addEventListener("click",async()=>{const p=currentPlaylist(),s=currentSong();if(!p||!s)return;try{await toggleSongInPlaylist(p,s);updatePlaylistButton();renderList()}catch(err){alert("Não foi possível atualizar a playlist.")}});

els.toneDownBtn.addEventListener("click",()=>{transposeSteps--;renderViewer()});
els.toneUpBtn.addEventListener("click",()=>{transposeSteps++;renderViewer()});
els.toneResetBtn.addEventListener("click",()=>{transposeSteps=0;renderViewer()});
els.fontDecBtn.addEventListener("click",()=>{fontSizePx=Math.max(14,fontSizePx-1);renderViewer()});
els.fontBaseBtn.addEventListener("click",()=>{fontSizePx=18;renderViewer()});
els.fontIncBtn.addEventListener("click",()=>{fontSizePx=Math.min(28,fontSizePx+1);renderViewer()});

els.form.addEventListener("submit",async e=>{
  e.preventDefault();
  const song={id:els.id.value||null,title:els.title.value.trim(),artist:els.artist.value.trim(),genre:els.genre.value.trim(),song_key:els.key.value,bpm:els.bpm.value.trim(),notes:els.notes.value.trim(),chords:els.chords.value};
  if(!song.title||!song.artist||!song.genre)return;
  try{currentSongId=await saveSong(song);transposeSteps=0;els.editDialog.close();refreshUI()}catch(err){console.error(err);alert("Não foi possível salvar a cifra.")}
});
document.addEventListener("click",e=>{const id=e.target.dataset?.close;if(id)document.getElementById(id)?.close()});

function applyTheme(theme){
  const dark=theme==="dark";document.body.classList.toggle("dark",dark);
  els.themeToggle.title=dark?"Usar modo claro":"Usar modo escuro";
  els.themeIcon.innerHTML=dark?'<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>':'<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"></path>';
}
applyTheme(localStorage.getItem("meu-cifras-theme")||"light");
els.themeToggle.addEventListener("click",()=>{const next=document.body.classList.contains("dark")?"light":"dark";localStorage.setItem("meu-cifras-theme",next);applyTheme(next)});

refreshUI();
initData();
