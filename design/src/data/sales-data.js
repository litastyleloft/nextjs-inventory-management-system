/* ===== LTS Solution · shared sample data for the Sales pages (sales, returns, billing notes) ===== */
(function () {
  function r2(x) { return Math.round(x * 100) / 100; }
  var SHORT = { meter: 'ม.', yard: 'หลา', kilogram: 'กก.', roll: 'ม้วน' }, UNIT = { meter: 'เมตร', yard: 'หลา', kilogram: 'กิโลกรัม', roll: 'ม้วน' };
  var PRODUCTS = [
    { code: 'COT58A101001', name: 'ผ้าคอตตอนป๊อปลิน 60s สีขาวออปติก', unit: 'yard', price: 78, cost: 57, stock: 2680, alert: 330, roll: 110, swatch: 'poplin' },
    { code: 'DEN58A201014', name: 'ผ้ายีนส์ยืด 10 ออนซ์ สีคราม', unit: 'yard', price: 165, cost: 128, stock: 1290, alert: 220, roll: 110, swatch: 'denim' },
    { code: 'VIS44B305022', name: 'ผ้าเรยอนพิมพ์ลายดอกไม้', unit: 'yard', price: 110, cost: 87, stock: 700, alert: 165, roll: 110, swatch: 'floral' },
    { code: 'PLY58A410012', name: 'ผ้าจอร์เจ็ตโพลีเอสเตอร์ สีกรมท่า', unit: 'yard', price: 60, cost: 44, stock: 82, alert: 110, roll: 110, swatch: 'georgette' },
    { code: 'LIN54C120003', name: 'ผ้าลินินผสมฝ้าย สีธรรมชาติ', unit: 'yard', price: 238, cost: 192, stock: 0, alert: 90, roll: 110, swatch: 'linen' },
    { code: 'KNT72A160008', name: 'ผ้ายืดซิงเกิลเจอร์ซีย์ 160 แกรม สีเทาท็อปดราย', unit: 'yard', price: 120, cost: 95, stock: 350, alert: 60, roll: 90, swatch: 'jersey' }
  ];
  var CUSTOMERS = [
    { id: 'C1', name: 'ร้านผ้าสยามแฟชั่น', initials: 'สฟ', phone: '081-234-5678', email: 'order@siamfashion.example', address: '45/12 ถนนจักรวรรดิ แขวงจักรวรรดิ เขตสัมพันธวงศ์ กรุงเทพฯ 10100', terms: 30, city: 'กรุงเทพมหานคร' },
    { id: 'C2', name: 'บริษัท ไทยการ์เมนท์ จำกัด', initials: 'ทก', phone: '02-456-7890', email: 'purchasing@thaigarment.example', address: '99 หมู่ 2 นิคมอุตสาหกรรมบางปู ต.แพรกษา อ.เมือง จ.สมุทรปราการ 10280', terms: 45, city: 'สมุทรปราการ' },
    { id: 'C3', name: 'ห้องเสื้อมาลัย', initials: 'มล', phone: '089-765-4321', email: 'malai@malai-atelier.example', address: '12 ถนนนิมมานเหมินท์ ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200', terms: 15, city: 'เชียงใหม่' },
    { id: 'C4', name: 'ลูกค้าหน้าร้าน', initials: 'หร', phone: '—', email: '—', address: 'ขายหน้าร้าน (ไม่ระบุที่อยู่)', terms: 0, city: 'กรุงเทพมหานคร' },
    { id: 'C5', name: 'ร้านผ้าขอนแก่นพาณิชย์', initials: 'ขพ', phone: '043-221-554', email: 'sales@khonkaenfabric.example', address: '210 ถนนหน้าเมือง ต.ในเมือง อ.เมือง จ.ขอนแก่น 40000', terms: 30, city: 'ขอนแก่น' },
    { id: 'C6', name: 'หาดใหญ่แฟบริค', initials: 'หฟ', phone: '074-355-120', email: 'order@hatyaifabric.example', address: '58 ถนนนิพัทธ์อุทิศ 3 อ.หาดใหญ่ จ.สงขลา 90110', terms: 30, city: 'สงขลา' }
  ];
  var COMPANY = { name: 'LTS Solution', email: 'contact@lts-solution.example', phone: '02-123-4567', address: '88 ถนนทรงวาด แขวงสัมพันธวงศ์ เขตสัมพันธวงศ์ กรุงเทพฯ 10100' };
  var WAREHOUSE = 'คลังสินค้าหลัก';

  /* Sales agents (match the Users page) and who looks after each customer */
  var AGENTS = [{ id: 'U3', name: 'วนิดา ศรีสุข' }, { id: 'U5', name: 'กมลชนก แก้วใส' }, { id: 'U2', name: 'สมชาย ใจดี' }];
  var AGENT_OF = { C1: 'U3', C2: 'U2', C3: 'U5', C4: 'U5', C5: 'U3', C6: 'U2' };
  function agent(id) { return AGENTS.filter(function (a) { return a.id === id; })[0] || { id: id, name: '—' }; }

  /* Region from a city or province name (Thai business regions) */
  var REGION_LIST = ['ภาคกลาง', 'ภาคเหนือ', 'ภาคตะวันออกเฉียงเหนือ', 'ภาคตะวันออก', 'ภาคตะวันตก', 'ภาคใต้'];
  var PROVINCES = {
    /* การแบ่ง 6 ภาค: กรุงเทพฯ และปริมณฑลนับเป็นภาคกลาง */
    'ภาคกลาง': 'กรุงเทพมหานคร กรุงเทพฯ กรุงเทพ นนทบุรี ปทุมธานี สมุทรปราการ สมุทรสาคร นครปฐม รังสิต ปากเกร็ด บางนา บางพลี มหาชัย พระนครศรีอยุธยา อยุธยา อ่างทอง ลพบุรี สิงห์บุรี ชัยนาท สระบุรี นครนายก สมุทรสงคราม สุพรรณบุรี สุโขทัย พิษณุโลก พิจิตร กำแพงเพชร เพชรบูรณ์ นครสวรรค์ อุทัยธานี',
    'ภาคเหนือ': 'เชียงใหม่ เชียงราย ลำพูน ลำปาง แพร่ น่าน พะเยา แม่ฮ่องสอน อุตรดิตถ์',
    'ภาคตะวันออกเฉียงเหนือ': 'กาฬสินธุ์ ขอนแก่น ชัยภูมิ นครพนม นครราชสีมา โคราช บึงกาฬ บุรีรัมย์ มหาสารคาม มุกดาหาร ยโสธร ร้อยเอ็ด เลย ศรีสะเกษ สกลนคร สุรินทร์ หนองคาย หนองบัวลำภู อุดรธานี อุบลราชธานี อำนาจเจริญ',
    'ภาคตะวันออก': 'ชลบุรี ระยอง จันทบุรี ตราด ฉะเชิงเทรา ปราจีนบุรี สระแก้ว พัทยา ศรีราชา',
    'ภาคตะวันตก': 'ตาก กาญจนบุรี ราชบุรี เพชรบุรี ประจวบคีรีขันธ์ หัวหิน',
    'ภาคใต้': 'ชุมพร ระนอง สุราษฎร์ธานี พังงา ภูเก็ต กระบี่ นครศรีธรรมราช ตรัง พัทลุง สตูล สงขลา หาดใหญ่ ปัตตานี ยะลา นราธิวาส เกาะสมุย'
  };
  var PROVINCE_LIST = 'กรุงเทพมหานคร กระบี่ กาญจนบุรี กาฬสินธุ์ กำแพงเพชร ขอนแก่น จันทบุรี ฉะเชิงเทรา ชลบุรี ชัยนาท ชัยภูมิ ชุมพร เชียงราย เชียงใหม่ ตรัง ตราด ตาก นครนายก นครปฐม นครพนม นครราชสีมา นครศรีธรรมราช นครสวรรค์ นนทบุรี นราธิวาส น่าน บึงกาฬ บุรีรัมย์ ปทุมธานี ประจวบคีรีขันธ์ ปราจีนบุรี ปัตตานี พระนครศรีอยุธยา พะเยา พังงา พัทลุง พิจิตร พิษณุโลก เพชรบุรี เพชรบูรณ์ แพร่ ภูเก็ต มหาสารคาม มุกดาหาร แม่ฮ่องสอน ยโสธร ยะลา ร้อยเอ็ด ระนอง ระยอง ราชบุรี ลพบุรี ลำปาง ลำพูน เลย ศรีสะเกษ สกลนคร สงขลา สตูล สมุทรปราการ สมุทรสงคราม สมุทรสาคร สระแก้ว สระบุรี สิงห์บุรี สุโขทัย สุพรรณบุรี สุราษฎร์ธานี สุรินทร์ หนองคาย หนองบัวลำภู อ่างทอง อำนาจเจริญ อุดรธานี อุตรดิตถ์ อุทัยธานี อุบลราชธานี'.split(' ');
  function regionOf(city, country) {
    if (country && country !== 'ไทย' && country !== 'ประเทศไทย') return 'ต่างประเทศ';
    var c = String(city || '').replace(/^(จังหวัด|จ\.|อำเภอ|อ\.|เขต)\s*/, '').replace(/\s+/g, '');
    if (!c) return '';
    for (var r in PROVINCES) { var names = PROVINCES[r].split(' '); for (var i = 0; i < names.length; i++) if (c === names[i] || c.indexOf(names[i]) >= 0 || (c.length >= 3 && names[i].indexOf(c) === 0)) return r; }
    return '';
  }

  function L(code, qty) { var p = product(code); return { code: code, price: p.price, disc: 0, discType: 'fixed', tax: 0, taxType: 'exclusive', qty: qty, unit: '' }; }
  /* [ref, date, customer, lines, payment: 'paid' | number paid | 0, status, method] */
  var RAW = [
    ['SA_11032', '2026-01-14T10:20', 'C1', [['COT58A101001', 150], ['VIS44B305022', 60]], 'paid', 'delivered', 'โอนผ่านธนาคาร'],
    ['SA_11048', '2026-03-02T14:05', 'C1', [['DEN58A201014', 100]], 'paid', 'delivered', 'โอนผ่านธนาคาร'],
    ['SA_11061', '2026-04-18T11:40', 'C1', [['COT58A101001', 200], ['PLY58A410012', 80]], 'paid', 'delivered', 'เงินสด'],
    ['SA_11077', '2026-06-05T09:55', 'C1', [['VIS44B305022', 90], ['LIN54C120003', 25]], 'paid', 'delivered', 'โอนผ่านธนาคาร'],
    ['SA_11086', '2026-07-11T15:30', 'C1', [['DEN58A201014', 60], ['COT58A101001', 120]], 'paid', 'delivered', 'โอนผ่านธนาคาร'],
    ['SA_11094', '2026-08-02T10:10', 'C1', [['KNT72A160008', 40], ['VIS44B305022', 70]], 'paid', 'delivered', 'โอนผ่านธนาคาร'],
    ['SA_11102', '2026-08-18T13:45', 'C1', [['COT58A101001', 180]], 'paid', 'delivered', 'เงินสด'],
    ['SA_11109', '2026-08-30T11:00', 'C1', [['DEN58A201014', 80], ['PLY58A410012', 60]], 8000, 'delivered', 'โอนผ่านธนาคาร'],
    ['SA_11117', '2026-09-14T16:20', 'C1', [['VIS44B305022', 110]], 0, 'delivered', 'เครดิต'],
    ['SA_11125', '2026-09-26T10:35', 'C1', [['COT58A101001', 100]], 0, 'delivered', 'เครดิต'],
    ['SA_11131', '2026-10-03T14:50', 'C1', [['LIN54C120003', 40], ['COT58A101001', 40]], 10000, 'delivered', 'โอนผ่านธนาคาร'],
    ['SA_11138', '2026-10-12T09:15', 'C1', [['DEN58A201014', 85], ['KNT72A160008', 10]], 0, 'delivered', 'เครดิต'],
    ['SA_11139', '2026-10-14T11:25', 'C2', [['KNT72A160008', 120]], 0, 'delivered', 'เครดิต'],
    ['SA_11140', '2026-10-16T10:41', 'C3', [['VIS44B305022', 40]], 'paid', 'delivered', 'โอนผ่านธนาคาร'],
    ['SA_11141', '2026-10-17T22:41', 'C4', [['COT58A101001', 30]], 'paid', 'delivered', 'เงินสด'],
    ['SA_11142', '2026-10-19T22:37', 'C2', [['DEN58A201014', 200], ['COT58A101001', 150]], 'paid', 'delivered', 'โอนผ่านธนาคาร'],
    ['SA_11143', '2026-10-20T22:38', 'C3', [['LIN54C120003', 15], ['PLY58A410012', 20]], 'paid', 'delivered', 'โอนผ่านธนาคาร'],
    ['SA_11144', '2026-10-22T22:38', 'C4', [['PLY58A410012', 12]], 'paid', 'delivered', 'เงินสด'],
    ['SA_11145', '2026-10-23T14:10', 'C2', [['KNT72A160008', 80]], 15000, 'delivered', 'โอนผ่านธนาคาร'],
    ['SA_11146', '2026-10-24T13:20', 'C3', [['VIS44B305022', 50], ['COT58A101001', 25]], 'paid', 'delivered', 'โอนผ่านธนาคาร'],
    ['SA_11147', '2026-10-26T11:05', 'C4', [['DEN58A201014', 10]], 'paid', 'delivered', 'เงินสด'],
    ['SA_11148', '2026-10-27T16:45', 'C2', [['COT58A101001', 300], ['VIS44B305022', 100]], 0, 'pending', 'เครดิต'],
    ['SA_11149', '2026-10-29T01:02', 'C3', [['DEN58A201014', 30], ['LIN54C120003', 10], ['KNT72A160008', 5]], 'paid', 'delivered', 'โอนผ่านธนาคาร'],
    ['SA_11150', '2026-10-30T10:30', 'C5', [['COT58A101001', 220], ['VIS44B305022', 80]], 0, 'delivered', 'เครดิต'],
    ['SA_11151', '2026-10-31T14:05', 'C6', [['DEN58A201014', 120]], 'paid', 'delivered', 'โอนผ่านธนาคาร'],
    ['SA_11152', '2026-11-02T11:15', 'C5', [['KNT72A160008', 90]], 5000, 'delivered', 'เครดิต'],
    ['SA_11153', '2026-11-03T16:40', 'C6', [['PLY58A410012', 40], ['COT58A101001', 150]], 0, 'pending', 'เครดิต'],
    ['SA_11154', '2026-11-04T10:05', 'C1', [['VIS44B305022', 60]], 0, 'delivered', 'เครดิต'],
    ['SA_11155', '2026-11-05T09:20', 'C4', [['COT58A101001', 12]], 'paid', 'delivered', 'เงินสด']
  ];
  var SALES = RAW.map(function (r) {
    var s = { ref: r[0], created: r[1], customer: r[2], lines: r[3].map(function (x) { return L(x[0], x[1]); }), orderTax: 7, discount: 0, shipping: 0, status: r[5], method: r[6], notes: '' };
    var g = totals(s).grand, paid = r[4] === 'paid' ? g : r[4];
    s.agent = AGENT_OF[s.customer] || 'U3';
    s.terms = paid >= g ? 0 : (customer(s.customer).terms || 30);
    s.payments = paid ? [{ date: r[1].slice(0, 10), amount: paid, method: r[6] === 'เครดิต' ? 'โอนผ่านธนาคาร' : r[6], note: paid >= g ? 'ชำระเต็มจำนวน' : 'ชำระบางส่วน' }] : [];
    return s;
  });
  var RETURNS = [
    ['SR_1116', '2026-10-28T13:21', 'SA_11147', [['DEN58A201014', 2]], 'pending', 0],
    ['SR_1115', '2026-10-26T10:12', 'SA_11146', [['VIS44B305022', 5]], 'received', 0],
    ['SR_1114', '2026-10-23T15:40', 'SA_11144', [['PLY58A410012', 2]], 'received', 'paid'],
    ['SR_1113', '2026-10-21T09:30', 'SA_11143', [['LIN54C120003', 3]], 'received', 0],
    ['SR_1112', '2026-10-20T22:41', 'SA_11142', [['DEN58A201014', 15], ['COT58A101001', 10]], 'received', 'paid'],
    ['SR_1111', '2026-10-17T22:39', 'SA_11140', [['VIS44B305022', 4]], 'received', 0]
  ].map(function (r) {
    var sale = saleByRef(r[2]);
    var rec = { ref: r[0], created: r[1], sale: r[2], customer: sale.customer, lines: r[3].map(function (x) { return L(x[0], x[1]); }), orderTax: 7, discount: 0, shipping: 0, status: r[4], notes: '' };
    rec.refunded = r[5] === 'paid' ? totals(rec).grand : r[5];
    return rec;
  });
  var BILLING = [
    { ref: 'BN_1009', customer: 'C1', date: '2026-09-01', due: '2026-10-01', terms: 30, sales: ['SA_11094', 'SA_11102'], status: 'paid', note: '' },
    { ref: 'BN_1010', customer: 'C2', date: '2026-10-25', due: '2026-12-09', terms: 45, sales: ['SA_11139', 'SA_11145'], status: 'issued', note: '' },
    { ref: 'BN_1011', customer: 'C2', date: '2026-10-28', due: '2026-12-12', terms: 45, sales: ['SA_11148'], status: 'draft', note: 'รอยืนยันยอดกับฝ่ายจัดซื้อ' }
  ];

  /* ---- helpers ---- */
  function product(code) { return PRODUCTS.filter(function (p) { return p.code === code; })[0]; }
  function customer(id) { return CUSTOMERS.filter(function (c) { return c.id === id; })[0]; }
  function saleByRef(ref) { return SALES.filter(function (s) { return s.ref === ref; })[0]; }
  function factor(p, u) { return u === p.unit || !u ? 1 : u === 'yard' ? 0.9144 : u === 'roll' ? p.roll : 1; }
  function calc(l) {
    var price = +l.price || 0, q = +l.qty || 0, t = (+l.tax || 0) / 100;
    var d = l.discType === 'percent' ? price * (+l.disc || 0) / 100 : (+l.disc || 0);
    var after = Math.max(0, price - d), net, taxU;
    if (l.taxType === 'inclusive') { net = after / (1 + t); taxU = after - net; } else { net = after; taxU = after * t; }
    return { net: r2(net), taxU: r2(taxU), unitTotal: r2(net + taxU), sub: r2((net + taxU) * q), discT: r2(d * q), taxT: r2(taxU * q), d: r2(d) };
  }
  function totals(rec) {
    var sub = r2(rec.lines.reduce(function (s, l) { return s + calc(l).sub; }, 0)), disc = Math.min(+rec.discount || 0, sub);
    var tax = r2((sub - disc) * (+rec.orderTax || 0) / 100), ship = +rec.shipping || 0;
    return { sub: sub, disc: disc, tax: tax, ship: ship, grand: r2(sub - disc + tax + ship) };
  }
  function paidOf(s) { return r2((s.payments || []).reduce(function (a, p) { return a + p.amount; }, 0)); }
  function payState(total, paid) { return paid >= total - 0.005 ? 'paid' : paid > 0 ? 'partial' : 'unpaid'; }
  /* A sale is "billed" while it sits on a billing note that is not cancelled or fully paid */
  function billedOn(ref, exceptNote) { return BILLING.filter(function (b) { return b !== exceptNote && b.status !== 'cancelled' && b.status !== 'paid' && b.sales.indexOf(ref) >= 0; })[0]; }
  function daysBetween(a, b) { return Math.round((new Date(b.slice(0, 10) + 'T00:00') - new Date(a.slice(0, 10) + 'T00:00')) / 86400000); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function num(x) { return Number(x).toLocaleString('th-TH', { maximumFractionDigits: 2 }); }
  function today() { var t = new Date(); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); }
  var STATUS = { delivered: ['success', 'ส่งมอบแล้ว'], pending: ['warning', 'รอดำเนินการ'], ordered: ['neutral', 'สั่งจองแล้ว'], received: ['info', 'รับคืนแล้ว'] };
  var PAY = { paid: ['success', 'ชำระแล้ว'], partial: ['warning', 'ชำระบางส่วน'], unpaid: ['danger', 'ค้างชำระ'] };
  function badge(t, dot) { return '<span class="gg-badge ' + t[0] + '">' + (dot === false ? '' : '<span class="gg-badge-dot" aria-hidden="true"></span>') + t[1] + '</span>'; }
  function swatchCss() {
    return '.swatch{width:40px;height:40px;border-radius:var(--radius-md);border:1px solid var(--border);display:block;flex:none}' +
      '.sw-poplin{background-color:#f3f1ea;background-image:repeating-linear-gradient(0deg,rgba(0,0,0,.035) 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,rgba(0,0,0,.03) 0 1px,transparent 1px 3px)}' +
      '.sw-denim{background-color:#2e4a74;background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.16) 0 1.5px,transparent 1.5px 4px)}' +
      '.sw-floral{background-color:#f6ead8;background-image:radial-gradient(circle at 30% 30%,#c2456b 0 4px,transparent 5px),radial-gradient(circle at 72% 64%,#d9a53b 0 3px,transparent 4px),radial-gradient(circle at 70% 22%,#3f7d5c 0 2.5px,transparent 3.5px),radial-gradient(circle at 26% 78%,#3f7d5c 0 2.5px,transparent 3.5px)}' +
      '.sw-georgette{background-color:#1f2b4d;background-image:linear-gradient(120deg,transparent 30%,rgba(255,255,255,.18) 48%,transparent 66%)}' +
      '.sw-linen{background-color:#d8cab0;background-image:repeating-linear-gradient(0deg,rgba(80,60,30,.12) 0 1px,transparent 1px 4px),repeating-linear-gradient(90deg,rgba(80,60,30,.1) 0 1px,transparent 1px 5px)}' +
      '.sw-jersey{background-color:#a7a9ad;background-image:radial-gradient(rgba(255,255,255,.35) .8px,transparent 1.2px),radial-gradient(rgba(0,0,0,.18) .8px,transparent 1.2px);background-size:4px 4px,5px 5px;background-position:0 0,2px 2px}';
  }
  /* Print-ready page for "Download PDF" (browser Save as PDF) */
  function printDoc(title, headHtml, rows, totalsRows) {
    var w = window.open('', '_blank');
    if (!w) return false;
    w.document.write('<!doctype html><html lang="th"><head><meta charset="utf-8"><title>' + esc(title) + '</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;600;700&display=swap"><style>' +
      'body{font:14px/1.6 "IBM Plex Sans Thai",sans-serif;color:#141b2b;margin:40px}h1{font-size:22px;margin:0 0 6px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:8px;border-bottom:1px solid #e2e5eb;text-align:left}th{font-size:12px;color:#5d6576}.r{text-align:right}.tot td{font-weight:700;font-size:16px;border-bottom:0}' +
      '</style></head><body><h1>LTS Solution · ' + esc(title) + '</h1>' + headHtml + '<table>' + rows + totalsRows + '</table></body></html>');
    w.document.close(); setTimeout(function () { w.focus(); w.print(); }, 400);
    return true;
  }
  (function () { var st = document.createElement('style'); st.textContent = swatchCss(); document.head.appendChild(st); })();
  window.LTS = { PRODUCTS: PRODUCTS, CUSTOMERS: CUSTOMERS, COMPANY: COMPANY, WAREHOUSE: WAREHOUSE, SALES: SALES, RETURNS: RETURNS, BILLING: BILLING, SHORT: SHORT, UNIT: UNIT,
    product: product, customer: customer, saleByRef: saleByRef, factor: factor, calc: calc, totals: totals, paidOf: paidOf, payState: payState, billedOn: billedOn,
    daysBetween: daysBetween, esc: esc, num: num, r2: r2, today: today, STATUS: STATUS, PAY: PAY, AGENTS: AGENTS, agent: agent, REGION_LIST: REGION_LIST, regionOf: regionOf, PROVINCE_LIST: PROVINCE_LIST, dueDate: function (s) { var d = new Date(s.created.slice(0, 10) + 'T00:00'); d.setDate(d.getDate() + (s.terms || 0)); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }, badge: badge, swatchCss: swatchCss, printDoc: printDoc, L: L };
})();
