<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ⚡ Kode Vibe: Cepat & Efisien

## 1. Gaya Penulisan & Arsitektur
- **Brevity is Key:** Tulis kode yang paling ringkas, elegan, dan pragmatis. Hindari abstraksi yang rumit dan over-engineering.
- **Kinerja Optimal:** Hasilkan kode dengan time/space complexity yang baik, minimalisir render tak perlu, dan manfaatkan native browser API.
- **Modern & Clean:** Gunakan sintaks modern (ES6+, TS), destructuring, dan standard formatting. Gunakan nama variabel yang mendeskripsikan tujuan.

## 2. React / Next.js (Strict Rules)
- **RSC First:** Selalu prioritaskan React Server Components. Gunakan `"use client"` hanya untuk komponen ujung daun (leaf components) yang butuh interaktivitas.
- **Derived State:** Hindari menempatkan turunan nilai (derived values) ke dalam `useState`. Hitung secara on-the-fly ketika mem-parsing render.
- **Early Returns:** Buat kode linear dengan menggunakan pengkondisian *early return* untuk mengurangi indentasi berlapis (Callback Hell/Nesting).
- **Minimal `useEffect`:** Sebagian besar fecth data harus terjadi di server. Sinkronisasi efek klien harus dihindari sebisa mungkin.

## 3. Komunikasi & Respon AI
- Langsung berikan kode atau solusi tanpa basa-basi. Dilarang meminta maaf atau memberikan sapaan panjang.
- Dilarang memberikan kode *placeholder* (`// kode di sini`). Kode harus utuh dan siap berjalan (*plug & play*).
- Pertahankan fungsionalitas dan komentar lama kecuali jika harus dirubah.
