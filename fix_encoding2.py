#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fix mojibake (double-encoded UTF-8) in page.js - Version 2
Includes emoji fixes and broader regex patterns.

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

    def fix_mojibake_char(m):
        s = m.group(0)
        try:
            return s.encode('latin-1').decode('utf-8')
        except Exception:
            return s

    # Turkish character mojibake map (all unicode escapes)
    mojibake_map = {
        '\u00c3\u00bc': '\u00fc',   # u umlaut
        '\u00c3\u00b6': '\u00f6',   # o umlaut
        '\u00c3\u00a7': '\u00e7',   # c cedilla
        '\u00c3\u00b1': '\u00f1',   # n tilde
        '\u00c3\u0096': '\u00d6',   # O umlaut
        '\u00c3\u009c': '\u00dc',   # U umlaut
        '\u00c4\u00b1': '\u0131',   # dotless i
        '\u00c4\u00b0': '\u0130',   # I with dot
        '\u00c5\u009f': '\u015f',   # s cedilla
        '\u00c5\u009e': '\u015e',   # S cedilla
        '\u00c4\u009f': '\u011f',   # g breve
        '\u00c4\u009e': '\u011e',   # G breve
        '\u00c3\u0087': '\u00c7',   # C cedilla
        '\u00c3\u009d': '\u00dd',   # Y acute
        '\u00c3\u00a2': '\u00e2',   # a circumflex
        '\u00c3\u00ae': '\u00ee',   # i circumflex
        '\u00c3\u009b': '\u00db',   # U circumflex
        '\u00c3\u0089': '\u00c9',   # E acute
        '\u00c3\u00b9': '\u00f9',   # u grave
        '\u00c3\u00a0': '\u00e0',   # a grave
    }

    total_fixes = 0
    for bad, good in mojibake_map.items():
        count = text.count(bad)
        if count > 0:
            text = text.replace(bad, good)
            total_fixes += count
            print(f"  Fixed {count}x: {repr(bad)} -> '{good}'")

    # Fix remaining patterns using the latin1->utf8 trick
    def fix_segment(m):
        s = m.group(0)
        try:
            fixed = s.encode('latin-1').decode('utf-8')
            return fixed
        except Exception:
            return s

    # Emoji mojibake fixes (all using unicode escape sequences)
    emoji_fixes = [
        ('\u011f\u0178\u201c\u2039', '\U0001f4cb'),   # clipboard
        ('\u011f\u0178\u2019\u0097', '\U0001f457'),   # dress
        ('\u011f\u0178\u00ad', '\U0001f3ed'),          # factory
        ('\u011f\u0178\u201c\u00a7', '\U0001f527'),    # wrench
        ('\u011f\u0178\u201c\u00a6', '\U0001f4e6'),    # package
        ('\u011f\u0178\u2019\u00a5', '\U0001f465'),    # people
        ('\u011f\u0178\u2019\u00b0', '\U0001f4b0'),    # money
        ('\u011f\u0178\u201c\u2030', '\U0001f4c9'),    # chart down
        ('\u011f\u0178\u201c\u02c6', '\U0001f4c8'),    # chart up
        ('\u011f\u0178\u201c\u0160', '\U0001f4ca'),    # bar chart
        ('\u011f\u0178\u00a4', '\U0001f91d'),          # handshake
        ('\u011f\u0178\u201c\u00b1', '\U0001f4f1'),    # phone
        ('\u011f\u0178\u00a7\u00b5', '\U0001f9f5'),    # thread
        ('\u011f\u0178\u201c\u00b7', '\U0001f4f7'),    # camera
        ('\u011f\u0178\u201c\u00b8', '\U0001f4f8'),    # camera flash
        ('\u011f\u0178\u201c\u2026', '\U0001f4c5'),    # calendar
    ]

    for bad, good in emoji_fixes:
        count = text.count(bad)
        if count > 0:
            text = text.replace(bad, good)
            total_fixes += count
            print(f"  Emoji fixed {count}x -> {good}")

    print(f"\nTotal fixes: {total_fixes}")

    # Verify Turkish words
    checks = ['Sipari\u015fler', 'Modeller', '\u00dcretim', 'M\u00fc\u015fteri', 'Personel', 'Kalite']
    for c in checks:
        print(f"  '{c}' present: {c in text}")

    with open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(text)

    print(f"\nDone! Written {len(text)} chars to {path}")


if __name__ == "__main__":
    run_fix()
