/* ===== LTS Solution · purchases & purchase returns for reports (needs sales-data, people-data) ===== */
(function () {
  var D = window.LTS;
  /* [ref, supplierId, status, paid, method, created, shipping, warehouse, lines [code, qty, cost]] — same records as the Purchases page */
  var RAW = [
    ['PU_1119', 'S1', 'pending', 0, 'เงินสด', '2026-10-04T00:25', 180, 'W1', [['VIS44B305022', 50, 95]]],
    ['PU_1118', 'S1', 'received', 2220, 'เงินสด', '2026-10-03T23:52', 0, 'W1', [['COT58A101001', 30, 62], ['PLY58A410012', 7.5, 48]]],
    ['PU_1117', 'S3', 'received', 100000, 'เงินสด', '2026-10-03T23:40', 0, 'W2', [['DEN58A201014', 1000, 162]]],
    ['PU_1116', 'S2', 'received', 45000, 'เงินสด', '2026-10-03T23:31', 0, 'W2', [['KNT72A160008', 180, 250]]],
    ['PU_1115', 'S1', 'received', 49300, 'เงินสด', '2026-10-03T23:23', 0, 'W1', [['LIN54C120003', 200, 210], ['VIS44B305022', 73, 100]]],
    ['PU_1114', 'S3', 'ordered', 0, 'เงินสด', '2026-10-03T23:15', 0, 'W2', [['DEN58A201014', 450, 143]]],
    ['PU_1113', 'S1', 'received', 30260, 'เงินสด', '2026-10-03T23:12', 0, 'W1', [['COT58A101001', 445, 68]]],
    ['PU_1112', 'S1', 'received', 1620, 'เงินสด', '2026-10-03T23:02', 0, 'W3', [['PLY58A410012', 36, 45]]],
    ['PU_1111', 'S2', 'received', 95000, 'เงินสด', '2026-10-02T23:08', 0, 'W2', [['KNT72A160008', 380, 250]]]
  ];
  var PURCHASES = RAW.map(function (r) {
    var lines = r[8].map(function (l) { return { code: l[0], qty: l[1], cost: l[2], sub: D.r2(l[1] * l[2]) }; });
    return { ref: r[0], supplier: r[1], status: r[2], paid: r[3], method: r[4], created: r[5], shipping: r[6], warehouse: r[7], lines: lines, total: D.r2(lines.reduce(function (a, l) { return a + l.sub; }, 0) + r[6]) };
  });
  /* purchase returns: [ref, created, purchaseRef, lines [code, qty], status, refunded] */
  var PRETURNS = [
    ['PR_1104', '2026-10-10T10:20', 'PU_1117', [['DEN58A201014', 25]], 'received', 'paid'],
    ['PR_1103', '2026-10-08T15:05', 'PU_1115', [['LIN54C120003', 12]], 'received', 'paid'],
    ['PR_1102', '2026-10-06T11:30', 'PU_1113', [['COT58A101001', 15]], 'pending', 0],
    ['PR_1101', '2026-10-05T09:45', 'PU_1116', [['KNT72A160008', 6]], 'received', 'paid']
  ].map(function (r) {
    var pu = PURCHASES.filter(function (p) { return p.ref === r[2]; })[0];
    var lines = r[3].map(function (l) { var c = pu.lines.filter(function (x) { return x.code === l[0]; })[0].cost; return { code: l[0], qty: l[1], cost: c, sub: D.r2(l[1] * c) }; });
    var total = D.r2(lines.reduce(function (a, l) { return a + l.sub; }, 0));
    return { ref: r[0], created: r[1], purchase: r[2], supplier: pu.supplier, warehouse: pu.warehouse, lines: lines, status: r[4], total: total, refunded: r[5] === 'paid' ? total : r[5] };
  });
  D.PURCHASES = PURCHASES; D.PRETURNS = PRETURNS;
  D.PSTATUS = { received: ['info', 'ได้รับแล้ว'], pending: ['warning', 'รอดำเนินการ'], ordered: ['neutral', 'สั่งซื้อแล้ว'] };
  /* Which warehouse a sale ships from: walk-in POS sales are the Pahurat shop, the rest leave the main warehouse */
  D.saleWh = function (s) { return s.customer === 'C4' ? 'W3' : 'W1'; };
  D.CATEGORY = { COT: 'ผ้าฝ้าย', DEN: 'ผ้ายีนส์', VIS: 'ผ้าเรยอน', PLY: 'ผ้าโพลีเอสเตอร์', LIN: 'ผ้าลินิน', KNT: 'ผ้ายืด' };
  D.categoryOf = function (code) { return D.CATEGORY[code.slice(0, 3)] || 'อื่น ๆ'; };
})();
