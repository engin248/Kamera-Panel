import re
import sys

path = r"c:\Users\Admin\Desktop\Kamera-Panel\app\app\page.js"

with open(path, "r", encoding="utf-8") as f:
    text = f.read()

print("Dosya boyutu:", len(text), "karakter")

# ============================================
# KATMAN 1: Kalan Turkce double-encode fixes
# ============================================
turkish_fixes = {
    "\u00c3\u0178": "\u015f",   # ÅŸ -> ş  (remaining)
    "\u0160": "\u015e",          # single char Ş
    "\u0178": "\u015f",          # single char ş (context dependent)
}

# Broader pattern: any 2-char sequence that decodes as latin1->utf8
def fix_double_encode(m):
    s = m.group(0)
    try:
        return s.encode("latin-1").decode("utf-8")
    except:
        return s

# ============================================
# KATMAN 2: Explicit string replacements
# ============================================
explicit_fixes = [
    # Turkish comment/string fragments still broken
    ("G\u00c3\u0096RSEL Y\u00c3\u009cKLEME", "G\u00d6RSEL Y\u00dcKLEME"),
    ("\u00c3\u0096nizleme", "\u00d6nizleme"),
    ("SE\u00c3\u0087ENEKLER\u0130", "SE\u00c7ENEKLER\u0130"),
    ("\u00c3\u0096N G\u00c3\u0096RSEL", "\u00d6N G\u00d6RSEL"),
    ("ARKA G\u00c3\u0096RSEL", "ARKA G\u00d6RSEL"),
    ("\u00c3\u009cr\u00fcn", "\u00dcr\u00fcn"),
    ("\u00c3\u009cretimde", "\u00dcretimde"),
    ("\u00c3\u0096l\u00e7\u00fc", "\u00d6l\u00e7\u00fc"),
    ("M\u00fc\u015fteri \u00c3\u0096zel", "M\u00fc\u015fteri \u00d6zel"),
    
    # ÅŸ -> ş (remaining instances)
    ("Olu\u0160tur", "Olu\u015ftur"),
    ("giri\u0160i", "giri\u015fi"),
    ("Sipari\u0160", "Sipari\u015f"),
    ("M\u00fc\u0160teri", "M\u00fc\u015fteri"),
    ("Kuma\u0160", "Kuma\u015f"),
    ("Nak\u0131\u0160", "Nak\u0131\u015f"),
    ("\u0130\u0160e", "\u0130\u015fe"),
    ("Ba\u0160lama", "Ba\u015flama"),
    ("De\u011fi\u0160tirmek", "De\u011fi\u015ftirmek"),
    ("Aral\u0131\u011f\u0131", "Aral\u0131\u011f\u0131"),  # already correct actually
    ("\u0130\u0160lemler", "\u0130\u015flemler"),
    ("konu\u0160un", "konu\u015fun"),
    
    # Em dash
    ("\u00e2\u20ac\u201c", "\u2014"),   # â€" -> —
    ("\u00e2\u20ac\u201d", "\u2014"),   # â€" variant
    
    # Turkish Lira
    ("\u00e2\u201a\u00ba", "\u20ba"),   # â‚º -> ₺
    
    # Emoji fixes (triple-encoded 4-byte emojis)
    ("g\u0178\u201c\u2039", "\U0001f4cb"),    # ğŸ"‹ -> 📋
    ("g\u0178\u2019\u2014", "\U0001f4cb"),    # another clipboard variant
    ("g\u0178\u201c\u2039\u00e2\u20ac\u2122\u00be", "\U0001f4be"),  # 💾
    ("g\u0178\u2019\u201d", "\U0001f457"),    # ğŸ'— -> 👗
    ("g\u0178\u2019\u2014", "\U0001f457"),    # another dress variant  
    ("g\u0178\u0178", "\U0001f4f8"),          # ğŸ"¸ -> 📸
    ("g\u0178\u201c\u2026", "\U0001f4c5"),    # ğŸ"… -> 📅
    ("g\u0178\u201c\u0178", "\U0001f4dd"),    # ğŸ" -> 📝
    ("g\u0178\u00a7\u00b5", "\U0001f9f5"),    # ğŸ§µ -> 🧵
    ("g\u0178\u00a7\u00a5", "\U0001f9e5"),    # ğŸ§¥ -> 🧥
    ("g\u0178\u0152", "\U0001f3a8"),          # ğŸ¨ -> 🎨
    ("g\u0178\u2021\u00b9g\u0178\u2021\u00b7", "\U0001f1f9\U0001f1f7"),  # 🇹🇷
    ("g\u0178\u2021\u00b8g\u0178\u2021\u00a6", "\U0001f1f8\U0001f1e6"),  # 🇸🇦
    ("g\u0178\u00a4", "\U0001f3a4"),          # ğŸ¤ -> 🎤
    
    # Symbol fixes
    ("\u00e2\u0178\u00b9", "\u23f9"),          # â¹ -> ⏹
    ("\u00e2\u0153\u2022", "\u2715"),          # âœ• -> ✕
    ("\u00e2\u0153\u00a7", "\u2727"),          # âœ§ -> ✧
    ("\u00e2\u0153\u201a\u00ef\u00b8\u008f", "\u2702\ufe0f"),  # âœ‚ï¸ -> ✂️
    ("\u00e2\u0153\u0026#201a;", "\u2702"),
    ("\u00e2\u0153\u0026#8218;", "\u2702"),    
    ("\u00e2\u0153\u0026#x85;", "\u2705"),     # âœ… -> ✅
    ("\u00e2\u0153\u2026", "\u2705"),          # âœ… -> ✅
    ("\u00e2\u0161\u00a0\u00ef\u00b8\u008f", "\u26a0\ufe0f"),  # âš ï¸ -> ⚠️
    ("\u00e2\u0153\u201a", "\u2702"),          # partial scissors
    ("\u00e2\u0153\u0178", "\u270f\ufe0f"),    # a pen
    ("\u00e2\u00b3", "\u23f3"),                # â³ -> ⏳
]

total = 0
for bad, good in explicit_fixes:
    count = text.count(bad)
    if count > 0:
        text = text.replace(bad, good)
        total += count
        print(f"  Fixed {count}x: {repr(bad[:30])} -> {repr(good)}")

print(f"\nToplam explicit fix: {total}")

# ============================================
# KATMAN 3: Remaining ÅŸ pattern
# ============================================
# ÅŸ = \u00c5\u0178 in some encodings -> should be ş
remaining_sh = text.count("\u00c5\u0178")
if remaining_sh > 0:
    text = text.replace("\u00c5\u0178", "\u015f")
    print(f"  Fixed {remaining_sh}x: ÅŸ -> ş")
    total += remaining_sh

# Ãœ remaining
remaining_u = text.count("\u00c3\u009c")
if remaining_u > 0:
    text = text.replace("\u00c3\u009c", "\u00dc")
    print(f"  Fixed {remaining_u}x: Ãœ -> Ü")
    total += remaining_u

# Ã– remaining  
remaining_o = text.count("\u00c3\u0096")
if remaining_o > 0:
    text = text.replace("\u00c3\u0096", "\u00d6")
    print(f"  Fixed {remaining_o}x: Ã– -> Ö")
    total += remaining_o

# Ã‡ remaining
remaining_c = text.count("\u00c3\u0087")
if remaining_c > 0:
    text = text.replace("\u00c3\u0087", "\u00c7")
    print(f"  Fixed {remaining_c}x: Ã‡ -> Ç")
    total += remaining_c

print(f"\nGrand total: {total}")

with open(path, "w", encoding="utf-8", newline="") as f:
    f.write(text)

print("KAYDEDILDI!")
