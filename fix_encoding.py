#!/usr/bin/env python3
"""
Aggressively fix mojibake in page.js using regex replacement.
Finds specific corrupted Turkish+emoji strings and replaces them.
"""
import re

path = r"c:\Users\Admin\Desktop\Kamera-Panel\app\app\page.js"

with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

print(f"File size: {len(text)} chars")
print(f"Line endings: \\r\\r\\n found: {'chr(13)+chr(13)+chr(10)' in repr(text[:200])}")

# Fix double \r\r\n -> \r\n (caused by Python writing \n over \r\n file)
text = text.replace('\r\r\n', '\r\n')
print(f"After CRLF fix, size: {len(text)} chars")

# Dictionary of known mojibake -> correct replacements
# Pattern: original UTF-8 bytes encoded as Latin-1, then stored as UTF-8
replacements = [
    # Turkish characters
    ('Ã¼', 'ü'), ('Ã¶', 'ö'), ('Ã§', 'ç'), ('Ã±', 'ñ'),
    ('Ã¼', 'ü'), ('Ã–', 'Ö'), ('Ã‡', 'Ç'), ('Ã', 'İ'),
    ('Ä±', 'ı'), ('Ä°', 'İ'), ('ÅŸ', 'ş'), ('Åž', 'Ş'),
    ('ÄŸ', 'ğ'), ('Äž', 'Ğ'), ('Ã¢', 'â'), ('Ã®', 'î'),
    ('Ã›', 'Û'), ('Ã‰', 'É'), ('Ã¹', 'ù'),
    # Common mojibake combos for Turkish
    ('Ã¼mrÃ¼t', 'ümrüt'),
    ('YeÅŸili', 'Yeşili'),
    ('AltÄ±n', 'Altın'),
    ('SarÄ±sÄ±', 'Sarısı'),
    ('SipariÅŸler', 'Siparişler'),
    ('Ã\x9cretim', 'Üretim'),
    ('Ã\x9cretim', 'Üretim'),
    ('\xc3\xbcretim', 'üretim'),
    # Emoji mojibake patterns (4-byte emoji encoded wrong)
    ('ğŸ"‹', '📋'), ('ğŸ'—', '👗'), ('ğŸ­', '🏭'), ('ğŸ"§', '🔧'),
    ('ğŸ"¦', '📦'), ('ğŸ'¥', '👥'), ('ğŸ'°', '💰'), ('ğŸ"‰', '📉'),
    ('ğŸ"ˆ', '📈'), ('ğŸ"Š', '📊'), ('ğŸ¤', '🤝'), ('ğŸ"±', '📱'),
    ('ğŸ§µ', '🧵'), ('ğŸ'ˆ', '👈'), ('ğŸ'‰', '👉'), ('ğŸ"·', '📷'),
    ('ğŸ"¸', '📸'), ('ğŸ"…', '📅'), ('ğŸ"†', '📆'), ('ğŸ"', '🔍'),
    ('ğŸ""', '🔒'), ('ğŸ"—', '🔗'), ('ğŸ'¾', '💾'), ('ğŸ—'ï¸', '🗑️'),
    ('ğŸ—ƒï¸', '🗃️'), ('ğŸ'ï¸', '👁️'), ('âœï¸', '✏️'), ('âœ…', '✅'),
    ('âŒ', '❌'), ('â", '⏳'), ('â—½', '◽'), ('â⁰', '⏹'),
    ('ğŸŽ¤', '🎤'), ('ğŸ‡¹ğŸ‡·', '🇹🇷'), ('ğŸ‡¸ğŸ‡¦', '🇸🇦'),
    ('â†©', '↩'), ('â˜', '✍️'), ('âš™ï¸', '⚙️'),
    ('ğŸ"Œ', '📌'), ('ğŸ'¡', '💡'), ('ğŸ"', '📝'), ('ğŸ"œ', '📜'),
    ('ğŸ†', '🏆'), ('ğŸ…', '🏅'), ('ğŸŽ¯', '🎯'), ('ğŸ"¢', '📢'),
    # More Turkish
    ('Ã\x9cretim', 'Üretim'), ('Ã\x9cret', 'Üret'),
]

total_fixes = 0
for bad, good in replacements:
    count = text.count(bad)
    if count > 0:
        text = text.replace(bad, good)
        total_fixes += count
        print(f"  Fixed {count}x: '{bad}' -> '{good}'")

print(f"\nTotal fixes: {total_fixes}")

# Now do a broader regex fix for remaining patterns
# Pattern: Ã followed by a character = UTF-8 2-byte sequence encoded wrong
def fix_mojibake_char(m):
    s = m.group(0)
    try:
        return s.encode('latin-1').decode('utf-8')
    except:
        return s

# Find remaining Ã patterns
remaining = re.findall(r'Ã.', text)
if remaining:
    print(f"Remaining Ã patterns: {len(remaining)}")
    print(f"Examples: {list(set(remaining))[:10]}")

# Apply broad fix
before = text
text = re.sub(r'[ÃÄÅğŸâÄ€-Ä¿Å€-Å¾ğ][^\x00-\x7F\u0100-\uFFFF]', fix_mojibake_char, text)

# Verify
checks = ['Siparişler', 'Modeller', 'Üretim', 'Müşteri']
for c in checks:
    print(f"'{c}' in text: {c in text}")

with open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(text)

print(f"\nDone! Written {len(text)} chars")
