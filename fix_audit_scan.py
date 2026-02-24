import re

path = r"c:\Users\Admin\Desktop\Kamera-Panel\app\app\page.js"

with open(path, "r", encoding="utf-8") as f:
    text = f.read()

original_len = len(text)

# ============================================================
# PLAN: Her Page component'e audit trail entegrasyonu
# 
# 1. Zaten edit+audit var: ModelsPage, PersonnelPage  [DONE]
# 2. Edit var ama audit yok: OrdersPage, CustomersPage, ShipmentsPage, MachinesPage
# 3. Ne edit ne audit: ProductionPage, FasonPage, QualityPage, CostsPage
#
# Strateji: Mevcut update fonksiyonlarini bul ve audit trail ekle
# ============================================================

changes = 0

# ============================================================
# ORDERS PAGE - handleUpdateOrder'a audit ekle
# ============================================================
# Find handleUpdateOrder or similar in OrdersPage
# OrdersPage starts around line 6538
order_patterns = [
    # Pattern: orders page edit save with PUT
    (r"(const handleSaveOrder\s*=\s*async.*?try\s*\{)",
     None),
]

# Find the order update function
order_update_match = re.search(
    r"(const handleUpdateOrder\s*=\s*async.*?try\s*\{)",
    text
)
if order_update_match:
    print("OrdersPage: handleUpdateOrder found")

# Let's find all update handlers that DON'T have audit-trail calls
update_funcs = list(re.finditer(
    r"const (handleUpdate\w+|handleEditSave\w*|handleSaveEdit\w*)\s*=\s*async\s*\([^)]*\)\s*=>\s*\{",
    text
))

print(f"Found {len(update_funcs)} update handler functions:")
for m in update_funcs:
    name = m.group(1)
    pos = m.start()
    # Check if audit-trail is already in the next 500 chars
    chunk = text[pos:pos+800]
    has_audit = 'audit-trail' in chunk
    print(f"  {name}: audit={has_audit}")

# ============================================================
# For MachinesPage - find edit machine handler
# ============================================================
machine_update = re.search(
    r"const (handleUpdateMachine|handleSaveMachine|handleEditMachine)\s*=\s*async",
    text
)
if machine_update:
    print(f"\nMachinesPage: {machine_update.group(1)} found")
else:
    print("\nMachinesPage: NO update handler found - will need to add one")

# ============================================================
# For OrdersPage - find edit order handler
# ============================================================
order_update = re.search(
    r"const (handleUpdateOrder|handleSaveOrder|handleEditOrder)\s*=\s*async",
    text
)
if order_update:
    print(f"OrdersPage: {order_update.group(1)} found")
else:
    print("OrdersPage: NO update handler found")

# ============================================================
# For CustomerPage
# ============================================================
customer_update = re.search(
    r"const (handleUpdateCustomer|handleSaveCustomer|handleEditCustomer)\s*=\s*async",
    text
)
if customer_update:
    print(f"CustomersPage: {customer_update.group(1)} found")
else:
    print("CustomersPage: NO update handler found")

# ============================================================
# For ShipmentsPage
# ============================================================
shipment_update = re.search(
    r"const (handleUpdateShipment|handleSaveShipment|handleEditShipment)\s*=\s*async",
    text
)
if shipment_update:
    print(f"ShipmentsPage: {shipment_update.group(1)} found")
else:
    print("ShipmentsPage: NO update handler found")

# ============================================================ 
# Find actual PUT calls in each section
# ============================================================
put_calls = list(re.finditer(r"method:\s*'PUT'", text))
print(f"\nTotal PUT calls: {len(put_calls)}")
for m in put_calls:
    pos = m.start()
    # Find function context
    line_num = text[:pos].count('\n') + 1
    # Get surrounding context
    start = max(0, pos - 200)
    chunk = text[start:pos]
    func_match = re.search(r'const (\w+)\s*=', chunk)
    func_name = func_match.group(1) if func_match else 'unknown'
    # Check if audit is nearby
    audit_nearby = 'audit-trail' in text[max(0,pos-500):pos]
    print(f"  L{line_num}: {func_name} - audit_before={audit_nearby}")
