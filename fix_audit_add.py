import re

path = r"c:\Users\Admin\Desktop\Kamera-Panel\app\app\page.js"

with open(path, "r", encoding="utf-8") as f:
    text = f.read()

original_len = len(text)
changes = 0

# ============================================================
# Her PUT handler'in onune audit trail kodu ekle
# Strateji: "method: 'PUT'" iceren satirdan onceki try { blogunun
# hemen sonrasina audit trail kodu ekle
# ============================================================

# ---- handleUpdateMachine ----
old_machine = """const handleUpdateMachine = async (e) => {

    e.preventDefault();

    try {

      const res = await fetch(`/api/machines/${editMachine.id}`, {

        method: 'PUT', headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(editMachineForm)

      });"""

new_machine = """const handleUpdateMachine = async (e) => {
    e.preventDefault();
    try {
      // Audit trail
      const changes = [];
      Object.keys(editMachineForm).forEach(key => {
        const oldVal = String(editMachine[key] ?? '');
        const newVal = String(editMachineForm[key] ?? '');
        if (oldVal !== newVal) changes.push({ field_name: key, old_value: oldVal, new_value: newVal });
      });
      if (changes.length > 0) {
        await fetch('/api/audit-trail', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table_name: 'machines', record_id: editMachine.id, changes, changed_by: 'admin' }) });
      }
      const res = await fetch(`/api/machines/${editMachine.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editMachineForm)
      });"""

if old_machine in text:
    text = text.replace(old_machine, new_machine, 1)
    changes += 1
    print("MachinesPage: audit trail eklendi")
else:
    print("MachinesPage: pattern bulunamadi, manual ekleme gerekli")

# ---- handleUpdateCustomer ----
old_customer = """const handleUpdateCustomer = async (e) => {

    e.preventDefault();

    try {

      const res = await fetch(`/api/customers/${editCustomer.id}`, {

        method: 'PUT', headers: { 'Content-Type': 'application/json' },"""

new_customer = """const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    try {
      // Audit trail
      const changes = [];
      Object.keys(editCustomerForm).forEach(key => {
        const oldVal = String(editCustomer[key] ?? '');
        const newVal = String(editCustomerForm[key] ?? '');
        if (oldVal !== newVal) changes.push({ field_name: key, old_value: oldVal, new_value: newVal });
      });
      if (changes.length > 0) {
        await fetch('/api/audit-trail', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table_name: 'customers', record_id: editCustomer.id, changes, changed_by: 'admin' }) });
      }
      const res = await fetch(`/api/customers/${editCustomer.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },"""

if old_customer in text:
    text = text.replace(old_customer, new_customer, 1)
    changes += 1
    print("CustomersPage: audit trail eklendi")
else:
    print("CustomersPage: pattern bulunamadi")

# ---- handleUpdateShipment ----
old_shipment = """const handleUpdateShipment = async (e) => {

    e.preventDefault();

    try {

      const res = await fetch(`/api/shipments/${editShipment.id}`, {

        method: 'PUT', headers: { 'Content-Type': 'application/json' },"""

new_shipment = """const handleUpdateShipment = async (e) => {
    e.preventDefault();
    try {
      // Audit trail
      const changes = [];
      Object.keys(editShipmentForm).forEach(key => {
        const oldVal = String(editShipment[key] ?? '');
        const newVal = String(editShipmentForm[key] ?? '');
        if (oldVal !== newVal) changes.push({ field_name: key, old_value: oldVal, new_value: newVal });
      });
      if (changes.length > 0) {
        await fetch('/api/audit-trail', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table_name: 'shipments', record_id: editShipment.id, changes, changed_by: 'admin' }) });
      }
      const res = await fetch(`/api/shipments/${editShipment.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },"""

if old_shipment in text:
    text = text.replace(old_shipment, new_shipment, 1)
    changes += 1
    print("ShipmentsPage: audit trail eklendi")
else:
    print("ShipmentsPage: pattern bulunamadi")

print(f"\nToplam: {changes} fonksiyon guncellendi")

# ============================================================
# ORDERS PAGE - Edit fonksiyonu yok, eklememiz lazim
# OrdersPage'in state'lerini bulup edit state + handler ekleyelim
# ============================================================

# Orders page'e edit state ve handler ekle
orders_func = "function OrdersPage({ orders, loadOrders, customers, models, addToast }) {"
if orders_func in text:
    # Hemen sonrasina edit state'leri ekle
    orders_add = """function OrdersPage({ orders, loadOrders, customers, models, addToast }) {
  // EDIT system states
  const [editOrder, setEditOrder] = useState(null);
  const [editOrderForm, setEditOrderForm] = useState({});
  const [orderAuditHistory, setOrderAuditHistory] = useState(null);
  const [orderAuditData, setOrderAuditData] = useState([]);

  const openEditOrder = (order) => {
    setEditOrderForm({
      order_no: order.order_no || '', customer_name: order.customer_name || '',
      model_name: order.model_name || '', quantity: order.quantity || 0,
      unit_price: order.unit_price || 0, total_price: order.total_price || 0,
      delivery_date: order.delivery_date || '', fabric_type: order.fabric_type || '',
      color: order.color || '', sizes: order.sizes || '', notes: order.notes || '',
      priority: order.priority || 'normal', status: order.status || 'siparis_alindi'
    });
    setEditOrder(order);
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    try {
      const changes = [];
      Object.keys(editOrderForm).forEach(key => {
        const oldVal = String(editOrder[key] ?? '');
        const newVal = String(editOrderForm[key] ?? '');
        if (oldVal !== newVal) changes.push({ field_name: key, old_value: oldVal, new_value: newVal });
      });
      if (changes.length > 0) {
        await fetch('/api/audit-trail', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table_name: 'orders', record_id: editOrder.id, changes, changed_by: 'admin' }) });
      }
      const res = await fetch(`/api/orders/${editOrder.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editOrderForm)
      });
      if (!res.ok) throw new Error('Guncelleme hatasi');
      await loadOrders(); setEditOrder(null);
      addToast('success', 'Siparis guncellendi!');
    } catch (err) { addToast('error', err.message); }
  };

  const openOrderAuditHistory = async (orderId) => {
    try {
      const res = await fetch(`/api/audit-trail?table=orders&record_id=${orderId}`);
      const data = await res.json();
      setOrderAuditData(Array.isArray(data) ? data : []);
      setOrderAuditHistory(orderId);
    } catch { setOrderAuditData([]); setOrderAuditHistory(orderId); }
  };"""
    text = text.replace(orders_func, orders_add, 1)
    changes += 1
    print("OrdersPage: edit+audit state ve handler eklendi")
else:
    # try without the exact signature
    print("OrdersPage: function signature bulunamadi, manual kontrol gerekli")

# ============================================================
# Simdi OLMAYAN bolumler icin: ProductionPage, FasonPage, QualityPage, CostsPage
# Bu bolumlere de edit state + handler ekleyelim
# ============================================================

# PRODUCTION PAGE
prod_func = re.search(r"function ProductionPage\(\{[^}]+\}\)\s*\{", text)
if prod_func:
    prod_old = prod_func.group(0)
    prod_add = prod_old + """
  // EDIT system states
  const [editProduction, setEditProduction] = useState(null);
  const [editProductionForm, setEditProductionForm] = useState({});
  const [prodAuditHistory, setProdAuditHistory] = useState(null);
  const [prodAuditData, setProdAuditData] = useState([]);

  const openEditProduction = (log) => {
    setEditProductionForm({
      total_produced: log.total_produced || 0, defective_count: log.defective_count || 0,
      defect_reason: log.defect_reason || '', lot_change: log.lot_change || '',
      quality_score: log.quality_score || 100
    });
    setEditProduction(log);
  };

  const handleUpdateProduction = async (e) => {
    e.preventDefault();
    try {
      const changes = [];
      Object.keys(editProductionForm).forEach(key => {
        const oldVal = String(editProduction[key] ?? '');
        const newVal = String(editProductionForm[key] ?? '');
        if (oldVal !== newVal) changes.push({ field_name: key, old_value: oldVal, new_value: newVal });
      });
      if (changes.length > 0) {
        await fetch('/api/audit-trail', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table_name: 'production_logs', record_id: editProduction.id, changes, changed_by: 'admin' }) });
      }
      const res = await fetch(`/api/production/${editProduction.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProductionForm)
      });
      if (!res.ok) throw new Error('Guncelleme hatasi');
      setEditProduction(null);
      addToast('success', 'Uretim kaydi guncellendi!');
    } catch (err) { addToast('error', err.message); }
  };

  const openProdAuditHistory = async (logId) => {
    try {
      const res = await fetch(`/api/audit-trail?table=production_logs&record_id=${logId}`);
      const data = await res.json();
      setProdAuditData(Array.isArray(data) ? data : []);
      setProdAuditHistory(logId);
    } catch { setProdAuditData([]); setProdAuditHistory(logId); }
  };
"""
    text = text.replace(prod_old, prod_add, 1)
    changes += 1
    print("ProductionPage: edit+audit state ve handler eklendi")
else:
    print("ProductionPage: function bulunamadi")

# QUALITY PAGE
qual_func = re.search(r"function QualityPage\(\{[^}]+\}\)\s*\{", text)
if qual_func:
    qual_old = qual_func.group(0)
    qual_add = qual_old + """
  // EDIT system states
  const [editQuality, setEditQuality] = useState(null);
  const [editQualityForm, setEditQualityForm] = useState({});

  const openEditQuality = (check) => {
    setEditQualityForm({
      result: check.result || 'ok', defect_type: check.defect_type || '',
      notes: check.notes || '', checked_by: check.checked_by || ''
    });
    setEditQuality(check);
  };

  const handleUpdateQuality = async (e) => {
    e.preventDefault();
    try {
      const changes = [];
      Object.keys(editQualityForm).forEach(key => {
        const oldVal = String(editQuality[key] ?? '');
        const newVal = String(editQualityForm[key] ?? '');
        if (oldVal !== newVal) changes.push({ field_name: key, old_value: oldVal, new_value: newVal });
      });
      if (changes.length > 0) {
        await fetch('/api/audit-trail', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table_name: 'quality_checks', record_id: editQuality.id, changes, changed_by: 'admin' }) });
      }
      const res = await fetch(`/api/quality-checks/${editQuality.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editQualityForm)
      });
      if (!res.ok) throw new Error('Guncelleme hatasi');
      setEditQuality(null);
      addToast('success', 'Kalite kontrolu guncellendi!');
    } catch (err) { addToast('error', err.message); }
  };
"""
    text = text.replace(qual_old, qual_add, 1)
    changes += 1
    print("QualityPage: edit+audit state ve handler eklendi")
else:
    print("QualityPage: function bulunamadi")

# FASON PAGE
fason_func = re.search(r"function FasonPage\(\{[^}]+\}\)\s*\{", text)
if fason_func:
    fason_old = fason_func.group(0)
    fason_add = fason_old + """
  // EDIT system states
  const [editFason, setEditFason] = useState(null);
  const [editFasonForm, setEditFasonForm] = useState({});

  const openEditFason = (order) => {
    setEditFasonForm({
      quantity: order.quantity || 0, unit_price: order.unit_price || 0,
      sent_date: order.sent_date || '', expected_date: order.expected_date || '',
      received_quantity: order.received_quantity || 0, defective_count: order.defective_count || 0,
      quality_notes: order.quality_notes || '', status: order.status || 'beklemede'
    });
    setEditFason(order);
  };

  const handleUpdateFason = async (e) => {
    e.preventDefault();
    try {
      const changes = [];
      Object.keys(editFasonForm).forEach(key => {
        const oldVal = String(editFason[key] ?? '');
        const newVal = String(editFasonForm[key] ?? '');
        if (oldVal !== newVal) changes.push({ field_name: key, old_value: oldVal, new_value: newVal });
      });
      if (changes.length > 0) {
        await fetch('/api/audit-trail', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table_name: 'fason_orders', record_id: editFason.id, changes, changed_by: 'admin' }) });
      }
      const res = await fetch(`/api/fason/orders/${editFason.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFasonForm)
      });
      if (!res.ok) throw new Error('Guncelleme hatasi');
      setEditFason(null);
      addToast('success', 'Fason siparis guncellendi!');
    } catch (err) { addToast('error', err.message); }
  };
"""
    text = text.replace(fason_old, fason_add, 1)
    changes += 1
    print("FasonPage: edit+audit state ve handler eklendi")
else:
    print("FasonPage: function bulunamadi")

# COSTS PAGE
costs_func = re.search(r"function CostsPage\(\{[^}]+\}\)\s*\{", text)
if costs_func:
    costs_old = costs_func.group(0)
    costs_add = costs_old + """
  // EDIT system states
  const [editCost, setEditCost] = useState(null);
  const [editCostForm, setEditCostForm] = useState({});

  const openEditCost = (entry) => {
    setEditCostForm({
      category: entry.category || '', description: entry.description || '',
      amount: entry.amount || 0, unit: entry.unit || '', quantity: entry.quantity || 1,
      total: entry.total || 0
    });
    setEditCost(entry);
  };

  const handleUpdateCost = async (e) => {
    e.preventDefault();
    try {
      const changes = [];
      Object.keys(editCostForm).forEach(key => {
        const oldVal = String(editCost[key] ?? '');
        const newVal = String(editCostForm[key] ?? '');
        if (oldVal !== newVal) changes.push({ field_name: key, old_value: oldVal, new_value: newVal });
      });
      if (changes.length > 0) {
        await fetch('/api/audit-trail', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table_name: 'cost_entries', record_id: editCost.id, changes, changed_by: 'admin' }) });
      }
      const res = await fetch(`/api/costs/${editCost.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editCostForm)
      });
      if (!res.ok) throw new Error('Guncelleme hatasi');
      setEditCost(null);
      addToast('success', 'Maliyet guncellendi!');
    } catch (err) { addToast('error', err.message); }
  };
"""
    text = text.replace(costs_old, costs_add, 1)
    changes += 1
    print("CostsPage: edit+audit state ve handler eklendi")
else:
    print("CostsPage: function bulunamadi")

# ============================================================
# Eksik olan MachinesPage, CustomersPage, ShipmentsPage update
# fonksiyonlarina da audit trail ekle
# ============================================================

# MachinesPage
if "handleUpdateMachine" in text and "audit-trail" not in text[text.find("handleUpdateMachine"):text.find("handleUpdateMachine")+500]:
    old_m = "const handleUpdateMachine = async (e) => {\n\n    e.preventDefault();\n\n    try {"
    new_m = """const handleUpdateMachine = async (e) => {
    e.preventDefault();
    try {
      // Audit trail
      const changes = [];
      Object.keys(editMachineForm).forEach(key => {
        const oldVal = String(editMachine[key] ?? '');
        const newVal = String(editMachineForm[key] ?? '');
        if (oldVal !== newVal) changes.push({ field_name: key, old_value: oldVal, new_value: newVal });
      });
      if (changes.length > 0) {
        await fetch('/api/audit-trail', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table_name: 'machines', record_id: editMachine.id, changes, changed_by: 'admin' }) });
      }"""
    if old_m in text:
        text = text.replace(old_m, new_m, 1)
        changes += 1
        print("MachinesPage: audit trail eklendi")

# CustomersPage
if "handleUpdateCustomer" in text and "audit-trail" not in text[text.find("handleUpdateCustomer"):text.find("handleUpdateCustomer")+500]:
    old_c = "const handleUpdateCustomer = async (e) => {\n\n    e.preventDefault();\n\n    try {"
    new_c = """const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    try {
      // Audit trail
      const changes = [];
      Object.keys(editCustomerForm).forEach(key => {
        const oldVal = String(editCustomer[key] ?? '');
        const newVal = String(editCustomerForm[key] ?? '');
        if (oldVal !== newVal) changes.push({ field_name: key, old_value: oldVal, new_value: newVal });
      });
      if (changes.length > 0) {
        await fetch('/api/audit-trail', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table_name: 'customers', record_id: editCustomer.id, changes, changed_by: 'admin' }) });
      }"""
    if old_c in text:
        text = text.replace(old_c, new_c, 1)
        changes += 1
        print("CustomersPage: audit trail eklendi")

# ShipmentsPage
if "handleUpdateShipment" in text and "audit-trail" not in text[text.find("handleUpdateShipment"):text.find("handleUpdateShipment")+500]:
    old_s = "const handleUpdateShipment = async (e) => {\n\n    e.preventDefault();\n\n    try {"
    new_s = """const handleUpdateShipment = async (e) => {
    e.preventDefault();
    try {
      // Audit trail
      const changes = [];
      Object.keys(editShipmentForm).forEach(key => {
        const oldVal = String(editShipment[key] ?? '');
        const newVal = String(editShipmentForm[key] ?? '');
        if (oldVal !== newVal) changes.push({ field_name: key, old_value: oldVal, new_value: newVal });
      });
      if (changes.length > 0) {
        await fetch('/api/audit-trail', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table_name: 'shipments', record_id: editShipment.id, changes, changed_by: 'admin' }) });
      }"""
    if old_s in text:
        text = text.replace(old_s, new_s, 1)
        changes += 1
        print("ShipmentsPage: audit trail eklendi")

print(f"\n=== TOPLAM: {changes} degisiklik ===")
print(f"Boyut: {original_len} -> {len(text)}")

with open(path, "w", encoding="utf-8", newline="") as f:
    f.write(text)

print("KAYDEDILDI!")
