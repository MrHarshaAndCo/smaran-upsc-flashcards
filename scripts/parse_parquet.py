import pandas as pd, json, hashlib
df = pd.read_parquet("train-00000-of-00001.parquet")

# Hindi detection: look for Devanagari codepoints (U+0900-U+097F)
def has_hindi(s):
    return any('\u0900' <= c <= '\u097F' for c in str(s))

eng = df[~df["Question"].apply(has_hindi)]
print(f"Total: {len(df)} | English: {len(eng)} | Hindi: {len(df)-len(eng)}")

answer_map = {"a":0,"b":1,"c":2,"d":3}
questions = []
seen = set()
for _, r in eng.iterrows():
    q = str(r.Question).strip()
    if not q: continue
    h = hashlib.sha1(q.encode()).hexdigest()
    if h in seen: continue
    seen.add(h)
    opts = [str(r.Option_A).strip(), str(r.Option_B).strip(), str(r.Option_C).strip(), str(r.Option_D).strip()]
    if any(not o for o in opts): continue
    ai = answer_map.get(str(r.Answer).strip().lower(), -1)
    if ai < 0: continue
    questions.append({
        "id": h,
        "subject": str(r.Subject).strip()[:80],
        "sub_topic": str(r.Topic).strip()[:120] if pd.notna(r.Topic) else None,
        "question": q,
        "options": opts,
        "answer_index": ai,
        "explanation": str(r.Explaination).strip()[:2000] if pd.notna(r.Explaination) else None
    })

with open("scripts/questions.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, ensure_ascii=False)
print(f"Exported {len(questions)} questions to scripts/questions.json")
