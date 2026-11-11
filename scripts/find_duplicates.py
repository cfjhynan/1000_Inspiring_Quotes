import json
import re

with open("data/quotes.json", "r", encoding="utf-8") as f:
    quotes = json.load(f)

def words(text):
    return set(re.findall(r"\b[a-z]{3,}\b", text.lower()))

def jaccard(s1, s2):
    if not s1 or not s2:
        return 0.0
    return len(s1 & s2) / len(s1 | s2)

duplicates = []
# Precompute word sets
quote_words = [words(q["quote"]) for q in quotes]

for i in range(len(quotes)):
    w1 = quote_words[i]
    if len(w1) < 3:
        continue
    for j in range(i + 1, len(quotes)):
        w2 = quote_words[j]
        if len(w2) < 3:
            continue
        sim = jaccard(w1, w2)
        # Also check author matching or high similarity
        q1 = quotes[i]
        q2 = quotes[j]
        same_author = (q1["author"].lower() == q2["author"].lower()) or (
            q1["author"].split()[-1].lower() == q2["author"].split()[-1].lower()
            if q1["author"] and q2["author"] else False
        )
        if sim >= 0.70 or (same_author and sim >= 0.50):
            duplicates.append((q1, q2, sim, same_author))

print(f"Total potential duplicate/variant pairs found: {len(duplicates)}")
for q1, q2, sim, same_author in sorted(duplicates, key=lambda x: -x[2]):
    print(f"\n[Similarity: {sim:.2f} | Same Author: {same_author}]")
    print(f"  #{q1['id']} [{q1['category']}] {q1['author']}: \"{q1['quote']}\"")
    print(f"  #{q2['id']} [{q2['category']}] {q2['author']}: \"{q2['quote']}\"")
