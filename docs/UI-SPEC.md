# Celik: UI specification

Version 2.0, 6 Nov 2026 evening (hybrid direction, D18-D28; new screens S19-S21). Companion to docs/SRS.md and docs/SDS.md. Product name: **Celik** ("celik" = literate, as in celik kewangan, financial literacy).
Tagline: **Bijak duit, kebal scam** (money-smart, scam-proof). Secondary catchphrase used in scam debriefs: "Kenali jerat sebelum terjerat".

## 0. Design principles

1. **It feels like your own phone.** The game is a fake phone with familiar-looking (but fictional) apps. Scams
   arrive the way they do in real life: a chat, a call, a notification.
2. **Real enough to fool you, fictional enough to be safe.** Messages use real tactics and Malaysian chat style,
   but every bank, company, app and person is invented.
3. **Consequences are dramatic, never shaming.** Losing shows what happens and why, then offers a retry.
   No "you were stupid" copy.
4. **One thumb, short sessions.** Every primary action sits in the bottom 40% of the screen. Each mode fits in 5-15 minutes.
5. **Malaysian, playful, BM first.** Casual Bahasa Melayu, local situations, Sang Kancil (the folk-tale trickster)
   as the clever coach who knows every trick.

## 1. Design tokens

### 1.1 Colour

| Token | Hex | Use |
| --- | --- | --- |
| --ink | #1C1B3A | Main text, icons |
| --ink-soft | #5E5C7A | Secondary text |
| --indigo | #2D2A6E | Brand, headers, home screen background top |
| --indigo-soft | #E9E8F7 | Cards, chips |
| --kancil | #F4A340 | Brand accent, coach, XP, buttons |
| --kancil-soft | #FFF1DC | Coach bubble background |
| --paper | #FFF8EE | App background |
| --chat-in | #FFFFFF | Incoming bubble |
| --chat-out | #DCF3E6 | Outgoing bubble (green, but not WhatsApp's exact colour) |
| --danger | #E5484D | Scam outcome, red flags, frozen account |
| --danger-soft | #FDECEC | Red-flag highlight background |
| --safe | #30A46C | Safe outcome, correct answer |
| --safe-soft | #E6F6EE | Safe banner background |
| --warning | #F5A524 | Tekanan meter high, timers |
| --sindiket-bg | #121212 | Mod Sindiket dark theme |
| --sindiket-neon | #B6F03C | Mod Sindiket accent (success meter, badges) |

Contrast: all text pairs at least 4.5:1. Colour is never the only signal (icons and labels always accompany red/green).

### 1.2 Typography

| Role | Font | Size / weight |
| --- | --- | --- |
| Display (titles, grades) | Plus Jakarta Sans | 28-40 px / 800 |
| Heading | Plus Jakarta Sans | 20-24 px / 700 |
| Body, chat | Inter | 16 px / 400 (never below 16 px on phone) |
| Caption | Inter | 13-14 px / 500 |
| Numbers (RM, timers, scores) | JetBrains Mono | 16-32 px / 600 |

All fonts bundled with @fontsource (offline). Class mode body text at least 32 px.

### 1.3 Spacing, shape, depth, motion

- 4 px grid; screen padding 16 px; card padding 16 px; gap between chat bubbles 6 px (same sender) / 12 px.
- Radius: chips 999 px, bubbles 18 px (tail corner 4 px), cards 16 px, sheets 24 px top corners.
- Shadow: one soft level for cards (0 2px 8px rgba(28,27,58,.08)), one for sheets/modals (0 -8px 24px rgba(28,27,58,.12)).
- Motion: 150 ms for taps, 250 ms for sheets and cards, 600-1200 ms for consequence timelines.
  Easing: spring (framer-motion, stiffness 300, damping 28) for UI; ease-in-out for timelines.
  `prefers-reduced-motion`: replace movement with fades, keep durations under 200 ms.

### 1.4 Iconography and illustration

- Icons: lucide-react, 1.75 px stroke, 24 px default.
- Illustrations: flat, warm, friendly; Malaysian campus details (hostel, mamak, bus stop, library).
- Mascot: **Sang Kancil**, a small mouse-deer with a backpack and a phone, appearing as the coach in a bottom
  sheet. Expressions needed: neutral, smiling, worried, proud, shocked.
- Fictional app icons: Sembang (chat, speech bubble), BankKu (bank, coin), Dompet (budget, wallet), Kalkulator
  (calculator with a small upward arrow), Kad (cards, flag and lightbulb), Latihan (drills, shield).

### 1.5 Sound (optional, off in class mode by default)

Message pop, call ringtone (short), "ding" correct, soft "thud" wrong, coin drop, alarm sting for frozen account.
All under 30 KB each; master mute in settings.

## 2. Layout and breakpoints

| Context | Viewport | Layout |
| --- | --- | --- |
| Phone (primary) | 360-430 px wide | Full-screen fake phone, no outer frame |
| Desktop / demo video | 1280 px and up | Phone frame (390 x 844) centred; left panel shows Sang Kancil tips, right panel shows live meters, for a clearer video |
| Projector (Mod Kelas) | 1920 x 1080 | Full-width class layout, no phone frame |

A **DEMO** watermark (top right, 40% opacity, toggle in settings) appears on every screen used in the video.

## 3. Shared components

| Component | Description | States |
| --- | --- | --- |
| PhoneFrame | Rounded device outline on desktop only | - |
| StatusBar | Left: in-game day and week ("Isn, Minggu 3"); right: Tekanan icon (battery-style), signal, RM balance chip | Tekanan low / mid / high (colour + icon) |
| NotificationBanner | Slides from top; app icon, sender, first line; tap to open | New, read |
| AppTile | Icon + label + red badge count | Normal, has-new, locked |
| ChatBubble | Incoming / outgoing / system; supports links (fake), images, voice-note placeholder | Normal, flag-hidden, flag-found (red underline + flag icon) |
| ReplyChip | Pill buttons stacked above the keyboard area; 2-4 per turn | Default, pressed, disabled |
| TypingIndicator | Three dots, 600-1500 ms before each incoming message | - |
| IncomingCall | Full-screen caller UI with accept/decline; during call, transcript bubbles + choice chips | Ringing, active, ended |
| MeterBar | Label + bar + value; used for Duit, Tekanan, success meter | Normal, warning, danger |
| ImunitiRing | Circular score 0-100 with level name inside; seven small segments around it, one per tactic | Level colours |
| CardTile | Red Flag card: tactic icon, BM name, scam family, short cue | Locked (silhouette), new (glow), collected |
| Badge | Hexagon badge for Sindiket tactics | Locked, unlocked |
| CoachSheet | Sang Kancil bottom sheet with tip text and one button | Tip, warning, praise |
| ConsequenceTimeline | Vertical steps that appear one by one with icons | Playing, done |
| MoneyChain | Horizontal node diagram (Mangsa -> Akaun anda -> Akaun lapis -> Sindiket) with animated coins; then a police icon traces back to "Akaun anda" | Playing, done |
| Toast | Small confirmation at bottom ("+10 Imuniti: Desakan Masa") | Info, success, danger |
| SimulasiBanner | Yellow strip: "SIMULASI - bukan laman/aplikasi sebenar" | Always on in BankKu transfer, Semak sim, 997 drill |

## 4. Screens

Each screen lists purpose, layout (top to bottom), key elements, interactions and sample copy (BM, with English
in brackets for the team).

### S01 Splash and disclaimer
- Logo "Celik" (Plus Jakarta Sans 800, indigo) with the dot of the "i" drawn as an open eye in kancil amber; Sang Kancil
  peeks from behind the letter C; tagline "Bijak duit, kebal scam" below.
- After 1.5 s, a card: "Semua nama bank, syarikat dan individu dalam permainan ini adalah rekaan. Jangan sekali-kali
  beri maklumat bank sebenar kepada sesiapa." (All names are fictional. Never give real bank details to anyone.)
- Button: **Mula** (Start). Language toggle BM | EN top right.

### S02 Onboarding (3 steps, progress dots)
1. Choose character: Aina or Amir (illustrated cards, tap to select, name editable).
2. Your situation: "Pelajar tahun 1, Universiti Cempaka Raya (UCR). Duit semester: RM2,000 + kerja sambilan RM400/bulan."
3. Meet Sang Kancil: "Saya Sang Kancil. Saya tahu semua helah. Jom kita belajar sebelum orang lain ambil kesempatan."
- Button: **Masuk semester** (Enter the semester).

### S03 Home (fake phone home screen)
- Status bar.
- Hero card: two small rings side by side, **Celik Kewangan** (amber) and **Imuniti** (indigo), + level name
  (Pemula, Berjimat, Bijak, Pelabur, Celik) + XP bar; below it "Minggu 3 daripada 12" and net worth (Duit + Labur).
- App grid (2 rows): Sembang (badge count), BankKu, Dompet, Kalkulator, Kad, Latihan.
- Mode dock (bottom, large tiles): **Semester Pertama** (continue), **Cek Harian** (streak flame and "hari ini: belum"
  / "selesai"), **Mod Kelas**. Mod Sindiket appears as a locked tile "Akan datang" until the stretch build.
- CoachSheet peeks with a daily tip.

### S04 Week intro
- Full-screen card sliding up: "Minggu 3" big, one line of context ("Yuran asrama perlu dibayar Jumaat ini"),
  this week's costs list, Tekanan meter. Button **Teruskan**.

### S05 Sembang: chat list
- Search bar (decorative), list of chats: avatar, name, last message, time, unread dot.
- Unknown numbers show the number, not a name. Groups (e.g. "Kelas MTH1023") appear for legit events.

### S06 Sembang: chat thread (main scenario screen)
- Header: back, avatar, name/number, "dalam talian" (online). No "verified" tick ever (to avoid teaching that ticks mean safe).
- Messages appear one by one with TypingIndicator. Fake links (always `*.test`, no `http://`) are underlined;
  tapping one opens a fake page inside the game (never a real site).
- ReplyChips appear when the story waits for a choice. A small **"Tanya Kancil"** (ask Kancil) chip costs 10 XP and
  gives a hint (limited to 1 per scenario).
- After the outcome: **Flag hunt** mode. Overlay instruction: "Tekan 3 bendera merah dalam perbualan ini."
  Suspicious phrases are tappable; correct taps turn red with a flag icon and a card flies to the Kad icon;
  wrong taps shake gently. Button **Selesai** appears after all flags or 3 wrong taps (then remaining flags are revealed).

### S07 Incoming call (authority scam)
- Ringing screen: caller ID "Pegawai Mahkamah" with a number; accept / decline.
- During the call: a large timer, waveform animation, transcript bubbles appearing in sync, choice chips:
  "Ikut arahan" (follow instructions), "Minta nama & nombor, saya semak sendiri" (ask for details to verify),
  "Letak telefon" (hang up).
- Rising Tekanan meter pulses during threats.

### S08 BankKu (fictional bank)
- Header: BankKu logo (fictional), balance in large mono type, last 5 transactions.
- Transfer screen: SimulasiBanner; recipient account and amount pre-filled by the story; **Sahkan** button.
- TAC/OTP prompt: a 6-digit fake code with a red caption "Jangan kongsi TAC dengan sesiapa, termasuk 'pegawai bank'."
- Frozen state: full red banner "Akaun anda telah dibekukan", reason line, and a button to see what happens next.

### S09 Apa jadi seterusnya (consequence)
- Title in danger colour (or safe colour for good outcomes).
- ConsequenceTimeline with 3-5 steps, each with an icon, one line and a time label ("5 minit kemudian", "2 minggu kemudian").
- For mule outcomes: MoneyChain animation, then a Penal Code note: "Seksyen 424A-424D Kanun Keseksaan: membenarkan
  akaun anda digunakan untuk penipuan adalah satu kesalahan." This is an i18n string marked `TODO-VERIFY` until checked
  against the official Penal Code.
- Meter changes animate (RM drop, Tekanan up, Imuniti change).
- Buttons: **Kumpul bendera merah** (go to the flag hunt), **Cuba lagi** (retry the scenario).

### S10 Debrief (Sang Kancil)
- CoachSheet expanded: "Taktik yang digunakan: Terlalu Lumayan + Bayar Dulu", 2 bullet tips, "Apa patut buat"
  (what to do: check the company is registered, don't pay to work, report to 997 if money was sent).

### S11 Kad (Red Flag and Kad Ilmu collection)
- Two top tabs: **Bendera Merah** and **Kad Ilmu**.
- Bendera Merah: header "12 / 16 kad" progress, total computed from content (one card per (tactic, family) pair
  flagged in a scenario); sub-tabs by tactic (7). Grid of CardTiles (3 columns); locked cards show a silhouette and "???".
- Kad Ilmu: 6 cards, one per concept, amber frame and a lightbulb icon (see S21).
- Card detail sheet: big card art, example message, how to spot, what to do.

### S12 Dompet (budget and Labur)
- Week 0: three sliders (Keperluan / Kehendak / Simpanan) with a donut chart and RM values; Sang Kancil suggests a
  starting split but the player decides.
- Weekly view: list of costs ticking off; Simpanan pot shown as a jar filling or emptying, with an **emergency fund
  bar** to RM300 ("Dana kecemasan: RM180 / RM300").
- **Labur pot** (fourth card): two fictional products, Amanah Cempaka (fixed price, steady) and Dana Ekuiti Cempaka
  (goes up and down; small sparkline). **Pindah** (move) buttons are active only at week intros; otherwise a note
  "Boleh pindah pada awal minggu". Moving money in while the emergency bar is not full shows the CoachSheet
  "Dana kecemasan dulu" with **Tetap labur** / **Batal**.
- Net worth line at the top: "Nilai bersih RM2,140 (Duit RM1,940 + Labur RM200)".
- Button **Lihat 10 tahun lagi** opens S19 Mesin Masa with the player's own monthly amount.
- Offer cards (BNPL, fast loan): show the tempting headline first; after the choice, the card flips to show the true cost.

### S13 Semester report card
- Grade letter in a big stamp (A-D), character illustration (happy/worried).
- Rows: money left, Labur value, emergency fund reached (yes/no), scams avoided / fell for, flags collected,
  judgement accuracy, Celik Kewangan per concept (6 amber bars), Imuniti per tactic (7 indigo bars).
- "Paling perlu dilatih: Kos Hutang" (weakest concept or tactic) with a button **Latih ini** (opens a related Cek
  Harian set or replays the scenario).
- **Kongsi keputusan** (stretch) generates the share image (1080 x 1350): character, grade, both rings, tagline, "DEMO" mark.

### S14 Mod Sindiket (play the scammer) - finalist stretch
- Dark theme (--sindiket-bg, neon accent), satirical "Pejabat Sindiket" (syndicate office) header with a fictional
  boss avatar.
- Top: target persona card (fictional name, age, traits like "perlukan duit", "percaya polis", "sibuk").
- Middle: message preview that assembles as cards are placed; success meter on the right.
- Bottom: hand of cards in three rows: Hook, Taktik, Minta (Ask). Drag or tap to place one of each (MVP), or stack
  extra tactics (later).
- **Hantar** (send) plays the persona's reaction; badge unlocks animate when a tactic is first used.
- After each round: Debrief panel switches to the light theme: "Beginilah mangsa boleh kesan helah anda" with the red flags.
- Twist ending: police raid animation, "Akaun keldai pelatih dikesan" (the interns' mule accounts are traced), then
  a summary: badges earned and "Sekarang anda kenal 3 taktik sindiket."

### S15 Sahih atau Scam? (60-second round; also reached from Cek Harian results)
- Top: timer bar (60 s) and score.
- Centre: card stack; each card shows a message as it would appear (SMS, chat or email style).
- Swipe left = Scam (red), right = Sahih (green); buttons below for non-swipe use.
- After each swipe the card flips for 1.5 s with a one-line reason; the timer pauses during the flip.
- Results: score, streak flame, missed cards list with explanations, **Main lagi**.

### S16 Latihan Tindakan (action drills)
- Menu with three tiles: Hubungi 997, Semak akaun, Senarai tindakan.
- **997 drill:** a simulated dialler; tapping 9-9-7 starts a guided call: steps to say (what happened, amount,
  account number money went to, time), a checklist to tick, and why the first minutes matter. SimulasiBanner visible.
- **Semak simulation:** generic search box (not styled like the official portal), enter a fictional account from the
  story, see "Dilaporkan dalam 3 kes" (reported in 3 cases). A clear button **Buka Semak Mule sebenar** opens
  https://semakmule.rmp.gov.my in the browser. SimulasiBanner visible.
- **Action checklist:** save 997 in contacts, bookmark Semak Mule, turn on bank transaction alerts, set a real
  savings goal, check an investment's licence before paying (link text only: "SC licence register"), tell your family
  about the game; each tick gives stars and a confetti burst. Self-reported, with a gentle honesty note.

### S17 Mod Kelas (projector)
- Lobby: facilitator sets 2-6 teams (names and colours), picks a card set (Scam, Duit or Campur / mixed), presses **Mula**.
- Round: huge card in the centre; team answer row at the bottom with SAHIH / SCAM toggles per team (or BETUL / SALAH
  and A / B for money cards);
  **Dedahkan** (reveal) button.
- Reveal: correct answer, reason, points flying to team cards.
- Scoreboard between rounds; winner screen with confetti after 10 rounds.
- All text at least 32 px; no student devices needed.

### S18 Settings
- Language, sound, reduced motion, DEMO watermark, reset progress (with confirmation), credits and sources.

### S19 Kalkulator (phone app, three tabs)
- Header "Kalkulator" with a segmented control: **Mesin Masa** | **Semak Pulangan** | **Kos Sebenar**. A yellow
  strip on every tab: "Contoh sahaja, bukan nasihat pelaburan" (examples only, not investment advice).
- **Mesin Masa:** inputs as large steppers: Simpan sebulan (RM), Pulangan setahun (%, with chips for the example
  bands), Mula umur (19), Hingga umur (30 / 55 chips). Output: big number "RM8,775" in JetBrains Mono, below it
  "Anda simpan RM6,600, pertumbuhan RM2,175". SVG line chart with two areas (contributed vs growth, indigo and
  amber), axis labels by age. Kancil line: "Mula awal, walaupun sedikit."
- **Semak Pulangan:** inputs: Janji pulangan (%), Setiap (hari / minggu / bulan / tahun). Output: "= 213.8% setahun"
  and a horizontal band chart: grey bars for the example ranges (simpanan, simpanan tetap, dana harga tetap, unit
  amanah), a red pin for the promised rate off the end of the scale with "Terlalu Lumayan" flag chip and the line
  "Tiada pelaburan sah boleh jamin pulangan begini." Below: "Semak dulu: SC Investor Alert List" (text only).
- **Kos Sebenar:** inputs: Jumlah (RM), Kadar rata (% setahun) or Yuran (RM), Tempoh (bulan). Output cards:
  Ansuran sebulan, Jumlah bayar balik, Kos sebenar (red), Kadar berkesan setahun (with a one-line explanation of why
  it is higher than the flat rate).
- Opened from a scenario ("Kira dulu"): inputs pre-filled from the preset, a **Kembali ke perbualan** button at the
  bottom, and a toast "+10 XP: Kira dulu" on first use.

### S20 Cek Harian (daily booster)
- Header: streak flame with the day count, "Cek Harian · 5 kad · ~2 minit", and a snowflake icon showing whether
  this week's freeze is still available.
- Card stack of 5: three message cards (swipe like S15) and two money cards. True/false money cards use **BETUL** /
  **SALAH** buttons; pick cards show two option tiles (A / B).
- After each answer: the card flips with a one-line reason; no timer.
- Results: "4 / 5", streak +1 animation, the concept or tactic each miss belongs to, and two buttons: **Main 60 saat**
  (S15) and **Selesai**. If already played today: "Datang lagi esok" with a countdown and the streak calendar.

### S21 Kad Ilmu (knowledge card detail)
- Amber-framed card with the concept icon and BM name (e.g. "Kuasa Kompaun").
- Sections: **Apa itu** (2 sentences), **Contoh** (a worked example with numbers, labelled "contoh"),
  **Di dunia sebenar** (real scheme names allowed here only, D27, e.g. "Contoh produk: simpanan tetap, unit
  amanah, dana harga tetap seperti ASB"; no logos), **Cara semak** (where to check, text only), and the footer
  "Kad ini menerangkan, bukan mengesyorkan." Any figure shows its year and source.

## 5. Screen flow

```text
S01 Splash -> S02 Onboarding -> S03 Home
S03 Home -> Semester Pertama: S04 Week intro -> S05/S06 chats, S07 calls, S08 BankKu
          -> S09 Consequence -> S06 flag hunt -> S10 Debrief -> next event ... -> S13 Report card
S03 Home -> S20 Cek Harian -> results -> (optional) S15 Sahih atau Scam?
S06 chat ("Kira dulu") -> S19 Kalkulator -> back to S06
S12 Dompet ("Lihat 10 tahun lagi") -> S19 Mesin Masa
S11 Kad -> S21 Kad Ilmu detail
S03 Home -> S14 Mod Sindiket (stretch: rounds -> debrief -> twist ending)
S03 Home -> S16 Latihan Tindakan (997 drill, Semak sim, checklist)
S03 Home -> S17 Mod Kelas (projector)
S03 Home -> S11 Kad, S12 Dompet, S19 Kalkulator, S18 Settings
```

## 6. Content style guide

- **Scammer voice:** realistic Malaysian texting: mixed BM-English, emojis, "Salam bos", "boleh PM", small typos,
  pressure phrases. Always fictional names and numbers: phone numbers use `01X-0000 0NNN` (e.g. 011-0000 0123),
  links use the `.test` domain with no scheme (e.g. `kurierkilat-bayar.test/alamat`).
- **Legit voice:** official but plain; legit messages never ask for OTP, never push links to pay, give a way to verify.
- **Sang Kancil voice:** short, warm, clever, a little cheeky. Max 2 sentences per tip.
- **Consequence voice:** factual and kind: "Ini yang biasanya berlaku..." (this is what usually happens...), then what to do.
- **Money voice (finance scenarios, Kad Ilmu, money cards):** plain and encouraging; explain with one worked number;
  always say "contoh" for rates; never say "beli" (buy) or recommend a product; say what to check instead.
- **Never:** real bank or company names or logos, real people, real phone numbers, real URLs (except the official
  Semak Mule portal and 997 as correct actions) in scenarios and cards; real scheme names only in Kad Ilmu and
  "where to check" lines (D27); victim-blaming words like "bodoh" (stupid).
- **Fictional entities list:** Universiti Cempaka Raya (UCR), BankKu, Bank Merpati, Bintang Digital Sdn Bhd (fake
  job company), CryptoNaga (fake investment), BayarNanti (legal but costly BNPL), Kafe Cempaka (campus cafe job),
  Amanah Cempaka (fictional fixed-price fund), Dana Ekuiti Cempaka (fictional unit trust), Sembang (chat app).
  Reserved for the stretch and later content: KurierKilat (courier), PinjamCepat (illegal lender).

## 7. Accessibility

- Tap targets at least 48 x 48 px; swipe actions always have button alternatives.
- Screen reader labels for every icon button; chat messages read in order with sender names.
- Text resizable to 130% without breaking layouts.
- Reduced-motion mode; no flashing faster than 3 times per second (the raid animation uses a slow pulse).
- Colour-blind safe: scam/legit always paired with icon (flag vs check) and word.

## 8. Asset list for the MVP

| Asset | Count | Notes |
| --- | --- | --- |
| Sang Kancil expressions | 5 | SVG, under 20 KB each |
| Character portraits (Aina, Amir) | 2 x 3 moods | SVG |
| Fictional app icons | 6 (incl. Kalkulator) | SVG |
| Contact avatars | 10 | Simple illustrated faces or initials |
| Red Flag card art | 7 tactic icons + 4 scam family frames (MVP) | Combine at runtime |
| Kad Ilmu concept icons | 6 | SVG, amber frame |
| Sindiket badges (stretch) | 7 | Hexagon SVGs |
| Sounds | 6 | OGG/MP3, under 30 KB each |
