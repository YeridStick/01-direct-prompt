'use strict';
const KEY = 'soluciones.tickets.v1';
const states = ['Abierto', 'En Progreso', 'Resuelto'];
const priorities = ['Alta', 'Media', 'Baja'];
const $ = selector => document.querySelector(selector);
let tickets = [];
let storageHealthy = true;
let selectedId = null;
let toastTimer;
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 5000);
}
try {
  const saved = localStorage.getItem(KEY);
  if (saved !== null) {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every(t => t && typeof t.id === 'string' && typeof t.title === 'string' && typeof t.description === 'string' && typeof t.requester === 'string' && states.includes(t.status) && priorities.includes(t.priority) && Number.isFinite(Date.parse(t.createdAt)) && Number.isFinite(Date.parse(t.updatedAt)))) throw new Error('Invalid data');
    tickets = parsed;
  }
} catch {
  storageHealthy = false;
  toast('No se pudieron leer los datos guardados. Revisa el almacenamiento del navegador antes de continuar.');
}
function save(next) {
  if (!storageHealthy) { toast('No es posible guardar sin recuperar el almacenamiento existente.'); return false; }
  try { localStorage.setItem(KEY, JSON.stringify(next)); tickets = next; return true; }
  catch { toast('No se pudo guardar. Comprueba el espacio y los permisos del navegador.'); return false; }
}
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date = value => new Intl.DateTimeFormat('es-CO', {day:'2-digit',month:'short',year:'numeric'}).format(new Date(value));
const statusClass = status => ['status-open','status-progress','status-resolved'][states.indexOf(status)];
const initials = name => name.trim().split(/\s+/).slice(0,2).map(n => n[0]).join('').toUpperCase();
function render() {
  $('#total-count').textContent = tickets.length;
  $('#nav-count').textContent = tickets.length;
  ['#open-count','#progress-count','#resolved-count'].forEach((selector,i) => { $(selector).textContent = tickets.filter(t => t.status === states[i]).length; });
  const query = $('#search').value.trim().toLocaleLowerCase('es');
  const filtered = tickets.filter(t => (!query || `${t.id} ${t.title} ${t.requester} ${t.description}`.toLocaleLowerCase('es').includes(query)) && (!$('#status-filter').value || t.status === $('#status-filter').value) && (!$('#priority-filter').value || t.priority === $('#priority-filter').value)).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  $('#list-count').textContent = filtered.length;
  $('#results-label').textContent = `Mostrando ${filtered.length} de ${tickets.length} tickets`;
  $('#ticket-rows').innerHTML = filtered.map(t => `<tr><td><span class="ticket-id">${escapeHTML(t.id)}</span><button class="ticket-title" data-detail="${escapeHTML(t.id)}">${escapeHTML(t.title)}</button></td><td><select class="status-select ${statusClass(t.status)}" data-status="${escapeHTML(t.id)}" aria-label="Estado de ${escapeHTML(t.id)}">${states.map(s => `<option${s === t.status ? ' selected' : ''}>${s}</option>`).join('')}</select></td><td><span class="priority priority-${t.priority.toLowerCase()}">${t.priority}</span></td><td><div class="person"><span class="person-icon">${escapeHTML(initials(t.requester))}</span>${escapeHTML(t.requester)}</div></td><td>${date(t.createdAt)}</td><td><button class="detail-button" data-detail="${escapeHTML(t.id)}" aria-label="Ver ${escapeHTML(t.id)}">↗</button></td></tr>`).join('');
  $('#empty-state').hidden = filtered.length > 0;
  $('#empty-title').textContent = tickets.length ? 'No encontramos coincidencias' : 'Todo empieza con un ticket';
  $('#empty-description').textContent = tickets.length ? 'Prueba otra búsqueda o restablece los filtros.' : 'Crea tu primera solicitud y dale seguimiento desde aquí.';
  $('#empty-create').hidden = tickets.length > 0;
}
function openCreate() { $('#ticket-form').reset(); $('#ticket-dialog').showModal(); }
$('#new-ticket').addEventListener('click', openCreate);
$('#empty-create').addEventListener('click', openCreate);
for (const dialog of document.querySelectorAll('dialog')) {
  dialog.querySelectorAll('.close,.cancel').forEach(button => button.addEventListener('click', () => dialog.close()));
}
$('#ticket-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  for (const field of ['title','description','requester']) {
    const input = form.elements[field];
    input.setCustomValidity(input.value.trim() ? '' : 'Escribe un valor que no esté vacío.');
    if (!input.reportValidity()) return;
  }
  const values = new FormData(form);
  const now = new Date().toISOString();
  const maxId = tickets.reduce((max,t) => Math.max(max, Number(t.id.replace('SOL-','')) || 0), 0);
  const ticket = {id:`SOL-${String(maxId+1).padStart(4,'0')}`,title:values.get('title').trim(),description:values.get('description').trim(),requester:values.get('requester').trim(),priority:values.get('priority'),status:'Abierto',createdAt:now,updatedAt:now};
  if (save([...tickets,ticket])) { $('#ticket-dialog').close(); resetFilters(); toast(`${ticket.id} creado correctamente`); }
});
$('#ticket-form').addEventListener('input', event => event.target.setCustomValidity?.(''));
function resetFilters() { $('#search').value=''; $('#status-filter').value=''; $('#priority-filter').value=''; render(); }
$('#reset-filters').addEventListener('click', resetFilters);
$('#search').addEventListener('input', render);
$('#status-filter').addEventListener('change', render);
$('#priority-filter').addEventListener('change', render);
function changeStatus(id,status) {
  if (!states.includes(status) || !tickets.some(t => t.id === id)) return;
  if (save(tickets.map(t => t.id === id ? {...t,status,updatedAt:new Date().toISOString()} : t))) { render(); toast('Estado actualizado y guardado'); }
  else render();
}
$('#ticket-rows').addEventListener('change', event => { if (event.target.dataset.status) changeStatus(event.target.dataset.status,event.target.value); });
function fillDetail(id) {
  const t = tickets.find(ticket => ticket.id === id);
  if (!t) { $('#detail-dialog').close(); return; }
  selectedId = id;
  $('#detail-id').textContent=t.id;
  $('#detail-title').textContent=t.title;
  $('#detail-meta').textContent=`${t.requester} · Prioridad ${t.priority.toLowerCase()} · ${date(t.createdAt)}`;
  $('#detail-description').textContent=t.description;
  $('#detail-status').value=t.status;
  $('#detail-updated').textContent=`Última actualización: ${new Date(t.updatedAt).toLocaleString('es-CO')}`;
}
$('#ticket-rows').addEventListener('click', event => { const button = event.target.closest('[data-detail]'); if (button) { fillDetail(button.dataset.detail); $('#detail-dialog').showModal(); } });
$('#detail-status').addEventListener('change', event => { changeStatus(selectedId,event.target.value); fillDetail(selectedId); });
window.addEventListener('storage', event => { if (event.key === KEY || event.key === null) window.location.reload(); });
render();
