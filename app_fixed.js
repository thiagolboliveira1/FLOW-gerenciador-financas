import { auth } from './firebase.js';
import { carregarFinancas, salvarItem, deletarItem } from './firestore.js';
import { contasIniciais } from './seed.js';

const STORAGE_KEY = 'flow_cache_v1';
let items = [];

const money = v => Number(v || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

// helper to get month key like '2025-11'
function monthKeyFromDate(d){
  if(!d) return null;
  try{
    const dt = new Date(d);
    if(isNaN(dt)) return null;
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
  }catch{return null;}
}

// populate month select
function initMonthSelector(){
  const sel = document.getElementById('monthSelect');
  const now = new Date();
  sel.innerHTML='';
  for(let i=0;i<12;i++){
    const dt = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
    const label = dt.toLocaleString('pt-BR',{month:'long', year:'numeric'});
    const opt = document.createElement('option'); opt.value = key; opt.innerText = label;
    sel.appendChild(opt);
  }
  sel.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  sel.onchange = ()=> render();
}

// totals for monthKey with recurring items logic
function totalsForMonth(monthKey){
  const income = items.filter(i=>i.type==='income').reduce((s,i)=>{
    const mk = monthKeyFromDate(i.date);
    if(mk) return s + ((mk===monthKey)?(i.value||0):0);
    return s + (i.date?0:(i.value||0));
  },0);
  const fixed = items.filter(i=>i.type==='fixed').reduce((s,i)=>{
    const mk = monthKeyFromDate(i.date);
    if(mk) return s + ((mk===monthKey)?(i.value||0):0);
    return s + (i.date?0:(i.value||0));
  },0);
  const variable = items.filter(i=>i.type==='variable').reduce((s,i)=>{
    const mk = monthKeyFromDate(i.date);
    if(mk) return s + ((mk===monthKey)?(i.value||0):0);
    return s + (i.date?0:0);
  },0);
  return {income, fixed, variable, saldo: income - (fixed+variable)};
}

// annual summary: compute last 12 months
function annualSummary(){
  const now = new Date();
  const months = [];
  for(let i=0;i<12;i++){
    const dt = new Date(now.getFullYear(), now.getMonth()-i, 1);
    months.unshift(`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`);
  }
  const table = months.map(mk=>{
    const t = totalsForMonth(mk);
    return {month:mk, income:t.income, fixed:t.fixed, variable:t.variable, saldo:t.saldo};
  });
  let html = '<div style="max-height:420px;overflow:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:6px">Mês</th><th style="text-align:right;padding:6px">Renda</th><th style="text-align:right;padding:6px">Fixas</th><th style="text-align:right;padding:6px">Variáveis</th><th style="text-align:right;padding:6px">Saldo</th></tr></thead><tbody>';
  let sumIncome=0, sumFixed=0, sumVar=0, sumSaldo=0;
  for(const r of table){
    const lbl = new Date(r.month+'-01').toLocaleString('pt-BR',{month:'short',year:'numeric'});
    html += `<tr><td style="padding:6px">${lbl}</td><td style="padding:6px;text-align:right">${money(r.income)}</td><td style="padding:6px;text-align:right">${money(r.fixed)}</td><td style="padding:6px;text-align:right">${money(r.variable)}</td><td style="padding:6px;text-align:right">${money(r.saldo)}</td></tr>`;
    sumIncome+=r.income; sumFixed+=r.fixed; sumVar+=r.variable; sumSaldo+=r.saldo;
  }
  html += `</tbody><tfoot><tr style="border-top:1px solid #eee"><td style="padding:6px"><strong>Total 12m</strong></td><td style="padding:6px;text-align:right"><strong>${money(sumIncome)}</strong></td><td style="padding:6px;text-align:right"><strong>${money(sumFixed)}</strong></td><td style="padding:6px;text-align:right"><strong>${money(sumVar)}</strong></td><td style="padding:6px;text-align:right"><strong>${money(sumSaldo)}</strong></td></tr></tfoot></table></div>`;

  if(document.getElementById('flow-modal')) document.getElementById('flow-modal').remove();
  const modal = document.createElement('div'); modal.id='flow-modal'; Object.assign(modal.style,{position:'fixed',inset:0,background:'rgba(0,0,0,0.35)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999});
  const card = document.createElement('div'); card.className='modal-card'; card.innerHTML = `<h3>Resumo anual</h3>${html}<div style="display:flex;justify-content:flex-end;margin-top:12px"><button id="sum_close" class="btn">Fechar</button></div>`;
  modal.appendChild(card); document.body.appendChild(modal);
  document.getElementById('sum_close').onclick = ()=> modal.remove();
}

function createSummary(itms){
  const income = itms.filter(i=>i.type==='income').reduce((s,i)=>s+(i.value||0),0);
  const fixed = itms.filter(i=>i.type==='fixed').reduce((s,i)=>s+(i.value||0),0);
  const variable = itms.filter(i=>i.type==='variable').reduce((s,i)=>s+(i.value||0),0);
  const saldo = income - (fixed+variable);
  return `<div style="display:flex;gap:18px;align-items:center;justify-content:space-between"><div><strong>Receita:</strong> ${money(income)}</div><div><strong>Despesas:</strong> ${money(fixed+variable)}</div><div><strong>Saldo:</strong> ${money(saldo)}</div></div>`;
}

function monthKeyFromDate(d){
  if(!d) return null;
  try{ const dt = new Date(d); if(isNaN(dt)) return null; return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`; }catch{return null;}
}

// image map (same icons used before)
const IMG = {
  salary: 'https://i.imgur.com/2yaf2wb.png',
  home: 'https://i.imgur.com/3sKQm9v.png',
  light: 'https://i.imgur.com/1Q9Z1ZP.png',
  water: 'https://i.imgur.com/8zK4b9G.png',
  market: 'https://i.imgur.com/3Qx1ZkT.png',
  internet: 'https://i.imgur.com/7yZ9Yq2.png',
  car: 'https://i.imgur.com/2Y2ZRmL.png',
  card: 'https://i.imgur.com/Z6b6Q2V.png',
  loan: 'https://i.imgur.com/4Rz5m6a.png',
  phone: 'https://i.imgur.com/0X3j1GQ.png',
  sofa: 'https://i.imgur.com/eqvL2Gx.png',
  entertainment: 'https://i.imgur.com/6hXh6Q1.png',
  pharmacy: 'https://i.imgur.com/2k3Yb3D.png',
  gas: 'https://i.imgur.com/9yG9F2K.png',
  briefcase: 'https://i.imgur.com/Yg9Q9xC.png',
  debt: 'https://i.imgur.com/7u1cJkV.png',
  serasa: 'https://i.imgur.com/5rQ2XkL.png',
  piggy: 'https://i.imgur.com/3Hk0Y7y.png',
  calendar: 'https://i.imgur.com/Jv0xH1E.png',
  insurance: 'https://i.imgur.com/u8e6QyK.png',
  ticket: 'https://i.imgur.com/Wy3Q9bN.png'
};

function typeOrder(t){ const o={income:0,cofrinho:1,goal:2,fixed:3,variable:4,limit:5}; return o[t]||9; }

function traduzTipo(t){ return {income:'Renda',fixed:'Despesa Fixa',variable:'Despesa Variável',goal:'Meta',cofrinho:'Cofrinho',limit:'Limite'}[t]||t; }

/* CARD element (same structure: cover, content, checkbox paid, actions) */
function cardElement(i){
  const el=document.createElement('div'); el.className='card';
  const cover=document.createElement('div'); cover.className='card-cover'; cover.style.backgroundImage=`url(${IMG[i.imgKey]||IMG['home']})`; el.appendChild(cover);
  const content=document.createElement('div'); content.className='card-content';
  const tipo=document.createElement('div'); tipo.className='card-type'; tipo.innerText=traduzTipo(i.type); content.appendChild(tipo);
  const title=document.createElement('div'); title.className='card-title'; title.contentEditable=true; title.innerText=i.title||'(sem título)'; title.addEventListener('blur',async e=>{ i.title=e.target.innerText.trim(); await trySave(i); }); content.appendChild(title);
  const owner=document.createElement('div'); owner.className='card-owner'; owner.innerText=i.owner||''; content.appendChild(owner);
  const value=document.createElement('div'); value.className='card-value'; value.innerText=money(i.value); content.appendChild(value);
  if(i.tags && Array.isArray(i.tags) && i.tags.length){ const tags=document.createElement('div'); tags.className='card-tags'; i.tags.forEach(t=>{ const tk=document.createElement('div'); tk.className='tag'; tk.innerText=t; tags.appendChild(tk); }); content.appendChild(tags); }
  if(i.type==='goal' || i.type==='cofrinho'){
    const progBox=document.createElement('div'); progBox.className='progress-box';
    const bar=document.createElement('div'); bar.className='progress-bar';
    const fill=document.createElement('div'); fill.className='progress-fill'; const pct=Math.min(100,Math.round(((i.progress||0)/(i.target||i.value||1))*100)); fill.style.width=pct+'%'; bar.appendChild(fill); progBox.appendChild(bar);
    const pctText=document.createElement('div'); pctText.className='progress-percent'; pctText.innerText=pct+'%';
    content.appendChild(progBox); content.appendChild(pctText);
  }
  const footer=document.createElement('div'); footer.className='card-footer';
  const paidWrap=document.createElement('label'); paidWrap.className='paid-checkbox'; const chk=document.createElement('input'); chk.type='checkbox'; chk.checked=!!i.paid; chk.onchange=async ()=>{ i.paid=chk.checked; await trySave(i); render(); }; paidWrap.appendChild(chk); paidWrap.append(' Pago'); footer.appendChild(paidWrap);
  const actions=document.createElement('div'); actions.style.display='flex'; actions.style.gap='8px';
  const btnEdit=document.createElement('button'); btnEdit.className='btn'; btnEdit.innerText='Editar'; btnEdit.onclick=()=>openModal(i); actions.appendChild(btnEdit);
  const btnDel=document.createElement('button'); btnDel.className='btn'; btnDel.innerText='Excluir'; btnDel.onclick=async ()=>{ if(!confirm('Excluir item?')) return; try{ await deletarItem(i.id); }catch(e){ console.warn(e); } items=items.filter(x=>x.id!==i.id); cacheSave(items); render(); }; actions.appendChild(btnDel);
  footer.appendChild(actions); el.appendChild(content); el.appendChild(footer);
  return el;
}

/* MODAL create/edit */
function openModal(editItem){
  if(document.getElementById('flow-modal')){ populateModal(editItem); return; }
  const modal=document.createElement('div'); modal.id='flow-modal'; Object.assign(modal.style,{position:'fixed',inset:0,background:'rgba(0,0,0,0.35)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999});
  const card=document.createElement('div'); card.className='modal-card'; card.innerHTML = `<h3 id="modal-title">Novo item</h3><input id="m_title" class="input" placeholder="Título" /><input id="m_owner" class="input" placeholder="Responsável" /><select id="m_type" class="input"><option value="income">Renda</option><option value="fixed">Despesa Fixa</option><option value="variable">Despesa Variável</option><option value="goal">Meta</option><option value="cofrinho">Cofrinho</option></select><input id="m_value" class="input" placeholder="Valor (ex: 150.00)" /><input id="m_target" class="input" placeholder="Meta (opcional)" /><input id="m_progress" class="input" placeholder="Progresso (opcional)" /><input id="m_date" class="input" placeholder="Data (YYYY-MM-DD) (opcional)" /><input id="m_imgKey" class="input" placeholder="Imagem key (ex: water, light)" /><div style="display:flex;gap:8px;justify-content:flex-end"><button id="m_cancel" class="btn">Cancelar</button><button id="m_save" class="btn primary">Salvar</button></div>`;
  modal.appendChild(card); document.body.appendChild(modal);
  document.getElementById('m_cancel').onclick = ()=> modal.remove();
  document.getElementById('m_save').onclick = async ()=>{
    const it = {
      id: editItem && editItem.id ? editItem.id : Date.now().toString(36)+Math.random().toString(36).slice(2,6),
      title: document.getElementById('m_title').value.trim(),
      owner: document.getElementById('m_owner').value.trim(),
      type: document.getElementById('m_type').value,
      value: parseFloat((document.getElementById('m_value').value||'0').replace(',','.'))||0,
      target: parseFloat((document.getElementById('m_target').value||'0').replace(',','.'))||0,
      progress: parseFloat((document.getElementById('m_progress').value||'0').replace(',','.'))||0,
      date: document.getElementById('m_date').value.trim()||null,
      imgKey: document.getElementById('m_imgKey').value.trim(),
      paid: !!(editItem && editItem.paid)
    };
    await trySave(it); modal.remove();
  };
  populateModal(editItem);
}
function populateModal(editItem){
  if(!editItem){
    document.getElementById('modal-title').innerText='Novo item';
    document.getElementById('m_title').value=''; document.getElementById('m_owner').value=''; document.getElementById('m_type').value='variable'; document.getElementById('m_value').value=''; document.getElementById('m_target').value=''; document.getElementById('m_progress').value=''; document.getElementById('m_date').value=''; document.getElementById('m_imgKey').value=''; return;
  }
  document.getElementById('modal-title').innerText='Editar item';
  document.getElementById('m_title').value=editItem.title||''; document.getElementById('m_owner').value=editItem.owner||''; document.getElementById('m_type').value=editItem.type||'variable'; document.getElementById('m_value').value=editItem.value||''; document.getElementById('m_target').value=editItem.target||''; document.getElementById('m_progress').value=editItem.progress||''; document.getElementById('m_date').value=editItem.date||''; document.getElementById('m_imgKey').value=editItem.imgKey||''; }

/* CACHE */
function cacheSave(arr){ try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(arr)); }catch(e){} }
function cacheLoad(){ try{ const r=localStorage.getItem(STORAGE_KEY); return r?JSON.parse(r):[] }catch{return []} }

/* RENDER principal (uses month selector totals) */
function render(){
  const container=document.getElementById('cards'); if(!container) return; container.innerHTML='';
  const sel = document.getElementById('monthSelect'); const monthKey = sel?sel.value:null;
  const summaryEl=document.getElementById('summary');
  if(monthKey){ const t = totalsForMonth(monthKey); summaryEl.innerHTML = `<div style="display:flex;gap:18px;align-items:center;justify-content:space-between"><div><strong>Receita:</strong> ${money(t.income)}</div><div><strong>Despesas:</strong> ${money(t.fixed + t.variable)}</div><div><strong>Saldo:</strong> ${money(t.saldo)}</div></div>`; } else summaryEl.innerHTML = createSummary(items);
  const filter = document.getElementById('filterType').value; const q = (document.getElementById('search').value||'').toLowerCase();
  const list = items.filter(i=> (filter==='all'?true:i.type===filter) && (i.title||'').toLowerCase().includes(q));
  list.sort((a,b)=> typeOrder(a.type) - typeOrder(b.type));
  for(const i of list) container.appendChild(cardElement(i));
}

/* buildControls + init month selector */
function buildControls(){
  document.getElementById('newItem').onclick = ()=> openModal();
  document.getElementById('exportCSV').onclick = exportCSV;
  document.getElementById('logoutBtn').onclick = ()=> auth.signOut().then(()=>window.location='login.html');
  document.getElementById('estimateBtn').onclick = estimateAllocation;
  document.getElementById('annualSummaryBtn').onclick = annualSummary;
  document.getElementById('filterType').onchange = render;
  document.getElementById('search').oninput = render;
  initMonthSelector();
}

/* SEED POPULATION - only add seed items whose id is NOT in existing db */
auth.onAuthStateChanged(async user=>{
  if(!user) return window.location='login.html';
  try{
    let dados = await carregarFinancas();
    const existingIds = new Set((dados||[]).map(d=>d.id));
    for(const it of contasIniciais){
      if(!existingIds.has(it.id)){
        if(!it.id) it.id = Date.now().toString(36)+Math.random().toString(36).slice(2,6);
        await salvarItem(it);
      }
    }
    items = await carregarFinancas();
    cacheSave(items);
    render();
  }catch(e){
    console.warn('Erro firestore, usando cache',e);
    items = cacheLoad();
    render();
  }
  buildControls();
});

/* trySave, estimateAllocation, exportCSV, import and sync (same logic) */
async function trySave(item){
  if(!item.id) item.id = Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  const idx = items.findIndex(x=>x.id===item.id);
  if(idx>=0) items[idx]=item; else items.unshift(item);
  cacheSave(items); render();
  if(navigator.onLine){
    try{ await salvarItem(item); items = await carregarFinancas(); cacheSave(items); render(); }catch(e){ console.warn('Falha salvar firestore',e); }
  }
}

function estimateAllocation(){
  const total = parseFloat((document.getElementById('investTotal').value||'0').replace(',','.'))||0;
  if(!total) return alert('Digite um valor para investir.');
  const targets = items.filter(i=> (i.type==='cofrinho' || i.type==='goal') && !String(i.id).startsWith('debt_'));
  if(!targets.length) return alert('Não há metas/cofrinhos para alocar.');
  const per = total / targets.length;
  let listHtml = '<div style="max-height:320px;overflow:auto">';
  for(const t of targets){ const pct = Math.round((per / (t.target || t.value || 1))*10000)/100; listHtml += `<div style="padding:8px;border-bottom:1px solid #eee"><strong>${t.title}</strong><div>Sugestão: ${per.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} — (${pct}% da meta)</div></div>`; }
  listHtml += '</div>';
  if(document.getElementById('flow-modal')) document.getElementById('flow-modal').remove();
  const modal=document.createElement('div'); modal.id='flow-modal'; Object.assign(modal.style,{position:'fixed',inset:0,background:'rgba(0,0,0,0.35)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999});
  const card=document.createElement('div'); card.className='modal-card'; card.innerHTML = `<h3>Estimativa de Alocação</h3>${listHtml}<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button id="est_close" class="btn">Fechar</button><button id="est_apply" class="btn primary">Aplicar sugestões</button></div>`;
  modal.appendChild(card); document.body.appendChild(modal);
  document.getElementById('est_close').onclick = ()=> modal.remove();
  document.getElementById('est_apply').onclick = async ()=>{ for(const t of targets){ t.progress = (t.progress||0) + per; t.suggestedAllocation = per; try{ await trySave(t);}catch(e){console.warn(e);} } cacheSave(items); render(); modal.remove(); alert('Sugestões aplicadas: progresso atualizado.'); };
}

function exportCSV(){ const cols=['id','type','title','owner','value','target','progress','date','imgKey','paid']; const rows=[cols.join(',')].concat(items.map(it=>cols.map(c=>{ let v=it[c]===undefined?'':it[c]; if(Array.isArray(v)) v=v.join(';'); return `"${String(v).replace(/"/g,'""')}"`; }).join(','))); const blob=new Blob([rows.join('\n')],{type:'text/csv;charset=utf-8;'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='flow_export.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href); }

function parseCSVToArray(text){ const lines=text.split(/\r?\n/).filter(Boolean); if(!lines.length) return []; const headers=lines.shift().split(',').map(h=>h.replace(/"/g,'').trim()); return lines.map(l=>{ const cols=l.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c=>c.replace(/^"|"$/g,'')); const obj={}; headers.forEach((h,i)=>obj[h]=cols[i]||''); if(obj.tags) obj.tags=obj.tags.split(';').filter(Boolean); obj.value=parseFloat((obj.value||'0').replace(',','.'))||0; obj.target=parseFloat((obj.target||'0').replace(',','.'))||0; obj.progress=parseFloat((obj.progress||'0').replace(',','.'))||0; obj.paid = obj.paid==='true' || obj.paid===true; obj.id = obj.id || Date.now().toString(36)+Math.random().toString(36).slice(2,6); return obj; }); }

async function mergeItemsFromArray(parsed){ if(!parsed||!parsed.length) return alert('CSV vazio'); const existing=new Set(items.map(k=>keyOf(k))); const toAdd=[]; for(const it of parsed){ const k=keyOf(it); if(existing.has(k)) continue; if(!it.id) it.id=Date.now().toString(36)+Math.random().toString(36).slice(2,6); toAdd.push(it); existing.add(k);} for(const it of toAdd) await trySave(it); alert(`${toAdd.length} item(s) adicionados`); }

window.addEventListener('online', async ()=>{ const cached = cacheLoad(); if(!cached||!cached.length) return; try{ for(const it of cached){ try{ await salvarItem(it);}catch(e){console.warn('Erro sync item',it.id,e);} } const fresh = await carregarFinancas(); if(fresh && fresh.length){ items = fresh; cacheSave(items); render(); } console.log('Sincronização concluída.'); }catch(e){ console.warn('Erro durante sincronização:', e); } });

document.addEventListener('DOMContentLoaded', ()=>{ const imp = document.getElementById('importCSV'); if(imp){ imp.onclick = ()=>{ const input=document.createElement('input'); input.type='file'; input.accept='.csv'; input.onchange=async e=>{ const f=e.target.files[0]; if(!f) return; const text=await f.text(); const parsed=parseCSVToArray(text); await mergeItemsFromArray(parsed); }; input.click(); }; } });

function keyOf(it){ return `${it.type}||${(it.title||'').trim().toLowerCase()}||${String(it.value||'0')}`; }

export { trySave, estimateAllocation, exportCSV, parseCSVToArray, mergeItemsFromArray };
