#!/usr/bin/env python3
"""LTS Solution page builder.

Rebuilds every page in html/ from the sources in src/.
Run from anywhere:  python3 build.py           (all pages)
                    python3 build.py sales     (only pages whose output name contains "sales")
"""
import json, re, os, sys
ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
P = os.path.join(SRC, 'design-system')
OUT = os.path.join(ROOT, 'html')

tok=json.load(open(P+'/tokens.json',encoding='utf-8'))
L=[':root {']
for t in tok['color']['tokens']: L.append(f"  --{t['name']}: {t['value']['light']};")
for f in ['shadow','spacing','radius','layout','zIndex']:
    for t in tok[f]['tokens']: L.append(f"  --{t['name']}: {t['value']};")
for k,v in tok['type']['families'].items(): L.append(f"  --font-{k}: {v};")
L.append('}'); TOK='\n'.join(L)
CSS=re.sub(r'@import url\([^)]*\);\n*','',open(P+'/components/bundle.css',encoding='utf-8').read())
js=open(P+'/components/bundle.js',encoding='utf-8').read()
ICONS=re.search(r'var ICONS = \{.*?\n  \};',js,re.S).group(0)
NAV=re.search(r'var NAV = \[.*?\n  \];',js,re.S).group(0)
top=open(os.path.join(SRC,'partials','shell_top.html'),encoding='utf-8').read(); bot=open(os.path.join(SRC,'partials','shell_bottom.html'),encoding='utf-8').read()
def crumbs(items):
    out=[]
    for i,(label,href) in enumerate(items):
        if i: out.append('<span data-icon="chevron-right" data-size="sm"></span>')
        last = i == len(items) - 1
        out.append(f'<a href="{href}">{label}</a>' if href else (f'<span class="current" aria-current="page">{label}</span>' if last else f'<span>{label}</span>'))
    return ''.join(out)
CHART='<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>'
PAGES=[('dashboard.page.html','lts-dashboard.html','แดชบอร์ด','dashboard',[('แดชบอร์ด',None)],CHART),
       ('products.page.html','lts-products.html','สินค้า','products.list',[('สินค้า','lts-products.html'),('สินค้าทั้งหมด',None)],''),
       ('categories.page.html','lts-categories.html','หมวดหมู่สินค้า','products.categories',[('สินค้า','lts-products.html'),('หมวดหมู่สินค้า',None)],''),
       ('adjustment.page.html','lts-adjustment.html','สร้างรายการปรับปรุงสต็อก','adjustments',[('ปรับปรุงสต็อก',None),('สร้างรายการ',None)],''),
       ('purchases.page.html','lts-purchases.html','รายการซื้อ','purchases.list',[('การซื้อ',None),('รายการซื้อ',None)],''),
       ('create-purchase.page.html','lts-create-purchase.html','สร้างรายการซื้อ','purchases.list',[('การซื้อ',None),('รายการซื้อ','lts-purchases.html'),('สร้างรายการซื้อ',None)],''),
       ('purchase-return.page.html','lts-purchase-return.html','คืนสินค้าให้ผู้จำหน่าย','purchases.returns',[('การซื้อ',None),('คืนสินค้าให้ผู้จำหน่าย',None)],''),
       ('create-product.page.html','lts-create-product.html','เพิ่มสินค้า','products.list',[('สินค้า','lts-products.html'),('เพิ่มสินค้า',None)],''),
       ('sales.page.html','lts-sales.html','รายการขาย','sales.list',[('การขาย',None),('รายการขาย',None)],''),
       ('sale-details.page.html','lts-sale-details.html','รายละเอียดการขาย','sales.list',[('การขาย',None),('รายการขาย','lts-sales.html'),('รายละเอียด',None)],''),
       ('create-sale.page.html','lts-create-sale.html','สร้างรายการขาย','sales.list',[('การขาย',None),('รายการขาย','lts-sales.html'),('สร้างรายการขาย',None)],''),
       ('sales-returns.page.html','lts-sales-returns.html','รับคืนสินค้า','sales.returns',[('การขาย',None),('รับคืนสินค้า',None)],''),
       ('billing-notes.page.html','lts-billing-notes.html','ใบวางบิล','sales.billing-notes',[('การขาย',None),('ใบวางบิล',None)],''),
       ('transfers.page.html','lts-transfers.html','โอนย้ายสินค้า','transfers',[('โอนย้ายสินค้า',None)],''),
       ('create-transfer.page.html','lts-create-transfer.html','สร้างรายการโอนย้าย','transfers',[('โอนย้ายสินค้า','lts-transfers.html'),('สร้างรายการโอนย้าย',None)],''),
       ('expenses.page.html','lts-expenses.html','รายการค่าใช้จ่าย','expenses.list',[('ค่าใช้จ่าย',None),('รายการค่าใช้จ่าย',None)],''),
       ('create-expense.page.html','lts-create-expense.html','บันทึกค่าใช้จ่าย','expenses.list',[('ค่าใช้จ่าย',None),('รายการค่าใช้จ่าย','lts-expenses.html'),('บันทึกค่าใช้จ่าย',None)],''),
       ('expense-categories.page.html','lts-expense-categories.html','หมวดหมู่ค่าใช้จ่าย','expenses.categories',[('ค่าใช้จ่าย',None),('หมวดหมู่ค่าใช้จ่าย',None)],''),
       ('suppliers.page.html','lts-suppliers.html','ผู้จำหน่าย','people.suppliers',[('บุคคล',None),('ผู้จำหน่าย',None)],''),
       ('create-supplier.page.html','lts-create-supplier.html','เพิ่มผู้จำหน่าย','people.suppliers',[('บุคคล',None),('ผู้จำหน่าย','lts-suppliers.html'),('เพิ่มผู้จำหน่าย',None)],''),
       ('customers.page.html','lts-customers.html','ลูกค้า','people.customers',[('บุคคล',None),('ลูกค้า',None)],''),
       ('create-customer.page.html','lts-create-customer.html','เพิ่มลูกค้า','people.customers',[('บุคคล',None),('ลูกค้า','lts-customers.html'),('เพิ่มลูกค้า',None)],''),
       ('users.page.html','lts-users.html','ผู้ใช้งาน','people.users',[('บุคคล',None),('ผู้ใช้งาน',None)],''),
       ('create-user.page.html','lts-create-user.html','เพิ่มผู้ใช้งาน','people.users',[('บุคคล',None),('ผู้ใช้งาน','lts-users.html'),('เพิ่มผู้ใช้งาน',None)],''),
       ('roles.page.html','lts-roles.html','บทบาทและสิทธิ์','roles',[('บทบาทและสิทธิ์',None)],''),
       ('create-role.page.html','lts-create-role.html','สร้างบทบาท','roles',[('บทบาทและสิทธิ์','lts-roles.html'),('สร้างบทบาท',None)],''),
       ('warehouses.page.html','lts-warehouses.html','คลังสินค้า','warehouse',[('คลังสินค้า',None)],''),
       ('create-warehouse.page.html','lts-create-warehouse.html','เพิ่มคลังสินค้า','warehouse',[('คลังสินค้า','lts-warehouses.html'),('เพิ่มคลังสินค้า',None)],''),
       ('reports.page.html','lts-reports.html','รายงาน','reports',[('รายงาน',None),('รายงานคลังสินค้า',None)],CHART),
       ('pos.page.html','lts-pos.html','ขายหน้าร้าน (POS)','sales.list',[('POS',None)],''),
       ('login.page.html','lts-login.html','เข้าสู่ระบบ','dashboard',[('เข้าสู่ระบบ',None)],'')]
KINDS = {'suppliers': 'suppliers', 'customers': 'customers', 'users': 'users', 'warehouses': 'warehouses',
         'create-supplier': 'suppliers', 'create-customer': 'customers', 'create-user': 'users', 'create-warehouse': 'warehouses'}
def source(src):
    name = src[:-len('.page.html')]
    if name in KINDS:
        tpl = 'people-form.tpl.html' if name.startswith('create-') else 'people-list.tpl.html'
        return open(os.path.join(SRC, 'pages', tpl), encoding='utf-8').read().replace('__KIND__', KINDS[name])
    return open(os.path.join(SRC, 'pages', src), encoding='utf-8').read()
only = sys.argv[1] if len(sys.argv) > 1 else ''
os.makedirs(OUT, exist_ok=True)
for src,out,title,active,cr,extra in PAGES:
    if only and only not in out: continue
    t=source(src)
    css=t.split('===CSS===')[1].split('===CONTENT===')[0]; content=t.split('===CONTENT===')[1].split('===JS===')[0]; pjs=t.split('===JS===')[1]
    html=(top+content+bot).replace('{{TITLE}}',title).replace('{{HEAD_EXTRA}}',extra).replace('{{ACTIVE}}',active).replace('{{CRUMBS}}',crumbs(cr))
    html=html.replace('{{TOKENS}}',TOK).replace('{{BUNDLE_CSS}}',CSS).replace('{{PAGE_CSS}}',css.strip()).replace('{{ICONS}}',ICONS).replace('{{NAV}}',NAV).replace('{{PAGE_JS}}',pjs.strip())
    html=re.sub(r'/\*@include ([\w-]+)\*/', lambda m: open(os.path.join(SRC,'data',m.group(1)+'.js'),encoding='utf-8').read(), html)
    assert '{{' not in html, out
    open(os.path.join(OUT,out),'w',encoding='utf-8').write(html); print('built', out)
