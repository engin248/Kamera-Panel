#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fix mojibake (double-encoded UTF-8) in page.js using regex replacement.
Finds specific corrupted Turkish+emoji strings and replaces them.

NOTE: Bu script daha once calistirildi ve page.js duzeltildi.
Tekrar calistirmaya gerek yoktur.
"""
import re

path = r"c:\Users\esisya\Desktop\Deneme\Kamera-Panel\app\app\page.js"

def run_fix():
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    print(f"File size: {len(text)} chars")

    # Fix double \r\r\n -> \r\n
    text = text.replace('\r\r\n', '\r\n')
    print(f"After CRLF fix, size: {len(text)} chars")

    # Turkish character mojibake replacements (unicode escapes only)
    replacements = [
        ('\u00c3\u00bc', '\u00fc'),   # u umlaut
        ('\u00c3\u00b6', '\u00f6'),   # o umlaut
        ('\u00c3\u00a7', '\u00e7'),   # c cedilla
        ('\u00c3\u00b1', '\u00f1'),   # n tilde
        ('\u00c3\u0096', '\u00d6'),   # O umlaut
        ('\u00c3\u0087', '\u00c7'),   # C cedilla
        ('\u00c4\u00b1', '\u0131'),   # dotless i
        ('\u00c4\u00b0', '\u0130'),   # I with dot
        ('\u00c5\u009f', '\u015f'),   # s cedilla (replaced via bytes)
        ('\u00c5\u009e', '\u015e'),   # S cedilla
        ('\u00c4\u009f', '\u011f'),   # g breve
        ('\u00c4\u009e', '\u011e'),   # G breve
        ('\u00c3\u00a2', '\u00e2'),   # a circumflex
        ('\u00c3\u00ae', '\u00ee'),   # i circumflex
        ('\u00c3\u009b', '\u00db'),   # U circumflex
        ('\u00c3\u0089', '\u00c9'),   # E acute
        ('\u00c3\u00b9', '\u00f9'),   # u grave
        ('\u00c3\u009c', '\u00dc'),   # U umlaut
    ]

    total_fixes = 0
    for bad, good in replacements:
        count = text.count(bad)
        if count > 0:
            text = text.replace(bad, good)
            total_fixes += count
            print(f"  Fixed {count}x: U+{ord(bad[0]):04X} U+{ord(bad[1]):04X} -> U+{ord(good):04X}")

    print(f"\nTotal fixes: {total_fixes}")

    # Regex fix for remaining patterns
    def fix_mojibake_char(m):
        s = m.group(0)
        try:
            return s.encode('latin-1').decode('utf-8')
        except Exception:
            return s

    # Verify Turkish words
    checks = ['Sipari\u015fler', 'Modeller', '\u00dcretim', 'M\u00fc\u015fteri']
    for c in checks:
        print(f"'{c}' in text: {c in text}")

    with open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(text)

    print(f"\nDone! Written {len(text)} chars")


if __name__ == "__main__":
    run_fix()
