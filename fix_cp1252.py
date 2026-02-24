import re

path = r"c:\Users\Admin\Desktop\Kamera-Panel\app\app\page.js"

with open(path, "r", encoding="utf-8") as f:
    text = f.read()

print("Boyut:", len(text))

# Windows-1252 bytes 0x80-0x9F are mapped to different Unicode codepoints.
# When the file was double-encoded, these bytes became their cp1252 Unicode equivalents.
# We need to map them back to their raw byte values for proper latin-1->utf-8 decode.
cp1252_to_byte = {
    0x20AC: 0x80,  # Euro sign
    0x201A: 0x82,  # Single low quotation mark
    0x0192: 0x83,  # Latin small f with hook
    0x201E: 0x84,  # Double low quotation mark
    0x2026: 0x85,  # Horizontal ellipsis
    0x2020: 0x86,  # Dagger
    0x2021: 0x87,  # Double dagger
    0x02C6: 0x88,  # Modifier letter circumflex
    0x2030: 0x89,  # Per mille sign
    0x0160: 0x8A,  # S with caron
    0x2039: 0x8B,  # Single left-pointing angle quotation
    0x0152: 0x8C,  # OE ligature
    0x017D: 0x8D,  # Z with caron
    0x2018: 0x91,  # Left single quotation mark
    0x2019: 0x92,  # Right single quotation mark
    0x201C: 0x93,  # Left double quotation mark
    0x201D: 0x94,  # Right double quotation mark
    0x2022: 0x95,  # Bullet
    0x2013: 0x96,  # En dash
    0x2014: 0x97,  # Em dash
    0x02DC: 0x98,  # Small tilde
    0x2122: 0x99,  # Trade mark sign
    0x0161: 0x9A,  # s with caron
    0x203A: 0x9B,  # Single right-pointing angle quotation
    0x0153: 0x9C,  # oe ligature
    0x017E: 0x9D,  # z with caron
    0x0178: 0x9E,  # Y with diaeresis
}

def char_to_byte(c):
    """Convert a character to its byte value, handling cp1252 special range"""
    cp = ord(c)
    if cp in cp1252_to_byte:
        return cp1252_to_byte[cp]
    if cp < 256:
        return cp
    return None

def fix_double_encoded(text):
    """Fix characters that were double-encoded through cp1252->unicode->utf8"""
    result = []
    i = 0
    fixes = 0
    while i < len(text):
        c = text[i]
        cp = ord(c)
        
        # Check if this is a UTF-8 lead byte (0xC0-0xFF range)
        if 0xC0 <= cp <= 0xFF and i + 1 < len(text):
            next_c = text[i + 1]
            next_byte = char_to_byte(next_c)
            
            if next_byte is not None and 0x80 <= next_byte <= 0xBF:
                # This looks like a double-encoded 2-byte UTF-8 sequence
                try:
                    decoded = bytes([cp, next_byte]).decode("utf-8")
                    result.append(decoded)
                    i += 2
                    fixes += 1
                    continue
                except:
                    pass
        
        # Check for 4-byte emoji sequences (F0 xx xx xx)
        # These appear as sequences of cp1252-mangled characters
        if cp == 0xC3 and i + 5 < len(text):
            # Could be start of a 4-byte sequence: C3 B0 = F0 (first byte)
            next_byte = char_to_byte(text[i + 1])
            if next_byte is not None:
                try:
                    first = bytes([cp, next_byte]).decode("utf-8")
                    if ord(first) >= 0xF0:
                        # 4-byte UTF-8 sequence
                        b2 = char_to_byte(text[i + 2]) if i + 2 < len(text) else None
                        b3 = char_to_byte(text[i + 3]) if i + 3 < len(text) else None
                        b4 = char_to_byte(text[i + 4]) if i + 4 < len(text) else None
                        if all(b is not None for b in [b2, b3, b4]):
                            try:
                                emoji = bytes([ord(first), b2, b3, b4]).decode("utf-8")
                                result.append(emoji)
                                i += 5
                                fixes += 1
                                continue
                            except:
                                pass
                except:
                    pass
        
        result.append(c)
        i += 1
    
    return "".join(result), fixes

text, fixes = fix_double_encoded(text)
print(f"Double-encode fixes: {fixes}")

# Verify critical words
checks = [
    ("Siparis", "Sipari\u015f"),
    ("Utu", "\u00dct\u00fc"),
    ("Urun", "\u00dcr\u00fcn"),
    ("ON GORSEL", "\u00d6N G\u00d6RSEL"),
    ("Uretimde", "\u00dcretimde"),
    ("Musteri", "M\u00fc\u015fteri"),
    ("Modeller", "Modeller"),
    ("Nakis", "Nak\u0131\u015f"),
]

print("\nDogrulama:")
for label, word in checks:
    found = word in text
    status = "OK" if found else "EKSIK"
    print(f"  {label} ({word}): {status}")

with open(path, "w", encoding="utf-8", newline="") as f:
    f.write(text)

print("\nKAYDEDILDI!")
