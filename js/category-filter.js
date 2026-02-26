"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// Category group definitions
// Each entry maps to a slice of treeData.children via its URL structure.
// ─────────────────────────────────────────────────────────────────────────────
const FILTER_GROUPS = [
  { id: "all", label: "All Pages" },

  { divider: true },

  // Product categories  ( /c/<seg2>/... )
  { id: "bricks", label: "Bricks", seg2: "bricks" },
  {
    id: "rooftiles",
    label: "Roof Tiles & Fittings",
    seg2: "roof-tiles-fittings",
  },
  { id: "hardscape", label: "Hard Landscaping", seg2: "hard-landscaping" },
  { id: "flooring", label: "Flooring", seg2: "flooring" },
  { id: "timber", label: "Timber & Joinery", seg2: "timber-joinery" },
  {
    id: "interior",
    label: "Interior & Exterior",
    seg2: "interior-exterior-products",
  },
  { id: "reclaimed", label: "Reclaimed Sale", seg2: "reclaimed-items-sale" },

  { divider: true },

  // Top-level URL segment groups
  { id: "products", label: "Products", seg1: "p" },
  { id: "brands", label: "Brands", seg1: "brands" },
  { id: "blog", label: "Blog & Articles", seg1: "category" },

  { divider: true },

  { id: "utility", label: "Utility Pages", utility: true },
];

const KNOWN_SEGS = new Set(["c", "p", "brands", "category"]);

// ─────────────────────────────────────────────────────────────────────────────
// Matching helpers
// ─────────────────────────────────────────────────────────────────────────────
function pathParts(node, rootUrl) {
  const url = node.display_url || node.node_name || "";
  return url.replace(rootUrl, "").replace(/^\//, "").split("/");
}

function buildMatcher(group, rootUrl) {
  if (group.id === "all") return () => true;
  if (group.seg1) return (n) => pathParts(n, rootUrl)[0] === group.seg1;
  if (group.seg2)
    return (n) => {
      const p = pathParts(n, rootUrl);
      return p[0] === "c" && p[1] === group.seg2;
    };
  if (group.utility) return (n) => !KNOWN_SEGS.has(pathParts(n, rootUrl)[0]);
  return () => false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter and re-render the chart
// ─────────────────────────────────────────────────────────────────────────────
function applyFilter(matcher) {
  const allChildren = treeData.children || treeData._children || [];
  const filtered = allChildren.filter(matcher);
  const subset = Object.assign({}, treeData, {
    children: filtered,
    _children: null,
  });
  chart.run(subset);
}

// ─────────────────────────────────────────────────────────────────────────────
// Build the sidebar panel
// ─────────────────────────────────────────────────────────────────────────────
function buildCategoryPanel() {
  const rootUrl = treeData.node_name;
  const allChildren = treeData.children || treeData._children || [];
  let activeBtn = null;

  // ── Toggle button (always visible) ──────────────────────────────────────
  const toggle = document.createElement("button");
  toggle.id = "cat-toggle";
  toggle.innerHTML = "&#9776;&nbsp;&nbsp;Categories";
  toggle.addEventListener("click", () => panel.classList.add("open"));
  document.body.appendChild(toggle);

  // ── Panel ────────────────────────────────────────────────────────────────
  const panel = document.createElement("div");
  panel.id = "cat-panel";

  // Header
  const header = document.createElement("div");
  header.className = "cat-header";
  header.innerHTML = "<span>Filter by Category</span>";
  const closeBtn = document.createElement("button");
  closeBtn.className = "cat-close";
  closeBtn.innerHTML = "&times;";
  closeBtn.title = "Close panel";
  closeBtn.addEventListener("click", () => panel.classList.remove("open"));
  header.appendChild(closeBtn);
  panel.appendChild(header);

  // Scrollable list
  const list = document.createElement("div");
  list.className = "cat-list";
  panel.appendChild(list);

  // ── Render each group entry ──────────────────────────────────────────────
  FILTER_GROUPS.forEach((group) => {
    if (group.divider) {
      const d = document.createElement("div");
      d.className = "cat-divider";
      list.appendChild(d);
      return;
    }

    const matcher = buildMatcher(group, rootUrl);
    const count = allChildren.filter(matcher).length;
    if (count === 0) return; // hide empty groups

    const btn = document.createElement("button");
    btn.className = "cat-btn";
    btn.dataset.catId = group.id;
    btn.innerHTML =
      `<span class="cat-label">${group.label}</span>` +
      `<span class="cat-count">${count}</span>`;

    btn.addEventListener("click", () => {
      if (activeBtn) activeBtn.classList.remove("active");
      btn.classList.add("active");
      activeBtn = btn;
      panel.classList.remove("open"); // auto-close on selection
      applyFilter(matcher);
    });

    list.appendChild(btn);

    if (group.id === "all") {
      btn.classList.add("active");
      activeBtn = btn;
    }
  });

  document.body.appendChild(panel);
}

// ─────────────────────────────────────────────────────────────────────────────
// Boot — build panel, then run chart with the full tree
// ─────────────────────────────────────────────────────────────────────────────
buildCategoryPanel();
chart.run(treeData);
