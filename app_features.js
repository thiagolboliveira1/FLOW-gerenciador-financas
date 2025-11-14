import { auth } from './firebase.js';
import { carregarFinancas, salvarItem, deletarItem } from './firestore.js';
import { contasIniciais } from './seed.js';

const STORAGE_KEY = 'flow_cache_v1';
let items = [];

// FORMATADOR DE DINHEIRO
const money = v =>
  Number(v || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

/* ============================================================
   MAPA DE IMAGENS PARA OS CARDS
   ============================================================ */
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

/* ============================================================
   RESUMO SUPERIOR (Receita / Despesas / Saldo)
   ============================================================ */
function createSummary(itms) {
  const income = itms
    .filter(i => i.type === 'income')
    .reduce((s, i) => s + (i.value || 0), 0);

  const fixed = itms
    .filter(i => i.type === 'fixed')
    .reduce((s, i) => s + (i.value || 0), 0);

  const variable = itms
    .filter(i => i.type === 'variable')
    .reduce((s, i) => s + (i.value || 0), 0);

  const saldo = income - (fixed + variable);

  return `
    <div style="display:flex;gap:18px;align-items:center;justify-content:space-between">
      <div><strong>Receita:</strong> ${money(income)}</div>
      <div><strong>Despesas:</strong> ${money(fixed + variable)}</div>
      <div><strong>Saldo:</strong> ${money(saldo)}</div>
    </div>
  `;
}

/* ============================================================
   BOTÕES / CONTROLES PRINCIPAIS
   ============================================================ */
function buildControls() {
  document.getElementById('newItem').onclick = () => openModal();
  document.getElementById('exportCSV').onclick = exportCSV;
  document.getElementById('logoutBtn').onclick = () =>
    auth.signOut().then(() => (window.location = 'login.html'));

  document.getElementById('estimateBtn').onclick = estimateAllocation;

  document.getElementById('filterType').onchange = render;
  document.getElementById('search').oninput = render;
}

/* ============================================================
   LOGIN AUTOMÁTICO / CARREGAMENTO DO FIRESTORE
   ============================================================ */
auth.onAuthStateChanged(async user => {
  if (!user) return (window.location = 'login.html');

  try {
    // Tenta carregar do Firestore
    let dados = await carregarFinancas();

    // Se for primeira vez → popular seed
    if (!dados || dados.length === 0) {
      for (const it of contasIniciais) {
        if (!it.id)
          it.id =
            Date.now().toString(36) +
            Math.random()
              .toString(36)
              .slice(2, 6);

        await salvarItem(it);
      }

      dados = await carregarFinancas();
    }

    items = dados || [];
    cacheSave(items);
    render();
  } catch (e) {
    console.warn('Erro Firestore, usando cache local:', e);
    items = cacheLoad();
    render();
  }

  buildControls();
});

/* ============================================================
   CACHE LOCAL (Offline seguro)
   ============================================================ */
function cacheSave(arr) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {}
}

function cacheLoad() {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    return r ? JSON.parse(r) : [];
  } catch {
    return [];
  }
}

/* ============================================================
   RENDER PRINCIPAL
   ============================================================ */
function render() {
  const container = document.getElementById('cards');
  if (!container) return;

  container.innerHTML = '';

  // Atualiza resumo
  document.getElementById('summary').innerHTML = createSummary(items);

  const filter = document.getElementById('filterType').value;
  const q = (document.getElementById('search').value || '').toLowerCase();

  const list = items.filter(
    i =>
      (filter === 'all' ? true : i.type === filter) &&
      (i.title || '').toLowerCase().includes(q)
  );

  // Ordenação lógica
  list.sort((a, b) => typeOrder(a.type) - typeOrder(b.type));

  for (const i of list) {
    container.appendChild(cardElement(i));
  }
}

/* ============================================================
   ORDEM LÓGICA DE EXIBIÇÃO
   ============================================================ */
function typeOrder(t) {
  const o = {
    income: 0,
    cofrinho: 1,
    goal: 2,
    fixed: 3,
    variable: 4,
    limit: 5
  };
  return o[t] || 9;
}
/* ============================================================
   PARTE 2/3 — CARDS, CHECKBOX "PAGO", PROGRESSO, MODAL, AÇÕES
   ============================================================ */

function cardElement(i) {
  const el = document.createElement('div');
  el.className = 'card';

  // COVER (imagem por imgKey)
  const cover = document.createElement('div');
  cover.className = 'card-cover';
  cover.style.backgroundImage = `url(${IMG[i.imgKey] || IMG['home']})`;
  el.appendChild(cover);

  // CONTENT
  const content = document.createElement('div');
  content.className = 'card-content';

  const tipo = document.createElement('div');
  tipo.className = 'card-type';
  tipo.innerText = traduzTipo(i.type);
  content.appendChild(tipo);

  const title = document.createElement('div');
  title.className = 'card-title';
  title.contentEditable = true;
  title.innerText = i.title || '(sem título)';
  title.addEventListener('blur', async e => {
    i.title = e.target.innerText.trim();
    await trySave(i);
  });
  content.appendChild(title);

  const owner = document.createElement('div');
  owner.className = 'card-owner';
  owner.innerText = i.owner || '';
  content.appendChild(owner);

  const value = document.createElement('div');
  value.className = 'card-value';
  value.innerText = money(i.value);
  content.appendChild(value);

  // tags (se existirem)
  if (i.tags && Array.isArray(i.tags) && i.tags.length) {
    const tags = document.createElement('div');
    tags.className = 'card-tags';
    i.tags.forEach(t => {
      const tk = document.createElement('div');
      tk.className = 'tag';
      tk.innerText = t;
      tags.appendChild(tk);
    });
    content.appendChild(tags);
  }

  // Progresso para metas/cofrinhos
  if (i.type === 'goal' || i.type === 'cofrinho') {
    const progBox = document.createElement('div');
    progBox.className = 'progress-box';

    const bar = document.createElement('div');
    bar.className = 'progress-bar';

    const fill = document.createElement('div');
    fill.className = 'progress-fill';
    const pct = Math.min(
      100,
      Math.round(((i.progress || 0) / (i.target || i.value || 1)) * 100)
    );
    fill.style.width = pct + '%';
    bar.appendChild(fill);
    progBox.appendChild(bar);

    const pctText = document.createElement('div');
    pctText.className = 'progress-percent';
    pctText.innerText = pct + '%';

    content.appendChild(progBox);
    content.appendChild(pctText);
  }

  // FOOTER: Paid checkbox + actions
  const footer = document.createElement('div');
  footer.className = 'card-footer';

  // Paid checkbox
  const paidWrap = document.createElement('label');
  paidWrap.className = 'paid-checkbox';
  const chk = document.createElement('input');
  chk.type = 'checkbox';
  chk.checked = !!i.paid;
  chk.onchange = async () => {
    i.paid = chk.checked;
    await trySave(i);
    render(); // atualiza visual (por ex. poderia riscar o título)
  };
  paidWrap.appendChild(chk);
  paidWrap.append(' Pago');
  footer.appendChild(paidWrap);

  // Actions
  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '8px';

  const btnEdit = document.createElement('button');
  btnEdit.className = 'btn';
  btnEdit.innerText = 'Editar';
  btnEdit.onclick = () => openModal(i);
  actions.appendChild(btnEdit);

  const btnDel = document.createElement('button');
  btnDel.className = 'btn';
  btnDel.innerText = 'Excluir';
  btnDel.onclick = async () => {
    if (!confirm('Excluir item?')) return;
    try {
      await deletarItem(i.id);
    } catch (e) {
      console.warn('Erro deletar (Firestore):', e);
    }
    items = items.filter(x => x.id !== i.id);
    cacheSave(items);
    render();
  };
  actions.appendChild(btnDel);

  footer.appendChild(actions);
  el.appendChild(content);
  el.appendChild(footer);

  return el;
}

/* ============================================================
   MODAL (CRIAR / EDITAR)
   ============================================================ */
function openModal(editItem) {
  // Se modal já existe, apenas popula
  if (document.getElementById('flow-modal')) {
    populateModal(editItem);
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'flow-modal';
  Object.assign(modal.style, {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  });

  const card = document.createElement('div');
  card.className = 'modal-card';
  card.innerHTML = `
    <h3 id="modal-title">Novo item</h3>
    <input id="m_title" class="input" placeholder="Título" />
    <input id="m_owner" class="input" placeholder="Responsável" />
    <select id="m_type" class="input">
      <option value="income">Renda</option>
      <option value="fixed">Despesa Fixa</option>
      <option value="variable">Despesa Variável</option>
      <option value="goal">Meta</option>
      <option value="cofrinho">Cofrinho</option>
    </select>
    <input id="m_value" class="input" placeholder="Valor (ex: 150.00)" />
    <input id="m_target" class="input" placeholder="Meta (opcional)" />
    <input id="m_progress" class="input" placeholder="Progresso (opcional)" />
    <input id="m_imgKey" class="input" placeholder="Imagem key (ex: water, light)" />
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button id="m_cancel" class="btn">Cancelar</button>
      <button id="m_save" class="btn primary">Salvar</button>
    </div>
  `;

  modal.appendChild(card);
  document.body.appendChild(modal);

  document.getElementById('m_cancel').onclick = () => modal.remove();

  document.getElementById('m_save').onclick = async () => {
    const it = {
      id:
        editItem && editItem.id
          ? editItem.id
          : Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: document.getElementById('m_title').value.trim(),
      owner: document.getElementById('m_owner').value.trim(),
      type: document.getElementById('m_type').value,
      value:
        parseFloat(
          (document.getElementById('m_value').value || '0').replace(',', '.')
        ) || 0,
      target:
        parseFloat(
          (document.getElementById('m_target').value || '0').replace(',', '.')
        ) || 0,
      progress:
        parseFloat(
          (document.getElementById('m_progress').value || '0').replace(',', '.')
        ) || 0,
      imgKey: document.getElementById('m_imgKey').value.trim(),
      paid: !!(editItem && editItem.paid)
    };

    await trySave(it);
    modal.remove();
  };

  populateModal(editItem);
}

function populateModal(editItem) {
  if (!editItem) {
    document.getElementById('modal-title').innerText = 'Novo item';
    document.getElementById('m_title').value = '';
    document.getElementById('m_owner').value = '';
    document.getElementById('m_type').value = 'variable';
    document.getElementById('m_value').value = '';
    document.getElementById('m_target').value = '';
    document.getElementById('m_progress').value = '';
    document.getElementById('m_imgKey').value = '';
    return;
  }

  document.getElementById('modal-title').innerText = 'Editar item';
  document.getElementById('m_title').value = editItem.title || '';
  document.getElementById('m_owner').value = editItem.owner || '';
  document.getElementById('m_type').value = editItem.type || 'variable';
  document.getElementById('m_value').value = editItem.value || '';
  document.getElementById('m_target').value = editItem.target || '';
  document.getElementById('m_progress').value = editItem.progress || '';
  document.getElementById('m_imgKey').value = editItem.imgKey || '';
}

/* ============================================================
   FUNÇÕES AUXILIARES (chave única)
   ============================================================ */
function keyOf(it) {
  return `${it.type}||${(it.title || '').trim().toLowerCase()}||${String(it.value || '0')}`;
}
/* ============================================================
   PARTE 3/3 — TRY SAVE, ESTIMADOR, CSV, SYNC, FINALIZAÇÃO
   ============================================================ */

async function trySave(item) {
  // garante id
  if (!item.id) item.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const idx = items.findIndex(x => x.id === item.id);
  if (idx >= 0) items[idx] = item;
  else items.unshift(item);

  cacheSave(items);
  render();

  // tenta salvar no Firestore se online
  if (navigator.onLine) {
    try {
      await salvarItem(item);
      // recarrega para manter consistência
      const fresh = await carregarFinancas();
      if (fresh && fresh.length) {
        items = fresh;
        cacheSave(items);
        render();
      }
    } catch (e) {
      console.warn('Falha ao salvar no Firestore — mantido no cache:', e);
    }
  } else {
    // sem conexão: ficará no cache e será sincronizado ao reconectar
    console.log('Offline — item salvo no cache.');
  }
}

/* ============================================================
   ESTIMADOR DE ALOCAÇÃO ENTRE METAS/COFRINHOS
   ============================================================ */
function estimateAllocation() {
  const total = parseFloat((document.getElementById('investTotal').value || '0').replace(',', '.')) || 0;
  if (!total) return alert('Digite um valor para investir.');

  // Seleciona targets: metas e cofrinhos, EXCLUINDO dívidas (id startsWith 'debt_')
  const targets = items.filter(i => (i.type === 'cofrinho' || i.type === 'goal') && !String(i.id).startsWith('debt_'));

  if (!targets.length) return alert('Não há metas/cofrinhos para alocar.');

  const per = total / targets.length;

  // monta lista com % da meta
  let listHtml = '<div style="max-height:320px;overflow:auto">';
  for (const t of targets) {
    const pct = Math.round((per / (t.target || t.value || 1)) * 10000) / 100;
    listHtml += `<div style="padding:8px;border-bottom:1px solid #eee"><strong>${t.title}</strong><div>Sugestão: ${per.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} — (${pct}% da meta)</div></div>`;
  }
  listHtml += '</div>';

  // modal com aplicar sugestões
  if (document.getElementById('flow-modal')) document.getElementById('flow-modal').remove();
  const modal = document.createElement('div');
  modal.id = 'flow-modal';
  Object.assign(modal.style, { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 });

  const card = document.createElement('div');
  card.className = 'modal-card';
  card.innerHTML = `<h3>Estimativa de Alocação</h3>${listHtml}<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button id="est_close" class="btn">Fechar</button><button id="est_apply" class="btn primary">Aplicar sugestões</button></div>`;
  modal.appendChild(card);
  document.body.appendChild(modal);

  document.getElementById('est_close').onclick = () => modal.remove();
  document.getElementById('est_apply').onclick = async () => {
    for (const t of targets) {
      // incrementa progress com a sugestão (por simplicidade)
      t.progress = (t.progress || 0) + per;
      // marca suggestedAllocation para referência
      t.suggestedAllocation = per;
      // salva cada item (tentativa Firestore se online)
      try {
        await trySave(t);
      } catch (e) {
        console.warn('Erro ao aplicar sugestão em item', t.id, e);
      }
    }
    cacheSave(items);
    render();
    modal.remove();
    alert('Sugestões aplicadas: progresso atualizado com as alocações sugeridas.');
  };
}

/* ============================================================
   EXPORT / IMPORT CSV
   ============================================================ */
function exportCSV() {
  const cols = ['id', 'type', 'title', 'owner', 'value', 'target', 'progress', 'date', 'imgKey', 'paid'];
  const rows = [cols.join(',')].concat(
    items.map(it =>
      cols
        .map(c => {
          let v = it[c] === undefined ? '' : it[c];
          if (Array.isArray(v)) v = v.join(';');
          return `"${String(v).replace(/"/g, '""')}"`;
        })
        .join(',')
    )
  );

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'flow_export.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function parseCSVToArray(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines.shift().split(',').map(h => h.replace(/"/g, '').trim());
  return lines.map(l => {
    const cols = l.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c => c.replace(/^"|"$/g, ''));
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = cols[i] || '';
    });
    if (obj.tags) obj.tags = obj.tags.split(';').filter(Boolean);
    obj.value = parseFloat((obj.value || '0').replace(',', '.')) || 0;
    obj.target = parseFloat((obj.target || '0').replace(',', '.')) || 0;
    obj.progress = parseFloat((obj.progress || '0').replace(',', '.')) || 0;
    obj.paid = obj.paid === 'true' || obj.paid === true;
    obj.id = obj.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    return obj;
  });
}

async function mergeItemsFromArray(parsed) {
  if (!parsed || !parsed.length) return alert('CSV vazio ou inválido.');
  const existingKeys = new Set(items.map(k => keyOf(k)));
  const toAdd = [];
  for (const it of parsed) {
    const k = keyOf(it);
    if (existingKeys.has(k)) continue; // evita duplicação
    if (!it.id) it.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    toAdd.push(it);
    existingKeys.add(k);
  }

  for (const it of toAdd) {
    await trySave(it);
  }

  alert(`Importação concluída. ${toAdd.length} item(s) adicionados.`);
}

/* ============================================================
   SINCRONIZAÇÃO AO RECONECTAR
   ============================================================ */
window.addEventListener('online', async () => {
  // se houver cache local, tenta enviar para Firestore
  const cached = cacheLoad();
  if (!cached || !cached.length) return;
  try {
    for (const it of cached) {
      // tenta salvar cada item (merge)
      try {
        await salvarItem(it);
      } catch (e) {
        console.warn('Erro ao sync item', it.id, e);
      }
    }
    // atualizar lista
    const fresh = await carregarFinancas();
    if (fresh && fresh.length) {
      items = fresh;
      cacheSave(items);
      render();
    }
    console.log('Sincronização concluída.');
  } catch (e) {
    console.warn('Erro durante sincronização:', e);
  }
});

/* ============================================================
   EXPORTAÇÃO / IMPORT VIA INPUT (aux)
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // botão de import (criado dinamicamente no buildControls, mas garante fallback)
  const imp = document.getElementById('importCSV');
  if (imp) {
    imp.onclick = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv';
      input.onchange = async e => {
        const f = e.target.files[0];
        if (!f) return;
        const text = await f.text();
        const parsed = parseCSVToArray(text);
        await mergeItemsFromArray(parsed);
      };
      input.click();
    };
  }
});

/* ============================================================
   FIM DO ARQUIVO — exporta funções úteis para debug (opcional)
   ============================================================ */
export { trySave, estimateAllocation, exportCSV, parseCSVToArray, mergeItemsFromArray };
