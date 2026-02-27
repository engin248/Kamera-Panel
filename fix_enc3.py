# -*- coding: utf-8 -*-
# Fix encoding for page.js
# Uses escape sequences to avoid encoding issues in the script file itself

path = r"c:\Users\Admin\Desktop\Kamera-Panel\app\app\page.js"

with open(path, "rb") as f:
    raw = f.read()

# The file is UTF-8, but some strings are double-encoded:
# original UTF-8 bytes were interpreted as Latin-1, then re-encoded as UTF-8
# So we need to find those sequences and fix them

# Read as UTF-8 first to get a string
try:
    text = raw.decode("utf-8")
except:
    text = raw.decode("latin-1")

# Mojibake mapping: wrong -> correct
# Each "wrong" char is what you see when UTF-8 bytes are read as Latin-1 then stored as UTF-8
# Format: (wrong_unicode_string, correct_unicode_string)
fixes = [
    # Turkish lowercase
    ("\u00c4\u00b1", "\u0131"),   # Ä± -> ı (dotless i)
    ("\u00c5\u00b8", "\u015f"),   # ÅŸ -> ş (s cedilla)
    ("\u00c4\u009f", "\u011f"),   # ÄŸ -> ğ (g breve)
    ("\u00c3\u00bc", "\u00fc"),   # Ã¼ -> ü (u umlaut)
    ("\u00c3\u00b6", "\u00f6"),   # Ã¶ -> ö (o umlaut)
    ("\u00c3\u00a7", "\u00e7"),   # Ã§ -> ç (c cedilla)
    # Turkish uppercase
    ("\u00c4\u00b0", "\u0130"),   # İ (I with dot above)
    ("\u00c5\u009e", "\u015e"),   # Åž -> Ş (S cedilla)
    ("\u00c4\u009e", "\u011e"),   # Äž -> Ğ (G breve)
    ("\u00c3\u0087", "\u00c7"),   # Ã‡ -> Ç (C cedilla)
    ("\u00c3\u0096", "\u00d6"),   # Ã– -> Ö (O umlaut)
    ("\u00c3\u009c", "\u00dc"),   # Ãœ -> Ü (U umlaut)
    # Other common chars
    ("\u00c3\u00a2", "\u00e2"),   # Ã¢ -> â
    ("\u00c3\u0099", "\u00d9"),   # Ã™ -> Ù
    ("\u00c3\u009b", "\u00db"),   # Ã› -> Û
]

total = 0
for bad, good in fixes:
    count = text.count(bad)
    if count > 0:
        text = text.replace(bad, good)
        total += count
        print("Fixed %d x U+%04X U+%04X -> U+%04X (%s)" % (
            count,
            ord(bad[0]), ord(bad[1]) if len(bad)>1 else 0,
            ord(good[0]),
            good.encode("utf-8")
        ))

print("Total fixes: %d" % total)

# Verify
checks = [
    ("\u0130stanbul", False),
    ("Sipari\u015fler", True),  # Siparişler
    ("Modeller", True),
    ("\u00dcretim", True),       # Üretim
    ("M\u00fc\u015fteri", True), # Müşteri
]
for word, should_exist in checks:
    found = word in text
    status = "OK" if found == should_exist else "MISSING"
    print("%s: %s in text" % (status, word.encode("utf-8")))

with open(path, "w", encoding="utf-8", newline="") as f:
    f.write(text)

print("Done! Saved %d chars." % len(text))
