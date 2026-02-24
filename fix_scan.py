path = r"c:\Users\Admin\Desktop\Kamera-Panel\app\app\page.js"

with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Toplam satir: {len(lines)}")

# Find all lines with remaining mojibake
bad_lines = []
for i, line in enumerate(lines, 1):
    has_issue = False
    issues = []
    
    # Check for ğŸ pattern (emoji mojibake)
    if "\u011f\u0178" in line:
        has_issue = True
        issues.append("EMOJI")
    
    # Check for remaining Ã pattern
    for j, c in enumerate(line):
        if ord(c) == 0xC3 and j+1 < len(line) and ord(line[j+1]) > 127:
            has_issue = True
            issues.append("DOUBLE_C3")
            break
    
    # Check for remaining â + high char pattern  
    for j, c in enumerate(line):
        if ord(c) == 0xE2 and j+1 < len(line) and ord(line[j+1]) > 127:
            # But exclude valid 3-byte UTF-8 sequences
            # Valid: E2 80-BF 80-BF (these are normal Unicode chars)
            if j+2 < len(line):
                b2 = ord(line[j+1])
                b3 = ord(line[j+2])
                if not (0x80 <= b2 <= 0xBF and 0x80 <= b3 <= 0xBF):
                    has_issue = True
                    issues.append("SYMBOL_E2")
                    break
    
    if has_issue:
        snippet = line.strip()[:80]
        bad_lines.append((i, issues, snippet))

print(f"Kalan bozuk satir: {len(bad_lines)}")
print()
for ln, issues, snippet in bad_lines:
    print(f"L{ln} [{','.join(issues)}]: {snippet[:70]}")
