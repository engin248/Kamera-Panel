"""page.js'den buyuk bilesenleri ayri dosyalara tas"""
import os

def read_js(path, encoding='utf-8'):
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        return f.readlines()

def write_file(path, lines, header_lines=None):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    content = ''
    if header_lines:
        content = '\n'.join(header_lines) + '\n\n'
    content += ''.join(lines)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Olusturuldu: {path} ({len(content)//1024}KB, {len(lines)} satir)")

page_path = 'app/page.js'
lines_raw = read_js(page_path)

# 0-indexed satirlar
# NewOperationModal: satir 1718-3289 (0-indexed: 1717-3288)
new_op_modal = lines_raw[1717:3289]
write_file(
    'app/components/modals/NewOperationModal.jsx',
    new_op_modal,
    ["'use client';", "", "import { useState, useEffect, useCallback, useRef } from 'react';", ""]
)

# NewPersonnelModal: satir 3362-4279 (0-indexed: 3361-4278)
new_pers_modal = lines_raw[3361:4279]
write_file(
    'app/components/modals/NewPersonnelModal.jsx',
    new_pers_modal,
    ["'use client';", "", "import { useState, useEffect, useCallback } from 'react';", "export { EditableSelect, EditableInput };", ""]
)

# NewModelModal: satir 830-1712 (0-indexed: 829-1711)
new_model_modal = lines_raw[829:1712]
write_file(
    'app/components/modals/NewModelModal.jsx',
    new_model_modal,
    ["'use client';", "", "import { useState, useEffect, useCallback, useRef, useMemo } from 'react';", ""]
)

print("Tum dosyalar olusturuldu!")
