/* =========================================================
   CONFIGURACIÓN SUPABASE
   ========================================================= */

const SUPABASE_URL = "https://plsgafhuvaivgjrlgtys.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_7fiJsqzP6pc85eUoxRgLlw_wbrgeL3R";
const ADMIN_EMAIL = "procesos@fonafe.gob.pe";

const supabaseClient = window.supabase?.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


/* =========================================================
   ESTADO
   ========================================================= */

let companies = [];
let aspects = [];
let currentCompany = null;
let currentAssistant = null;
let highManagement = { president: null, generalManager: null, directors: [] };
let managers = [];

let adminRows = [];
let adminCompanies = [];
let adminPage = 1;
let adminPageSize = 25;
let adminLoading = false;
let adminSort = { key: "empresa", direction: 1 };
let hasUnsavedChanges = false;
let managerSaving = false;
let managerFormSnapshot = "";
let toastTimer;


let distriluzGroupCompanies = [];


/* =========================================================
   ELEMENTOS
   ========================================================= */

const accessView = document.getElementById("accessView");
const companyView = document.getElementById("companyView");
const adminView = document.getElementById("adminView");

const companyAccessTab = document.getElementById("companyAccessTab");
const adminAccessTab = document.getElementById("adminAccessTab");
const companyAccessForm = document.getElementById("companyAccessForm");
const adminAccessForm = document.getElementById("adminAccessForm");

const companyAccessError = document.getElementById("companyAccessError");
const adminAccessError = document.getElementById("adminAccessError");

const accessCompany = document.getElementById("accessCompany");
const accessEmail = document.getElementById("accessEmail");

const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");

const sessionCompanyName = document.getElementById("sessionCompanyName");
const sessionReviewerName = document.getElementById("sessionReviewerName");

const functionalManagersSection = document.getElementById("functionalManagersSection");
const presidentBody = document.getElementById("presidentBody");
const companySwitcher = document.getElementById("companySwitcher");
const companySwitchSelect = document.getElementById("companySwitchSelect");

const presidentName = document.getElementById("presidentName");
const presidentPhone = document.getElementById("presidentPhone");
const presidentEmail = document.getElementById("presidentEmail");
const generalManagerName = document.getElementById("generalManagerName");
const generalManagerPhone = document.getElementById("generalManagerPhone");
const generalManagerEmail = document.getElementById("generalManagerEmail");
const directorsBody = document.getElementById("directorsBody");

const managerTableBody = document.getElementById("managerTableBody");
const managerDialog = document.getElementById("managerDialog");
const managerForm = document.getElementById("managerForm");

const saveReviewBtn = document.getElementById("saveReviewBtn");
const saveStatus = document.getElementById("saveStatus");

const loadingOverlay = document.getElementById("loadingOverlay");
const loadingText = document.getElementById("loadingText");

const adminTableBody = document.getElementById("adminTableBody");
const adminCompanyFilter = document.getElementById("adminCompanyFilter");
const adminSearch = document.getElementById("adminSearch");


/* =========================================================
   UTILIDADES
   ========================================================= */

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function showLoading(message = "Procesando...") {
  loadingText.textContent = message;
  loadingOverlay.classList.remove("hidden");
}

function hideLoading() {
  loadingOverlay.classList.add("hidden");
}

function toast(message, type = "normal") {
  const element = document.getElementById("toast");
  element.textContent = message;
  element.classList.toggle("error", type === "error");
  element.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => element.classList.remove("show"), 5000);
}

function setSaveStatus(message, type = "neutral") {
  if (type === "pending") hasUnsavedChanges = true;
  if (type === "success") hasUnsavedChanges = false;
  saveStatus.textContent = message;
  saveStatus.classList.remove("success", "pending", "error");
  if (type !== "neutral") saveStatus.classList.add(type);
}

function showAccessError(element, message) {
  element.textContent = message;
  element.classList.remove("hidden");
}

function clearAccessError(element) {
  element.textContent = "";
  element.classList.add("hidden");
}

function getAspectById(id) {
  return aspects.find(item => Number(item.id) === Number(id));
}

function normalizeAspectNames(items = []) {
  return items.map(item => ({
    ...item,
    nombre: String(item.nombre || "").replace(/buenas\s+pr[aá]cticas/gi, "Procesos y SIG")
  }));
}

function getCompanyName(companyId) {
  return adminCompanies.find(c => Number(c.id) === Number(companyId))?.nombre || "";
}

function isCorporateWithoutFunctionalManagers(company) {
  return normalizeName(company?.nombre).includes("distriluz");
}

const SUBSIDIARIES_WITHOUT_PRESIDENT = [
  "electronoroeste",
  "electronorte",
  "hidrandina",
  "electrocentro",
  "sima iquitos"
];

function isSubsidiaryWithoutPresident(company) {
  const name = normalizeName(company?.nombre);
  return SUBSIDIARIES_WITHOUT_PRESIDENT.some(subsidiary => name.includes(subsidiary));
}

const DISTRILUZ_GROUP_SUBSIDIARIES = [
  "electronoroeste",
  "electronorte",
  "hidrandina",
  "electrocentro"
];

function applyCompanyRules(company) {
  functionalManagersSection.classList.toggle(
    "hidden",
    isCorporateWithoutFunctionalManagers(company)
  );

  presidentBody.classList.toggle(
    "hidden",
    isSubsidiaryWithoutPresident(company)
  );
}

function setupDistriluzGroupSwitcher(company) {
  if (!isCorporateWithoutFunctionalManagers(company)) {
    companySwitcher.classList.add("hidden");
    companySwitchSelect.innerHTML = "";
    distriluzGroupCompanies = [];
    return;
  }

  distriluzGroupCompanies = [
    company,
    ...companies.filter(candidate => {
      const name = normalizeName(candidate.nombre);
      return DISTRILUZ_GROUP_SUBSIDIARIES.some(subsidiary => name.includes(subsidiary));
    })
  ];

  companySwitchSelect.innerHTML = distriluzGroupCompanies
    .map(item => `<option value="${item.id}">${escapeHtml(item.nombre)}</option>`)
    .join("");

  companySwitchSelect.value = String(company.id);
  companySwitcher.classList.remove("hidden");
}


/* =========================================================
   VISTAS
   ========================================================= */

function showAccessView(mode = "company") {
  accessView.classList.remove("hidden");
  companyView.classList.add("hidden");
  adminView.classList.add("hidden");

  if (mode === "admin") {
    adminAccessTab.click();
  } else {
    companyAccessTab.click();
  }
}

function showCompanyView() {
  accessView.classList.add("hidden");
  adminView.classList.add("hidden");
  companyView.classList.remove("hidden");
}

function showAdminView() {
  accessView.classList.add("hidden");
  companyView.classList.add("hidden");
  adminView.classList.remove("hidden");
}


/* =========================================================
   TABS
   ========================================================= */

companyAccessTab.addEventListener("click", () => {
  companyAccessTab.classList.add("active");
  adminAccessTab.classList.remove("active");
  companyAccessForm.classList.remove("hidden");
  adminAccessForm.classList.add("hidden");
  clearAccessError(companyAccessError);
});

adminAccessTab.addEventListener("click", () => {
  adminAccessTab.classList.add("active");
  companyAccessTab.classList.remove("active");
  adminAccessForm.classList.remove("hidden");
  companyAccessForm.classList.add("hidden");
  clearAccessError(adminAccessError);
});


/* =========================================================
   CARGA INICIAL
   ========================================================= */

async function loadInitialData() {
  showLoading("Cargando información...");

  try {
    const [
      { data: companyData, error: companyError },
      { data: aspectData, error: aspectError }
    ] = await Promise.all([
      supabaseClient
        .from("empresas")
        .select("id,nombre")
        .eq("activo", true)
        .order("nombre"),

      supabaseClient
        .from("aspectos")
        .select("id,codigo,nombre,orden")
        .eq("activo", true)
        .order("orden")
    ]);

    if (companyError) throw companyError;
    if (aspectError) throw aspectError;

    companies = companyData || [];
    aspects = normalizeAspectNames(aspectData || []);

    accessCompany.innerHTML = '<option value="">Seleccione una empresa</option>';

    companies.forEach(company => {
      const option = document.createElement("option");
      option.value = company.id;
      option.textContent = company.nombre;
      accessCompany.appendChild(option);
    });

  } catch (error) {
    console.error(error);
    accessCompany.innerHTML = '<option value="">No se pudieron cargar las empresas</option>';
    showAccessError(
      companyAccessError,
      error?.message || "No se pudo cargar la información inicial."
    );
  } finally {
    hideLoading();
  }
}


/* =========================================================
   ACCESO EMPRESA
   Valida SOLO empresa + correo.
   El nombre NO se compara con Supabase.
   ========================================================= */

companyAccessForm.addEventListener("submit", async event => {
  event.preventDefault();
  clearAccessError(companyAccessError);

  const companyId = Number(accessCompany.value);
  const email = normalizeEmail(accessEmail.value);

  if (!companyId || !email) {
    showAccessError(
      companyAccessError,
      "Seleccione una empresa e ingrese el correo registrado."
    );
    return;
  }

  showLoading("Validando correo...");

  try {
    const { data, error } = await supabaseClient
      .from("asistentes_empresas")
      .select("id,empresa_id,nombre,cargo,telefono,celular,correo,activo")
      .eq("empresa_id", companyId)
      .eq("activo", true)
      .ilike("correo", email)
      .limit(1);

    if (error) throw error;

    const assistant = (data || [])[0] || null;

    if (!assistant) {
      throw new Error("El correo ingresado no está autorizado para la empresa seleccionada.");
    }

    currentAssistant = assistant;

    currentCompany = companies.find(
      company => Number(company.id) === Number(companyId)
    );

    if (!currentCompany) {
      throw new Error("Empresa no encontrada.");
    }

    sessionCompanyName.textContent = currentCompany.nombre;
    sessionReviewerName.textContent = currentAssistant.nombre || email;

    applyCompanyRules(currentCompany);
    setupDistriluzGroupSwitcher(currentCompany);

    await loadCompanyDirectory(currentCompany.id);

    try {
      await supabaseClient
        .from("asistentes_empresas")
        .update({ ultimo_acceso: new Date().toISOString() })
        .eq("id", assistant.id);
    } catch (error) {
      console.warn("No se pudo actualizar ultimo_acceso:", error);
    }

    showCompanyView();

  } catch (error) {
    console.error("Error validando acceso:", error);
    showAccessError(
      companyAccessError,
      error?.message || "No fue posible validar el correo."
    );
  } finally {
    hideLoading();
  }
});


/* =========================================================
   ADMIN
   ========================================================= */

adminAccessForm.addEventListener("submit", async event => {
  event.preventDefault();
  clearAccessError(adminAccessError);

  const email = normalizeEmail(adminEmail.value);
  const password = adminPassword.value;

  if (email !== ADMIN_EMAIL) {
    showAccessError(
      adminAccessError,
      "Este correo no tiene acceso a la vista Administrador."
    );
    return;
  }

  showLoading("Ingresando como administrador...");

  try {
    await supabaseClient.auth.signOut();

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    if (normalizeEmail(data?.user?.email) !== ADMIN_EMAIL) {
      await supabaseClient.auth.signOut();
      throw new Error("Acceso administrador no autorizado.");
    }

    await loadAdminData();
    showAdminView();
    adminPassword.value = "";

  } catch (error) {
    console.error("Error Supabase Auth:", error);
    showAccessError(
      adminAccessError,
      error?.message || "No se pudo iniciar sesión."
    );
  } finally {
    hideLoading();
  }
});


/* =========================================================
   DIRECTORIO EMPRESA
   ========================================================= */

async function loadCompanyDirectory(companyId) {
  const [
    { data: highData, error: highError },
    { data: managerData, error: managerError },
    { data: relationData, error: relationError }
  ] = await Promise.all([
    supabaseClient
      .from("alta_direccion")
      .select("id,empresa_id,tipo_cargo,titularidad,cargo_original,nombre,celular,correo,activo")
      .eq("empresa_id", companyId)
      .eq("activo", true)
      .order("id"),

    supabaseClient
      .from("gerentes_funcionales")
      .select("id,empresa_id,titularidad,cargo,nombre,celular,correo,activo")
      .eq("empresa_id", companyId)
      .eq("activo", true)
      .order("nombre"),

    supabaseClient
      .from("gerente_aspecto")
      .select("id,gerente_id,aspecto_id,activo")
      .eq("activo", true)
  ]);

  if (highError) throw highError;
  if (managerError) throw managerError;
  if (relationError) throw relationError;

  highManagement = {
    president:
      (highData || []).find(
        x => x.tipo_cargo === "PRESIDENTE_DIRECTORIO" && x.cargo_original !== "Director"
      ) || null,
    generalManager:
      (highData || []).find(x => x.tipo_cargo === "GERENTE_GENERAL") || null,
    directors:
      (highData || []).filter(x => x.cargo_original === "Director")
  };

  const managerIds = new Set((managerData || []).map(x => Number(x.id)));
  const relations = (relationData || []).filter(
    x => managerIds.has(Number(x.gerente_id))
  );

  managers = (managerData || []).map(manager => ({
    ...manager,
    aspectIds: relations
      .filter(rel => Number(rel.gerente_id) === Number(manager.id))
      .map(rel => Number(rel.aspecto_id))
  }));

  fillHighManagement();
  renderManagers();
  setSaveStatus("Directorio cargado correctamente.", "success");
}

function fillHighManagement() {
  presidentName.value = highManagement.president?.nombre || "";
  presidentPhone.value = highManagement.president?.celular || "";
  presidentEmail.value = highManagement.president?.correo || "";
  generalManagerName.value = highManagement.generalManager?.nombre || "";
  generalManagerPhone.value = highManagement.generalManager?.celular || "";
  generalManagerEmail.value = highManagement.generalManager?.correo || "";

  directorsBody.innerHTML = (highManagement.directors || []).map(director => `
    <tr data-director-id="${director.id}">
      <td class="role-cell">${escapeHtml(director.cargo_original || "Director")}</td>
      <td><input type="text" class="director-name" value="${escapeHtml(director.nombre || "")}" /></td>
      <td><input type="tel" class="director-phone" value="${escapeHtml(director.celular || "")}" /></td>
      <td><input type="email" class="director-email" value="${escapeHtml(director.correo || "")}" /></td>
    </tr>
  `).join("");
}

async function saveHighManagement() {
  if (!currentCompany) throw new Error("No hay empresa activa.");

  const records = [];

  if (!isSubsidiaryWithoutPresident(currentCompany)) {
    records.push({
      key: "president",
      tipo_cargo: "PRESIDENTE_DIRECTORIO",
      cargo_original: "Presidente de Directorio",
      nombre: presidentName.value.trim(),
      celular: presidentPhone.value.trim(),
      correo: normalizeEmail(presidentEmail.value)
    });
  }

  records.push({
    key: "generalManager",
    tipo_cargo: "GERENTE_GENERAL",
    cargo_original: "Gerente General",
    nombre: generalManagerName.value.trim(),
    celular: generalManagerPhone.value.trim(),
    correo: normalizeEmail(generalManagerEmail.value)
  });

  for (const record of records) {
    const existing = highManagement[record.key];
    if (!existing?.id && !record.nombre && !record.correo && !record.celular) continue;

    if (existing?.id) {
      const { data, error } = await supabaseClient
        .from("alta_direccion")
        .update({
          nombre: record.nombre,
          celular: record.celular,
          correo: record.correo,
          activo: true
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      highManagement[record.key] = data;

    } else {
      const { data, error } = await supabaseClient
        .from("alta_direccion")
        .insert({
          empresa_id: currentCompany.id,
          tipo_cargo: record.tipo_cargo,
          titularidad: "",
          cargo_original: record.cargo_original,
          nombre: record.nombre,
          celular: record.celular,
          correo: record.correo,
          activo: true
        })
        .select()
        .single();

      if (error) throw error;
      highManagement[record.key] = data;
    }
  }

  const directorRows = [...directorsBody.querySelectorAll("tr[data-director-id]")];

  for (const row of directorRows) {
    const { error } = await supabaseClient
      .from("alta_direccion")
      .update({
        nombre: row.querySelector(".director-name").value.trim(),
        celular: row.querySelector(".director-phone").value.trim(),
        correo: normalizeEmail(row.querySelector(".director-email").value),
        activo: true
      })
      .eq("id", row.dataset.directorId);

    if (error) throw error;
  }
}


/* =========================================================
   GERENTES FUNCIONALES
   ========================================================= */

function renderManagers() {
  managerTableBody.innerHTML = "";

  const visible = managers;
  if (!visible.length) {
    managerTableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="6">
          Todavía no hay gerentes en el listado. Use «Agregar gerente» para registrar uno.
        </td>
      </tr>`;
    return;
  }

  visible.forEach(manager => {
    const assignedAspects = manager.aspectIds
      .map(id => getAspectById(id))
      .filter(Boolean)
      .sort((a,b) => Number(a.orden) - Number(b.orden));

    const row = document.createElement("tr");

    row.innerHTML = `
      <td><strong>${escapeHtml(manager.nombre)}</strong></td>
      <td>${escapeHtml(manager.cargo)}</td>
      <td>${escapeHtml(manager.correo || "Sin correo")}</td>
      <td>${escapeHtml(manager.celular || "Sin celular")}</td>
      <td>
        ${
          assignedAspects.length
            ? assignedAspects.map(aspect => `
              <span class="tag">
                <span class="tag-code">${escapeHtml(aspect.codigo)}</span>
                ${escapeHtml(aspect.nombre)}
              </span>
            `).join("")
            : '<span class="tag">Sin aspecto asignado</span>'
        }
      </td>
      <td>
        <div class="row-actions">
          <button class="row-action" type="button" data-action="edit" data-id="${manager.id}" aria-label="Editar a ${escapeHtml(manager.nombre)}" title="Editar">Editar</button>
          <button class="row-action delete" type="button" data-action="deactivate" data-id="${manager.id}" aria-label="Eliminar a ${escapeHtml(manager.nombre)} del listado" title="Eliminar del listado"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg>Eliminar</button>
        </div>
      </td>`;

    managerTableBody.appendChild(row);
  });
}

function openManagerDialog(manager = null) {
  clearAccessError(document.getElementById("managerFormError"));
  document.getElementById("dialogTitle").textContent =
    manager ? "Editar gerente" : "Agregar gerente";

  document.getElementById("managerId").value = manager?.id || "";
  document.getElementById("managerName").value = manager?.nombre || "";
  document.getElementById("managerRole").value = manager?.cargo || "";
  document.getElementById("managerEmail").value = manager?.correo || "";
  document.getElementById("managerPhone").value = manager?.celular || "";

  const selectedIds = new Set((manager?.aspectIds || []).map(Number));

  document.getElementById("topicsContainer").innerHTML = aspects
    .slice()
    .sort((a,b) => Number(a.orden) - Number(b.orden))
    .map(aspect => `
      <label class="topic-option">
        <input
          type="checkbox"
          value="${aspect.id}"
          ${selectedIds.has(Number(aspect.id)) ? "checked" : ""} />
        <span>
          <span class="topic-option-code">${escapeHtml(aspect.codigo)}</span>
          ${escapeHtml(aspect.nombre)}
        </span>
      </label>
    `).join("");

  updateTopicCount();
  managerFormSnapshot = getManagerFormSnapshot();
  managerDialog.showModal();
}

function getManagerFormSnapshot() {
  return JSON.stringify([...managerForm.querySelectorAll("input")].map(input => [input.id || input.value, input.type === "checkbox" ? input.checked : input.value]));
}

function closeManagerDialog() {
  if (managerSaving) return;
  if (getManagerFormSnapshot() !== managerFormSnapshot && !window.confirm("Tiene cambios en esta ficha sin guardar. ¿Desea descartarlos?")) return;
  managerDialog.close();
}

managerDialog.addEventListener("cancel", event => { event.preventDefault(); closeManagerDialog(); });

async function saveManager(managerPayload, aspectIds) {
  let savedManager;

  if (managerPayload.id) {
    const { data, error } = await supabaseClient
      .from("gerentes_funcionales")
      .update({
        nombre: managerPayload.nombre,
        cargo: managerPayload.cargo,
        correo: managerPayload.correo,
        celular: managerPayload.celular,
        activo: true
      })
      .eq("id", managerPayload.id)
      .select()
      .single();

    if (error) throw error;
    savedManager = data;

  } else {
    const { data, error } = await supabaseClient
      .from("gerentes_funcionales")
      .insert({
        empresa_id: currentCompany.id,
        titularidad: "Designado",
        cargo: managerPayload.cargo,
        nombre: managerPayload.nombre,
        celular: managerPayload.celular,
        correo: managerPayload.correo,
        activo: true
      })
      .select()
      .single();

    if (error) throw error;
    savedManager = data;
  }

  // Preserve the created ID if saving its aspects fails, so retry updates it.
  document.getElementById("managerId").value = savedManager.id;
  const { error: deleteError } = await supabaseClient
    .from("gerente_aspecto")
    .delete()
    .eq("gerente_id", savedManager.id);

  if (deleteError) throw deleteError;

  if (aspectIds.length) {
    const { error } = await supabaseClient
      .from("gerente_aspecto")
      .insert(
        aspectIds.map(aspectId => ({
          gerente_id: savedManager.id,
          aspecto_id: Number(aspectId),
          activo: true
        }))
      );

    if (error) throw error;
  }

  return {
    ...savedManager,
    aspectIds: aspectIds.map(Number)
  };
}

async function deactivateManager(managerId) {
  const { error } = await supabaseClient
    .from("gerentes_funcionales")
    .update({ activo: false })
    .eq("id", managerId);

  if (error) throw error;

  const { error: relationError } = await supabaseClient
    .from("gerente_aspecto")
    .update({ activo: false })
    .eq("gerente_id", managerId);

  if (relationError) throw relationError;
}


/* =========================================================
   AUDITORÍA / REVISIÓN
   ========================================================= */

async function tryRegisterAudit({
  entidadTipo,
  entidadId,
  accion,
  detalle
}) {
  if (!currentCompany || !currentAssistant || saveReviewBtn.disabled) return;

  try {
    await supabaseClient
      .from("auditoria_directorio")
      .insert({
        empresa_id: currentCompany.id,
        entidad_tipo: entidadTipo,
        entidad_id: entidadId || null,
        accion,
        detalle,
        usuario_nombre: currentAssistant.nombre,
        usuario_correo:
          normalizeEmail(currentAssistant.correo),
        created_at: new Date().toISOString()
      });

  } catch (error) {
    console.warn("Auditoría no registrada:", error);
  }
}

async function registerReview() {
  if (!currentCompany || !currentAssistant || saveReviewBtn.disabled) return;

  const invalid = [...document.querySelectorAll("#highManagementSection input")].find(input => !input.closest(".hidden") && !input.checkValidity());
  if (invalid) { invalid.reportValidity(); return; }

  const assignedAspectIds = new Set(
    managers.flatMap(manager => manager.aspectIds.map(Number))
  );
  const missingAspects = aspects
    .filter(aspect => !assignedAspectIds.has(Number(aspect.id)))
    .sort((a, b) => Number(a.orden) - Number(b.orden));

  if (missingAspects.length) {
    const detalle = missingAspects
      .map(aspect => `${aspect.codigo} - ${aspect.nombre}`)
      .join(", ");
    toast(`Falta asignar responsable a: ${detalle}`, "error");
    setSaveStatus(`Faltan aspectos sin responsable: ${detalle}`, "error");
    return;
  }

  showLoading("Guardando...");
  saveReviewBtn.disabled = true;

  try {
    await saveHighManagement();

    const nowIso = new Date().toISOString();

    const { error } = await supabaseClient
      .from("revisiones_directorio")
      .insert({
        empresa_id: currentCompany.id,
        nombre_revisor: currentAssistant.nombre,
        correo_revisor:
          normalizeEmail(currentAssistant.correo),
        fecha_revision: nowIso
      });

    if (error) throw error;

    try {
      await supabaseClient
        .from("asistentes_empresas")
        .update({ ultima_validacion: nowIso })
        .eq("id", currentAssistant.id);
    } catch (error) {
      console.warn("No se pudo actualizar ultima_validacion:", error);
    }

    await tryRegisterAudit({
      entidadTipo: "directorio",
      entidadId: null,
      accion: "confirmar",
      detalle: `Revisión registrada por ${currentAssistant.nombre}`
    });

    setSaveStatus(
      `Guardado correctamente: ${new Date().toLocaleString("es-PE")}`,
      "success"
    );

    toast("Cambios guardados correctamente.");

  } catch (error) {
    console.error(error);
    setSaveStatus("No se pudieron guardar los cambios.", "error");
    toast(
      error?.message || "No se pudo guardar.",
      "error"
    );
  } finally {
    saveReviewBtn.disabled = false;
    hideLoading();
  }
}


/* =========================================================
   EVENTOS EMPRESA
   ========================================================= */

document
  .getElementById("addManagerBtn")
  .addEventListener("click", () => openManagerDialog());

document
  .getElementById("closeDialogBtn")
  .addEventListener("click", closeManagerDialog);

document
  .getElementById("cancelDialogBtn")
  .addEventListener("click", closeManagerDialog);

managerTableBody.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const managerId = Number(button.dataset.id);
  const manager = managers.find(
    item => Number(item.id) === managerId
  );

  if (!manager) return;

  if (button.dataset.action === "edit") {
    openManagerDialog(manager);
    return;
  }

  if (button.dataset.action === "deactivate") {
    if (!window.confirm(`¿Eliminar a ${manager.nombre} del listado de su empresa?\n\nDejará de aparecer entre los gerentes actuales. Su registro se conservará en el historial de administración.`)) return;

    showLoading("Eliminando del listado...");

    try {
      await deactivateManager(manager.id);

      managers = managers.filter(
        item => Number(item.id) !== Number(manager.id)
      );

      renderManagers();

      await tryRegisterAudit({
        entidadTipo: "gerente_funcional",
        entidadId: manager.id,
        accion: "desactivar",
        detalle: manager.nombre
      });

      setSaveStatus(
        "Hay cambios pendientes de confirmar.",
        "pending"
      );

      toast("Gerente eliminado del listado.");

    } catch (error) {
      console.error(error);
      toast("No se pudo eliminar del listado. Intente nuevamente.", "error");
    } finally {
      hideLoading();
    }
  }
});

managerForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (managerSaving || !managerForm.reportValidity()) return;
  const formError = document.getElementById("managerFormError");
  clearAccessError(formError);
  const selectedAspectIds = [
    ...document.querySelectorAll("#topicsContainer input:checked")
  ].map(input => Number(input.value));

  if (!selectedAspectIds.length) {
    showAccessError(formError, "Seleccione al menos un aspecto a cargo.");
    document.querySelector("#topicsContainer input")?.focus();
    return;
  }

  const managerId =
    Number(document.getElementById("managerId").value) || null;

  const payload = {
    id: managerId,
    nombre: document.getElementById("managerName").value.trim(),
    cargo: document.getElementById("managerRole").value.trim(),
    correo: normalizeEmail(
      document.getElementById("managerEmail").value
    ),
    celular: document.getElementById("managerPhone").value.trim()
  };

  if (!payload.nombre || !payload.cargo) { toast("Complete el nombre y el cargo.", "error"); return; }
  const originalManager = managers.find(item => Number(item.id) === managerId);
  if (normalizeEmail(originalManager?.correo) !== payload.correo && managers.some(item => Number(item.id) !== managerId && normalizeEmail(item.correo) === payload.correo)) {
    showAccessError(formError, "Ya existe un gerente con este correo. Edite su ficha para agregarle más aspectos.");
    document.getElementById("managerEmail").focus();
    return;
  }
  managerSaving = true;
  managerForm.querySelector('[type="submit"]').disabled = true;
  showLoading(
    managerId ? "Actualizando gerente..." : "Agregando gerente..."
  );

  try {
    const saved = await saveManager(
      payload,
      selectedAspectIds
    );
    const existingIndex = managers.findIndex(item => Number(item.id) === Number(saved.id));

    if (existingIndex >= 0) {
      managers[existingIndex] = saved;
    } else {
      managers.push(saved);
    }

    managers.sort(
      (a,b) =>
        String(a.nombre).localeCompare(
          String(b.nombre),
          "es"
        )
    );

    renderManagers();

    await tryRegisterAudit({
      entidadTipo: "gerente_funcional",
      entidadId: saved.id,
      accion: managerId ? "editar" : "crear",
      detalle: saved.nombre
    });

    managerDialog.close();
    managerForm.reset();

    setSaveStatus(
      "Hay cambios pendientes de confirmar.",
      "pending"
    );

    toast(
      managerId
        ? "Gerente actualizado."
        : "Gerente agregado."
    );

  } catch (error) {
    console.error(error);
    showAccessError(document.getElementById("managerFormError"), "No se completó el guardado. Mantuvimos los datos de la ficha; vuelva a intentarlo.");
    toast(
      error?.message || "No se pudo guardar el gerente.",
      "error"
    );
  } finally {
    managerSaving = false;
    managerForm.querySelector('[type="submit"]').disabled = false;
    hideLoading();
  }
});

saveReviewBtn.addEventListener("click", registerReview);
document.getElementById("highManagementSection").addEventListener("input", () => setSaveStatus("Tiene cambios sin guardar.", "pending"));
window.addEventListener("beforeunload", event => { if (hasUnsavedChanges || (managerDialog.open && getManagerFormSnapshot() !== managerFormSnapshot)) { event.preventDefault(); event.returnValue = ""; } });

document
  .getElementById("companyLogoutBtn")
  .addEventListener("click", async () => {
    if (hasUnsavedChanges && !confirm("Hay cambios pendientes. ¿Desea salir sin confirmar?")) return;
    hasUnsavedChanges = false;
    currentAssistant = null;
    currentCompany = null;
    managers = [];
    highManagement = {
      president: null,
      generalManager: null,
      directors: []
    };
    directorsBody.innerHTML = "";

    distriluzGroupCompanies = [];
    companySwitcher.classList.add("hidden");
    companySwitchSelect.innerHTML = "";

    accessEmail.value = "";
    accessCompany.value = "";

    showAccessView("company");
  });

companySwitchSelect.addEventListener("change", async () => {
  const selectedId = Number(companySwitchSelect.value);

  const selectedCompany = distriluzGroupCompanies.find(
    item => Number(item.id) === selectedId
  );

  if (!selectedCompany || Number(selectedCompany.id) === Number(currentCompany?.id)) {
    return;
  }

  const previousCompany = currentCompany;
  if (hasUnsavedChanges && !confirm("Hay cambios pendientes. ¿Desea cambiar de empresa sin confirmar?")) { companySwitchSelect.value = String(previousCompany.id); return; }

  showLoading("Cargando información...");

  try {
    await loadCompanyDirectory(selectedCompany.id);
    currentCompany = selectedCompany;
    sessionCompanyName.textContent = currentCompany.nombre;
    applyCompanyRules(currentCompany);
  } catch (error) {
    console.error(error);
    companySwitchSelect.value = String(previousCompany.id);
    toast("No se pudo cargar el directorio de la empresa seleccionada.", "error");
  } finally {
    hideLoading();
  }
});


/* =========================================================
   ADMIN CONSOLIDADO
   NO incluye asistentes_empresas.
   ========================================================= */

async function loadAdminData() {
  if (adminLoading) return;
  adminLoading = true;
  document.getElementById("adminRefreshBtn").disabled = true;
  showLoading("Cargando directorio consolidado...");

  try {
    const [
      { data: companyData, error: companyError },
      { data: highData, error: highError },
      { data: managerData, error: managerError },
      { data: relationData, error: relationError },
      { data: aspectData, error: aspectError }
    ] = await Promise.all([
      supabaseClient
        .from("empresas")
        .select("id,nombre,activo")
        .order("nombre"),

      supabaseClient
        .from("alta_direccion")
        .select("id,empresa_id,tipo_cargo,cargo_original,nombre,celular,correo,activo"),

      supabaseClient
        .from("gerentes_funcionales")
        .select("id,empresa_id,cargo,nombre,celular,correo,activo"),

      supabaseClient
        .from("gerente_aspecto")
        .select("gerente_id,aspecto_id,activo"),

      supabaseClient
        .from("aspectos")
        .select("id,codigo,nombre,orden,activo")
        .order("orden")
    ]);

    if (companyError) throw companyError;
    if (highError) throw highError;
    if (managerError) throw managerError;
    if (relationError) throw relationError;
    if (aspectError) throw aspectError;

    adminCompanies = companyData || [];
    aspects = normalizeAspectNames(aspectData || []);

    const relations = relationData || [];

    const highRows = (highData || []).map(item => ({
      id: `AD-${item.id}`,
      empresa_id: item.empresa_id,
      empresa: getCompanyName(item.empresa_id),
      tipo: "ALTA_DIRECCION",
      tipoCargo: item.cargo_original === "Director" ? "DIRECTOR" : item.tipo_cargo,
      aspectIds: [],
      tipoLabel: item.cargo_original === "Director" ? "Director" :
        item.tipo_cargo === "PRESIDENTE_DIRECTORIO"
          ? "Presidente del Directorio"
          : "Gerente General",
      nombre: item.nombre || "",
      cargo: item.cargo_original || item.tipo_cargo || "",
      correo: item.correo || "",
      celular: item.celular || "",
      aspectos: "",
      activo: item.activo !== false
    }));

    const managerRows = (managerData || []).map(item => {
      const aspectNames = relations
        .filter(
          rel =>
            rel.activo !== false &&
            Number(rel.gerente_id) === Number(item.id)
        )
        .map(
          rel =>
            aspects.find(
              a => Number(a.id) === Number(rel.aspecto_id)
            )
        )
        .filter(Boolean)
        .sort(
          (a,b) =>
            Number(a.orden) - Number(b.orden)
        )
        .map(
          a => `${a.codigo} - ${a.nombre}`
        )
        .join(", ");

      return {
        id: `GF-${item.id}`,
        empresa_id: item.empresa_id,
        empresa: getCompanyName(item.empresa_id),
        tipo: "GERENTE_FUNCIONAL",
        tipoLabel: "Gerente funcional",
        nombre: item.nombre || "",
        cargo: item.cargo || "",
        correo: item.correo || "",
        celular: item.celular || "",
        aspectos: aspectNames,
        aspectIds: relations.filter(rel => rel.activo !== false && Number(rel.gerente_id) === Number(item.id)).map(rel => Number(rel.aspecto_id)),
        activo: item.activo !== false
      };
    });

    adminRows = [
      ...highRows,
      ...managerRows
    ];

    document.getElementById("metricCompanies").textContent =
      adminCompanies.filter(x => x.activo !== false).length;

    document.getElementById("metricHigh").textContent =
      highRows.filter(x => x.activo).length;

    document.getElementById("metricManagers").textContent =
      managerRows.filter(x => x.activo).length;

    const previousFilter = adminCompanyFilter.value;
    adminCompanyFilter.innerHTML =
      '<option value="">Todas las empresas</option>';

    adminCompanies.forEach(company => {
      const option = document.createElement("option");
      option.value = company.id;
      option.textContent = company.nombre;
      adminCompanyFilter.appendChild(option);
    });

    adminCompanyFilter.value = previousFilter;
    const aspectFilter = document.getElementById("adminAspectFilter");
    const previousAspect = aspectFilter.value;
    aspectFilter.innerHTML = '<option value="">Todos los aspectos</option>' + aspects.map(aspect => `<option value="${Number(aspect.id)}">${escapeHtml(aspect.codigo)} · ${escapeHtml(aspect.nombre)}</option>`).join("");
    aspectFilter.value = previousAspect;
    renderAdminTable();

  } catch (error) {
    console.error(error);

    toast(
      error?.message ||
        "No se pudo cargar la vista Administrador.",
      "error"
    );

    throw error;

  } finally {
    adminLoading = false;
    document.getElementById("adminRefreshBtn").disabled = false;
    hideLoading();
  }
}

function getFilteredAdminRows() {
  const companyId =
    Number(adminCompanyFilter.value) || null;


  const term =
    normalizeName(adminSearch.value);

  const aspectId = document.getElementById("adminAspectFilter").value;
  return adminRows.filter(row => {
    if (
      companyId &&
      Number(row.empresa_id) !== companyId
    ) {
      return false;
    }

    if (aspectId && !(row.aspectIds || []).includes(Number(aspectId))) return false;

    if (term) {
      const haystack = normalizeName([
        row.empresa,
        row.tipoLabel,
        row.nombre,
        row.cargo,
        row.correo,
        row.celular,
        row.aspectos
      ].join(" "));

      if (!haystack.includes(term)) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => String(a[adminSort.key]).localeCompare(String(b[adminSort.key]), "es", { numeric: true, sensitivity: "base" }) * adminSort.direction || a.id.localeCompare(b.id));
}

function renderAdminTable(resetPage = true) {
  if (resetPage !== false) adminPage = 1;
  const filtered = getFilteredAdminRows();
  const pages = Math.max(1, Math.ceil(filtered.length / adminPageSize));
  adminPage = Math.min(adminPage, pages);
  const offset = (adminPage - 1) * adminPageSize;
  document.querySelectorAll("[data-sort]").forEach(button => {
    const selected = button.dataset.sort === adminSort.key;
    button.parentElement.setAttribute("aria-sort", selected ? (adminSort.direction === 1 ? "ascending" : "descending") : "none");
    button.querySelector("span").textContent = selected ? (adminSort.direction === 1 ? "↑" : "↓") : "↕";
  });
  document.getElementById("adminResultCount").textContent = `${filtered.length} de ${adminRows.length} registros`;
  document.getElementById("adminPageInfo").textContent = filtered.length ? `${offset + 1}–${Math.min(offset + adminPageSize, filtered.length)} · Página ${adminPage} de ${pages}` : "Sin resultados";
  document.getElementById("adminPrevPage").disabled = adminPage <= 1;
  document.getElementById("adminNextPage").disabled = adminPage >= pages;
  document.getElementById("adminExcelBtn").disabled = !filtered.length;
  adminTableBody.innerHTML = filtered.length ? "" : '<tr class="empty-row"><td colspan="5"><strong>No encontramos coincidencias</strong><p>Pruebe otra búsqueda o limpie los filtros.</p></td></tr>';
  filtered.slice(offset, offset + adminPageSize).forEach(row => {
    const tr = document.createElement("tr");
    const email = row.correo ? `<a href="mailto:${escapeHtml(encodeURIComponent(row.correo))}">${escapeHtml(row.correo)}</a>` : '<span class="cell-muted">Sin correo</span>';
    const phone = row.celular ? `<span>${escapeHtml(row.celular)}</span>` : '<span class="cell-muted">Sin celular</span>';
    tr.innerHTML = `
      <td data-label="Empresa"><strong>${escapeHtml(row.empresa || "Sin empresa")}</strong></td>
      <td data-label="Participante"><div class="cell-stack"><strong>${escapeHtml(row.nombre || "Sin nombre registrado")}</strong><span>${escapeHtml(row.cargo || "Sin cargo")}</span><span class="admin-type ${row.tipo === "ALTA_DIRECCION" ? "high" : "manager"}">${escapeHtml(row.tipoLabel)}</span></div></td>
      <td data-label="Contacto"><div class="cell-stack">${email}${phone}</div></td>
      <td data-label="Aspectos">${row.aspectos ? `<details class="aspect-details"><summary>Ver aspectos</summary><p>${escapeHtml(row.aspectos)}</p></details>` : '<span class="cell-muted">' + (row.tipo === "ALTA_DIRECCION" ? "No aplica" : "Sin asignar") + '</span>'}</td>
      <td data-label="Estado"><span class="admin-status ${row.activo ? "" : "inactive"}">${row.activo ? "Activo" : "Inactivo"}</span></td>`;
    adminTableBody.appendChild(tr);
  });
}

[adminCompanyFilter, document.getElementById("adminAspectFilter")].forEach(el => el.addEventListener("change", renderAdminTable));
adminSearch.addEventListener("input", renderAdminTable);
document.getElementById("clearFiltersBtn").addEventListener("click", () => {
  [adminCompanyFilter, adminSearch, document.getElementById("adminAspectFilter")].forEach(el => el.value = "");
  renderAdminTable();
});
document.querySelectorAll("[data-sort]").forEach(button => button.addEventListener("click", () => {
  adminSort = { key: button.dataset.sort, direction: adminSort.key === button.dataset.sort ? -adminSort.direction : 1 };
  renderAdminTable();
}));
document.getElementById("adminPageSize").addEventListener("change", event => { adminPageSize = Number(event.target.value); renderAdminTable(); });
function moveAdminPage(delta) {
  adminPage += delta;
  renderAdminTable(false);
  document.getElementById("adminResultCount").scrollIntoView({ block: "start" });
}
document.getElementById("adminPrevPage").addEventListener("click", () => moveAdminPage(-1));
document.getElementById("adminNextPage").addEventListener("click", () => moveAdminPage(1));

document
  .getElementById("adminRefreshBtn")
  .addEventListener("click", () => loadAdminData().catch(() => {}));

document
  .getElementById("adminExcelBtn")
  .addEventListener("click", () => {
    if (!window.XLSX) { toast("No se pudo cargar Excel. Verifique su conexión y recargue la página.", "error"); return; }
    const rows = [
      [
        "Empresa",
        "Tipo",
        "Nombre",
        "Cargo",
        "Correo",
        "Celular",
        "Aspectos",
        "Estado"
      ],
      ...getFilteredAdminRows().map(row => [
        row.empresa,
        row.tipoLabel,
        row.nombre,
        row.cargo,
        row.correo,
        row.celular,
        row.aspectos,
        row.activo ? "Activo" : "Inactivo"
      ])
    ];

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(rows),
      "Directorio consolidado"
    );

    XLSX.writeFile(
      wb,
      "Directorio_Consolidado_FONAFE.xlsx"
    );
  });

document
  .getElementById("adminLogoutBtn")
  .addEventListener("click", async () => {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
    } catch (error) { toast("No se pudo cerrar la sesión. Intente nuevamente.", "error"); return; }
    adminRows = [];
    adminTableBody.innerHTML = "";
    [adminCompanyFilter, adminSearch, document.getElementById("adminAspectFilter")].forEach(el => el.value = "");
    adminPassword.value = "";

    showAccessView("admin");
    await loadInitialData();
  });


/* =========================================================
   RESTAURAR SESIÓN ADMIN
   ========================================================= */

async function restoreAdminSession() {
  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  const email =
    normalizeEmail(session?.user?.email);

  if (email === ADMIN_EMAIL) {
    try {
      await loadAdminData();
      showAdminView();
      return true;
    } catch (error) {
      await supabaseClient.auth.signOut();
      return false;
    }
  }

  return false;
}


/* =========================================================
   INICIO
   ========================================================= */

(async function init() {
  if (!supabaseClient) { showAccessError(companyAccessError, "No se pudo conectar al servicio. Verifique su conexión y recargue la página."); accessCompany.innerHTML = '<option value="">Servicio no disponible</option>'; return; }
  let restored = false;
  try { restored = await restoreAdminSession(); } catch (error) { console.warn("No se pudo restaurar la sesión", error); }

  if (!restored) {
    showAccessView("company");
    await loadInitialData();
  }
})();

function labelCompanyTables() {
  document.querySelectorAll("#companyView table").forEach(table => {
    const labels = [...table.querySelectorAll("thead th")].map(th => th.textContent.trim());
    table.querySelectorAll("tbody tr").forEach(row => [...row.cells].forEach((cell, index) => {
      cell.dataset.label = labels[index];
      cell.querySelectorAll("input").forEach(input => input.setAttribute("aria-label", `${labels[index]} · ${row.cells[0].textContent.trim()}`));
    }));
  });
}
labelCompanyTables();
new MutationObserver(labelCompanyTables).observe(companyView, { childList: true, subtree: true });

function updateTopicCount() {
  const count = document.querySelectorAll('#topicsContainer input:checked').length;
  document.getElementById('selectedTopicCount').textContent = `${count} ${count === 1 ? 'aspecto seleccionado' : 'aspectos seleccionados'}`;
}
document.getElementById('topicsContainer').addEventListener('change', updateTopicCount);

