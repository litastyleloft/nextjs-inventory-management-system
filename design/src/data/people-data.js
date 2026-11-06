/* ===== LTS Solution · suppliers, customers and users (needs sales-data) ===== */
(function () {
  var D = window.LTS;
  var SUPPLIERS = [
    { id: 'S1', name: 'ทอผ้าริมน้ำ จำกัด', email: 'sales@rimnamweaving.example', phone: '034-412-889', country: 'ไทย', city: 'นครปฐม', address: '120 หมู่ 4 ต.ไร่ขิง อ.สามพราน', taxId: '0735561002345', created: '2024-02-02T06:16', purchases: 4, spent: 182450 },
    { id: 'S2', name: 'นอร์ทเกต นิตติ้ง จำกัด', email: 'order@northgateknit.example', phone: '02-813-2240', country: 'ไทย', city: 'สมุทรปราการ', address: '55/8 ถ.เทพารักษ์ ต.บางพลีใหญ่', taxId: '0115559004121', created: '2024-03-11T10:20', purchases: 2, spent: 96800 },
    { id: 'S3', name: 'ซันฟิลด์ เดนิม จำกัด', email: 'denim@sunfield.example', phone: '02-907-5511', country: 'ไทย', city: 'ปทุมธานี', address: '9 ถ.พหลโยธิน ต.คลองหนึ่ง อ.คลองหลวง', taxId: '0135560007781', created: '2024-05-27T14:02', purchases: 3, spent: 214000 },
    { id: 'S4', name: 'Shaoxing Keqiao Textile Co., Ltd.', email: 'export@kqtextile.example', phone: '+86 575 8412 3366', country: 'จีน', city: 'เซ่าซิง', address: 'China Textile City, Keqiao District, Zhejiang', taxId: '', created: '2025-01-15T09:41', purchases: 1, spent: 365000 },
    { id: 'S5', name: 'ไหมไทยโคราช', email: 'silk@korat-thaisilk.example', phone: '044-271-330', country: 'ไทย', city: 'นครราชสีมา', address: '88 ถ.มิตรภาพ ต.ในเมือง อ.เมือง', taxId: '', created: '2026-08-03T16:55', purchases: 0, spent: 0 }
  ];
  var EXTRA = {
    C1: { country: 'ไทย', city: 'กรุงเทพฯ', dob: '', created: '2025-11-04T11:52' },
    C2: { country: 'ไทย', city: 'สมุทรปราการ', dob: '', created: '2025-12-20T09:30' },
    C3: { country: 'ไทย', city: 'เชียงใหม่', dob: '1984-06-12', created: '2026-02-08T15:18', email: 'malai@malai-atelier.example' },
    C4: { country: 'ไทย', city: 'กรุงเทพฯ', dob: '', created: '2025-10-01T08:00', walkIn: true, email: 'pos@lts-solution.example', phone: '02-123-4567' },
    C5: { country: 'ไทย', city: 'ขอนแก่น', dob: '', created: '2026-09-12T10:00' },
    C6: { country: 'ไทย', city: 'สงขลา', dob: '', created: '2026-09-28T13:30' }
  };
  D.CUSTOMERS.forEach(function (c) { Object.assign(c, EXTRA[c.id] || {}); c.region = D.regionOf(c.city, c.country); });
  /* Permission catalogue, grouped the way the sidebar is */
  var PERM_GROUPS = [
    { name: 'สินค้าคงคลัง', perms: [['dashboard', 'แดชบอร์ด'], ['products', 'สินค้า'], ['product-categories', 'หมวดหมู่สินค้า'], ['units', 'หน่วยสินค้า'], ['adjustments', 'ปรับปรุงสต็อก'], ['transfers', 'โอนย้ายสินค้า'], ['warehouses', 'คลังสินค้า']] },
    { name: 'ซื้อขาย', perms: [['pos', 'หน้าจอ POS'], ['quotations', 'ใบเสนอราคา'], ['purchases', 'การซื้อ'], ['purchase-returns', 'คืนสินค้าให้ผู้จำหน่าย'], ['sales', 'การขาย'], ['sale-returns', 'รับคืนสินค้า'], ['billing-notes', 'ใบวางบิล'], ['expenses', 'ค่าใช้จ่าย'], ['expense-categories', 'หมวดหมู่ค่าใช้จ่าย']] },
    { name: 'บุคคล', perms: [['suppliers', 'ผู้จำหน่าย'], ['customers', 'ลูกค้า'], ['users', 'ผู้ใช้งาน'], ['roles', 'บทบาทและสิทธิ์']] },
    { name: 'รายงานและการตั้งค่า', perms: [['reports', 'รายงาน'], ['currencies', 'สกุลเงิน'], ['languages', 'ภาษา'], ['settings', 'ตั้งค่าระบบ'], ['email-templates', 'เทมเพลตอีเมล'], ['sms-templates', 'เทมเพลต SMS'], ['sms-apis', 'การเชื่อมต่อ SMS']] }
  ];
  var ALL_PERMS = [].concat.apply([], PERM_GROUPS.map(function (g) { return g.perms.map(function (p) { return p[0]; }); }));
  var ROLES = [
    { id: 'admin', name: 'ผู้ดูแลระบบ', tone: 'navy', system: true, created: '2025-10-01T08:00', desc: 'เข้าถึงทุกเมนู รวมถึงตั้งค่าและบทบาท', perms: ALL_PERMS.slice() },
    { id: 'manager', name: 'ผู้จัดการ', tone: 'info', created: '2025-10-02T10:15', desc: 'ดูรายงาน อนุมัติการซื้อ ขาย และโอนย้าย', perms: ALL_PERMS.filter(function (p) { return ['roles', 'settings', 'sms-apis', 'languages', 'currencies'].indexOf(p) < 0; }) },
    { id: 'sales', name: 'พนักงานขาย', tone: 'success', created: '2026-01-10T09:40', desc: 'ใช้ POS สร้างรายการขาย ใบรับคืน และใบวางบิล', perms: ['dashboard', 'products', 'pos', 'quotations', 'sales', 'sale-returns', 'billing-notes', 'customers'] },
    { id: 'stock', name: 'พนักงานคลังสินค้า', tone: 'warning', created: '2026-03-01T14:05', desc: 'จัดการสินค้า ปรับปรุงสต็อก และโอนย้ายสินค้า', perms: ['dashboard', 'products', 'product-categories', 'units', 'adjustments', 'transfers', 'warehouses', 'purchases', 'purchase-returns', 'suppliers'] }
  ];
  D.PERM_GROUPS = PERM_GROUPS; D.ALL_PERMS = ALL_PERMS;

  var USERS = [
    { id: 'U1', first: 'แอดมิน', last: 'ระบบ', email: 'admin@lts-solution.example', phone: '081-000-1111', role: 'admin', created: '2025-10-01T08:00', self: true, last_login: '2026-10-30T15:58' },
    { id: 'U2', first: 'สมชาย', last: 'ใจดี', email: 'somchai@lts-solution.example', phone: '089-555-1234', role: 'manager', created: '2025-10-03T19:27', last_login: '2026-10-30T09:12' },
    { id: 'U3', first: 'วนิดา', last: 'ศรีสุข', email: 'wanida@lts-solution.example', phone: '086-223-4410', role: 'sales', created: '2026-01-15T10:05', last_login: '2026-10-29T17:40' },
    { id: 'U4', first: 'ประเสริฐ', last: 'ทองมา', email: 'prasert@lts-solution.example', phone: '092-781-6650', role: 'stock', created: '2026-03-02T13:44', last_login: '2026-10-28T08:15' },
    { id: 'U5', first: 'กมลชนก', last: 'แก้วใส', email: 'kamon@lts-solution.example', phone: '095-114-7720', role: 'sales', created: '2026-09-21T11:30', last_login: '' }
  ];
  function initials(name) { var p = String(name).replace(/^(บริษัท|ห้างหุ้นส่วน|ร้าน)\s*/, '').trim().split(/\s+/); return (ch(p[0]) + (p[1] ? ch(p[1]) : ch((p[0] || '').replace(/^[\u0E40-\u0E44]/, '').slice(1)))).toUpperCase(); }
  /* first letter for an avatar, skipping Thai leading vowels (เ แ โ ใ ไ) */
  function ch(s) { return String(s || '').replace(/^[\u0E40-\u0E44]/, '').charAt(0); }
  D.ch = ch;
  D.SUPPLIERS = SUPPLIERS; D.ROLES = ROLES; D.USERS = USERS; D.initials = initials;
  D.role = function (id) { return ROLES.filter(function (r) { return r.id === id; })[0]; };
  /* customer sales stats from the shared sales sample */
  D.custStats = function (c) {
    var s = D.SALES.filter(function (x) { return x.customer === c.id; }), g = s.reduce(function (a, x) { return a + D.totals(x).grand; }, 0), p = s.reduce(function (a, x) { return a + D.paidOf(x); }, 0);
    return { count: s.length, total: D.r2(g), due: D.r2(g - p) };
  };
})();
