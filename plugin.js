(function initCssToAsePlugin() {
  const core = window.CssToAseCore;
  const statusEl = document.getElementById("status");
  const itemListEl = document.getElementById("itemList");
  const resultsEl = document.getElementById("results");
  const convertBtn = document.getElementById("convertBtn");
  const refreshBtn = document.getElementById("refreshBtn");
  const closeBtn = document.getElementById("closeBtn");

  let selectedItems = [];

  function setStatus(message) {
    statusEl.textContent = message;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function previewSwatchCount(filePath) {
    try {
      if (!core || typeof core.previewCssFile !== "function") {
        return null;
      }
      return core.previewCssFile(filePath);
    } catch {
      return null;
    }
  }

  function renderItems(items) {
    if (!items.length) {
      itemListEl.innerHTML = '<div class="empty">Select one or more `.css` palette files in Eagle, then click Refresh selection.</div>';
      convertBtn.disabled = true;
      setStatus("No CSS files selected.");
      return;
    }

    convertBtn.disabled = false;
    setStatus(`${items.length} CSS file${items.length === 1 ? "" : "s"} ready to convert.`);

    itemListEl.innerHTML = items.map((item) => {
      const count = previewSwatchCount(item.filePath);
      const countLabel = Number.isFinite(count)
        ? `${count} swatch${count === 1 ? "" : "es"}`
        : "Could not preview swatch count";
      return `
        <article class="item-card">
          <strong>${escapeHtml(item.name || "CSS palette")}</strong>
          <span>${escapeHtml(item.filePath || "")}</span>
          <span>${escapeHtml(countLabel)}</span>
        </article>
      `;
    }).join("");
  }

  async function loadSelection() {
    if (!window.eagle || !eagle.item || typeof eagle.item.getSelected !== "function") {
      selectedItems = [];
      renderItems(selectedItems);
      setStatus("Eagle item API is unavailable.");
      return;
    }

    const items = await eagle.item.getSelected();
    selectedItems = (Array.isArray(items) ? items : []).filter((item) => {
      const ext = String(item.ext || "").toLowerCase();
      return ext === "css" && item.filePath;
    });
    renderItems(selectedItems);
  }

  async function findExistingAseItem(outPath) {
    if (!window.eagle || !eagle.item || typeof eagle.item.get !== "function") {
      return null;
    }
    const matches = await eagle.item.get({ ext: "ase" });
    const list = Array.isArray(matches) ? matches : [];
    return list.find((entry) => entry.filePath === outPath) || null;
  }

  async function importAse(outPath, sourceItem, paletteName) {
    if (!window.eagle || !eagle.item) return null;

    const existing = await findExistingAseItem(outPath);
    if (existing && typeof existing.replaceFile === "function") {
      await existing.replaceFile(outPath);
      if (typeof existing.save === "function") {
        existing.name = paletteName;
        await existing.save();
      }
      return existing.id;
    }

    if (typeof eagle.item.addFromPath !== "function") {
      return null;
    }

    return eagle.item.addFromPath(outPath, {
      name: paletteName,
      folders: Array.isArray(sourceItem.folders) ? sourceItem.folders : [],
      tags: Array.isArray(sourceItem.tags) ? sourceItem.tags : [],
      annotation: `Converted from ${sourceItem.name || "CSS palette"}`
    });
  }

  function renderResults(rows) {
    resultsEl.classList.remove("hidden");
    resultsEl.innerHTML = rows.map((row) => `
      <div class="result-row ${row.ok ? "ok" : "error"}">
        <strong>${escapeHtml(row.title)}</strong>
        <span>${escapeHtml(row.detail)}</span>
      </div>
    `).join("");
  }

  async function convertSelected() {
    if (!selectedItems.length) {
      await loadSelection();
      if (!selectedItems.length) return;
    }

    convertBtn.disabled = true;
    refreshBtn.disabled = true;
    setStatus("Converting...");

    const rows = [];
    if (!core || typeof core.convertCssFile !== "function") {
      setStatus("Converter failed to load. Restart Eagle and try again.");
      convertBtn.disabled = false;
      refreshBtn.disabled = false;
      return;
    }

    for (const item of selectedItems) {
      try {
        const result = core.convertCssFile({ cssPath: item.filePath });
        const itemId = await importAse(result.outPath, item, result.paletteName);
        rows.push({
          ok: true,
          title: item.name || result.paletteName,
          detail: `Wrote ${result.outPath} (${result.swatchCount} swatches)${itemId ? ` · imported as ${itemId}` : ""}`
        });
      } catch (error) {
        rows.push({
          ok: false,
          title: item.name || item.filePath,
          detail: error.message || String(error)
        });
      }
    }

    renderResults(rows);
    const failures = rows.filter((row) => !row.ok).length;
    setStatus(
      failures === 0
        ? `Converted ${rows.length} file${rows.length === 1 ? "" : "s"}.`
        : `Converted ${rows.length - failures} of ${rows.length} files.`
    );

    convertBtn.disabled = false;
    refreshBtn.disabled = false;
  }

  async function closePlugin() {
    if (window.eagle && eagle.window && typeof eagle.window.hide === "function") {
      await eagle.window.hide();
    }
  }

  refreshBtn.addEventListener("click", () => {
    loadSelection();
  });
  convertBtn.addEventListener("click", () => {
    convertSelected();
  });
  closeBtn.addEventListener("click", () => {
    closePlugin();
  });

  if (!core) {
    setStatus("Converter failed to load. Restart Eagle and try again.");
    convertBtn.disabled = true;
    refreshBtn.disabled = true;
    return;
  }

  if (window.eagle && typeof eagle.onPluginCreate === "function") {
    eagle.onPluginCreate(async () => {
      await loadSelection();
    });
  } else {
    loadSelection();
  }

  if (window.eagle && typeof eagle.onPluginShow === "function") {
    eagle.onPluginShow(async () => {
      await loadSelection();
    });
  }
})();
