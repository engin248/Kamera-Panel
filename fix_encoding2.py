#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fix mojibake (double-encoded UTF-8) in page.js
"""
import re

path = r"c:\Users\Admin\Desktop\Kamera-Panel\app\app\page.js"

with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

print(f"File size: {len(text)} chars")

# Fix double \r\r\n -> \r\n
text = text.replace('\r\r\n', '\r\n')

def fix_mojibake_char(m):
    s = m.group(0)
    try:
        return s.encode('latin-1').decode('utf-8')
    except Exception:
        return s

# Replace known mojibake patterns for Turkish characters
# These are UTF-8 bytes that were read as Latin-1 and then stored as UTF-8 again
replacements = [
    # Turkish lowercase
    ('Ã¼', 'u\u0308'),   # u umlaut = u + combining umlaut... let's do explicit
]

# Better approach: find all sequences that look like double-encoded UTF-8
# Pattern: characters in the range 0xC0-0xFF followed by 0x80-0xBF range chars
# In Python string terms, these appear as multi-char sequences like 'Ã¼' = u00fc

# Direct character mapping for mojibake:
mojibake_map = {
    'Ã¼': '\u00fc',  # u with umlaut (u)
    'Ã¶': '\u00f6',  # o with umlaut (o)
    'Ã§': '\u00e7',  # c cedilla
    'Ã±': '\u00f1',  # n tilde
    'Ã–': '\u00d6',  # O with umlaut
    'Ã\u009c': '\u00dc',  # U with umlaut
    'Ä±': '\u0131',  # dotless i (Turkish)
    'Ä°': '\u0130',  # I with dot (Turkish)
    'ÅŸ': '\u015f',  # s cedilla (Turkish)
    'Åž': '\u015e',  # S cedilla (Turkish)
    'ÄŸ': '\u011f',  # g breve (Turkish)
    'Äž': '\u011e',  # G breve (Turkish)
    'Ã‡': '\u00c7',  # C cedilla
    '\u00c3\u0096': '\u00d6',  # O umlaut
    'Ã\u009d': '\u00dd',  # Y acute
    'Ã¢': '\u00e2',  # a circumflex
    'Ã®': '\u00ee',  # i circumflex
    'Ã›': '\u00db',  # U circumflex
    'Ã‰': '\u00c9',  # E acute
    'Ã¹': '\u00f9',  # u grave
    'Ã ': '\u00e0',  # a grave
}

total_fixes = 0
for bad, good in mojibake_map.items():
    count = text.count(bad)
    if count > 0:
        text = text.replace(bad, good)
        total_fixes += count
        print(f"  Fixed {count}x: '{repr(bad)}' -> '{good}'")

# Fix remaining Ã patterns using the latin1->utf8 trick
def fix_segment(m):
    s = m.group(0)
    try:
        fixed = s.encode('latin-1').decode('utf-8')
        return fixed
    except Exception:
        return s

# Pattern: sequences starting with Ã, Ä, Å followed by specific chars
import re
pattern = re.compile(r'[ÃÄÅƟ][^\x00-\x7F]')
before_len = len(text)
text = pattern.sub(fix_segment, text)
after_len = len(text)
print(f"Regex fix changed {before_len - after_len} chars")

# Fix emoji mojibake - these are 4-byte emojis encoded wrong
emoji_fixes = [
    ('ğŸ"‹', '\U0001f4cb'),   # 📋 clipboard
    ("ğŸ'\u0097", '\U0001f457'),  # 👗 dress
    ('ğŸ­', '\U0001f3ed'),   # 🏭 factory
    ('ğŸ"§', '\U0001f527'),   # 🔧 wrench
    ('ğŸ"¦', '\U0001f4e6'),   # 📦 package
    ('ğŸ'¥', '\U0001f465'),   # 👥 people
    ('ğŸ'°', '\U0001f4b0'),   # 💰 money
    ('ğŸ"‰', '\U0001f4c9'),   # 📉 chart down
    ('ğŸ"ˆ', '\U0001f4c8'),   # 📈 chart up
    ('ğŸ"Š', '\U0001f4ca'),   # 📊 bar chart
    ('ğŸ¤', '\U0001f91d'),    # 🤝 handshake
    ('ğŸ"±', '\U0001f4f1'),   # 📱 phone
    ('ğŸ§µ', '\U0001f9f5'),   # 🧵 thread
    ('ğŸ"·', '\U0001f4f7'),   # 📷 camera
    ('ğŸ"¸', '\U0001f4f8'),   # 📸 camera flash
    ('ğŸ"…', '\U0001f4c5'),   # 📅 calendar
    ('ğŸ"', '\U0001f50d'),    # 🔍 magnifier
    ('ğŸ"', '\U0001f4dd'),    # 📝 memo
    ('ğŸ"œ', '\U0001f4dc'),   # 📜 scroll
    ('ğŸ†', '\U0001f3c6'),    # 🏆 trophy
    ('ğŸ"Œ', '\U0001f4cc'),   # 📌 pin
    ('ğŸ'¡', '\U0001f4a1'),   # 💡 bulb
    ('ğŸ"¢', '\U0001f4e2'),   # 📢 loudspeaker
    ('ğŸ†', '\U0001f3c6'),    # 🏆 trophy
    ('ğŸ‡¹ğŸ‡·', '\U0001f1f9\U0001f1f7'),  # 🇹🇷 Turkey flag
    ('ğŸ‡¸ğŸ‡¦', '\U0001f1f8\U0001f1e6'),  # 🇸🇦 Saudi flag
    ('ğŸŽ¤', '\U0001f3a4'),   # 🎤 microphone
    ('ğŸŽ¯', '\U0001f3af'),   # 🎯 target
]

for bad, good in emoji_fixes:
    count = text.count(bad)
    if count > 0:
        text = text.replace(bad, good)
        total_fixes += count
        print(f"  Emoji fixed {count}x: '{bad}' -> '{good}'")

print(f"\nTotal fixes: {total_fixes}")

# Verify some Turkish words are correct now
checks = ['Siparişler', 'Modeller', 'Üretim', 'Müşteri', 'Personel', 'Kalite']
for c in checks:
    print(f"  '{c}' present: {c in text}")

with open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(text)

print(f"\nDone! Written {len(text)} chars to {path}")
