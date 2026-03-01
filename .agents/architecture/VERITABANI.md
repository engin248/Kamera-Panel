# 🗄️ VERİTABANI ŞEMASI — KAMERA-PANEL

> **Dosya:** `app/data/kamera-panel.db`  
> **Motor:** SQLite (better-sqlite3)  
> **Pragma:** WAL mode + Foreign Keys ON  
> **Son Güncelleme:** 2026-03-01

---

## 📋 TABLO: `models` (Modeller)

Model teknik kartı — Her konfeksiyon modeli için bir kayıt.

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| `id` | INTEGER PK | Otomatik artan |
| `name` | TEXT | Model adı (örn: "Bayan Bluz A") |
| `code` | TEXT UNIQUE | Benzersiz model kodu |
| `order_no` | TEXT | Sipariş numarası |
| `modelist` | TEXT | Modelisti kim yaptı |
| `customer` | TEXT | Müşteri adı (text) |
| `customer_id` | INTEGER | Müşteri FK |
| `description` | TEXT | Açıklama |
| `fabric_type` | TEXT | Kumaş türü |
| `sizes` | TEXT | Bedenler (metin, boşlukla ayrılmış) |
| `size_range` | TEXT | Beden aralığı |
| `total_order` | INTEGER | Toplam sipariş adedi |
| `total_order_text` | TEXT | Sipariş + metin açıklama |
| `completed_count` | INTEGER | Tamamlanan adet |
| `fason_price` | REAL | Fason birim fiyat (₺) |
| `fason_price_text` | TEXT | Fiyat + metin açıklama |
| `model_difficulty` | INTEGER | Zorluk 1-10 |
| `front_image` | TEXT | Ön fotoğraf path |
| `back_image` | TEXT | Arka fotoğraf path |
| `measurement_table` | TEXT | Ölçü tablosu (JSON/metin) |
| `delivery_date` | DATE | Teslimat tarihi |
| `work_start_date` | DATE | Üretim başlangıç tarihi |
| `post_sewing` | TEXT | Dikimsonrası işlemler |
| `garni` | TEXT | Garni bilgisi |
| `color_count` | INTEGER | Renk sayısı |
| `color_details` | TEXT | Renk detayları |
| `size_count` | INTEGER | Beden sayısı |
| `size_distribution` | TEXT | Beden dağılımı |
| `asorti` | TEXT | Asorti bilgisi |
| `total_operations` | INTEGER | Toplam operasyon sayısı |
| `piece_count` | INTEGER | Parça sayısı |
| `piece_count_details` | TEXT | Parça listesi detayı |
| `op_kesim_count` | INTEGER | Kesim operasyon sayısı |
| `op_kesim_details` | TEXT | Kesim detayları |
| `op_dikim_count` | INTEGER | Dikim operasyon sayısı |
| `op_dikim_details` | TEXT | Dikim detayları |
| `op_utu_paket_count` | INTEGER | Ütü/paket operasyon sayısı |
| `op_utu_paket_details` | TEXT | Ütü/paket detayları |
| `op_nakis_count` | INTEGER | Nakış operasyon sayısı |
| `op_nakis_details` | TEXT | Nakış detayları |
| `op_yikama_count` | INTEGER | Yıkama operasyon sayısı |
| `op_yikama_details` | TEXT | Yıkama detayları |
| `has_lining` | INTEGER | Astar var mı? (0/1) |
| `lining_pieces` | INTEGER | Astar parça sayısı |
| `has_interlining` | INTEGER | Tela var mı? (0/1) |
| `interlining_parts` | TEXT | Tela parçaları |
| `interlining_count` | INTEGER | Tela parça sayısı |
| `difficult_points` | TEXT | Zor noktalar |
| `critical_points` | TEXT | Kritik noktalar |
| `customer_requests` | TEXT | Müşteri talepleri |
| `status` | TEXT | `prototip` / `seri_uretim` / `tamamlandi` |
| `cutting_info` | TEXT | Kesim bilgisi |
| `accessory_info` | TEXT | Aksesuar bilgisi |
| `label_info` | TEXT | Etiket bilgisi |
| `deleted_at` | TEXT | Soft-delete tarihi |
| `deleted_by` | TEXT | Soft-delete yapan |
| `created_at` | DATETIME | Oluşturma zamanı |
| `updated_at` | DATETIME | Güncelleme zamanı |

---

## 📋 TABLO: `personnel` (Personel)

P1-P11 kriterli tam personel profili.

| Sütun Grubu | Sütunlar |
|-------------|----------|
| **Kimlik (P1)** | `name`, `national_id`, `birth_date`, `gender`, `education`, `children_count`, `blood_type`, `military_status`, `emergency_contact_*`, `smokes`, `prays`, `transport_type`, `turkish_level`, `living_status`, `disability_status` |
| **İş Geçmişi (P2)** | `role`, `department`, `position`, `start_date`, `contract_type`, `sgk_entry_date`, `previous_workplaces`, `leave_reason`, `leave_types` |
| **Ücret (P3)** | `daily_wage`, `base_salary`, `transport_allowance`, `ssk_cost`, `food_allowance`, `compensation` |
| **Beceri (P4)** | `skill_level`, `machines`, `skills`, `capable_operations`, `operation_skill_scores`, `learning_speed`, `independence_level`, `finger_dexterity`, `color_perception`, `sample_reading` |
| **Makine (P5)** | `preferred_machine`, `most_efficient_machine`, `maintenance_skill`, `machine_adjustment_care`, `machine_adjustments` |
| **Fiziksel (P6)** | `physical_endurance`, `eye_health`, `health_restrictions`, `body_type`, `work_capacity`, `isg_training_date`, `last_health_check` |
| **Karakter (P7)** | `reliability`, `hygiene`, `change_openness`, `responsibility_acceptance`, `error_stance` |
| **Üretim (P8-P9)** | `daily_avg_output`, `error_rate`, `efficiency_score`, `color_tone_matching`, `critical_matching_responsibility`, `fabric_experience` |
| **Gelişim (P10)** | `new_machine_learning`, `hard_work_avoidance`, `self_improvement`, `training_needs`, `general_evaluation` |
| **Performans (P11)** | `operator_class`, `satisfaction_score`, `recommend`, `weekly_note`, `leadership_potential` |
| **Sistem** | `status`, `language`, `work_start`, `work_end`, `adaptation_status`, `photo_url`, `phone`, `deleted_at`, `deleted_by`, `created_at` |

---

## 📋 TABLO: `production_logs` (Üretim Kayıtları)

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| `model_id` | FK | Hangi model |
| `operation_id` | FK | Hangi operasyon |
| `personnel_id` | FK | Hangi personel |
| `start_time` | DATETIME | Başlangıç |
| `end_time` | DATETIME | Bitiş |
| `total_produced` | INTEGER | Üretilen adet |
| `defective_count` | INTEGER | Hatalı adet |
| `defect_reason` | TEXT | Hata nedeni |
| `defect_source` | TEXT | `operator`/`machine`/`material` |
| `defect_photo` | TEXT | Hata fotoğrafı |
| `defect_classification` | TEXT | Hata sınıflandırması |
| `oee_score` | REAL | OEE skoru (%) |
| `first_pass_yield` | REAL | İlk geçiş verimi (%) |
| `takt_time_ratio` | REAL | Takt zamanı oranı |
| `quality_score` | REAL | Kalite puanı |
| `unit_value` | REAL | Birim değer (₺) |
| `net_work_minutes` | REAL | Net çalışma süresi |
| `notes` | TEXT | Notlar |
| `deleted_at` | TEXT | Soft-delete |

---

## 📋 DIĞER TABLOLAR (Özet)

| Tablo | Temel Alanlar |
|-------|---------------|
| `operations` | model_id, name, machine_type, standard_time_min/max, unit_price, operation_category, required_skill_level |
| `quality_checks` | production_log_id, result (ok/red/warning), defect_type, photo_path |
| `orders` | customer_id, model_id, quantity, delivery_date, status, deleted_at |
| `customers` | name, company, phone, email, address, tax_no |
| `machines` | name, type, brand, serial_no, status, sub_type, count, category |
| `fason_providers` | name, phone, speciality, quality_rating |
| `fason_orders` | provider_id, model_id, quantity, unit_price, status |
| `shipments` | model_id, customer_id, quantity, shipment_date, cargo_company |
| `cost_entries` | model_id, category, amount, quantity, total |
| `business_expenses` | category, amount, year, month, is_recurring |
| `users` | username, role (koordinator/ustabasi/kaliteci/operator) |
| `audit_trail` | table_name, record_id, field_name, old_value, new_value |

---

## ⚠️ VERİTABANI KURALLARI

1. `CREATE TABLE` → ASLA değiştirme, sadece `ALTER TABLE` ekle
2. Soft-delete kullan: `deleted_at IS NULL` filtresi ekle
3. Her kritik işlem `audit_trail`'e kaydedilir
4. `activity_log` — kim ne zaman ne yaptı kaydı
5. Migration'lar `alterStatements[]` dizisine eklenir
