const cfg=window.APP_CONFIG||{};
const hasSupabase=Boolean(
  cfg.SUPABASE_URL &&
  cfg.SUPABASE_ANON_KEY &&
  !cfg.SUPABASE_URL.includes("COLE_") &&
  !cfg.SUPABASE_ANON_KEY.includes("COLE_")
);
const db=hasSupabase
  ? window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY)
  : null;

const $=s=>document.querySelector(s);

const els={
  status:$("#storageStatus"),list:$("#songList"),search:$("#searchInput"),
  artistFilter:$("#artistFilter"),genreFilter:$("#genreFilter"),
  playlistFilter:$("#playlistFilter"),songsHeadLabel:$("#songsHeadLabel"),
  count:$("#resultCount"),heroSongName:$("#heroSongName"),
  heroSongArtist:$("#heroSongArtist"),heroPills:$("#heroPills"),
  sheetBody:$("#sheetBody"),editBtn:$("#editBtn"),printBtn:$("#printBtn"),
  deleteBtn:$("#deleteBtn"),togglePlaylistSongBtn:$("#togglePlaylistSongBtn"),
  toneDownBtn:$("#toneDownBtn"),toneCurrentBtn:$("#toneCurrentBtn"),
  toneUpBtn:$("#toneUpBtn"),toneResetBtn:$("#toneResetBtn"),
  fontDecBtn:$("#fontDecBtn"),fontBaseBtn:$("#fontBaseBtn"),fontIncBtn:$("#fontIncBtn"),
  editDialog:$("#editDialog"),form:$("#songForm"),formTitle:$("#formTitle"),
  id:$("#songId"),title:$("#title"),artist:$("#artist"),genre:$("#genre"),
  key:$("#songKey"),bpm:$("#bpm"),notes:$("#notes"),chords:$("#chords"),
  playlistDialog:$("#playlistDialog"),playlistForm:$("#playlistForm"),
  playlistFormTitle:$("#playlistFormTitle"),playlistName:$("#playlistName"),
  renamePlaylistBtn:$("#renamePlaylistBtn"),deletePlaylistBtn:$("#deletePlaylistBtn"),
  themeToggle:$("#themeToggle"),themeIcon:$("#themeIcon")
};

let songs=[];
let playlists=[];
let currentSongId=null;
let transposeSteps=0;
let fontSizePx=18;
let editingPlaylistId=null;

const localSongsKey="meu-cifras-songs-v3";
const localPlaylistsKey="meu-cifras-playlists-v3";
const localMigrationKey="meu-cifras-public-cloud-migrated-v1";

const notesSharp=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const flatToSharp={"Db":"C#","Eb":"D#","Gb":"F#","Ab":"G#","Bb":"A#","Cb":"B","Fb":"E","E#":"F","B#":"C"};

function uid(){return crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random()}
function esc(v){return String(v||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function normalizeSong(r){return{id:r.id,title:r.title||"",artist:r.artist||"",genre:r.genre||"",song_key:r.song_key||"",bpm:r.bpm||"",notes:r.notes||"",chords:r.chords||"",created_at:r.created_at||new Date().toISOString(),updated_at:r.updated_at||new Date().toISOString()}}
function normalizePlaylist(r){return{id:r.id,name:r.name||"",songIds:(r.playlist_songs||r.songIds||[]).map(x=>typeof x==="string"?x:x.song_id).filter(Boolean)}}
function currentSong(){return songs.find(s=>s.id===currentSongId)||null}
function currentPlaylist(){return playlists.find(p=>p.id===els.playlistFilter.value)||null}

function saveLocal(){
  localStorage.setItem(localSongsKey,JSON.stringify(songs));
  localStorage.setItem(localPlaylistsKey,JSON.stringify(playlists));
}

async function loadCloudData(){
  if(!db){
    songs=JSON.parse(localStorage.getItem(localSongsKey)||"[]").map(normalizeSong);
    playlists=JSON.parse(localStorage.getItem(localPlaylistsKey)||"[]").map(normalizePlaylist);
    els.status.textContent="Banco local";
    return;
  }

  const [{data:songData,error:songErr},{data:playlistData,error:playlistErr}] = await Promise.all([
    db.from("songs").select("*").order("title"),
    db.from("playlists").select("id,name,created_at,playlist_songs(song_id)").order("name")
  ]);

  if(songErr)throw songErr;
  if(playlistErr)throw playlistErr;

  songs=(songData||[]).map(normalizeSong);
  playlists=(playlistData||[]).map(normalizePlaylist);
  els.status.textContent="Sincronizado na nuvem";
}

async function migrateLocalDataOnce(){
  if(!db||localStorage.getItem(localMigrationKey)==="1")return;

  const localSongs=JSON.parse(localStorage.getItem(localSongsKey)||"[]").map(normalizeSong);
  const localPlaylists=JSON.parse(localStorage.getItem(localPlaylistsKey)||"[]");

  if(!localSongs.length&&!localPlaylists.length){
    localStorage.setItem(localMigrationKey,"1");
    return;
  }

  const {count,error:countErr}=await db.from("songs").select("id",{count:"exact",head:true});
  if(countErr)throw countErr;

  if((count||0)>0){
    localStorage.setItem(localMigrationKey,"1");
    return;
  }

  const songMap=new Map();
  for(const oldSong of localSongs){
    const {data,error}=await db.from("songs").insert({
      title:oldSong.title,artist:oldSong.artist,genre:oldSong.genre,
      song_key:oldSong.song_key||null,bpm:oldSong.bpm||null,
      notes:oldSong.notes||null,chords:oldSong.chords||""
    }).select("id").single();
    if(error)throw error;
    songMap.set(oldSong.id,data.id);
  }

  for(const oldPlaylist of localPlaylists){
    const {data,error}=await db.from("playlists").insert({name:oldPlaylist.name}).select("id").single();
    if(error)throw error;
    const links=(oldPlaylist.songIds||[])
      .map(oldId=>songMap.get(oldId)).filter(Boolean)
      .map(songId=>({playlist_id:data.id,song_id:songId}));
    if(links.length){
      const {error:linkErr}=await db.from("playlist_songs").insert(links);
      if(linkErr)throw linkErr;
    }
  }

  localStorage.setItem(localMigrationKey,"1");
}

async function initData(){
  try{
    if(db)await migrateLocalDataOnce();
    await loadCloudData();
    refreshUI();
    const visible=filteredSongs();
    if(visible.length&&!currentSongId)selectSong(visible[0].id);
  }catch(err){
    console.error(err);
    els.status.textContent="Erro ao sincronizar";
  }
}

async function saveSong(song){
  if(!db){
    const now=new Date().toISOString();
    if(song.id){
      const i=songs.findIndex(s=>s.id===song.id);
      songs[i]=normalizeSong({...songs[i],...song,updated_at:now});
      saveLocal();
      return song.id;
    }
    const created=normalizeSong({...song,id:uid(),created_at:now,updated_at:now});
    songs.push(created);saveLocal();return created.id;
  }

  const payload={
    title:song.title,artist:song.artist,genre:song.genre,
    song_key:song.song_key||null,bpm:song.bpm||null,notes:song.notes||null,
    chords:song.chords||"",updated_at:new Date().toISOString()
  };

  if(song.id){
    const {data,error}=await db.from("songs").update(payload).eq("id",song.id).select().single();
    if(error)throw error;
    songs[songs.findIndex(s=>s.id===song.id)]=normalizeSong(data);
    return data.id;
  }

  delete payload.updated_at;
  const {data,error}=await db.from("songs").insert(payload).select().single();
  if(error)throw error;
  songs.push(normalizeSong(data));
  return data.id;
}

async function removeSong(id){
  if(db){
    const {error}=await db.from("songs").delete().eq("id",id);
    if(error)throw error;
  }
  songs=songs.filter(s=>s.id!==id);
  playlists.forEach(p=>p.songIds=(p.songIds||[]).filter(songId=>songId!==id));
  if(!db)saveLocal();
}

async function createPlaylist(name){
  if(!db){
    const p={id:uid(),name,songIds:[]};playlists.push(p);saveLocal();return p.id;
  }
  const {data,error}=await db.from("playlists").insert({name}).select().single();
  if(error)throw error;
  playlists.push({id:data.id,name:data.name,songIds:[]});
  return data.id;
}
async function renamePlaylist(id,name){
  if(db){
    const {error}=await db.from("playlists").update({name,updated_at:new Date().toISOString()}).eq("id",id);
    if(error)throw error;
  }
  const p=playlists.find(x=>x.id===id);if(p)p.name=name;
  if(!db)saveLocal();
}
async function deletePlaylist(id){
  if(db){
    const {error}=await db.from("playlists").delete().eq("id",id);
    if(error)throw error;
  }
  playlists=playlists.filter(p=>p.id!==id);
  if(!db)saveLocal();
}
async function toggleSongInPlaylist(playlist,song){
  playlist.songIds=playlist.songIds||[];
  const inside=playlist.songIds.includes(song.id);

  if(inside){
    if(db){
      const {error}=await db.from("playlist_songs").delete().eq("playlist_id",playlist.id).eq("song_id",song.id);
      if(error)throw error;
    }
    playlist.songIds=playlist.songIds.filter(id=>id!==song.id);
  }else{
    if(db){
      const {error}=await db.from("playlist_songs").insert({playlist_id:playlist.id,song_id:song.id});
      if(error)throw error;
    }
    playlist.songIds.push(song.id);
  }
  if(!db)saveLocal();
}
