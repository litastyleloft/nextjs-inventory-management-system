/* ===== LTS Solution · shared sample data for Transfers (needs sales-data for products & maths) ===== */
(function () {
  var D = window.LTS;
  var WAREHOUSES = [
    { id: 'W1', name: 'คลังสินค้าหลัก', area: 'สัมพันธวงศ์', email: 'main.wh@lts-solution.example', phone: '02-123-4567', country: 'ไทย', city: 'กรุงเทพฯ', zip: '10100', created: '2025-10-01T08:00' },
    { id: 'W2', name: 'คลังบางนา', area: 'บางนา-ตราด กม.12', email: 'bangna.wh@lts-solution.example', phone: '02-750-1188', country: 'ไทย', city: 'สมุทรปราการ', zip: '10540', created: '2026-02-14T11:52' },
    { id: 'W3', name: 'หน้าร้านพาหุรัด', area: 'ถนนพาหุรัด', email: 'pahurat@lts-solution.example', phone: '02-221-0099', country: 'ไทย', city: 'กรุงเทพฯ', zip: '10200', created: '2026-04-20T09:30' }
  ];
  /* on-hand stock per warehouse, in each fabric's stock unit */
  var STOCK = {
    'COT58A101001': { W1: 2680, W2: 1200, W3: 180 },
    'DEN58A201014': { W1: 1290, W2: 600, W3: 95 },
    'VIS44B305022': { W1: 700, W2: 300, W3: 120 },
    'PLY58A410012': { W1: 82, W2: 420, W3: 40 },
    'LIN54C120003': { W1: 0, W2: 160, W3: 12 },
    'KNT72A160008': { W1: 350, W2: 75, W3: 0 }
  };
  function L(code, qty) { var p = D.product(code); return { code: code, price: p.cost, disc: 0, discType: 'fixed', tax: 0, taxType: 'exclusive', qty: qty, unit: '', lot: '' }; }
  /* [ref, created, from, to, lines, status, shipping, note] */
  var TRANSFERS = [
    ['TR_1124', '2026-10-29T20:08', 'W2', 'W1', [['LIN54C120003', 100]], 'sent', 350, 'เติมสต็อกลินินที่คลังหลักหมด'],
    ['TR_1123', '2026-10-28T20:06', 'W1', 'W3', [['COT58A101001', 60], ['VIS44B305022', 40]], 'completed', 120, ''],
    ['TR_1122', '2026-10-24T00:12', 'W2', 'W1', [['PLY58A410012', 200]], 'completed', 300, ''],
    ['TR_1121', '2026-10-23T11:59', 'W1', 'W3', [['DEN58A201014', 40], ['KNT72A160008', 15]], 'completed', 120, ''],
    ['TR_1120', '2026-10-30T09:15', 'W1', 'W2', [['COT58A101001', 500]], 'pending', 0, 'รอรถขนส่งรอบบ่าย'],
    ['TR_1119', '2026-10-15T11:05', 'W2', 'W3', [['VIS44B305022', 50]], 'completed', 250, ''],
    ['TR_1118', '2026-10-12T14:43', 'W3', 'W1', [['COT58A101001', 20]], 'completed', 80, 'คืนผ้าหน้าร้านที่ขายไม่หมด'],
    ['TR_1117', '2026-10-10T12:46', 'W1', 'W2', [['DEN58A201014', 300]], 'completed', 400, ''],
    ['TR_1116', '2026-10-09T19:25', 'W2', 'W1', [['KNT72A160008', 50], ['PLY58A410012', 100]], 'completed', 300, ''],
    ['TR_1115', '2026-10-05T12:30', 'W3', 'W1', [['VIS44B305022', 10]], 'completed', 80, ''],
    ['TR_1114', '2026-09-28T10:10', 'W1', 'W3', [['COT58A101001', 80], ['DEN58A201014', 30]], 'completed', 120, ''],
    ['TR_1113', '2026-09-20T16:40', 'W1', 'W2', [['LIN54C120003', 150]], 'completed', 350, '']
  ].map(function (r) { return { ref: r[0], created: r[1], from: r[2], to: r[3], lines: r[4].map(function (x) { return L(x[0], x[1]); }), orderTax: 0, discount: 0, shipping: r[6], status: r[5], notes: r[7] }; });
  var TSTATUS = { completed: ['success', 'โอนสำเร็จ'], sent: ['info', 'ระหว่างขนส่ง'], pending: ['warning', 'รอดำเนินการ'] };
  function wh(id) { return WAREHOUSES.filter(function (w) { return w.id === id; })[0]; }
  function transfer(ref) { return TRANSFERS.filter(function (t) { return t.ref === ref; })[0]; }
  function stockAt(code, w) { return (STOCK[code] || {})[w] || 0; }
  function nextRef() { return 'TR_' + (Math.max.apply(null, TRANSFERS.map(function (t) { return +t.ref.slice(3); })) + 1); }
  D.WAREHOUSES = WAREHOUSES; D.STOCK = STOCK; D.TRANSFERS = TRANSFERS; D.TSTATUS = TSTATUS;
  D.wh = wh; D.transfer = transfer; D.stockAt = stockAt; D.nextTransfer = nextRef; D.TL = L;
})();
