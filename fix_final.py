import re

path = r"c:\Users\Admin\Desktop\Kamera-Panel\app\app\page.js"

with open(path, "r", encoding="utf-8") as f:
    text = f.read()

print("ONCESI:", len(text))

# ============================================================
# MASTER FIX: Convert ALL remaining ğŸ emoji patterns
# ğ = U+011F, Ÿ = U+0178
# These represent triple-encoded 4-byte emojis
# Original: F0 9F XX XX
# After triple encoding: ğ(\u011F) Ÿ(\u0178) + 2 more chars
# The 3rd and 4th chars encode the XX XX bytes through cp1252
# ============================================================

CP1252_MAP = {
    0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84,
    0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88,
    0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C,
    0x017D: 0x8D, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93,
    0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
    0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B,
    0x0153: 0x9C, 0x017E: 0x9D, 0x0178: 0x9E,
}

def to_byte(c):
    cp = ord(c)
    if cp in CP1252_MAP:
        return CP1252_MAP[cp]
    if cp < 256:
        return cp
    return None

# Process character by character
result = []
i = 0
n = len(text)
emoji_fixes = 0
other_fixes = 0

while i < n:
    c = text[i]
    
    # Pattern: ğŸ + 2 chars = triple-encoded emoji
    if c == "\u011f" and i + 3 < n and text[i+1] == "\u0178":
        # ğ = encoded from C4 9F (UTF-8 for U+011F)
        # Original byte was F0 (emoji lead byte)
        # Ÿ = U+0178 -> cp1252 byte 0x9E -> but emoji second byte is 0x9F
        # Wait: U+0178 cp1252 = 0x9E, not 0x9F
        # Hmm. Let me reconsider.
        # Actually ğ in UTF-8 = C4 9F
        # If the original bytes were F0 9F, read as UTF-8 incorrectly:
        #   No, F0 9F is start of a 4-byte sequence
        # 
        # The path was: F0 9F XX XX (original emoji bytes)
        # 1. Read as latin-1: each byte becomes a char: \xF0 \x9F \xXX \xXX
        # 2. Written as UTF-8: \xF0 -> C3 B0, \x9F -> C2 9F, etc.
        # 3. Read as latin-1 AGAIN: C3->Ã B0->° C2->Â 9F->\x9F
        # 4. Written as UTF-8 AGAIN: Ã->C3 83, °->C2 B0, etc.
        # This would give us the original C3 sequence not ğ.
        #
        # Alternative path: F0 9F XX XX
        # 1. Read as cp1252: F0->\xF0, 9F->(undefined in cp1252, mapped to \x9F), etc.
        # 2. Encode to UTF-8: \xF0 -> C3 B0, \x9F -> C2 9F
        # Then some partial fix decoded C3 B0 -> ð -> no
        #
        # ACTUALLY the simplest explanation:
        # ğ (\u011F) UTF-8 = C4 9F
        # If text had C4 9F and was read as latin-1: Ä (C4) + \x9F
        # Then \x9F in cp1252 = nothing standard, but somehow became...
        # NOT matching.
        #
        # Let me just check: does U+011F U+0178 look like garbled F0 9F?
        # ğ = C4 9F in UTF-8 bytes
        # Previous fix converted some C4 9F -> ğ correctly
        # But F0 = C3 B0 in UTF-8 -> if read as latin-1 pairs...
        #
        # PRAGMATIC: the pattern ğŸ consistently appears before emojis
        # The 3rd byte (offset 2) should map to the 3rd byte of the emoji
        # The 4th byte (offset 3) should map to the 4th byte
        # We know emoji = F0 9F XX XX
        # So byte 1 = F0, byte 2 = 9F (these became ğŸ)
        # byte 3 and 4 are encoded through the cp1252 mapping
        
        b3 = to_byte(text[i+2])
        b4 = to_byte(text[i+3])
        
        if b3 is not None and b4 is not None and 0x80 <= b3 <= 0xBF and 0x80 <= b4 <= 0xBF:
            try:
                emoji = bytes([0xF0, 0x9F, b3, b4]).decode("utf-8")
                result.append(emoji)
                i += 4
                emoji_fixes += 1
                continue
            except:
                pass
    
    # Pattern: remaining 3-byte sequences (â + 2 cp1252 chars)
    # â = \u00E2, normally start of 3-byte UTF-8
    if ord(c) == 0xE2 and i + 2 < n:
        b2 = to_byte(text[i+1])
        b3 = to_byte(text[i+2])
        if b2 is not None and b3 is not None and 0x80 <= b2 <= 0xBF and 0x80 <= b3 <= 0xBF:
            try:
                sym = bytes([0xE2, b2, b3]).decode("utf-8")
                result.append(sym)
                i += 3
                other_fixes += 1
                continue
            except:
                pass
    
    # Pattern: remaining 2-byte sequences
    if 0xC0 <= ord(c) <= 0xDF and i + 1 < n:
        b2 = to_byte(text[i+1])
        if b2 is not None and 0x80 <= b2 <= 0xBF:
            try:
                ch = bytes([ord(c), b2]).decode("utf-8")
                result.append(ch)
                i += 2
                other_fixes += 1
                continue
            except:
                pass
    
    result.append(c)
    i += 1

text = "".join(result)
print(f"Emoji fixes: {emoji_fixes}")
print(f"Other fixes: {other_fixes}")
print(f"Total: {emoji_fixes + other_fixes}")

with open(path, "w", encoding="utf-8", newline="") as f:
    f.write(text)

print("SONRASI:", len(text))
print("KAYDEDILDI!")
