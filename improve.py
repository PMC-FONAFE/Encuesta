from pathlib import Path
p=Path('directorio_fonafe/index.html')
s=p.read_text(encoding='utf-8')
s=s.replace('mantener actualizado la base','mantener actualizada la base')
s=s.replace('role="tablist"','aria-label="Tipo de acceso"')
s=s.replace('<dialog id="managerDialog"','<dialog aria-labelledby="dialogTitle" id="managerDialog"')
s=s.replace('id="closeDialogBtn"','aria-label="Cerrar formulario" id="closeDialogBtn"')
s=s.replace('id="saveStatus"','id="saveStatus" role="status" aria-live="polite"')
s=s.replace('class="access-message hidden"','class="access-message hidden" role="alert"')
s=s.replace('          <div class="table-wrap managers-wrap">','''          <div class="manager-toolbar">
            <label class="field"><span>Buscar gerente</span><input id="managerSearch" type="search" placeholder="Nombre, cargo, correo o aspecto" /></label>
            <span id="managerCount" role="status"></span>
          </div>
          <div class="table-wrap managers-wrap">''')
s=s.replace('          <div class="admin-result-line">','''          <div class="admin-options">
            <label class="field"><span>Estado</span><select id="adminStatusFilter"><option value="">Todos los estados</option><option value="active">Activos</option><option value="inactive">Inactivos</option></select></label>
            <label class="field"><span>Filas por página</span><select id="adminPageSize"><option>25</option><option>50</option><option>100</option></select></label>
            <button id="clearFiltersBtn" class="button secondary" type="button">Limpiar filtros</button>
          </div>
          <div class="admin-result-line">''')
s=s.replace('Información consolidada del directorio.','Seleccione un encabezado para ordenar.')
start=s.index('<table class="admin-table">'); end=s.index('</table>',start)
t=s[start:end]
for label,key in [('Empresa','empresa'),('Tipo','tipoLabel'),('Nombre','nombre'),('Cargo','cargo'),('Correo','correo'),('Celular','celular'),('Aspectos','aspectos'),('Estado','activo')]:
 t=t.replace(f'<th>{label}</th>',f'<th scope="col" aria-sort="none"><button type="button" class="sort-button" data-sort="{key}">{label}<span aria-hidden="true">↕</span></button></th>')
s=s[:start]+t+s[end:]
needle='''              <tbody id="adminTableBody"></tbody>
            </table>
          </div>'''
s=s.replace(needle,needle+'''\n          <nav class="table-pagination" aria-label="Páginas del directorio"><span id="adminPageInfo" role="status"></span><div><button id="previousPageBtn" class="button secondary" type="button">← Anterior</button><button id="nextPageBtn" class="button secondary" type="button">Siguiente →</button></div></nav>''')
s=s.replace('<th>','<th scope="col">')
s=s.replace('<div class="table-wrap','<div tabindex="0" role="region" aria-label="Tabla del directorio; desplazamiento horizontal disponible" class="table-wrap')
p.write_text(s,encoding='utf-8')
p=Path('directorio_fonafe/app.js');s=p.read_text(encoding='utf-8')
s=s.replace('window.supabase.createClient(','window.supabase?.createClient(')
s=s.replace('let adminCompanies = [];','''let adminCompanies = [];
let adminPage = 1;
let adminSort = { key: "empresa", direction: 1 };
let hasUnsavedChanges = false;
let managerSaving = false;
let toastTimer;
''')
s=s.replace('window.setTimeout(() => element.classList.remove("show"), 3000);','clearTimeout(toastTimer);\n  toastTimer = window.setTimeout(() => element.classList.remove("show"), 5000);')
s=s.replace('  saveStatus.textContent = message;','  if (type === "pending") hasUnsavedChanges = true;\n  if (type === "success") hasUnsavedChanges = false;\n  saveStatus.textContent = message;')
s=s.replace('  if (!managers.length) {','''  const term = normalizeName(document.getElementById("managerSearch").value);
  const visible = managers.filter(m => normalizeName([m.nombre, m.cargo, m.correo, m.celular, ...m.aspectIds.map(id => getAspectById(id)?.nombre || "")].join(" ")).includes(term));
  document.getElementById("managerCount").textContent = `${visible.length} de ${managers.length} gerentes`;
  if (!visible.length) {''')
s=s.replace('No hay gerentes funcionales registrados para esta empresa.','No hay gerentes que mostrar. Agregue un registro o revise la búsqueda.')
s=s.replace('  managers.forEach(manager => {','  visible.forEach(manager => {')
s=s.replace('title="Editar"','aria-label="Editar gerente" title="Editar"').replace('title="Desactivar"','aria-label="Desactivar gerente" title="Desactivar"')
s=s.replace('    if (!record.nombre && !record.correo) continue;','    if (!existing?.id && !record.nombre && !record.correo && !record.celular) continue;')
s=s.replace('  showLoading("Guardando...");','''  const invalid = [...document.querySelectorAll("#highManagementSection input")].find(input => !input.closest(".hidden") && !input.checkValidity());
  if (invalid) { invalid.reportValidity(); return; }
  showLoading("Guardando...");''')
s=s.replace('  const selectedAspectIds = [','  if (managerSaving || !managerForm.reportValidity()) return;\n  const selectedAspectIds = [')
s=s.replace('  showLoading(\n    managerId ?', '''  if (!payload.nombre || !payload.cargo) { toast("Complete el nombre y el cargo.", "error"); return; }
  managerSaving = true;
  managerForm.querySelector('[type="submit"]').disabled = true;
  showLoading(
    managerId ?''')
s=s.replace('saveReviewBtn.addEventListener("click", registerReview);','''saveReviewBtn.addEventListener("click", registerReview);
document.getElementById("managerSearch").addEventListener("input", renderManagers);
document.getElementById("highManagementSection").addEventListener("input", () => setSaveStatus("Tiene cambios sin guardar.", "pending"));
window.addEventListener("beforeunload", event => { if (hasUnsavedChanges) { event.preventDefault(); event.returnValue = ""; } });''')
a=s.index('managerForm.addEventListener("submit"'); b=s.index('saveReviewBtn.addEventListener',a)
x=s[a:b].replace('  } finally {\n    hideLoading();','  } finally {\n    managerSaving = false;\n    managerForm.querySelector(\'[type="submit"]\').disabled = false;\n    hideLoading();');s=s[:a]+x+s[b:]
s=s.replace('    currentAssistant = null;','    if (hasUnsavedChanges && !confirm("Hay cambios pendientes. ¿Desea salir sin confirmar?")) return;\n    hasUnsavedChanges = false;\n    currentAssistant = null;')
s=s.replace('  currentCompany = selectedCompany;\n  sessionCompanyName.textContent = currentCompany.nombre;\n  applyCompanyRules(currentCompany);','''  const previousCompany = currentCompany;
  if (hasUnsavedChanges && !confirm("Hay cambios pendientes. ¿Desea cambiar de empresa sin confirmar?")) { companySwitchSelect.value = String(previousCompany.id); return; }''')
s=s.replace('    await loadCompanyDirectory(currentCompany.id);\n  } catch (error)', '''    await loadCompanyDirectory(selectedCompany.id);
    currentCompany = selectedCompany;
    sessionCompanyName.textContent = currentCompany.nombre;
    applyCompanyRules(currentCompany);
  } catch (error)''')
s=s.replace('    toast("No se pudo cargar el directorio de la empresa seleccionada.", "error");','    companySwitchSelect.value = String(previousCompany.id);\n    toast("No se pudo cargar el directorio de la empresa seleccionada.", "error");')
s=s.replace('      tipoLabel:\n        item.tipo_cargo', '      tipoLabel: item.cargo_original === "Director" ? "Director" :\n        item.tipo_cargo')
s=s.replace('    adminCompanyFilter.innerHTML =','    const previousFilter = adminCompanyFilter.value;\n    adminCompanyFilter.innerHTML =')
s=s.replace('    renderAdminTable();\n\n  } catch','    adminCompanyFilter.value = previousFilter;\n    renderAdminTable();\n\n  } catch')
s=s.replace('function renderAdminTable() {','function getFilteredAdminRows() {')
s=s.replace('  const filtered = adminRows.filter(row => {','''  const status = document.getElementById("adminStatusFilter").value;
  return adminRows.filter(row => {
    if (status === "active" && !row.activo || status === "inactive" && row.activo) return false;''')
needle='''    return true;
  });

  document.getElementById("adminResultCount")'''
s=s.replace(needle,'''    return true;
  }).sort((a, b) => String(a[adminSort.key]).localeCompare(String(b[adminSort.key]), "es", { numeric: true, sensitivity: "base" }) * adminSort.direction || a.id.localeCompare(b.id));
}

function renderAdminTable() {
  const filtered = getFilteredAdminRows();
  const size = Number(document.getElementById("adminPageSize").value);
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  adminPage = Math.min(adminPage, pages);
  const start = (adminPage - 1) * size;
  document.getElementById("adminPageInfo").textContent = filtered.length ? `${start + 1}–${Math.min(start + size, filtered.length)} de ${filtered.length} · Página ${adminPage} de ${pages}` : "Sin resultados";
  document.getElementById("previousPageBtn").disabled = adminPage === 1;
  document.getElementById("nextPageBtn").disabled = adminPage === pages;
  document.querySelectorAll("[data-sort]").forEach(button => {
    const selected = button.dataset.sort === adminSort.key;
    button.parentElement.setAttribute("aria-sort", selected ? (adminSort.direction === 1 ? "ascending" : "descending") : "none");
    button.querySelector("span").textContent = selected ? (adminSort.direction === 1 ? "↑" : "↓") : "↕";
  });
  document.getElementById("adminResultCount")''')
s=s.replace('  filtered.forEach(row => {','  filtered.slice(start, start + size).forEach(row => {')
s=s.replace('<span class="admin-status">','<span class="admin-status ${row.activo ? "" : "inactive"}">')
s=s.replace('adminCompanyFilter.addEventListener("change", renderAdminTable);\nadminTypeFilter.addEventListener("change", renderAdminTable);\nadminSearch.addEventListener("input", renderAdminTable);','''function resetAdminPage() { adminPage = 1; renderAdminTable(); }
adminCompanyFilter.addEventListener("change", resetAdminPage);
adminTypeFilter.addEventListener("change", resetAdminPage);
adminSearch.addEventListener("input", resetAdminPage);
["adminStatusFilter", "adminPageSize"].forEach(id => document.getElementById(id).addEventListener("change", resetAdminPage));
document.getElementById("clearFiltersBtn").addEventListener("click", () => { [adminCompanyFilter, adminTypeFilter, adminSearch, document.getElementById("adminStatusFilter")].forEach(el => el.value = ""); resetAdminPage(); });
document.querySelectorAll("[data-sort]").forEach(button => button.addEventListener("click", () => { adminSort = { key: button.dataset.sort, direction: adminSort.key === button.dataset.sort ? -adminSort.direction : 1 }; resetAdminPage(); }));
document.getElementById("previousPageBtn").addEventListener("click", () => { adminPage--; renderAdminTable(); });
document.getElementById("nextPageBtn").addEventListener("click", () => { adminPage++; renderAdminTable(); });''')
s=s.replace('.addEventListener("click", loadAdminData);','.addEventListener("click", () => loadAdminData().catch(() => {}));')
s=s.replace('    const rows = [','    if (!window.XLSX) { toast("No se pudo cargar Excel. Verifique su conexión y recargue la página.", "error"); return; }\n    const rows = [')
s=s.replace('...adminRows.map(row => [','...getFilteredAdminRows().map(row => [')
s=s.replace('  const restored = await restoreAdminSession();','''  if (!supabaseClient) { showAccessError(companyAccessError, "No se pudo conectar al servicio. Verifique su conexión y recargue la página."); accessCompany.innerHTML = '<option value="">Servicio no disponible</option>'; return; }
  let restored = false;
  try { restored = await restoreAdminSession(); } catch (error) { console.warn("No se pudo restaurar la sesión", error); }''')
s=s.replace('    await loadInitialData();\n    showAccessView("company");','    showAccessView("company");\n    await loadInitialData();')
p.write_text(s,encoding='utf-8')
