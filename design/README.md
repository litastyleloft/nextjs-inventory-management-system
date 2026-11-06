# LTS Solution: editable pages

There are two ways to edit the pages, depending on how big the change is.

## 1. Quick edits: change the HTML file directly

Every page in `html/` is a complete standalone file. Open one in any editor (VS Code, Notepad++, even Notepad), change it, save it, and refresh the browser.

Each file has the same structure:

| Part of the file | Where to find it |
|---|---|
| Design tokens (colours, fonts, spacing) | the first `:root { … }` block in `<style>` |
| Page-only styles | the end of `<style>`, after the comment `/* ===== Page composition ===== */` |
| Page content (text, tables, forms) | inside `<main class="gg-shell-content">` |
| Sample data and behaviour | the `<script>` near the end, after `/* ===== Page script ===== */` |

**Watch out:** the sidebar, top bar, colours and sample data are copied into every page. If you change them in one file, the other 30 pages stay as they were. For shared changes, use option 2.

## 2. Shared edits: change the source and rebuild

Edit the files in `src/`, then run this once (Python 3, no extra installs):

```
python3 build.py          # rebuild all 31 pages into html/
python3 build.py sales    # rebuild only pages whose name contains "sales"
```

**Warning:** a rebuild overwrites the files in `html/`. If you made quick edits there (option 1), copy them into `src/` first.

| To change… | Edit |
|---|---|
| Colours, fonts, radius, spacing for every page | `src/design-system/tokens.json` |
| Buttons, tables, badges, modals and other shared components | `src/design-system/components/bundle.css` |
| Sidebar menu items or icons | `src/design-system/components/bundle.js` (`NAV`, `ICONS`) |
| Thai menu labels, sidebar links, top bar, footer | `src/partials/shell_top.html`, `src/partials/shell_bottom.html` |
| Sample products, customers, sales, warehouses… | `src/data/*.js` |
| One page | `src/pages/<name>.page.html` |
| Suppliers, Customers, Users and Warehouses (lists and forms) | `src/pages/people-list.tpl.html` and `people-form.tpl.html` (one template drives all four) |

Each `*.page.html` file has three parts, which the build places into the shared shell:

```
===CSS===      styles for this page only
===CONTENT===  the page HTML
===JS===       the page script (/*@include sales-data*/ pastes in src/data/sales-data.js)
```

Page titles, breadcrumbs and which sidebar item is highlighted are set in the `PAGES` list in `build.py`. To add a new page, add a line there.

## Notes
- All data is sample data held in memory. Nothing is saved when the page reloads.
- Chart.js (dashboard and reports) and Google Fonts load from the internet. Everything else is inside the file.
