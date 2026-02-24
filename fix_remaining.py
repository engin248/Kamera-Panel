path = r"c:\Users\Admin\Desktop\Kamera-Panel\app\app\page.js"

with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# Direct string replacements for remaining issues
replacements = [
    # Remaining emoji patterns (ğ + Ÿ + extra chars)
    # These are triple-encoded emojis that survived earlier fixes
    # We'll replace them with known correct emojis based on context

    # Need to find exact byte sequences
    # ğ = \u011F, Ÿ = \u0178
]

# Find ALL unique ğŸ patterns remaining
unique = {}
for i in range(len(text) - 3):
    if text[i] == "\u011f" and text[i+1] == "\u0178":
        key = text[i:i+4]
        cps = tuple(hex(ord(c)) for c in key)
        if cps not in unique:
            # Get surrounding context
            start = max(0, i-10)
            end = min(len(text), i+20)
            context = text[start:end]
            unique[cps] = {"key": key, "count": 0, "context": repr(context)}
        unique[cps]["count"] += 1

print("Remaining broken emoji patterns:")
for cps, info in unique.items():
    print(f"  {cps} x{info['count']} context: {info['context'][:60]}")

# Now build the fix map based on what we found
# We know from context what each should be:
fix_map = {}

for cps, info in unique.items():
    key = info["key"]
    ctx = info["context"]
    
    # Determine correct emoji based on context
    if "Tema Rengi" in ctx or "Rengi" in ctx:
        fix_map[key] = "\U0001F3A8"  # 🎨
    elif "Model Olu" in ctx or "dress" in ctx.lower():
        fix_map[key] = "\U0001F457"  # 👗
    elif "Kaydet" in ctx or "floppy" in ctx.lower():
        fix_map[key] = "\U0001F4BE"  # 💾
    elif "Gorsel" in ctx or "rsel" in ctx or "camera" in ctx.lower():
        fix_map[key] = "\U0001F4F8"  # 📸
    elif "Detay" in ctx or "rün Det" in ctx:
        fix_map[key] = "\U0001F4DD"  # 📝
    elif "Tarih" in ctx or "lcü" in ctx:
        fix_map[key] = "\U0001F4C5"  # 📅

print("\nFix map:")
for key, emoji in fix_map.items():
    cps = [hex(ord(c)) for c in key]
    print(f"  {cps} -> {emoji}")

# Apply fixes - but since patterns may overlap with legitimate text,
# do it carefully by checking each occurrence
total = 0
for bad, good in fix_map.items():
    count = text.count(bad)
    if count > 0:
        text = text.replace(bad, good)
        total += count
        print(f"  Fixed {count}x")

# Also fix specific known remaining issues
# AralıĞı -> Aralığı (big G-breve should be small)
if "Aral\u0131\u011e\u0131" in text:
    text = text.replace("Aral\u0131\u011e\u0131", "Aral\u0131\u011f\u0131")
    total += 1
    print("  Fixed AralıĞı -> Aralığı")

# 📋'¾ -> 💾
if "\U0001F4CB\u2019\u00be" in text:
    text = text.replace("\U0001F4CB\u2019\u00be", "\U0001F4BE")
    total += 1
    print("  Fixed 📋'¾ -> 💾")

print(f"\nTotal fixes: {total}")

with open(path, "w", encoding="utf-8", newline="") as f:
    f.write(text)

print("KAYDEDILDI!")
