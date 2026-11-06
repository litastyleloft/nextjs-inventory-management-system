/* @ds-bundle: {"format":4,"namespace":"GildedGlow","components":[{"name":"AppShell"},{"name":"Sidebar"},{"name":"TopBar"},{"name":"PageHeader"},{"name":"StatCard"},{"name":"DataTable"},{"name":"TableToolbar"},{"name":"Pagination"},{"name":"ActionMenu"},{"name":"FormCard"},{"name":"Field"},{"name":"Input"},{"name":"Select"},{"name":"Textarea"},{"name":"Stepper"},{"name":"Card"},{"name":"Button"},{"name":"Badge"},{"name":"StatusBadge"},{"name":"Modal"},{"name":"ConfirmModal"},{"name":"Icon"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;
  var useState = React.useState, useEffect = React.useEffect, useRef = React.useRef, Fragment = React.Fragment;

  function cx() { var out = []; for (var i = 0; i < arguments.length; i++) { if (arguments[i]) out.push(arguments[i]); } return out.join(' '); }
  function omit(obj, keys) { var o = {}; for (var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k) && keys.indexOf(k) < 0) o[k] = obj[k]; } return o; }

  /* ---------- Icons: LTS Solution's own 24px stroke set ---------- */
  var ICONS = {
    dashboard: ['M4 4h7v7H4z', 'M13 4h7v4h-7z', 'M13 10h7v10h-7z', 'M4 13h7v7H4z'],
    box: ['M12 3l8 4.5v9L12 21l-8-4.5v-9z', 'M4 7.5l8 4.5 8-4.5', 'M12 12v9'],
    adjust: ['M4 4h16v16H4z', 'M7.5 12h3.5', 'M9.25 10.25v3.5', 'M13.5 12h3'],
    quote: ['M6 3h8l5 5v13H6z', 'M14 3v5h5', 'M9 13h7', 'M9 17h5'],
    cart: ['M3 4h2.2l2.2 11h10.8l2-8H6.4', { c: [9, 19, 1.4] }, { c: [17, 19, 1.4] }],
    receipt: ['M6 3h12v18l-3-2-3 2-3-2-3 2z', 'M9 8h6', 'M9 12h6', 'M9 16h3'],
    transfer: ['M4 8h15', 'M15 4l4 4-4 4', 'M20 16H5', 'M9 12l-4 4 4 4'],
    wallet: ['M4 7a2 2 0 0 1 2-2h11v4', 'M4 7v10a2 2 0 0 0 2 2h14V9H6a2 2 0 0 1-2-2z', 'M16 14h1'],
    users: [{ c: [9, 8, 3.5] }, 'M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6', 'M15.5 5.2a3 3 0 0 1 0 5.6', 'M18 14.5c1.8.7 3 2.5 3 4.5'],
    user: [{ c: [12, 8, 4] }, 'M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8'],
    truck: ['M3 6h11v10H3z', 'M14 9h4l3 3v4h-7', { c: [7, 18, 1.8] }, { c: [17, 18, 1.8] }],
    shield: ['M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z', 'M9 12l2 2 4-4'],
    warehouse: ['M3 10l9-6 9 6v10H3z', 'M8 20v-6h8v6', 'M8 17h8'],
    chart: ['M4 20h16', 'M7 16v-5', 'M12 16V7', 'M17 16v-8'],
    coin: [{ c: [12, 12, 9] }, 'M14.8 9.4c-.5-.9-1.5-1.4-2.8-1.4-1.7 0-2.9.8-2.9 2s1.2 1.7 2.9 2 2.9.8 2.9 2-1.2 2-2.9 2c-1.3 0-2.4-.5-2.9-1.4', 'M12 6.5v11'],
    globe: [{ c: [12, 12, 9] }, 'M3 12h18', 'M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3z'],
    layout: ['M4 4h16v16H4z', 'M4 9h16', 'M10 9v11'],
    settings: ['M4 6h9', 'M17 6h3', 'M4 12h3', 'M11 12h9', 'M4 18h11', 'M19 18h1', { c: [15, 6, 2] }, { c: [9, 12, 2] }, { c: [17, 18, 2] }],
    tag: ['M3 12V4h8l9 9-8 8z', { c: [7.5, 8.5, 1.3] }],
    barcode: ['M4 7V4h3', 'M17 4h3v3', 'M20 17v3h-3', 'M7 20H4v-3', 'M8 8v8', 'M11 8v8', 'M14 8v8', 'M16.5 8v8'],
    ruler: ['M3 15l12-12 6 6-12 12z', 'M7 11l2 2', 'M10 8l2 2', 'M13 5l2 2'],
    folder: ['M3 6h6l2 2h10v11H3z'],
    search: [{ c: [11, 11, 7] }, 'M20 20l-4-4'],
    plus: ['M12 5v14', 'M5 12h14'],
    minus: ['M5 12h14'],
    'chevron-right': ['M9 6l6 6-6 6'],
    'chevron-left': ['M15 6l-6 6 6 6'],
    'chevron-down': ['M6 9l6 6 6-6'],
    'chevrons-left': ['M11 6l-6 6 6 6', 'M18 6l-6 6 6 6'],
    'chevrons-right': ['M6 6l6 6-6 6', 'M13 6l6 6-6 6'],
    menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
    'panel-left': ['M4 4h16v16H4z', 'M9 4v16', 'M15.5 10l-2 2 2 2'],
    more: [{ c: [12, 5, 1.3] }, { c: [12, 12, 1.3] }, { c: [12, 19, 1.3] }],
    edit: ['M4 20h4L19 9l-4-4L4 16z', 'M13 7l4 4'],
    trash: ['M4 7h16', 'M9 7V4h6v3', 'M6 7l1 13h10l1-13', 'M10 11v6', 'M14 11v6'],
    eye: [{ c: [12, 12, 3] }, 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z'],
    x: ['M6 6l12 12', 'M18 6L6 18'],
    calendar: ['M4 6h16v14H4z', 'M4 10h16', 'M8 3v5', 'M16 3v5'],
    filter: ['M4 5h16l-6 8v6l-4-2v-4z'],
    download: ['M12 4v11', 'M7 10l5 5 5-5', 'M5 20h14'],
    upload: ['M12 20V9', 'M7 14l5-5 5 5', 'M5 4h14'],
    bell: ['M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z', 'M10 21h4'],
    expand: ['M4 9V4h5', 'M20 9V4h-5', 'M4 15v5h5', 'M20 15v5h-5'],
    'trend-up': ['M4 16l6-6 4 4 6-6', 'M15 8h5v5'],
    'trend-down': ['M4 8l6 6 4-4 6 6', 'M15 16h5v-5'],
    'return-left': ['M9 14l-5-5 5-5', 'M4 9h11a5 5 0 0 1 0 10h-3'],
    'return-right': ['M15 14l5-5-5-5', 'M20 9H9a5 5 0 0 0 0 10h3'],
    cash: ['M3 6h18v12H3z', { c: [12, 12, 2.5] }, 'M6.5 9.5v.01', 'M17.5 14.5v.01'],
    alert: ['M12 4l9 16H3z', 'M12 10v4', 'M12 17v.5'],
    check: ['M5 12l5 5 9-10'],
    image: ['M4 5h16v14H4z', { c: [9, 10, 1.5] }, 'M4 17l5-5 4 4 2-2 5 5'],
    logout: ['M15 4h4v16h-4', 'M10 8l-4 4 4 4', 'M6 12h10'],
    sort: ['M8 9l4-4 4 4', 'M8 15l4 4 4-4'],
    'sort-up': ['M8 14l4-4 4 4'],
    'sort-down': ['M8 10l4 4 4-4'],
    printer: ['M7 8V3h10v5', 'M5 8h14v8h-2', 'M7 16H5', 'M7 13h10v8H7z'],
    copy: ['M8 8h12v12H8z', 'M16 8V4H4v12h4']
  };

  function Icon(props) {
    var parts = ICONS[props.name] || ICONS.box;
    var children = parts.map(function (p, i) {
      return typeof p === 'string' ? h('path', { key: i, d: p }) : h('circle', { key: i, cx: p.c[0], cy: p.c[1], r: p.c[2] });
    });
    if (props.title) children.unshift(h('title', { key: 't' }, props.title));
    return h('svg', {
      className: cx('gg-icon', props.size === 'sm' && 'sm', props.size === 'lg' && 'lg', props.className),
      viewBox: '0 0 24 24', 'aria-hidden': props.title ? undefined : 'true', role: props.title ? 'img' : undefined, focusable: 'false'
    }, children);
  }
  Icon.names = Object.keys(ICONS);

  /* ---------- Button ---------- */
  function Button(props) {
    var variant = props.variant || 'primary', size = props.size || 'md';
    var iconOnly = props.icon && (props.children == null || props.children === '');
    var rest = omit(props, ['variant', 'size', 'icon', 'iconRight', 'loading', 'className', 'children', 'type', 'tone']);
    return h('button', Object.assign({
      type: props.type || 'button',
      className: cx('gg-btn', 'gg-btn-' + variant, size !== 'md' && size, iconOnly && 'icon-only', props.tone === 'danger' && 'danger', props.className),
      'aria-busy': props.loading ? 'true' : undefined
    }, rest),
      props.icon ? h(Icon, { name: props.icon, size: size === 'sm' ? 'sm' : undefined }) : null,
      props.children,
      props.iconRight ? h(Icon, { name: props.iconRight, size: 'sm' }) : null);
  }

  /* ---------- Badges ---------- */
  function Badge(props) {
    return h('span', { className: cx('gg-badge', props.tone || 'neutral', props.mono && 'mono', props.className) },
      props.dot ? h('span', { className: 'gg-badge-dot', 'aria-hidden': 'true' }) : null,
      props.icon ? h(Icon, { name: props.icon, size: 'sm' }) : null,
      props.children);
  }
  var STATUS = {
    paid: ['success', 'Paid'], unpaid: ['danger', 'Unpaid'], partial: ['warning', 'Partial'],
    received: ['info', 'Received'], completed: ['success', 'Completed'], pending: ['warning', 'Pending'],
    ordered: ['neutral', 'Ordered'], draft: ['neutral', 'Draft'], sent: ['info', 'Sent'], cancelled: ['danger', 'Cancelled'],
    returned: ['neutral', 'Returned'], 'in-stock': ['success', 'In stock'], 'low-stock': ['warning', 'Low stock'], 'out-of-stock': ['danger', 'Out of stock']
  };
  function StatusBadge(props) {
    var key = String(props.status || '').toLowerCase().replace(/\s+/g, '-');
    var s = STATUS[key] || ['neutral', props.status];
    return h(Badge, { tone: s[0], dot: true, className: props.className }, props.children || s[1]);
  }
  StatusBadge.statuses = Object.keys(STATUS);

  /* ---------- Form controls ---------- */
  function Field(props) {
    return h('div', { className: cx('gg-field', props.span === 2 && 'span-2', props.className) },
      props.label ? h('label', { className: 'gg-label', htmlFor: props.htmlFor }, props.label, props.required ? h('span', { className: 'gg-req', 'aria-hidden': 'true' }, '*') : null) : null,
      props.children,
      props.error ? h('div', { className: 'gg-error', role: 'alert' }, props.error) : (props.hint ? h('div', { className: 'gg-hint' }, props.hint) : null));
  }

  function Input(props) {
    var rest = omit(props, ['icon', 'suffix', 'action', 'invalid', 'className', 'trailingIcon']);
    return h('div', { className: cx('gg-control', props.invalid && 'invalid', props.disabled && 'disabled', props.className) },
      props.icon ? h('span', { className: 'gg-lead' }, h(Icon, { name: props.icon, size: 'sm' })) : null,
      h('input', Object.assign({ 'aria-invalid': props.invalid ? 'true' : undefined }, rest)),
      props.trailingIcon ? h('span', { className: 'gg-lead', style: { paddingRight: 12, paddingLeft: 0 } }, h(Icon, { name: props.trailingIcon, size: 'sm' })) : null,
      props.suffix != null ? h('span', { className: 'gg-addon' }, props.suffix) : null,
      props.action ? h('button', { type: 'button', className: 'gg-addon btn', onClick: props.action.onClick, 'aria-label': props.action.label },
        h(Icon, { name: props.action.icon || 'plus', size: 'sm' })) : null);
  }

  function Select(props) {
    var rest = omit(props, ['options', 'placeholder', 'invalid', 'className']);
    var opts = (props.options || []).map(function (o) {
      var v = typeof o === 'object' ? o.value : o, l = typeof o === 'object' ? o.label : o;
      return h('option', { key: v, value: v }, l);
    });
    if (props.placeholder) opts.unshift(h('option', { key: '__ph', value: '', disabled: true }, props.placeholder));
    var sel = Object.assign({ 'aria-invalid': props.invalid ? 'true' : undefined }, rest);
    if (props.placeholder && sel.value === undefined && sel.defaultValue === undefined) sel.defaultValue = '';
    return h('div', { className: cx('gg-control', props.invalid && 'invalid', props.disabled && 'disabled', props.className) },
      h('select', sel, opts),
      h('span', { className: 'gg-caret' }, h(Icon, { name: 'chevron-down', size: 'sm' })));
  }

  function Textarea(props) {
    var rest = omit(props, ['invalid', 'className']);
    return h('div', { className: cx('gg-control textarea', props.invalid && 'invalid', props.className) },
      h('textarea', Object.assign({ rows: 3 }, rest)));
  }

  function Stepper(props) {
    var min = props.min != null ? props.min : 0, max = props.max != null ? props.max : Infinity, step = props.step || 1;
    var st = useState(props.defaultValue != null ? props.defaultValue : min);
    var value = props.value != null ? props.value : st[0];
    function set(v) { v = Math.max(min, Math.min(max, v)); if (props.value == null) st[1](v); if (props.onChange) props.onChange(v); }
    return h('div', { className: 'gg-stepper' },
      h('button', { type: 'button', 'aria-label': 'Decrease', onClick: function () { set(value - step); } }, h(Icon, { name: 'minus', size: 'sm' })),
      h('input', { value: value, inputMode: 'numeric', 'aria-label': props.label || 'Quantity', onChange: function (e) { var n = parseInt(e.target.value, 10); set(isNaN(n) ? min : n); } }),
      h('button', { type: 'button', 'aria-label': 'Increase', onClick: function () { set(value + step); } }, h(Icon, { name: 'plus', size: 'sm' })));
  }

  /* ---------- Cards ---------- */
  function Card(props) {
    var head = props.title || props.actions;
    return h('section', { className: cx('gg-card', props.className), style: props.style },
      head ? h('div', { className: 'gg-card-head' },
        h('div', null, props.title ? h('h2', { className: 'gg-card-title' }, props.title) : null,
          props.subtitle ? h('p', { className: 'gg-card-sub' }, props.subtitle) : null),
        props.actions ? h('div', { className: 'gg-row' }, props.actions) : null) : null,
      props.padded === false ? props.children : h('div', { className: 'gg-card-body' }, props.children),
      props.footer ? h('div', { className: 'gg-card-foot' }, props.footer) : null);
  }

  function FormCard(props) {
    var cols = props.columns || 2;
    function submit(e) { e.preventDefault(); if (props.onSubmit) props.onSubmit(e); }
    return h('form', { className: cx('gg-card', props.className), onSubmit: submit, noValidate: true },
      props.title ? h('div', { className: 'gg-card-head' }, h('div', null, h('h2', { className: 'gg-card-title' }, props.title),
        props.subtitle ? h('p', { className: 'gg-card-sub' }, props.subtitle) : null)) : null,
      h('div', { className: 'gg-card-body' }, h('div', { className: cx('gg-form-grid', cols === 3 && 'cols-3') }, props.children)),
      props.hideFooter ? null : h('div', { className: 'gg-card-foot' },
        props.extraActions || null,
        h(Button, { variant: 'secondary', onClick: props.onCancel }, props.cancelLabel || 'Cancel'),
        h(Button, { type: 'submit', loading: props.submitting, disabled: props.submitDisabled }, props.submitLabel || 'Save')));
  }
  FormCard.Section = function FormSection(props) { return h('div', { className: 'gg-form-section' }, props.children); };

  function StatCard(props) {
    var tone = props.tone || 'navy', variant = props.variant || 'strong';
    var dir = props.trend || (props.delta && String(props.delta).trim().charAt(0) === '-' ? 'down' : 'up');
    return h('div', { className: cx('gg-stat', variant, tone, props.className) },
      props.icon ? h('div', { className: 'gg-stat-icon' }, h(Icon, { name: props.icon, size: 'lg' })) : null,
      h('div', { className: 'gg-stat-body' },
        h('div', { className: 'gg-stat-label' }, props.label),
        h('div', { className: 'gg-stat-value' }, props.value),
        props.delta ? h('div', { className: cx('gg-stat-delta', dir) }, props.delta) : null));
  }
  StatCard.Grid = function StatGrid(props) { return h('div', { className: 'gg-stat-grid', style: props.columns ? { gridTemplateColumns: 'repeat(' + props.columns + ', minmax(0, 1fr))' } : undefined }, props.children); };

  /* ---------- Menus ---------- */
  function useOutside(ref, open, close) {
    useEffect(function () {
      if (!open) return;
      function onDown(e) { if (ref.current && !ref.current.contains(e.target)) close(); }
      function onKey(e) { if (e.key === 'Escape') close(); }
      document.addEventListener('mousedown', onDown); document.addEventListener('keydown', onKey);
      return function () { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
    }, [open]);
  }

  function ActionMenu(props) {
    var st = useState(!!props.defaultOpen), open = st[0], setOpen = st[1];
    var ref = useRef(null);
    useOutside(ref, open, function () { setOpen(false); });
    var trigger = props.trigger
      ? h('span', { onClick: function () { setOpen(!open); } }, props.trigger)
      : h(Button, { variant: 'ghost', size: 'sm', icon: 'more', 'aria-label': props.label || 'Row actions', 'aria-haspopup': 'menu', 'aria-expanded': open, onClick: function () { setOpen(!open); } });
    return h('div', { className: 'gg-menu-anchor', ref: ref },
      trigger,
      open ? h('div', { className: cx('gg-menu', props.placement === 'up' && 'up'), role: 'menu' },
        (props.items || []).map(function (it, i) {
          if (it === 'separator') return h('div', { key: i, className: 'gg-menu-sep', role: 'separator' });
          return h('button', { key: i, type: 'button', role: 'menuitem', className: cx('gg-menu-item', it.danger && 'danger'),
            onClick: function () { setOpen(false); if (it.onClick) it.onClick(); } },
            it.icon ? h(Icon, { name: it.icon, size: 'sm' }) : null, it.label);
        })) : null);
  }

  /* ---------- Table ---------- */
  function Pagination(props) {
    var page = props.page || 1, size = props.pageSize || 10, total = props.total || 0;
    var pages = Math.max(1, Math.ceil(total / size));
    var from = total ? (page - 1) * size + 1 : 0, to = Math.min(total, page * size);
    function go(p) { if (props.onPageChange) props.onPageChange(Math.max(1, Math.min(pages, p))); }
    var nums = [], start = Math.max(1, Math.min(page - 2, pages - 4)), end = Math.min(pages, start + 4);
    for (var p = start; p <= end; p++) nums.push(p);
    return h('div', { className: 'gg-pager' },
      h('div', { className: 'gg-pager-size' }, 'Rows per page',
        h(Select, { 'aria-label': 'Rows per page', value: size, options: props.pageSizeOptions || [10, 25, 50, 100],
          onChange: function (e) { if (props.onPageSizeChange) props.onPageSizeChange(parseInt(e.target.value, 10)); } }),
        h('span', { className: 'gg-num', style: { marginLeft: 8 } }, from + '–' + to + ' of ' + total)),
      h('nav', { className: 'gg-pager-pages', 'aria-label': 'Pagination' },
        h('button', { className: 'gg-page', disabled: page <= 1, onClick: function () { go(1); }, 'aria-label': 'First page' }, h(Icon, { name: 'chevrons-left', size: 'sm' })),
        h('button', { className: 'gg-page', disabled: page <= 1, onClick: function () { go(page - 1); }, 'aria-label': 'Previous page' }, h(Icon, { name: 'chevron-left', size: 'sm' })),
        nums.map(function (n) { return h('button', { key: n, className: cx('gg-page', n === page && 'active'), 'aria-current': n === page ? 'page' : undefined, onClick: function () { go(n); } }, n); }),
        h('button', { className: 'gg-page', disabled: page >= pages, onClick: function () { go(page + 1); }, 'aria-label': 'Next page' }, h(Icon, { name: 'chevron-right', size: 'sm' })),
        h('button', { className: 'gg-page', disabled: page >= pages, onClick: function () { go(pages); }, 'aria-label': 'Last page' }, h(Icon, { name: 'chevrons-right', size: 'sm' }))));
  }

  function TableToolbar(props) {
    return h('div', { className: 'gg-table-toolbar' },
      h('div', { className: 'gg-row', style: { flex: 1 } },
        props.title ? h('h2', { className: 'gg-card-title', style: { marginRight: 8 } }, props.title) : null,
        props.onSearch !== false ? h('div', { style: { width: 320 } }, h(Input, { icon: 'search', placeholder: props.searchPlaceholder || 'Search', 'aria-label': 'Search table', value: props.onSearch ? props.search : undefined, onChange: props.onSearch ? function (e) { props.onSearch(e.target.value); } : undefined })) : null,
        props.filters || null),
      h('div', { className: 'gg-row' }, props.children));
  }

  function DataTable(props) {
    var cols = props.columns || [], rows = props.rows || [];
    var keyOf = typeof props.rowKey === 'function' ? props.rowKey : function (r, i) { return r[props.rowKey || 'id'] != null ? r[props.rowKey || 'id'] : i; };
    var sortSt = useState(props.defaultSort || null), sort = sortSt[0];
    var selSt = useState([]), sel = selSt[0];
    var pageSt = useState(1), sizeSt = useState(props.pageSize || 10);
    var paged = props.paginate !== false && !props.serverPagination;
    var data = rows.slice();
    if (sort) {
      var col = cols.filter(function (c) { return c.key === sort.key; })[0];
      var get = col && col.sortValue ? col.sortValue : function (r) { return r[sort.key]; };
      data.sort(function (a, b) { var x = get(a), y = get(b); return (x > y ? 1 : x < y ? -1 : 0) * (sort.dir === 'desc' ? -1 : 1); });
    }
    var total = props.serverPagination ? props.serverPagination.total : data.length;
    var page = props.serverPagination ? props.serverPagination.page : pageSt[0];
    var size = props.serverPagination ? props.serverPagination.pageSize : sizeSt[0];
    if (paged) data = data.slice((page - 1) * size, page * size);
    function toggleSort(c) {
      if (!c.sortable) return;
      sortSt[1](sort && sort.key === c.key ? (sort.dir === 'asc' ? { key: c.key, dir: 'desc' } : null) : { key: c.key, dir: 'asc' });
    }
    function toggleRow(k) { selSt[1](sel.indexOf(k) >= 0 ? sel.filter(function (x) { return x !== k; }) : sel.concat([k])); }
    var allKeys = data.map(keyOf), allOn = allKeys.length && allKeys.every(function (k) { return sel.indexOf(k) >= 0; });
    var hasActions = !!props.rowActions;

    var thead = h('thead', null, h('tr', null,
      props.selectable ? h('th', { style: { width: 48 } }, h('input', { type: 'checkbox', className: 'gg-check', 'aria-label': 'Select all rows', checked: !!allOn, onChange: function () { selSt[1](allOn ? [] : allKeys); } })) : null,
      cols.map(function (c) {
        var s = sort && sort.key === c.key ? sort.dir : null;
        return h('th', { key: c.key, className: cx(c.align, c.sortable && 'sortable'), style: c.width ? { width: c.width } : undefined,
          'aria-sort': s ? (s === 'asc' ? 'ascending' : 'descending') : undefined, onClick: function () { toggleSort(c); } },
          c.header, c.sortable ? h('span', { className: 'gg-sort' }, h(Icon, { name: s === 'asc' ? 'sort-up' : s === 'desc' ? 'sort-down' : 'sort', size: 'sm' })) : null);
      }),
      hasActions ? h('th', { className: 'gg-actions-cell right' }, h('span', { className: 'gg-sr' }, 'Actions')) : null));

    var body = data.length ? data.map(function (r, i) {
      var k = keyOf(r, i), on = sel.indexOf(k) >= 0;
      return h('tr', { key: k, className: cx(on && 'selected'), onClick: props.onRowClick ? function () { props.onRowClick(r); } : undefined, style: props.onRowClick ? { cursor: 'pointer' } : undefined },
        props.selectable ? h('td', null, h('input', { type: 'checkbox', className: 'gg-check', 'aria-label': 'Select row', checked: on, onChange: function () { toggleRow(k); }, onClick: function (e) { e.stopPropagation(); } })) : null,
        cols.map(function (c) { return h('td', { key: c.key, className: cx(c.align, c.primary && 'primary') }, c.render ? c.render(r) : r[c.key]); }),
        hasActions ? h('td', { className: 'gg-actions-cell right', onClick: function (e) { e.stopPropagation(); } },
          h(ActionMenu, { items: props.rowActions(r), placement: i >= data.length - 2 && data.length > 3 ? 'up' : 'down' })) : null);
    }) : [h('tr', { key: 'empty' }, h('td', { colSpan: cols.length + (props.selectable ? 1 : 0) + (hasActions ? 1 : 0), className: 'gg-empty' }, props.empty || 'No records yet.'))];

    var foot = props.footerRow ? h('tfoot', null, h('tr', null,
      props.selectable ? h('td') : null,
      cols.map(function (c) { return h('td', { key: c.key, className: c.align }, props.footerRow[c.key] != null ? props.footerRow[c.key] : null); }),
      hasActions ? h('td') : null)) : null;

    return h('div', { className: cx('gg-table-card', props.className) },
      props.toolbar || null,
      h('div', { className: 'gg-table-wrap', style: !props.toolbar ? { borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' } : undefined },
        h('table', { className: cx('gg-table', props.compact && 'compact'), style: !props.toolbar ? { marginTop: -1 } : undefined }, thead, h('tbody', null, body), foot)),
      paged || props.serverPagination ? h(Pagination, {
        page: page, pageSize: size, total: total,
        onPageChange: props.serverPagination ? props.serverPagination.onPageChange : pageSt[1],
        onPageSizeChange: props.serverPagination ? props.serverPagination.onPageSizeChange : function (n) { sizeSt[1](n); pageSt[1](1); }
      }) : null);
  }

  /* ---------- Modal ---------- */
  function Modal(props) {
    useEffect(function () {
      if (!props.open || props.inline) return;
      function onKey(e) { if (e.key === 'Escape' && props.onClose) props.onClose(); }
      document.addEventListener('keydown', onKey);
      return function () { document.removeEventListener('keydown', onKey); };
    }, [props.open]);
    if (!props.open) return null;
    return h('div', { className: cx('gg-scrim', props.inline && 'inline'), onMouseDown: function (e) { if (e.target === e.currentTarget && props.onClose) props.onClose(); } },
      h('div', { className: cx('gg-modal', props.size), role: 'dialog', 'aria-modal': 'true', 'aria-label': props.title },
        h('div', { className: 'gg-modal-head' }, h('h2', { className: 'gg-modal-title' }, props.title),
          h(Button, { variant: 'ghost', size: 'sm', icon: 'x', 'aria-label': 'Close', onClick: props.onClose })),
        h('div', { className: 'gg-modal-body' }, props.children),
        props.footer ? h('div', { className: 'gg-modal-foot' }, props.footer) : null));
  }

  function ConfirmModal(props) {
    return h(Modal, { open: props.open, inline: props.inline, title: props.title || 'Delete record?', size: 'sm', onClose: props.onClose,
      footer: h(Fragment, null, h(Button, { variant: 'secondary', onClick: props.onClose }, props.cancelLabel || 'Cancel'),
        h(Button, { variant: props.tone === 'primary' ? 'primary' : 'danger', onClick: props.onConfirm }, props.confirmLabel || 'Delete')) },
      h('div', { className: 'gg-modal-confirm' },
        h('div', { className: 'gg-stat-icon' }, h(Icon, { name: props.icon || 'trash' })),
        h('div', { style: { color: 'var(--ink-2)' } }, props.children || props.message)));
  }

  /* ---------- Navigation ---------- */
  var NAV = [
    { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { section: 'Inventory' },
    { key: 'products', label: 'Products', icon: 'box', children: [
      { key: 'products.list', label: 'Products' }, { key: 'products.categories', label: 'Product Categories' },
      { key: 'products.units', label: 'Units' },
      { key: 'products.base-units', label: 'Base Units' }, { key: 'products.barcode', label: 'Print Barcode' }] },
    { key: 'adjustments', label: 'Adjustments', icon: 'adjust' },
    { key: 'transfers', label: 'Transfers', icon: 'transfer' },
    { key: 'warehouse', label: 'Warehouses', icon: 'warehouse' },
    { section: 'Trading' },
    { key: 'quotations', label: 'Quotations', icon: 'quote' },
    { key: 'purchases', label: 'Purchases', icon: 'cart', children: [{ key: 'purchases.list', label: 'Purchases' }, { key: 'purchases.returns', label: 'Purchase Returns' }] },
    { key: 'sales', label: 'Sales', icon: 'receipt', children: [{ key: 'sales.list', label: 'Sales' }, { key: 'sales.returns', label: 'Sales Returns' }, { key: 'sales.billing-notes', label: 'Billing Notes' }] },
    { key: 'expenses', label: 'Expenses', icon: 'wallet', children: [{ key: 'expenses.list', label: 'Expenses' }, { key: 'expenses.categories', label: 'Expense Categories' }] },
    { section: 'People' },
    { key: 'people', label: 'People', icon: 'users', children: [{ key: 'people.suppliers', label: 'Suppliers' }, { key: 'people.customers', label: 'Customers' }, { key: 'people.users', label: 'Users' }] },
    { key: 'roles', label: 'Roles & Permissions', icon: 'shield' },
    { section: 'Insights & Setup' },
    { key: 'reports', label: 'Reports', icon: 'chart' },
    { key: 'currencies', label: 'Currencies', icon: 'coin' },
    { key: 'languages', label: 'Languages', icon: 'globe' },
    { key: 'templates', label: 'Templates', icon: 'layout', children: [{ key: 'templates.email', label: 'Email Templates' }, { key: 'templates.sms', label: 'SMS Templates' }] },
    { key: 'settings', label: 'Settings', icon: 'settings' }
  ];

  function Sidebar(props) {
    var items = props.items || NAV, active = props.activeKey || 'dashboard';
    var collapsed = !!props.collapsed;
    var initial = {};
    items.forEach(function (it) { if (it.children && it.children.some(function (c) { return c.key === active; })) initial[it.key] = true; });
    var openSt = useState(initial), open = openSt[0];
    function nav(it) { if (props.onNavigate) props.onNavigate(it.key, it); }
    var brand = props.brand || {};
    return h('aside', { className: cx('gg-sidebar', collapsed && 'collapsed', props.static && 'static'), 'aria-label': 'Main navigation' },
      h('div', { className: 'gg-brand' },
        h('div', { className: 'gg-brand-mark' }, brand.logo ? h('img', { src: brand.logo, alt: '' }) : 'L'),
        h('div', { className: 'gg-brand-name' }, brand.name || h(Fragment, null, 'LTS ', h('b', null, 'Solution')))),
      h('nav', { className: 'gg-nav' }, items.map(function (it, i) {
        if (it.section) return h('div', { key: 's' + i, className: 'gg-nav-label' }, it.section);
        var kids = it.children, isOpen = !!open[it.key];
        var childActive = kids && kids.some(function (c) { return c.key === active; });
        return h(Fragment, { key: it.key },
          h('button', { type: 'button', className: cx('gg-nav-item', it.key === active && 'active', childActive && 'child-active', childActive && isOpen && 'open-parent'),
            title: collapsed ? it.label : undefined, 'aria-current': it.key === active ? 'page' : undefined,
            'aria-expanded': kids ? isOpen : undefined,
            onClick: function () {
              if (kids && !collapsed) { var n = Object.assign({}, open); n[it.key] = !isOpen; openSt[1](n); }
              else if (kids && collapsed) { nav(kids[0]); }
              else nav(it);
            } },
            h(Icon, { name: it.icon }), h('span', { className: 'gg-nav-text' }, it.label),
            it.count != null ? h('span', { className: 'gg-nav-count' }, it.count) : null,
            kids ? h(Icon, { name: 'chevron-right', size: 'sm', className: 'gg-chev' }) : null),
          kids && isOpen ? h('div', { className: 'gg-subnav' }, kids.map(function (c) {
            return h('button', { key: c.key, type: 'button', className: cx('gg-nav-item', c.key === active && 'active'), 'aria-current': c.key === active ? 'page' : undefined, onClick: function () { nav(c); } },
              h('span', { className: 'gg-nav-text' }, c.label));
          })) : null);
      })),
      props.footer ? h('div', { className: 'gg-sidebar-foot' }, props.footer) : null);
  }
  Sidebar.defaultItems = NAV;

  function TopBar(props) {
    var user = props.user || { name: 'Admin', role: 'Owner' };
    var initials = user.initials || String(user.name || 'A').split(/\s+/).map(function (s) { return s.charAt(0); }).join('').slice(0, 2).toUpperCase();
    var crumbs = props.crumbs || [];
    return h('header', { className: cx('gg-topbar', props.static && 'static') },
      h(Button, { variant: 'ghost', icon: props.collapsed ? 'menu' : 'panel-left', 'aria-label': props.collapsed ? 'Expand sidebar' : 'Collapse sidebar', onClick: props.onToggleSidebar }),
      crumbs.length ? h('nav', { className: 'gg-crumbs', 'aria-label': 'Breadcrumb' }, crumbs.map(function (c, i) {
        var last = i === crumbs.length - 1;
        return h(Fragment, { key: i }, i ? h(Icon, { name: 'chevron-right', size: 'sm' }) : null, h('span', { className: last ? 'current' : undefined, 'aria-current': last ? 'page' : undefined }, c));
      })) : null,
      props.onSearch !== false ? h('div', { className: 'gg-topbar-search' },
        h('div', { className: 'gg-control' }, h('span', { className: 'gg-lead' }, h(Icon, { name: 'search', size: 'sm' })),
          h('input', { placeholder: props.searchPlaceholder || 'Search products, sales, customers', 'aria-label': 'Global search', onChange: props.onSearch ? function (e) { props.onSearch(e.target.value); } : undefined }),
          h('span', { className: 'gg-kbd' }, '/'))) : null,
      h('div', { className: 'gg-topbar-end' },
        props.actions || null,
        h(Button, { variant: 'gold', className: 'gg-pos', icon: 'barcode', onClick: props.onPos }, 'POS'),
        h(Button, { variant: 'ghost', icon: 'expand', 'aria-label': 'Full screen', onClick: props.onFullscreen }),
        h('span', { className: 'gg-iconbtn-wrap' }, h(Button, { variant: 'ghost', icon: 'bell', 'aria-label': 'Notifications', onClick: props.onNotifications }),
          props.unread ? h('span', { className: 'gg-iconbtn-dot', 'aria-hidden': 'true' }) : null),
        h('span', { className: 'gg-divider-v', 'aria-hidden': 'true' }),
        h(ActionMenu, {
          trigger: h('button', { type: 'button', className: 'gg-user', 'aria-haspopup': 'menu' },
            h('span', { className: 'gg-avatar' }, initials),
            h('span', null, h('div', { className: 'gg-user-name' }, user.name), h('div', { className: 'gg-user-role' }, user.role)),
            h(Icon, { name: 'chevron-down', size: 'sm' })),
          items: props.userMenu || [{ label: 'My profile', icon: 'user' }, { label: 'Settings', icon: 'settings' }, 'separator', { label: 'Log out', icon: 'logout', danger: true }]
        })));
  }

  function PageHeader(props) {
    return h('div', { className: 'gg-pagehead' },
      h('div', null, h('h1', { className: 'gg-pagehead-title' }, props.title),
        props.subtitle ? h('p', { className: 'gg-pagehead-sub' }, props.subtitle) : null),
      h('div', { className: 'gg-pagehead-actions' },
        props.actions || null,
        props.onBack ? h(Button, { variant: 'secondary', icon: 'chevron-left', onClick: props.onBack }, props.backLabel || 'Back') : null));
  }

  function AppShell(props) {
    var colSt = useState(!!props.defaultCollapsed);
    var collapsed = props.collapsed != null ? props.collapsed : colSt[0];
    function toggle() { if (props.onCollapsedChange) props.onCollapsedChange(!collapsed); if (props.collapsed == null) colSt[1](!collapsed); }
    var year = props.year || new Date().getFullYear();
    return h('div', { className: cx('gg', 'gg-shell', props.static && 'static') },
      h(Sidebar, { items: props.nav, activeKey: props.activeKey, onNavigate: props.onNavigate, collapsed: collapsed, brand: props.brand, static: props.static }),
      h('div', { className: 'gg-shell-main' },
        h(TopBar, Object.assign({ collapsed: collapsed, onToggleSidebar: toggle, crumbs: props.crumbs, user: props.user, static: props.static }, props.topBar || {})),
        h('main', { className: 'gg-shell-content' }, props.children),
        props.footer === false ? null : h('footer', { className: 'gg-shell-foot' },
          props.footer || h(Fragment, null, h('span', null, '© ' + year + ' ', h('a', { href: '#' }, 'LTS Solution'), '. All rights reserved.'), h('span', null, 'Inventory & POS')))));
  }

  var api = {
    AppShell: AppShell, Sidebar: Sidebar, TopBar: TopBar, PageHeader: PageHeader, StatCard: StatCard,
    DataTable: DataTable, TableToolbar: TableToolbar, Pagination: Pagination, ActionMenu: ActionMenu,
    FormCard: FormCard, Field: Field, Input: Input, Select: Select, Textarea: Textarea, Stepper: Stepper,
    Card: Card, Button: Button, Badge: Badge, StatusBadge: StatusBadge, Modal: Modal, ConfirmModal: ConfirmModal, Icon: Icon
  };
  window.GildedGlow = Object.assign(window.GildedGlow || {}, api);
})();
