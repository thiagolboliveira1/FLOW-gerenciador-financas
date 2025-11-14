import { auth } from './firebase.js';
import { salvarItem, deletarItem, carregarFinancas } from './firestore.js';
import { contasIniciais } from './seed.js';

const STORAGE_KEY = 'flow_cache_v1';
let items = [];

const moneyBR = v=> Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

function createHeaderSummary(items){
  const totalIncome = items.filter(i=>i.type==='income').reduce((s,i)=>s+(i.value||0),0);
  const totalFixed = items.filter(i=>i.type==='fixed').reduce((s,i)=>s+(i.value||0),0);
  const totalVar = items.filter(i=>i.type==='variable').reduce((s,i)=>s+(i.value||0),0);
  const saldo = totalIncome - (totalFixed+totalVar);
  return `<div style="display:flex;gap:12px;align-items:center;justify-content:space-between">
    <div><strong>Receita:</strong> ${moneyBR(totalIncome)}</div>
    <div><strong>Despesas:</strong> ${moneyBR(totalFixed+totalVar)}</div>
    <div><strong>Saldo:</strong> ${moneyBR(saldo)}</div>
  </div>`;
}

function buildControls(){
  document.getElementById('newItem').onclick = ()=> openModal();
  document.getElementById('exportCSV').onclick = exportCSV;
  document.getElementById('importCSV').onclick = ()=>{
    const input = document.createElement('input'); input.type='file'; input.accept='.csv';
    input.onchange = async e=>{ const f=e.target.files[0]; if(!f) return; const text=await f.text(); const parsed = parseCSVToArray(text); mergeItemsFromArray(parsed); };
    input.click();
  };
  document.getElementById('logoutBtn').onclick = ()=> auth.signOut().then(()=>window.location='login.html');
}

auth.onAuthStateChanged(async user=>{
  if(!user) return window.location='login.html';
  try{
    let dados = await carregarFinancas();
    if(!dados||dados.length===0){
      for(const it of contasIniciais){
        if(!it.id) it.id = Date.now().toString(36)+Math.random().toString(36).slice(2,6);
        await salvarItem(it);
      }
      dados = await carregarFinancas();
    }
    items = dados||[];
    cacheSave(items);
    render();
  }catch(e){
    console.warn('Erro Firestore, usando cache',e);
    items = cacheLoad();
    render();
  }
  buildControls();
});

function cacheSave(a){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(a)); }catch(e){console.warn(e);} }
function cacheLoad(){ try{ const r=localStorage.getItem(STORAGE_KEY); return r?JSON.parse(r):[] }catch{ return []; } }

function render(){
  const container = document.getElementById('cards');
  if(!container) return;
  container.innerHTML = '';
  document.getElementById('summary').innerHTML = createHeaderSummary(items);
  const sorted = items.slice().sort((a,b)=> (typeOrder(a.type)-typeOrder(b.type)) );
  for(const i of sorted){
    const card = document.createElement('div'); card.className='card';
    const cover = document.createElement('div'); cover.className='card-cover';
    // mix visuals
    if(i.type==='income') cover.style.backgroundImage='linear-gradient(90deg,#d1f7e7,#bff6ff)';
    else if(i.type==='fixed') cover.style.backgroundImage='linear-gradient(90deg,#fff4d6,#ffd6e6)';
    else if(i.type==='variable') cover.style.backgroundImage='linear-gradient(90deg,#e9ecff,#f3e8ff)';
    else if(i.type==='goal') cover.style.backgroundImage='linear-gradient(90deg,#ffd6a5,#ffb6b9)';
    else cover.style.backgroundImage='linear-gradient(90deg,#e6f7ff,#e6ffe6)';
    const content = document.createElement('div'); content.className='card-content';
    const tipo = document.createElement('div'); tipo.className='card-type'; tipo.innerText = traduzTipo(i.type);
    const title = document.createElement('div'); title.className='card-title'; title.contentEditable=true; title.innerText = i.title||'(sem título)'; title.addEventListener('blur',async e=>{ i.title=e.target.innerText.trim(); await trySave(i); });
    const owner = document.createElement('div'); owner.className='card-owner'; owner.innerText = i.owner||'';
    const value = document.createElement('div'); value.className='card-value'; value.innerText = moneyBR(i.value);
    const tags = document.createElement('div'); tags.className='card-tags'; (i.tags||[]).forEach(t=>{ const tk=document.createElement('div'); tk.className='tag'; tk.innerText=t; tags.appendChild(tk); });
    content.appendChild(tipo); content.appendChild(title); content.appendChild(owner); content.appendChild(value); content.appendChild(tags);
    if(i.type==='goal' || i.type==='cofrinho'){ const box=document.createElement('div'); box.className='progress-box'; const label=document.createElement('div'); label.className='progress-label'; label.innerText='Progresso'; const bar=document.createElement('div'); bar.className='progress-bar'; const fill=document.createElement('div'); fill.className='progress-fill'; const pct = Math.min(100, Math.round(((i.progress||0)/(i.target||(i.value||1)))*100)); fill.style.width = pct + '%'; bar.appendChild(fill); const pctText=document.createElement('div'); pctText.className='progress-percent'; pctText.innerText = pct + '%'; box.appendChild(label); box.appendChild(bar); box.appendChild(pctText); content.appendChild(box); }
    const actions = document.createElement('div'); actions.className='card-actions';
    const edit = document.createElement('button'); edit.className='btn'; edit.innerText='Editar'; edit.onclick = ()=> openModal(i);
    const del = document.createElement('button'); del.className='btn'; del.innerText='Excluir'; del.onclick = async ()=>{ if(!confirm('Excluir?')) return; try{ await deletarItem(i.id); }catch(e){console.warn(e);} items = items.filter(x=>x.id!==i.id); cacheSave(items); render(); };
    actions.appendChild(edit); actions.appendChild(del); content.appendChild(actions);
    card.appendChild(cover); card.appendChild(content); container.appendChild(card);
  }
}

function typeOrder(t){ const o={income:0,cofrinho:1,goal:2,fixed:3,variable:4,limit:5}; return o[t]||9; }
function traduzTipo(t){ return {income:'Renda',fixed:'Despesa Fixa',variable:'Despesa Variável',goal:'Meta',cofrinho:'Cofrinho',limit:'Limite'}[t]||t; }
async function trySave(item){ if(!item.id) item.id = Date.now().toString(36)+Math.random().toString(36).slice(2,6); const idx = items.findIndex(x=>x.id===item.id); if(idx>=0) items[idx]=item; else items.unshift(item); cacheSave(items); render(); if(navigator.onLine){ try{ await salvarItem(item); items = await carregarFinancas(); cacheSave(items); render(); }catch(e){ console.warn(e); } } }
function openModal(editItem){ if(document.getElementById('flow-modal')){ populateModal(editItem); return; } const modal=document.createElement('div'); modal.id='flow-modal'; const style=modal.style; Object.assign(style,{position:'fixed',inset:0,background:'rgba(0,0,0,0.35)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}); const card=document.createElement('div'); card.className='modal-card'; card.innerHTML=`<h3 id='modal-title'>Novo item</h3><input id='m_title' class='input' placeholder='Título'><input id='m_owner' class='input' placeholder='Responsável'><select id='m_type' class='input'><option value='income'>Renda</option><option value='fixed'>Despesa Fixa</option><option value='variable'>Despesa Variável</option><option value='goal'>Meta</option><option value='cofrinho'>Cofrinho</option></select><input id='m_value' class='input' placeholder='Valor'><input id='m_target' class='input' placeholder='Meta (opcional)'><input id='m_progress' class='input' placeholder='Progresso (opcional)'><input id='m_tags' class='input' placeholder='tags, separado por vírgula'><div style='display:flex;gap:8px;justify-content:flex-end'><button id='m_cancel' class='btn'>Cancelar</button><button id='m_save' class='btn primary'>Salvar</button></div>`; modal.appendChild(card); document.body.appendChild(modal); document.getElementById('m_cancel').onclick=()=>modal.remove(); document.getElementById('m_save').onclick=async ()=>{ const it={ id: editItem?editItem.id:Date.now().toString(36)+Math.random().toString(36).slice(2,6), title:document.getElementById('m_title').value.trim(), owner:document.getElementById('m_owner').value.trim(), type:document.getElementById('m_type').value, value:parseFloat((document.getElementById('m_value').value||'0').replace(',','.'))||0, target:parseFloat((document.getElementById('m_target').value||'0').replace(',','.'))||0, progress:parseFloat((document.getElementById('m_progress').value||'0').replace(',','.'))||0, tags:(document.getElementById('m_tags').value||'').split(',').map(s=>s.trim()).filter(Boolean)}; await trySave(it); modal.remove(); }; populateModal(editItem); }
function populateModal(editItem){ if(!editItem){ document.getElementById('modal-title').innerText='Novo item'; document.getElementById('m_title').value=''; document.getElementById('m_owner').value=''; document.getElementById('m_type').value='variable'; document.getElementById('m_value').value=''; document.getElementById('m_target').value=''; document.getElementById('m_progress').value=''; document.getElementById('m_tags').value=''; return; } document.getElementById('modal-title').innerText='Editar item'; document.getElementById('m_title').value=editItem.title||''; document.getElementById('m_owner').value=editItem.owner||''; document.getElementById('m_type').value=editItem.type||'variable'; document.getElementById('m_value').value=editItem.value||''; document.getElementById('m_target').value=editItem.target||''; document.getElementById('m_progress').value=editItem.progress||''; document.getElementById('m_tags').value=(editItem.tags||[]).join(','); }
function exportCSV(){ const cols=['id','type','title','owner','value','target','progress','date','tags']; const rows=[cols.join(',')].concat(items.map(it=>cols.map(c=>{ let v=it[c]===undefined?'':it[c]; if(Array.isArray(v)) v=v.join(';'); return `"${String(v).replace(/"/g,'""')}"`; }).join(','))); const blob=new Blob([rows.join('\n')],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='flow_export.csv'; document.body.appendChild(a); a.click(); a.remove(); }
function parseCSVToArray(text){ const lines=text.split(/\r?\n/).filter(Boolean); if(!lines.length) return []; const headers=lines.shift().split(',').map(h=>h.replace(/"/g,'').trim()); return lines.map(l=>{ const cols=l.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c=>c.replace(/^"|"$/g,'')); const obj={}; headers.forEach((h,i)=>obj[h]=cols[i]||''); if(obj.tags) obj.tags=obj.tags.split(';').filter(Boolean); obj.value=parseFloat((obj.value||'0').replace(',','.'))||0; obj.target=parseFloat((obj.target||'0').replace(',','.'))||0; obj.progress=parseFloat((obj.progress||'0').replace(',','.'))||0; obj.id=obj.id||''; return obj; }); }
async function mergeItemsFromArray(parsed){ if(!parsed||!parsed.length) return alert('CSV vazio'); const existing=new Set(items.map(k=>keyOf(k))); const toAdd=[]; for(const it of parsed){ const k=keyOf(it); if(existing.has(k)) continue; if(!it.id) it.id=Date.now().toString(36)+Math.random().toString(36).slice(2,6); toAdd.push(it); existing.add(k); } for(const it of toAdd) await trySave(it); alert(`${toAdd.length} item(s) adicionados`); }
function keyOf(it){ return `${it.type}||${(it.title||'').trim().toLowerCase()}||${String(it.value||'0')}||${it.date||''}||${(it.owner||'').trim().toLowerCase()}`; }
document.addEventListener('DOMContentLoaded',()=>{});
