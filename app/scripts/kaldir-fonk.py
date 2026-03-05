"""page.js'ten buyuk fonksiyonlari kaldir, import ekle"""

def read_file(path):
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

content = read_file('app/page.js')
lines = content.split('\n')
total = len(lines)
print(f"Toplam satir: {total}")

# Kaldirilacak aralıklar (0-indexed):
# NewModelModal: 829-1711 (bitis: 1711, bir sonraki 1712'den basliyor)
# NewOperationModal: 1717-3288
# NewPersonnelModal + EditableSelect + EditableInput: 3290-4278
# (EditableSelect ve EditableInput NewPersonnelModal icin kullaniliyor)

# Fonksiyonları işaretle
# NewModelModal: 830-1712 (1-indexed) = 829-1711 (0-indexed)
# Aralarındaki comment satırları dahil: 828-1715
# NewOperationModal: 1718-3289 (1-indexed) = 1717-3288 (0-indexed)
# Aralarındaki comment dahil: 1715-3291
# EditableSelect: 3295-3348, EditableInput: 3350-3357 (1-indexed) = 3294-3356 (0-indexed)
# NewPersonnelModal: 3362-4279 (1-indexed) = 3361-4278 (0-indexed)
# Tum bu blok: 3290-4278 (0-indexed)

# Cıkarılacak satırlar
remove_ranges = [
    (828, 1716),   # NewModelModal + oncesi/sonrasi bos satirlar
    (1716, 3292),  # NewOperationModal
    (3289, 4279),  # EditableSelect, EditableInput, NewPersonnelModal
]

# Satirları işaretle - büyükten kücüğe sil
to_remove = set()
for start, end in remove_ranges:
    for i in range(start, min(end, len(lines))):
        to_remove.add(i)

# Import satırları bul ve ekle
import_line_idx = None
for i, line in enumerate(lines[:15]):
    if "import {" in line and "react" in line.lower():
        import_line_idx = i
        break

# Yeni import satirlari
new_imports = [
    "import NewModelModal from '@/components/modals/NewModelModal';",
    "import NewOperationModal from '@/components/modals/NewOperationModal';",
    "import NewPersonnelModal from '@/components/modals/NewPersonnelModal';",
    "import { EditableSelect, EditableInput } from '@/components/modals/NewPersonnelModal';",
]

# Yeni içerik oluştur
new_lines = []
imports_added = False
for i, line in enumerate(lines):
    if i in to_remove:
        continue
    new_lines.append(line)
    # React import satırından sonra yeni importları ekle
    if not imports_added and import_line_idx is not None and i == import_line_idx:
        new_lines.extend(new_imports)
        imports_added = True

new_content = '\n'.join(new_lines)
write_file('app/page.js', new_content)

new_size = len(new_content.encode('utf-8'))
print(f"Yeni satir sayisi: {len(new_lines)}")
print(f"Yeni boyut: {new_size//1024}KB (eskisi 721KB)")
print("Tamamlandi!")
