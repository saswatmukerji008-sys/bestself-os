import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const todayISO = () => new Date().toISOString().split("T")[0];
const isWeekend = () => [0, 6].includes(new Date().getDay());
const fmtTime = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const greet = () => { const h = new Date().getHours(); return h < 5 ? "Still up? 🌙" : h < 12 ? "Good Morning 🌅" : h < 17 ? "Good Afternoon ☀️" : h < 21 ? "Good Evening 🌆" : "Good Night 🌙"; };
const getLast = n => { const o = []; for (let i = n - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); o.push(d.toISOString().split("T")[0]); } return o; };
const weekKey = () => { const d = new Date(), day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1); const m = new Date(d); m.setDate(diff); return m.toISOString().split("T")[0]; };
const fmtINR = n => n >= 10000000 ? `₹${(n / 10000000).toFixed(1)}Cr` : n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n}`;

// ── Constants ─────────────────────────────────────────────────────────────────
const C = { purple: "#7c3aed", indigo: "#6366f1", green: "#10b981", orange: "#f97316", pink: "#ec4899", violet: "#8b5cf6", rose: "#f43f5e", cyan: "#06b6d4", yellow: "#eab308", teal: "#14b8a6", blue: "#60a5fa", fuchsia: "#f472b6", lime: "#4ade80", amber: "#fbbf24", sky: "#0ea5e9", bg: "#0a0a14", card: "#111120", card2: "#0e0e1c", border: "#1a1a2e" };
const HC = { sleep: C.indigo, exercise: C.green, reading: C.fuchsia, guitar: C.violet, journal: C.pink, meditate: C.purple, social: C.rose, medicine: C.cyan, learn: C.yellow, food: C.orange, finance: C.teal, grooming: C.amber, plants: C.lime, work: C.blue, social_media: C.rose, travel: C.teal };
const HABITS = [
  { id: "sleep", icon: "😴", label: "Sleep 7h", cat: "health" }, { id: "exercise", icon: "🏋️", label: "Exercise", cat: "health" },
  { id: "food", icon: "🥗", label: "Eat Clean", cat: "health" }, { id: "medicine", icon: "💊", label: "Medicines", cat: "health" },
  { id: "reading", icon: "📚", label: "Read 30 min", cat: "growth" }, { id: "learn", icon: "🧠", label: "Learn 1h", cat: "growth" },
  { id: "guitar", icon: "🎸", label: "Guitar", cat: "growth" }, { id: "journal", icon: "✍️", label: "Journal", cat: "mind" },
  { id: "meditate", icon: "🧘", label: "Meditate", cat: "mind" }, { id: "social", icon: "🤝", label: "Family & Friends", cat: "connect" },
  { id: "work", icon: "💼", label: "Deep Work", cat: "career" }, { id: "social_media", icon: "📱", label: "Create Content", cat: "career" },
  { id: "finance", icon: "💰", label: "Finance Check", cat: "wealth" }, { id: "grooming", icon: "🪥", label: "Grooming", cat: "self" },
  { id: "plants", icon: "🌿", label: "Water Plants", cat: "self" }, { id: "travel", icon: "✈️", label: "Travel / Plan", cat: "joy" },
];
const CAT_META = { health: { label: "❤️ Health", color: C.green }, growth: { label: "🌱 Growth", color: C.violet }, mind: { label: "🧠 Mind", color: C.purple }, connect: { label: "🤝 Connect", color: C.rose }, career: { label: "💼 Career", color: C.blue }, wealth: { label: "💰 Wealth", color: C.teal }, self: { label: "✨ Self Care", color: C.amber }, joy: { label: "🎉 Joy", color: C.fuchsia } };
const BOOKS = [{ t: "Atomic Habits", a: "James Clear", w: "Build habits that stick" }, { t: "Deep Work", a: "Cal Newport", w: "Master focus" }, { t: "The Psychology of Money", a: "Morgan Housel", w: "Financial wisdom" }, { t: "Why We Sleep", a: "Matthew Walker", w: "Optimise every night" }, { t: "Ikigai", a: "Héctor García", w: "Find your purpose" }, { t: "Sapiens", a: "Yuval Noah Harari", w: "Big-picture thinking" }, { t: "Essentialism", a: "Greg McKeown", w: "Do less, but better" }, { t: "Naval's Almanack", a: "Eric Jorgenson", w: "Wealth + happiness" }, { t: "Range", a: "David Epstein", w: "Why curiosity wins" }, { t: "The Alchemist", a: "Paulo Coelho", w: "For the traveller in you" }];
const DAILY_QUOTES = ["The secret of getting ahead is getting started. — Mark Twain", "Small daily improvements lead to stunning results. — Robin Sharma", "You don't rise to your goals, you fall to your systems. — James Clear", "Discipline is the bridge between goals and accomplishment. — Jim Rohn", "Arise, awake, and stop not till the goal is reached. — Swami Vivekananda", "Action is the foundational key to all success. — Pablo Picasso", "We are what we repeatedly do. Excellence is a habit. — Aristotle", "The mind is everything. What you think, you become. — Buddha"];
const MORNING_ROUTINE = ["Drink a full glass of warm water", "5 min stretch or yoga", "Meditate for 10-15 min", "Review today's top 3 priorities", "Take medicines with breakfast"];
const NIGHT_ROUTINE = ["No screens 30 min before bed", "Write 3 things you're grateful for", "Review tomorrow's schedule", "Light stretching or breathing", "Set your wake alarm & wind down"];
const WEEKDAY = [{ t: "06:00", a: "Wake up · warm water · stretch" }, { t: "06:15", a: "Meditate (15 min)" }, { t: "06:30", a: "Exercise (90 min)" }, { t: "08:30", a: "Shower · Grooming" }, { t: "09:00", a: "Breakfast · Medicines" }, { t: "09:30", a: "Deep Work Block 1" }, { t: "12:00", a: "Lunch (clean eating)" }, { t: "13:00", a: "Learn something new — 1h" }, { t: "14:00", a: "Deep Work Block 2" }, { t: "16:00", a: "Reading — 30 min" }, { t: "16:30", a: "Guitar practice" }, { t: "17:30", a: "Call family / friends" }, { t: "19:00", a: "Light dinner" }, { t: "20:00", a: "Content creation" }, { t: "21:00", a: "Journal" }, { t: "22:00", a: "Wind down · no screens" }, { t: "22:30", a: "Sleep 😴" }];
const WEEKEND = [{ t: "07:00", a: "Wake up gently" }, { t: "07:30", a: "Meditation + Spiritual (30 min)" }, { t: "08:00", a: "Leisure exercise" }, { t: "09:30", a: "Breakfast · family time" }, { t: "11:00", a: "Deep learning / skill building" }, { t: "13:00", a: "Lunch + rest" }, { t: "15:00", a: "Travel / explore" }, { t: "17:00", a: "Guitar + creative time" }, { t: "19:00", a: "Meet friends / family" }, { t: "21:00", a: "Weekly review + Journal" }, { t: "22:00", a: "Sleep 😴" }];
const JOURNAL_PROMPTS = ["What made you genuinely smile today?", "One thing you're proud of yourself for?", "What would you do differently tomorrow?", "What step did you take toward your best self?", "What fear did you face or avoid today?", "What did your body need that you ignored?", "What would your future self thank you for today?", "One thing you learned about yourself this week?"];

const defaultData = {
  habits: {}, journal: {}, sleep: [], exercise: [], food: [], medicine: {}, finance: [],
  books: { current: "", log: [] }, weight: [], mood: {}, medList: [], learnLog: [], guitarLog: [],
  medLog: [], weeklyReviews: {}, contentLog: [], tripPlans: [], bodyMeasurements: [],
  morningChecks: {}, nightChecks: {}, annualLetter: {}, balanceWheel: {},
  profile: { name: "", wakeTime: "06:00", sleepTime: "22:30", city: "Gurugram", goal: "" },
  notifications: { enabled: false, reminders: { wake: true, exercise: true, medicine: true, journal: true, sleep: true, meditation: true } },
  onboarded: false
};

// ── UI Primitives ─────────────────────────────────────────────────────────────
const inp = { background: C.card2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 13px", color: "#fff", fontSize: 13, width: "100%", boxSizing: "border-box", outline: "none" };

function Card({ children, color = C.purple, title, sub, noPad }) {
  return (
    <div style={{ background: C.card, borderRadius: 18, padding: noPad ? 0 : 16, border: `1px solid ${color}18`, marginBottom: 12, overflow: "hidden" }}>
      {(title || sub) && (
        <div style={{ padding: noPad ? "16px 16px 0" : 0 }}>
          {title && <div style={{ color, fontWeight: 700, fontSize: 14, marginBottom: sub ? 3 : 10 }}>{title}</div>}
          {sub && <div style={{ color: "#444", fontSize: 11, marginBottom: 10 }}>{sub}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

function Bar({ value, max, color, h = 5 }) {
  const p = Math.min((value / Math.max(max, 1)) * 100, 100);
  return (
    <div style={{ background: "#1e1e30", borderRadius: 99, height: h, overflow: "hidden" }}>
      <div style={{ background: color, width: `${p}%`, height: h, borderRadius: 99, transition: "width .5s ease" }} />
    </div>
  );
}

function Chip({ label, active, color, onClick }) {
  return (
    <button onClick={onClick} style={{ background: active ? color : C.card2, border: `1px solid ${active ? color : C.border}`, borderRadius: 99, padding: "5px 12px", color: active ? "#fff" : "#666", cursor: "pointer", fontSize: 11, fontWeight: active ? 700 : 400, whiteSpace: "nowrap", transition: "all .15s" }}>
      {label}
    </button>
  );
}

function Btn({ children, onClick, color = C.purple, ghost, full, small, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: ghost ? "transparent" : disabled ? "#1a1a2e" : color, border: `1.5px solid ${disabled ? "#2a2a3a" : color}`, borderRadius: 11, padding: small ? "7px 14px" : "10px 20px", color: ghost ? color : disabled ? "#444" : "#fff", cursor: disabled ? "not-allowed" : "pointer", fontSize: small ? 12 : 13, fontWeight: 700, width: full ? "100%" : "auto", opacity: disabled ? .6 : 1, transition: "opacity .15s" }}>
      {children}
    </button>
  );
}

function Stat({ icon, value, label, color }) {
  return (
    <div style={{ background: C.card2, borderRadius: 14, padding: "12px 8px", textAlign: "center", flex: 1 }}>
      <div style={{ fontSize: 17, marginBottom: 2 }}>{icon}</div>
      <div style={{ color, fontSize: 16, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      <div style={{ color: "#444", fontSize: 10, marginTop: 3 }}>{label}</div>
    </div>
  );
}

function HRow({ habit, done, streak, onToggle }) {
  const c = HC[habit.id] || C.purple;
  return (
    <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", background: done ? `${c}10` : C.card2 + "80", borderRadius: 12, marginBottom: 4, cursor: "pointer", border: `1px solid ${done ? c + "40" : C.border}`, transition: "all .2s" }}>
      <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{habit.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ color: done ? "#fff" : "#888", fontSize: 13, fontWeight: done ? 600 : 400 }}>{habit.label}</div>
        {streak > 0 && <div style={{ color: c, fontSize: 10, marginTop: 1 }}>🔥 {streak}d streak</div>}
      </div>
      <div style={{ width: 22, height: 22, borderRadius: 11, background: done ? c : "transparent", border: `2px solid ${done ? c : "#2a2a3a"}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, transition: "all .2s" }}>
        {done ? "✓" : ""}
      </div>
    </div>
  );
}

function Toggle({ value, onChange, color = C.purple }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 99, background: value ? color : "#1e1e30", cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0, border: `1px solid ${value ? color : C.border}` }}>
      <div style={{ width: 18, height: 18, borderRadius: 99, background: "#fff", position: "absolute", top: 2, left: value ? 22 : 3, transition: "left .2s" }} />
    </div>
  );
}

// ── Charts ────────────────────────────────────────────────────────────────────
function Heatmap({ habitData, color = C.purple, label = "Activity" }) {
  const days = getLast(91);
  const scores = days.map(d => { const h = habitData[d] || {}; return Math.min(Math.round((HABITS.filter(x => h[x.id]).length / HABITS.length) * 4), 4); });
  const cols = Array(13).fill(0).map((_, wi) => days.slice(wi * 7, (wi + 1) * 7).map((d, di) => ({ d, s: scores[wi * 7 + di] || 0 })));
  const pal = ["#1a1a2e", "#2a1a4e", `${color}44`, `${color}88`, color];
  return (
    <div>
      <div style={{ color: "#444", fontSize: 10, marginBottom: 5 }}>{label} — last 91 days</div>
      <div style={{ display: "flex", gap: 2 }}>
        {cols.map((col, ci) => (
          <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {col.map((cell, di) => <div key={di} title={cell.d} style={{ width: 9, height: 9, borderRadius: 2, background: pal[cell.s] }} />)}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 3, marginTop: 5, alignItems: "center" }}>
        <span style={{ color: "#333", fontSize: 9 }}>Less</span>
        {pal.map((p, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: 2, background: p }} />)}
        <span style={{ color: "#333", fontSize: 9 }}>More</span>
      </div>
    </div>
  );
}

function LineChart({ points, color, label, unit = "", height = 80 }) {
  if (!points || points.length < 2) return <div style={{ color: "#333", fontSize: 12 }}>Log more data to see trend</div>;
  const vals = points.map(p => Number(p.v) || 0);
  const mn = Math.min(...vals), mx = Math.max(...vals), rng = mx - mn || 1;
  const W = 300, H = height, pad = 10;
  const pts = points.map((p, i) => ({ x: pad + (i / (points.length - 1)) * (W - pad * 2), y: H - pad - ((Number(p.v) - mn) / rng) * (H - pad * 2) }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${path} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;
  const id = `g${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <div>
      <div style={{ color: "#444", fontSize: 10, marginBottom: 4 }}>{label}</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${id})`} />
        <path d={path} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={color} />)}
        <text x={pts[pts.length - 1].x} y={Math.max(pts[pts.length - 1].y - 7, 10)} fill={color} fontSize={9} textAnchor="middle">{points[points.length - 1].v}{unit}</text>
      </svg>
    </div>
  );
}

// ── Onboarding ────────────────────────────────────────────────────────────────
function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [wake, setWake] = useState("06:00");
  const [sleep, setSleep] = useState("22:30");
  const [city, setCity] = useState("Gurugram");
  const [goal, setGoal] = useState("");
  const [meds, setMeds] = useState([""]);

  const steps = [
    {
      title: "Welcome 🙏", sub: "Your personal Life OS — set up in 60 seconds",
      content: (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🌟</div>
          <p style={{ color: "#888", fontSize: 14, lineHeight: 1.7, margin: "0 0 20px" }}>You've decided to build the best version of yourself. This app tracks, coaches, and guides you — every single day.</p>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="What should I call you?" style={{ ...inp, textAlign: "center", fontSize: 15 }} />
        </div>
      )
    },
    {
      title: `Hey ${name || "there"}! 👋`, sub: "Tell me about your ideal day",
      content: (
        <div>
          <div style={{ color: "#666", fontSize: 12, marginBottom: 5 }}>Ideal wake time</div>
          <input type="time" value={wake} onChange={e => setWake(e.target.value)} style={{ ...inp, marginBottom: 12 }} />
          <div style={{ color: "#666", fontSize: 12, marginBottom: 5 }}>Target sleep time</div>
          <input type="time" value={sleep} onChange={e => setSleep(e.target.value)} style={{ ...inp, marginBottom: 12 }} />
          <div style={{ color: "#666", fontSize: 12, marginBottom: 5 }}>Your city</div>
          <input value={city} onChange={e => setCity(e.target.value)} placeholder="City" style={inp} />
        </div>
      )
    },
    {
      title: "Your #1 Goal 🎯", sub: "What's the one thing you most want to achieve?",
      content: (
        <div>
          <textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g. Build a healthy, happy life with financial freedom and meaningful relationships" style={{ ...inp, minHeight: 100, resize: "vertical", lineHeight: 1.7, marginBottom: 12 }} />
          <div style={{ color: "#444", fontSize: 11 }}>This will show on your dashboard every day as your anchor.</div>
        </div>
      )
    },
    {
      title: "Daily Medicines 💊", sub: "Add medicines you take daily (skip if none)",
      content: (
        <div>
          {meds.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input value={m} onChange={e => { const a = [...meds]; a[i] = e.target.value; setMeds(a); }} placeholder={`Medicine ${i + 1}`} style={{ ...inp, flex: 1, width: "auto" }} />
              {i === meds.length - 1 && <button onClick={() => setMeds([...meds, ""])} style={{ background: C.cyan, border: "none", borderRadius: 8, padding: "0 14px", color: "#fff", cursor: "pointer", fontSize: 18 }}>+</button>}
            </div>
          ))}
        </div>
      )
    },
    {
      title: "You're all set! 🚀", sub: "Your journey to your best self starts now",
      content: (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🎯</div>
          {goal && <div style={{ background: `${C.purple}15`, borderRadius: 12, padding: 12, marginBottom: 16, color: C.purple, fontSize: 13, fontStyle: "italic", lineHeight: 1.6 }}>"{goal}"</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {["16 habit trackers", "AI life coach", "Sleep & weight charts", "Weekly review system", "91-day heatmap", "Pomodoro timer", "Notification reminders", "Trip planner"].map((f, i) => (
              <div key={i} style={{ background: C.card2, borderRadius: 10, padding: "8px 10px", color: "#777", fontSize: 11 }}>✓ {f}</div>
            ))}
          </div>
        </div>
      )
    },
  ];

  const cur = steps[step];
  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "-apple-system,'Inter',sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
          {steps.map((_, i) => <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= step ? C.purple : C.border, transition: "background .3s" }} />)}
        </div>
        <div style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{cur.title}</div>
        <div style={{ color: "#555", fontSize: 13, marginBottom: 20 }}>{cur.sub}</div>
        {cur.content}
        <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "space-between" }}>
          {step > 0 ? <Btn ghost color={C.purple} onClick={() => setStep(s => s - 1)}>Back</Btn> : <div />}
          <Btn color={C.purple} onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : onDone({ name, wakeTime: wake, sleepTime: sleep, city, goal, meds: meds.filter(Boolean) })}>
            {step === steps.length - 1 ? "Let's Go 🚀" : "Next →"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── AI Coach ──────────────────────────────────────────────────────────────────
function AICoach({ data }) {
  const [period, setPeriod] = useState("weekly");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const name = data.profile?.name || "friend";

  const generate = async () => {
    setLoading(true); setResult("");
    const days = period === "monthly" ? 30 : period === "quarterly" ? 90 : period === "yearly" ? 365 : 7;
    const cut = new Date(); cut.setDate(cut.getDate() - days);
    const cutISO = cut.toISOString().split("T")[0];
    const hdays = Object.entries(data.habits || {}).filter(([d]) => d >= cutISO);
    const total = hdays.length || 1;
    const rates = {};
    HABITS.forEach(h => { rates[h.label] = Math.round((hdays.filter(([, v]) => v[h.id]).length / total) * 100) + "%"; });
    const sl = (data.sleep || []).filter(s => s.date >= cutISO);
    const moods = Object.entries(data.mood || {}).filter(([d]) => d >= cutISO).map(([, v]) => v);
    const avgSl = sl.length ? (sl.reduce((a, s) => a + Number(s.hours || 0), 0) / sl.length).toFixed(1) : "N/A";
    const avgMood = moods.length ? (moods.reduce((a, v) => a + v, 0) / moods.length).toFixed(1) : "N/A";
    const top3 = Object.entries(rates).sort((a, b) => parseInt(b[1]) - parseInt(a[1])).slice(0, 3).map(([k, v]) => `${k}(${v})`).join(", ");
    const bot3 = Object.entries(rates).sort((a, b) => parseInt(a[1]) - parseInt(b[1])).slice(0, 3).map(([k, v]) => `${k}(${v})`).join(", ");
    const prompt = `You are ${name}'s personal life coach. They live in ${data.profile?.city || "India"} and their #1 goal is: "${data.profile?.goal || "build the best version of themselves"}". Be warm, direct, specific — like a brilliant friend who genuinely cares.\n\n${period.toUpperCase()} REVIEW (${total} days):\n• Top habits: ${top3} | Needs work: ${bot3}\n• Sleep avg: ${avgSl}h | Mood avg: ${avgMood}/4\n• Journals: ${Object.keys(data.journal || {}).filter(d => d >= cutISO).length} entries\n\nWrite a ${period} coaching note:\n**What you're winning at** — celebrate specifically\n**What the data reveals** — one insight they haven't noticed\n**Top 3 priorities next ${period}** — concrete, actionable\n**One hard truth** — say it with love\n**Closing line** — from someone who believes in them\n\nMax 280 words. Human tone. India context.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 900, messages: [{ role: "user", content: prompt }] }) });
      const d = await res.json();
      setResult(d.content?.[0]?.text || "Couldn't generate. Try again.");
    } catch { setResult("Network error. Please try again."); }
    setLoading(false);
  };

  return (
    <Card color={C.purple} title="🤖 AI Life Coach" sub="Personalised insights from your actual data">
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {["weekly", "monthly", "quarterly", "yearly"].map(p => <Chip key={p} label={p[0].toUpperCase() + p.slice(1)} active={period === p} color={C.purple} onClick={() => setPeriod(p)} />)}
      </div>
      <Btn full color={C.purple} onClick={generate}>{loading ? "Analysing your data…" : "Generate " + period[0].toUpperCase() + period.slice(1) + " Insights ✨"}</Btn>
      {result && (
        <div style={{ marginTop: 14, background: C.card2, borderRadius: 12, padding: 14, color: "#ccc", fontSize: 13, lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
          {result.split("**").map((seg, i) => i % 2 === 1 ? <strong key={i} style={{ color: "#fff" }}>{seg}</strong> : <span key={i}>{seg}</span>)}
        </div>
      )}
    </Card>
  );
}

// ── SIP Projector ─────────────────────────────────────────────────────────────
function SIPProjector() {
  const [monthly, setMonthly] = useState(10000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(20);
  const result = useMemo(() => { const r = rate / 100 / 12, n = years * 12; return Math.round(monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r)); }, [monthly, rate, years]);
  const invested = monthly * years * 12;
  const gains = result - invested;
  const points = useMemo(() => Array.from({ length: years }, (_, i) => { const n = (i + 1) * 12, r = rate / 100 / 12; return { v: Math.round(monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r)) }; }), [monthly, rate, years]);
  return (
    <Card color={C.teal} title="📈 SIP Investment Projector">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div><div style={{ color: "#555", fontSize: 11, marginBottom: 4 }}>Monthly SIP (₹)</div><input type="number" value={monthly} onChange={e => setMonthly(Number(e.target.value))} style={inp} /></div>
        <div><div style={{ color: "#555", fontSize: 11, marginBottom: 4 }}>Expected return (%)</div><input type="number" value={rate} onChange={e => setRate(Number(e.target.value))} style={inp} /></div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ color: "#555", fontSize: 11, marginBottom: 6 }}>Investment period: <span style={{ color: C.teal, fontWeight: 700 }}>{years} years</span></div>
        <input type="range" min={1} max={40} value={years} onChange={e => setYears(Number(e.target.value))} style={{ width: "100%", accentColor: C.teal }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
        <div style={{ background: C.card2, borderRadius: 12, padding: 10, textAlign: "center" }}><div style={{ color: "#555", fontSize: 10 }}>Invested</div><div style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginTop: 2 }}>{fmtINR(invested)}</div></div>
        <div style={{ background: C.card2, borderRadius: 12, padding: 10, textAlign: "center" }}><div style={{ color: "#555", fontSize: 10 }}>Gains</div><div style={{ color: C.green, fontSize: 13, fontWeight: 700, marginTop: 2 }}>{fmtINR(gains)}</div></div>
        <div style={{ background: `${C.teal}15`, borderRadius: 12, padding: 10, textAlign: "center", border: `1px solid ${C.teal}30` }}><div style={{ color: C.teal, fontSize: 10 }}>Total Value</div><div style={{ color: C.teal, fontSize: 13, fontWeight: 800, marginTop: 2 }}>{fmtINR(result)}</div></div>
      </div>
      <LineChart points={points} color={C.teal} label="Portfolio growth over time" />
      <div style={{ marginTop: 10, color: "#444", fontSize: 11 }}>* Based on {rate}% annual returns. Not financial advice.</div>
    </Card>
  );
}

// ── Pomodoro ──────────────────────────────────────────────────────────────────
function Pomodoro() {
  const [mode, setMode] = useState("work");
  const [secs, setSecs] = useState(25 * 60);
  const [on, setOn] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [task, setTask] = useState("");
  const ref = useRef(null);
  const WORK = 25 * 60, BREAK = 5 * 60;
  useEffect(() => {
    if (on) {
      ref.current = setInterval(() => setSecs(s => {
        if (s <= 1) { clearInterval(ref.current); setOn(false); if (mode === "work") { setSessions(n => n + 1); setMode("break"); setSecs(BREAK); } else { setMode("work"); setSecs(WORK); } return 0; }
        return s - 1;
      }), 1000);
    } else clearInterval(ref.current);
    return () => clearInterval(ref.current);
  }, [on, mode]);
  const max = mode === "work" ? WORK : BREAK;
  const pct = secs / max, r = 56, c = 2 * Math.PI * r;
  return (
    <Card color={C.blue} title="⏱ Pomodoro Focus Timer" sub="25 min work · 5 min break · stay locked in">
      <input value={task} onChange={e => setTask(e.target.value)} placeholder="What are you working on?" style={{ ...inp, marginBottom: 14 }} />
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        <svg width={130} height={130}>
          <circle cx={65} cy={65} r={r} fill="none" stroke={C.border} strokeWidth={9} />
          <circle cx={65} cy={65} r={r} fill="none" stroke={mode === "work" ? C.blue : C.green} strokeWidth={9} strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" transform="rotate(-90 65 65)" />
          <text x={65} y={59} textAnchor="middle" fill="#fff" fontSize={22} fontWeight="bold">{fmtTime(secs)}</text>
          <text x={65} y={76} textAnchor="middle" fill="#444" fontSize={11}>{mode === "work" ? "Deep Work 🔴" : "Break 🟢"}</text>
          <text x={65} y={90} textAnchor="middle" fill="#333" fontSize={10}>Session #{sessions + 1}</text>
        </svg>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}>
        <Btn color={mode === "work" ? C.blue : C.green} onClick={() => setOn(!on)}>{on ? "Pause" : "Start"}</Btn>
        <Btn color={C.blue} ghost onClick={() => { setOn(false); setSecs(mode === "work" ? WORK : BREAK); }}>Reset</Btn>
      </div>
      {sessions > 0 && <div style={{ textAlign: "center", color: "#555", fontSize: 12, marginTop: 8 }}>{sessions} session{sessions !== 1 ? "s" : ""} · {sessions * 25} min focused</div>}
    </Card>
  );
}

// ── Balance Wheel ─────────────────────────────────────────────────────────────
function BalanceWheel({ data, save }) {
  const areas = ["Health", "Career", "Finance", "Relationships", "Growth", "Fun", "Spirituality", "Mindset"];
  const colors = [C.green, C.blue, C.teal, C.rose, C.violet, C.fuchsia, C.purple, C.amber];
  const saved = data.balanceWheel || {};
  const [vals, setVals] = useState(() => areas.reduce((a, ar) => ({ ...a, [ar]: saved[ar] || 5 }), {}));
  const cx = 120, cy = 120, maxR = 90;
  const pts = areas.map((ar, i) => {
    const angle = (i / areas.length) * 2 * Math.PI - Math.PI / 2;
    const r = (vals[ar] / 10) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), lx: cx + (maxR + 18) * Math.cos(angle), ly: cy + (maxR + 18) * Math.sin(angle), label: ar, color: colors[i] };
  });
  const polyPts = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return (
    <div>
      <Card color={C.purple} title="🎯 Life Balance Wheel" sub="Rate each area 1-10">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <svg width={240} height={240} viewBox="0 0 240 240">
            {[2, 4, 6, 8, 10].map(r => <circle key={r} cx={cx} cy={cy} r={(r / 10) * maxR} fill="none" stroke={C.border} strokeWidth={1} />)}
            {areas.map((_, i) => { const angle = (i / areas.length) * 2 * Math.PI - Math.PI / 2; return <line key={i} x1={cx} y1={cy} x2={cx + maxR * Math.cos(angle)} y2={cy + maxR * Math.sin(angle)} stroke={C.border} strokeWidth={1} />; })}
            <polygon points={polyPts} fill={`${C.purple}30`} stroke={C.purple} strokeWidth={2} />
            {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={4} fill={p.color} />)}
            {pts.map((p, i) => <text key={i} x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle" fill={colors[i]} fontSize={8} fontWeight="600">{p.label}</text>)}
          </svg>
        </div>
        {areas.map((ar, i) => (
          <div key={ar} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ color: colors[i], fontSize: 12, width: 90, flexShrink: 0 }}>{ar}</div>
            <input type="range" min={1} max={10} value={vals[ar]} onChange={e => setVals(v => ({ ...v, [ar]: Number(e.target.value) }))} style={{ flex: 1, accentColor: colors[i] }} />
            <div style={{ color: colors[i], fontWeight: 700, fontSize: 13, width: 20, textAlign: "right" }}>{vals[ar]}</div>
          </div>
        ))}
        <div style={{ height: 6 }} />
        <Btn full color={C.purple} onClick={() => save({ ...data, balanceWheel: { ...vals, date: todayISO() } })}>Save Wheel ✓</Btn>
      </Card>
    </div>
  );
}

// ── Routine Checklist ─────────────────────────────────────────────────────────
function RoutineChecklist({ data, save }) {
  const mc = data.morningChecks || {}, nc = data.nightChecks || {}, today = todayISO();
  const mDone = MORNING_ROUTINE.filter((_, i) => mc[today]?.[i]).length;
  const nDone = NIGHT_ROUTINE.filter((_, i) => nc[today]?.[i]).length;
  return (
    <div>
      <Card color={C.amber} title={`☀️ Morning Routine — ${mDone}/${MORNING_ROUTINE.length}`}>
        <Bar value={mDone} max={MORNING_ROUTINE.length} color={C.amber} h={4} />
        <div style={{ height: 10 }} />
        {MORNING_ROUTINE.map((item, i) => {
          const done = !!mc[today]?.[i];
          return (
            <div key={i} onClick={() => save({ ...data, morningChecks: { ...mc, [today]: { ...mc[today], [i]: !done } } })} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
              <div style={{ width: 20, height: 20, borderRadius: 10, background: done ? C.amber : "transparent", border: `2px solid ${done ? C.amber : "#2a2a3a"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", flexShrink: 0 }}>{done ? "✓" : ""}</div>
              <span style={{ color: done ? "#fff" : "#888", fontSize: 13, textDecoration: done ? "line-through" : "none" }}>{item}</span>
            </div>
          );
        })}
      </Card>
      <Card color={C.indigo} title={`🌙 Night Routine — ${nDone}/${NIGHT_ROUTINE.length}`}>
        <Bar value={nDone} max={NIGHT_ROUTINE.length} color={C.indigo} h={4} />
        <div style={{ height: 10 }} />
        {NIGHT_ROUTINE.map((item, i) => {
          const done = !!nc[today]?.[i];
          return (
            <div key={i} onClick={() => save({ ...data, nightChecks: { ...nc, [today]: { ...nc[today], [i]: !done } } })} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
              <div style={{ width: 20, height: 20, borderRadius: 10, background: done ? C.indigo : "transparent", border: `2px solid ${done ? C.indigo : "#2a2a3a"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", flexShrink: 0 }}>{done ? "✓" : ""}</div>
              <span style={{ color: done ? "#fff" : "#888", fontSize: 13, textDecoration: done ? "line-through" : "none" }}>{item}</span>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ── Tab: Today ────────────────────────────────────────────────────────────────
function TabToday({ data, save, toggleHabit, getStreak }) {
  const tod = data.habits[todayISO()] || {};
  const done = HABITS.filter(h => tod[h.id]).length;
  const score = Math.round((done / HABITS.length) * 100);
  const moodVal = data.mood[todayISO()];
  const moodE = ["😞", "😕", "😐", "🙂", "😄"];
  const name = data.profile?.name;
  const todaySl = useMemo(() => data.sleep.find(s => s.date === todayISO()), [data.sleep]);
  const exMins = useMemo(() => data.exercise.filter(e => e.date === todayISO()).reduce((a, e) => a + Number(e.duration || 0), 0), [data.exercise]);
  const water = useMemo(() => data.food.filter(f => f.date === todayISO()).reduce((a, f) => a + Number(f.water || 0), 0), [data.food]);
  const quote = DAILY_QUOTES[new Date().getDay() % DAILY_QUOTES.length];
  const mDone = MORNING_ROUTINE.filter((_, i) => (data.morningChecks || {})[todayISO()]?.[i]).length;
  const nDone = NIGHT_ROUTINE.filter((_, i) => (data.nightChecks || {})[todayISO()]?.[i]).length;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: "#fff", fontSize: 22, fontWeight: 800 }}>{greet()}{name ? `, ${name}` : ""}! 🙏</div>
        <div style={{ color: "#444", fontSize: 13, marginTop: 2 }}>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} · {isWeekend() ? "Weekend 🌴" : "Weekday 💼"}</div>
      </div>
      {data.profile?.goal && <div style={{ background: `${C.purple}10`, borderRadius: 12, padding: "10px 14px", marginBottom: 12, border: `1px solid ${C.purple}20` }}><div style={{ color: "#444", fontSize: 10, marginBottom: 2 }}>YOUR GOAL</div><div style={{ color: C.purple, fontSize: 13, fontStyle: "italic" }}>"{data.profile.goal}"</div></div>}
      <div style={{ background: C.card2, borderRadius: 12, padding: "10px 14px", marginBottom: 12 }}><div style={{ color: "#333", fontSize: 10, marginBottom: 2 }}>TODAY'S QUOTE</div><div style={{ color: "#666", fontSize: 12, fontStyle: "italic", lineHeight: 1.5 }}>{quote}</div></div>
      <div style={{ background: `linear-gradient(135deg,#160a2e,${C.card})`, borderRadius: 20, padding: 18, marginBottom: 12, border: `1px solid ${C.purple}20` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative", width: 76, height: 76, flexShrink: 0 }}>
            <svg width={76} height={76} style={{ transform: "rotate(-90deg)" }}>
              <circle cx={38} cy={38} r={30} fill="none" stroke="#1e1e30" strokeWidth={8} />
              <circle cx={38} cy={38} r={30} fill="none" stroke={score >= 70 ? C.green : score >= 40 ? C.amber : C.rose} strokeWidth={8} strokeDasharray={2 * Math.PI * 30} strokeDashoffset={2 * Math.PI * 30 * (1 - score / 100)} strokeLinecap="round" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
              <span style={{ color: "#fff", fontSize: 16, fontWeight: 800, lineHeight: 1 }}>{score}</span>
              <span style={{ color: "#444", fontSize: 9 }}>%</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{score >= 80 ? "🔥 Crushing it!" : score >= 50 ? "💪 Keep going!" : score > 0 ? "🌱 Building momentum" : "👋 Start strong today"}</div>
            <Bar value={done} max={HABITS.length} color={score >= 70 ? C.green : score >= 40 ? C.amber : C.rose} h={5} />
            <div style={{ color: "#444", fontSize: 11, marginTop: 5 }}>{done} of {HABITS.length} habits done</div>
          </div>
        </div>
      </div>
      {score === 100 && <div style={{ background: `${C.green}15`, borderRadius: 14, padding: 14, marginBottom: 12, textAlign: "center", border: `1px solid ${C.green}30` }}><div style={{ fontSize: 32, marginBottom: 4 }}>🎉</div><div style={{ color: C.green, fontWeight: 800, fontSize: 16 }}>100% — Perfect Day!</div></div>}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <Stat icon="😴" value={todaySl ? todaySl.hours + "h" : "—"} label="Sleep" color={todaySl && Number(todaySl.hours) >= 7 ? C.green : C.rose} />
        <Stat icon="🏋️" value={exMins > 0 ? exMins + "m" : "—"} label="Exercise" color={exMins >= 90 ? C.green : C.amber} />
        <Stat icon="💧" value={water + "/8"} label="Water" color={water >= 8 ? C.green : C.sky} />
        <Stat icon="😊" value={moodVal != null ? moodE[moodVal] : "—"} label="Mood" color={C.pink} />
      </div>
      <Card color={C.amber}>
        <div style={{ color: "#555", fontSize: 12, marginBottom: 10 }}>How are you feeling right now?</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {moodE.map((e, i) => <div key={i} onClick={() => save({ ...data, mood: { ...data.mood, [todayISO()]: i } })} style={{ fontSize: 26, cursor: "pointer", opacity: moodVal === i ? 1 : 0.2, transform: moodVal === i ? "scale(1.3)" : "scale(1)", transition: "all .2s" }}>{e}</div>)}
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <div style={{ background: C.card, borderRadius: 14, padding: 12, border: `1px solid ${C.amber}20` }}><div style={{ color: C.amber, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>☀️ Morning</div><div style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>{mDone}/{MORNING_ROUTINE.length}</div><Bar value={mDone} max={MORNING_ROUTINE.length} color={C.amber} h={3} /></div>
        <div style={{ background: C.card, borderRadius: 14, padding: 12, border: `1px solid ${C.indigo}20` }}><div style={{ color: C.indigo, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>🌙 Night</div><div style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>{nDone}/{NIGHT_ROUTINE.length}</div><Bar value={nDone} max={NIGHT_ROUTINE.length} color={C.indigo} h={3} /></div>
      </div>
      <Card color={C.green} title="⚡ Today's Habits">
        {HABITS.map(h => <HRow key={h.id} habit={h} done={!!tod[h.id]} streak={getStreak(h.id)} onToggle={() => toggleHabit(h.id)} />)}
      </Card>
    </div>
  );
}

// ── Tab: Habits ───────────────────────────────────────────────────────────────
function TabHabits({ data, toggleHabit, getStreak }) {
  const tod = data.habits[todayISO()] || {};
  const done = HABITS.filter(h => tod[h.id]).length;
  const cats = [...new Set(HABITS.map(h => h.cat))];
  return (
    <div>
      <Card color={C.purple}>
        <Bar value={done} max={HABITS.length} color={C.purple} h={8} />
        <div style={{ color: "#555", fontSize: 12, marginTop: 6 }}>{done}/{HABITS.length} today</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {Object.entries(CAT_META).map(([cat, m]) => { const t = HABITS.filter(h => h.cat === cat).length, cd = HABITS.filter(h => h.cat === cat && tod[h.id]).length; return <div key={cat} style={{ background: C.card2, borderRadius: 8, padding: "5px 9px", fontSize: 11, color: cd === t ? m.color : "#444" }}>{m.label.split(" ")[0]} {cd}/{t}</div>; })}
        </div>
      </Card>
      <Heatmap habitData={data.habits} color={C.purple} label="Overall habit completion" />
      {cats.map(cat => (
        <Card key={cat} color={CAT_META[cat].color} title={CAT_META[cat].label}>
          {HABITS.filter(h => h.cat === cat).map(h => <HRow key={h.id} habit={h} done={!!tod[h.id]} streak={getStreak(h.id)} onToggle={() => toggleHabit(h.id)} />)}
        </Card>
      ))}
    </div>
  );
}

// ── Tab: Journal ──────────────────────────────────────────────────────────────
function TabJournal({ data, save, toggleHabit }) {
  const ex = data.journal[todayISO()];
  const [text, setText] = useState(ex?.text || "");
  const [g, setG] = useState(ex?.gratitude || ["", "", ""]);
  const [search, setSearch] = useState("");
  const p = JOURNAL_PROMPTS[new Date().getDay() % JOURNAL_PROMPTS.length];
  const entries = Object.values(data.journal).reverse();
  const filtered = search ? entries.filter(e => e.text?.toLowerCase().includes(search.toLowerCase())) : entries;
  return (
    <div>
      <Card color={C.pink} title="✍️ Today's Journal" sub={`Prompt: ${p}`}>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Write freely. No judgment. This is yours." style={{ ...inp, minHeight: 140, resize: "vertical", lineHeight: 1.75, marginBottom: 12 }} />
        <div style={{ color: "#555", fontSize: 12, marginBottom: 8, fontWeight: 600 }}>🙏 3 Things Grateful For</div>
        {g.map((v, i) => <input key={i} value={v} onChange={e => { const a = [...g]; a[i] = e.target.value; setG(a); }} placeholder="I'm grateful for…" style={{ ...inp, marginBottom: 6 }} />)}
        <div style={{ height: 8 }} />
        <Btn full color={C.pink} onClick={() => { save({ ...data, journal: { ...data.journal, [todayISO()]: { text, gratitude: g, date: todayISO() } } }); toggleHabit("journal"); }}>Save Journal ✓</Btn>
      </Card>
      {entries.length > 0 && (
        <Card color={C.pink} title={`📖 Past Entries (${entries.length})`}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search entries…" style={{ ...inp, marginBottom: 12 }} />
          {filtered.slice(0, 8).map((j, i) => (
            <div key={i} style={{ borderBottom: `1px solid ${C.border}`, padding: "10px 0" }}>
              <div style={{ color: C.pink, fontSize: 11, marginBottom: 4 }}>{j.date}</div>
              <div style={{ color: "#666", fontSize: 13, lineHeight: 1.5 }}>{j.text?.slice(0, 120)}{j.text?.length > 120 ? "…" : ""}</div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ── Tab: Sleep ────────────────────────────────────────────────────────────────
function TabSleep({ data, save, toggleHabit }) {
  const [bed, setBed] = useState(data.profile?.sleepTime || "22:30");
  const [wk, setWk] = useState(data.profile?.wakeTime || "06:00");
  const [q, setQ] = useState("Good");
  const calcH = useCallback(() => { try { const [bh, bm] = bed.split(":").map(Number), [wh, wm] = wk.split(":").map(Number); let d = (wh * 60 + wm) - (bh * 60 + bm); if (d < 0) d += 1440; return (d / 60).toFixed(1); } catch { return 0; } }, [bed, wk]);
  const h = calcH();
  const last14 = data.sleep.slice(-14).map(s => ({ v: Number(s.hours) }));
  const avg7 = useMemo(() => { const r = data.sleep.slice(-7); return r.length ? (r.reduce((a, s) => a + Number(s.hours), 0) / r.length).toFixed(1) : null; }, [data.sleep]);
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <Stat icon="📊" value={avg7 ? avg7 + "h" : "—"} label="7-day avg" color={avg7 && Number(avg7) >= 7 ? C.green : C.rose} />
        <Stat icon="✅" value={data.sleep.filter(s => Number(s.hours) >= 7).length} label="7h+ nights" color={C.green} />
        <Stat icon="🗓️" value={data.sleep.length} label="Total logs" color={C.indigo} />
      </div>
      {last14.length > 1 && <Card color={C.indigo}><LineChart points={last14} color={C.indigo} label="Sleep duration trend (hours)" unit="h" /></Card>}
      <Card color={C.indigo} title="😴 Log Sleep">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div><div style={{ color: "#444", fontSize: 11, marginBottom: 4 }}>Bedtime</div><input type="time" value={bed} onChange={e => setBed(e.target.value)} style={inp} /></div>
          <div><div style={{ color: "#444", fontSize: 11, marginBottom: 4 }}>Wake time</div><input type="time" value={wk} onChange={e => setWk(e.target.value)} style={inp} /></div>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {["Poor", "Fair", "Good", "Great"].map(v => <Chip key={v} label={v} active={q === v} color={C.indigo} onClick={() => setQ(v)} />)}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.card2, borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
          <span style={{ color: "#555", fontSize: 13 }}>Duration</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: Number(h) >= 7 ? C.green : C.rose }}>{h}h</span>
        </div>
        <Btn full color={C.indigo} onClick={() => { save({ ...data, sleep: [...data.sleep.filter(s => s.date !== todayISO()), { date: todayISO(), bed, wake: wk, hours: h, quality: q }] }); toggleHabit("sleep"); }}>Save Sleep Log ✓</Btn>
      </Card>
    </div>
  );
}

// ── Tab: Exercise ─────────────────────────────────────────────────────────────
function TabExercise({ data, save, toggleHabit }) {
  const [exType, setExType] = useState("Gym");
  const [dur, setDur] = useState("90");
  const [intensity, setIntensity] = useState("Moderate");
  const [notes, setNotes] = useState("");
  const types = ["Gym", "Yoga", "Surya Namaskar", "Running", "Walking", "Cycling", "Swimming", "Cricket", "HIIT", "Pranayama", "Other"];
  const thisWeek = useMemo(() => { const d = new Date(), mon = new Date(d); mon.setDate(d.getDate() - (d.getDay() || 7) + 1); return data.exercise.filter(e => e.date >= mon.toISOString().split("T")[0]).reduce((a, e) => a + Number(e.duration || 0), 0); }, [data.exercise]);
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <Stat icon="🏋️" value={thisWeek + "m"} label="This week" color={thisWeek >= 450 ? C.green : C.amber} />
        <Stat icon="📅" value={data.exercise.length} label="Sessions" color={C.green} />
        <Stat icon="🔥" value={data.exercise.filter(e => e.intensity === "Intense").length} label="Intense" color={C.rose} />
      </div>
      <Heatmap habitData={Object.fromEntries(Object.entries(data.habits || {}).map(([d, h]) => [d, { exercise: h.exercise }]))} color={C.green} label="Exercise consistency" />
      <Card color={C.green} title="🏋️ Log Exercise">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {types.map(t => <Chip key={t} label={t} active={exType === t} color={C.green} onClick={() => setExType(t)} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div><div style={{ color: "#444", fontSize: 11, marginBottom: 4 }}>Duration (min)</div><input type="number" value={dur} onChange={e => setDur(e.target.value)} style={inp} /></div>
          <div><div style={{ color: "#444", fontSize: 11, marginBottom: 4 }}>Intensity</div><select value={intensity} onChange={e => setIntensity(e.target.value)} style={{ ...inp, height: 40 }}><option>Light</option><option>Moderate</option><option>Intense</option></select></div>
        </div>
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes" style={{ ...inp, marginBottom: 12 }} />
        <Btn full color={C.green} onClick={() => { save({ ...data, exercise: [...data.exercise, { type: exType, duration: dur, intensity, notes, date: todayISO(), id: Date.now() }] }); toggleHabit("exercise"); setNotes(""); }}>Log Exercise ✓</Btn>
      </Card>
    </div>
  );
}

// ── Tab: Food ─────────────────────────────────────────────────────────────────
function TabFood({ data, save, toggleHabit }) {
  const [meal, setMeal] = useState("Breakfast");
  const [items, setItems] = useState("");
  const [water, setWater] = useState("2");
  const meals = ["Early Morning", "Breakfast", "Lunch", "Evening Snack", "Dinner"];
  const quick = ["Dal Chawal", "Roti Sabzi", "Poha", "Idli Sambar", "Oats", "Fruits", "Salad", "Khichdi", "Paneer", "Eggs", "Curd", "Sprouts"];
  const tFood = data.food.filter(f => f.date === todayISO());
  const totalW = tFood.reduce((a, f) => a + Number(f.water || 0), 0);
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <Stat icon="🍽️" value={tFood.length} label="Meals today" color={C.orange} />
        <Stat icon="💧" value={`${totalW}/8`} label="Water" color={totalW >= 8 ? C.green : C.sky} />
      </div>
      <div style={{ background: C.card, borderRadius: 16, padding: 14, marginBottom: 12, border: `1px solid ${C.sky}18` }}>
        <div style={{ color: C.sky, fontWeight: 600, fontSize: 13, marginBottom: 8 }}>💧 {totalW}/8 glasses</div>
        <div style={{ display: "flex", gap: 3 }}>{Array(8).fill(0).map((_, i) => <div key={i} style={{ flex: 1, height: 22, borderRadius: 5, background: i < totalW ? C.sky : C.card2, transition: "background .3s" }} />)}</div>
      </div>
      <Card color={C.orange} title="🥗 Log Meal">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
          {meals.map(m => <Chip key={m} label={m} active={meal === m} color={C.orange} onClick={() => setMeal(m)} />)}
        </div>
        <input value={items} onChange={e => setItems(e.target.value)} placeholder="What did you eat?" style={{ ...inp, marginBottom: 8 }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
          {quick.map(q => <span key={q} onClick={() => setItems(v => v ? v + ", " + q : q)} style={{ background: C.card2, borderRadius: 6, padding: "3px 9px", fontSize: 11, color: "#777", cursor: "pointer" }}>{q}</span>)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ color: "#555", fontSize: 12 }}>💧</span>
          <input type="number" value={water} onChange={e => setWater(e.target.value)} style={{ ...inp, width: 70, flex: "none" }} />
          <span style={{ color: "#444", fontSize: 12 }}>glasses</span>
        </div>
        <Btn full color={C.orange} onClick={() => { if (items) { save({ ...data, food: [...data.food, { meal, items, water, date: todayISO(), id: Date.now() }] }); toggleHabit("food"); setItems(""); setWater("2"); } }}>Log Meal ✓</Btn>
      </Card>
      {tFood.length > 0 && <Card color={C.orange} title="Today's Log">{tFood.map((f, i) => <div key={i} style={{ padding: "7px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}><span style={{ color: C.orange, fontWeight: 600 }}>{f.meal}: </span><span style={{ color: "#888" }}>{f.items}</span></div>)}</Card>}
    </div>
  );
}

// ── Tab: Reading ──────────────────────────────────────────────────────────────
function TabReading({ data, save, toggleHabit }) {
  const [current, setCurrent] = useState(data.books?.current || "");
  const [mins, setMins] = useState("");
  const log = data.books?.log || [];
  const readPts = log.slice(-10).map(l => ({ v: Number(l.mins || 0) }));
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <Stat icon="📚" value={log.length} label="Sessions" color={C.fuchsia} />
        <Stat icon="⏱️" value={Math.round(log.reduce((a, l) => a + Number(l.mins || 0), 0) / 60) + "h"} label="Total" color={C.fuchsia} />
      </div>
      {readPts.length > 1 && <Card color={C.fuchsia}><LineChart points={readPts} color={C.fuchsia} label="Reading minutes per session" unit="m" /></Card>}
      <Card color={C.fuchsia} title="📚 Log Reading">
        <input value={current} onChange={e => setCurrent(e.target.value)} placeholder="Book title…" style={{ ...inp, marginBottom: 8 }} />
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input type="number" value={mins} onChange={e => setMins(e.target.value)} placeholder="Minutes read" style={{ ...inp, flex: 1, width: "auto" }} />
          <Btn color={C.fuchsia} onClick={() => { if (mins) { save({ ...data, books: { current, log: [...log, { date: todayISO(), book: current, mins: Number(mins) }] } }); toggleHabit("reading"); setMins(""); } }} small>Log ✓</Btn>
        </div>
      </Card>
      <Card color={C.fuchsia} title="📖 Books for You">
        {BOOKS.map((b, i) => (
          <div key={i} onClick={() => setCurrent(b.t)} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{b.t}</div>
            <div style={{ color: "#444", fontSize: 11 }}>by {b.a}</div>
            <div style={{ color: C.fuchsia, fontSize: 11, marginTop: 2 }}>→ {b.w}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Tab: Learn & Guitar ───────────────────────────────────────────────────────
function TabLearnGuitar({ data, save, toggleHabit }) {
  const [topic, setTopic] = useState("");
  const [gMins, setGMins] = useState("20");
  const [gNote, setGNote] = useState("");
  const ll = data.learnLog || [], gl = data.guitarLog || [];
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <Stat icon="🧠" value={ll.length} label="Learn logs" color={C.yellow} />
        <Stat icon="🎸" value={gl.length} label="Guitar logs" color={C.violet} />
        <Stat icon="⏱️" value={gl.reduce((a, g) => a + Number(g.mins || 0), 0) + "m"} label="Guitar time" color={C.violet} />
      </div>
      <Card color={C.yellow} title="🧠 Learn 1h Daily" sub="Finance · AI · History · Language · Philosophy · Coding">
        <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="What did you learn today?" style={{ ...inp, marginBottom: 12 }} />
        <Btn full color={C.yellow} onClick={() => { if (topic) { save({ ...data, learnLog: [...ll, { date: todayISO(), topic, id: Date.now() }] }); toggleHabit("learn"); setTopic(""); } }}>Log Learning ✓</Btn>
        <div style={{ marginTop: 12 }}>{ll.slice(-5).reverse().map((l, i) => <div key={i} style={{ padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12 }}><span style={{ color: C.yellow }}>{l.date}</span><span style={{ color: "#555" }}> — {l.topic}</span></div>)}</div>
      </Card>
      <Card color={C.violet} title="🎸 Guitar Practice">
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input type="number" value={gMins} onChange={e => setGMins(e.target.value)} style={{ ...inp, width: 80, flex: "none" }} placeholder="Min" />
          <input value={gNote} onChange={e => setGNote(e.target.value)} placeholder="Chords, song, scale practiced…" style={{ ...inp, flex: 1, width: "auto" }} />
        </div>
        <Btn full color={C.violet} onClick={() => { save({ ...data, guitarLog: [...gl, { date: todayISO(), mins: gMins, note: gNote, id: Date.now() }] }); toggleHabit("guitar"); setGNote(""); }}>Log Practice ✓</Btn>
        <div style={{ marginTop: 12 }}>{gl.slice(-5).reverse().map((g, i) => <div key={i} style={{ padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12 }}><span style={{ color: C.violet }}>{g.date}</span><span style={{ color: "#555" }}> — {g.mins}m {g.note ? `· ${g.note}` : ""}</span></div>)}</div>
      </Card>
    </div>
  );
}

// ── Tab: Meditate ─────────────────────────────────────────────────────────────
function TabMeditate({ data, save, toggleHabit }) {
  const [mins, setMins] = useState(15);
  const [secs, setSecs] = useState(15 * 60);
  const [on, setOn] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (on) { ref.current = setInterval(() => setSecs(s => { if (s <= 1) { clearInterval(ref.current); setOn(false); return 0; } return s - 1; }), 1000); }
    else clearInterval(ref.current);
    return () => clearInterval(ref.current);
  }, [on]);
  const streak = useMemo(() => { let s = 0, d = new Date(); while (true) { const k = d.toISOString().split("T")[0]; if ((data.medLog || []).find(m => m.date === k)) { s++; d.setDate(d.getDate() - 1); } else break; } return s; }, [data.medLog]);
  const pct = secs / (mins * 60), r = 56, c = 2 * Math.PI * r;
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <Stat icon="🔥" value={streak} label="Day streak" color={streak >= 7 ? C.green : C.violet} />
        <Stat icon="🧘" value={(data.medLog || []).length} label="Sessions" color={C.violet} />
        <Stat icon="⏱️" value={(data.medLog || []).reduce((a, m) => a + Number(m.mins || 0), 0) + "m"} label="Total" color={C.violet} />
      </div>
      <Card color={C.violet} title="🧘 Meditation Timer">
        <div style={{ display: "flex", gap: 6, marginBottom: 16, justifyContent: "center" }}>
          {[5, 10, 15, 20, 30].map(m => <Chip key={m} label={`${m}m`} active={mins === m} color={C.violet} onClick={() => { setMins(m); setSecs(m * 60); setOn(false); }} />)}
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <svg width={130} height={130}>
            <circle cx={65} cy={65} r={r} fill="none" stroke={C.border} strokeWidth={9} />
            <circle cx={65} cy={65} r={r} fill="none" stroke={C.violet} strokeWidth={9} strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" transform="rotate(-90 65 65)" />
            <text x={65} y={61} textAnchor="middle" fill="#fff" fontSize={22} fontWeight="bold">{fmtTime(secs)}</text>
            <text x={65} y={79} textAnchor="middle" fill="#444" fontSize={12}>{on ? "Breathe…" : "Ready"}</text>
          </svg>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 14 }}>
          <Btn color={C.violet} onClick={() => setOn(!on)}>{on ? "Pause" : "Start"}</Btn>
          <Btn color={C.violet} ghost onClick={() => { setOn(false); setSecs(mins * 60); }}>Reset</Btn>
        </div>
        <Btn full color={C.violet} onClick={() => { save({ ...data, medLog: [...(data.medLog || []), { date: todayISO(), mins }] }); toggleHabit("meditate"); }}>Save Session ✓</Btn>
      </Card>
    </div>
  );
}

// ── Tab: Medicine ─────────────────────────────────────────────────────────────
function TabMedicine({ data, save, toggleHabit }) {
  const [name, setName] = useState("");
  const [time, setTime] = useState("08:00");
  const meds = data.medList || [];
  const done = data.medicine[todayISO()] || {};
  const allDone = meds.length > 0 && meds.every(m => done[m.id]);
  return (
    <div>
      <Card color={C.cyan} title="💊 Daily Medicines">
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Medicine name" style={{ ...inp, flex: 1, width: "auto" }} />
          <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ ...inp, width: 90, flex: "none" }} />
          <Btn color={C.cyan} onClick={() => { if (name) { save({ ...data, medList: [...meds, { id: Date.now(), name, time }] }); setName(""); } }} small>+</Btn>
        </div>
        {meds.length === 0 ? <div style={{ color: "#444", fontSize: 13 }}>Add your daily medicines above.</div> : (
          <>
            {meds.map(m => (
              <div key={m.id} onClick={() => save({ ...data, medicine: { ...data.medicine, [todayISO()]: { ...done, [m.id]: !done[m.id] } } })} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", background: done[m.id] ? `${C.cyan}10` : C.card2, borderRadius: 12, marginBottom: 4, cursor: "pointer", border: `1px solid ${done[m.id] ? C.cyan + "40" : C.border}` }}>
                <div style={{ width: 22, height: 22, borderRadius: 11, background: done[m.id] ? C.cyan : "transparent", border: `2px solid ${done[m.id] ? C.cyan : "#2a2a3a"}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11 }}>{done[m.id] ? "✓" : ""}</div>
                <div style={{ flex: 1, color: done[m.id] ? "#fff" : "#aaa", fontSize: 13 }}>{m.name}</div>
                <div style={{ color: "#444", fontSize: 12 }}>{m.time}</div>
                <div onClick={e => { e.stopPropagation(); save({ ...data, medList: meds.filter(x => x.id !== m.id) }); }} style={{ color: "#333", cursor: "pointer", padding: "0 6px", fontSize: 18 }}>×</div>
              </div>
            ))}
            <div style={{ height: 8 }} />
            <Btn full color={allDone ? C.green : C.cyan} onClick={() => { save({ ...data, medicine: { ...data.medicine, [todayISO()]: Object.fromEntries(meds.map(m => [m.id, true])) } }); toggleHabit("medicine"); }}>{allDone ? "✅ All Done!" : "Mark All Done ✓"}</Btn>
          </>
        )}
      </Card>
    </div>
  );
}

// ── Tab: Finance ──────────────────────────────────────────────────────────────
function TabFinance({ data, save, toggleHabit }) {
  const [fType, setFType] = useState("SIP");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const logs = data.finance || [];
  const totalSIP = logs.filter(l => l.type === "SIP").reduce((a, l) => a + Number(l.amount || 0), 0);
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <Stat icon="💰" value={logs.length} label="Entries" color={C.teal} />
        <Stat icon="📈" value={fmtINR(totalSIP)} label="SIP total" color={C.teal} />
      </div>
      <SIPProjector />
      <Card color={C.teal} title="💰 Finance Log">
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
          {["SIP", "Stock", "FD", "MF", "Portfolio", "Expense", "Income", "Goal"].map(t => <Chip key={t} label={t} active={fType === t} color={C.teal} onClick={() => setFType(t)} />)}
        </div>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount (₹)" style={{ ...inp, marginBottom: 8 }} />
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Notes" style={{ ...inp, marginBottom: 12 }} />
        <Btn full color={C.teal} onClick={() => { if (amount || note) { save({ ...data, finance: [...logs, { type: fType, amount, note, date: todayISO(), id: Date.now() }] }); toggleHabit("finance"); setAmount(""); setNote(""); } }}>Log Entry ✓</Btn>
      </Card>
    </div>
  );
}

// ── Tab: Body ─────────────────────────────────────────────────────────────────
function TabBody({ data, save }) {
  const [wt, setWt] = useState("");
  const [height, setHeight] = useState(data.bodyMeasurements?.slice(-1)[0]?.height || "");
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const lastWt = (data.weight || []).slice(-1)[0]?.val;
  const bmi = (wt || lastWt) && height ? (Number(wt || lastWt) / ((Number(height) / 100) ** 2)).toFixed(1) : null;
  const bmiColor = bmi ? Number(bmi) < 18.5 ? C.sky : Number(bmi) < 25 ? C.green : Number(bmi) < 30 ? C.amber : C.rose : "#fff";
  const bmiLabel = bmi ? Number(bmi) < 18.5 ? "Underweight" : Number(bmi) < 25 ? "Normal ✅" : Number(bmi) < 30 ? "Overweight" : "Obese" : "";
  const wtPoints = (data.weight || []).slice(-14).map(w => ({ v: Number(w.val) }));
  const measurements = data.bodyMeasurements || [];
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <Stat icon="⚖️" value={lastWt ? lastWt + "kg" : "—"} label="Last weight" color={C.blue} />
        <Stat icon="📏" value={bmi || "—"} label="BMI" color={bmiColor} />
      </div>
      {wtPoints.length > 1 && <Card color={C.blue}><LineChart points={wtPoints} color={C.blue} label="Weight trend (kg)" unit="kg" /></Card>}
      <Card color={C.blue} title="💪 Body Measurements">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div><div style={{ color: "#555", fontSize: 11, marginBottom: 4 }}>Weight (kg)</div><input type="number" value={wt} onChange={e => setWt(e.target.value)} style={inp} /></div>
          <div><div style={{ color: "#555", fontSize: 11, marginBottom: 4 }}>Height (cm)</div><input type="number" value={height} onChange={e => setHeight(e.target.value)} style={inp} /></div>
          <div><div style={{ color: "#555", fontSize: 11, marginBottom: 4 }}>Chest (cm)</div><input type="number" value={chest} onChange={e => setChest(e.target.value)} style={inp} /></div>
          <div><div style={{ color: "#555", fontSize: 11, marginBottom: 4 }}>Waist (cm)</div><input type="number" value={waist} onChange={e => setWaist(e.target.value)} style={inp} /></div>
        </div>
        {bmi && <div style={{ padding: "10px 14px", background: C.card2, borderRadius: 10, marginBottom: 12, display: "flex", justifyContent: "space-between" }}><span style={{ color: "#666", fontSize: 13 }}>BMI: <span style={{ color: bmiColor, fontWeight: 800 }}>{bmi}</span></span><span style={{ color: bmiColor, fontSize: 12 }}>{bmiLabel}</span></div>}
        <Btn full color={C.blue} onClick={() => { if (wt) { save({ ...data, weight: [...(data.weight || []), { date: todayISO(), val: Number(wt) }], bodyMeasurements: [...measurements, { date: todayISO(), weight: wt, height, chest, waist }] }); setWt(""); setChest(""); setWaist(""); } }}>Log Measurements ✓</Btn>
      </Card>
    </div>
  );
}

// ── Tab: Content ──────────────────────────────────────────────────────────────
function TabContent({ data, save, toggleHabit }) {
  const [platform, setPlatform] = useState("LinkedIn");
  const [type, setType] = useState("Post");
  const [caption, setCaption] = useState("");
  const logs = data.contentLog || [];
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <Stat icon="💼" value={logs.filter(l => l.platform === "LinkedIn").length} label="LinkedIn" color={C.blue} />
        <Stat icon="📸" value={logs.filter(l => l.platform === "Instagram").length} label="Instagram" color={C.rose} />
        <Stat icon="📊" value={logs.length} label="Total" color={C.rose} />
      </div>
      <Card color={C.rose} title="📱 Content Log">
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {["LinkedIn", "Instagram", "Both"].map(p => <Chip key={p} label={p} active={platform === p} color={C.rose} onClick={() => setPlatform(p)} />)}
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {["Post", "Article", "Reel", "Story", "Thread"].map(t => <Chip key={t} label={t} active={type === t} color={C.rose} onClick={() => setType(t)} />)}
        </div>
        <textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="Caption / topic / idea…" style={{ ...inp, minHeight: 70, resize: "vertical", marginBottom: 10 }} />
        <Btn full color={C.rose} onClick={() => { if (caption) { save({ ...data, contentLog: [...logs, { platform, type, caption, date: todayISO(), id: Date.now() }] }); toggleHabit("social_media"); setCaption(""); } }}>Log Content ✓</Btn>
      </Card>
      <Card color={C.blue} title="💡 Content Ideas">
        {["Share one thing you learned this week", "Your fitness journey", "A book that changed your thinking", "Travel photo with a real story", "A productivity tip that actually worked", "One financial lesson from this month"].map((t, i) => <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}`, color: "#777", fontSize: 13 }}>💡 {t}</div>)}
      </Card>
    </div>
  );
}

// ── Tab: Travel ───────────────────────────────────────────────────────────────
function TabTravel({ data, save }) {
  const [dest, setDest] = useState("");
  const [dates, setDates] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Planning");
  const trips = data.tripPlans || [];
  return (
    <div>
      <Card color={C.teal} title="✈️ Trip Planner">
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {["Planning", "Booked", "Completed", "Wishlist"].map(s => <Chip key={s} label={s} active={status === s} color={C.teal} onClick={() => setStatus(s)} />)}
        </div>
        <input value={dest} onChange={e => setDest(e.target.value)} placeholder="Destination" style={{ ...inp, marginBottom: 8 }} />
        <input value={dates} onChange={e => setDates(e.target.value)} placeholder="Dates / timeframe" style={{ ...inp, marginBottom: 8 }} />
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes, budget, things to do…" style={{ ...inp, minHeight: 64, resize: "vertical", marginBottom: 12 }} />
        <Btn full color={C.teal} onClick={() => { if (dest) { save({ ...data, tripPlans: [...trips, { dest, dates, notes, status, id: Date.now(), added: todayISO() }] }); setDest(""); setDates(""); setNotes(""); } }}>Add Trip ✓</Btn>
      </Card>
      {trips.length > 0 && (
        <Card color={C.teal} title="🗺️ My Trips">
          {trips.map((t, i) => (
            <div key={i} style={{ background: C.card2, borderRadius: 12, padding: 12, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ color: "#fff", fontWeight: 600 }}>✈️ {t.dest}</span>
                <span style={{ background: `${C.teal}20`, color: C.teal, fontSize: 10, padding: "3px 8px", borderRadius: 99 }}>{t.status}</span>
              </div>
              {t.dates && <div style={{ color: "#555", fontSize: 12 }}>📅 {t.dates}</div>}
              {t.notes && <div style={{ color: "#777", fontSize: 12, marginTop: 3 }}>{t.notes.slice(0, 80)}</div>}
            </div>
          ))}
        </Card>
      )}
      <Card color={C.teal} title="💡 Travel Ideas">
        {[{ i: "🏔️", c: "Weekend", p: "Rishikesh · Kasol · Coorg" }, { i: "🌊", c: "Short trip", p: "Goa · Kerala · Andaman" }, { i: "🏜️", c: "Long trip", p: "Rajasthan · Spiti · Ladakh" }, { i: "🌏", c: "International", p: "Thailand · Japan · Vietnam" }].map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
            <span style={{ fontSize: 20 }}>{t.i}</span>
            <div><div style={{ color: C.teal, fontSize: 11, fontWeight: 600 }}>{t.c}</div><div style={{ color: "#888", fontSize: 13 }}>{t.p}</div></div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Tab: Schedule ─────────────────────────────────────────────────────────────
function TabSchedule() {
  const weekend = isWeekend(), sched = weekend ? WEEKEND : WEEKDAY, hr = new Date().getHours();
  return (
    <div>
      <Card color={C.blue} title={`📅 ${weekend ? "Weekend" : "Weekday"} Schedule`}>
        {sched.map((s, i) => {
          const sh = parseInt(s.t), active = sh === hr, past = sh < hr;
          return (
            <div key={i} style={{ display: "flex", gap: 12, padding: active ? "9px 8px" : "7px 8px", borderRadius: 9, background: active ? C.card2 : undefined, marginBottom: 1, alignItems: "flex-start" }}>
              <div style={{ color: active ? C.blue : past ? "#222" : "#444", fontSize: 12, fontWeight: active ? 700 : 400, minWidth: 44 }}>{s.t}</div>
              <div style={{ width: 2, background: active ? C.blue : past ? "#1a1a2e" : "#252535", borderRadius: 2, alignSelf: "stretch", minHeight: 14 }} />
              <div style={{ color: active ? "#fff" : past ? "#333" : "#777", fontSize: 13 }}>{active ? "▶ " : ""}{s.a}</div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ── Tab: Progress ─────────────────────────────────────────────────────────────
function TabProgress({ data, save, getStreak }) {
  const last14 = useMemo(() => getLast(14).map(d => { const done = HABITS.filter(h => data.habits[d]?.[h.id]).length; return { v: Math.round((done / HABITS.length) * 100) }; }), [data.habits]);
  const avg7 = Math.round(last14.slice(-7).reduce((a, d) => a + d.v, 0) / 7);
  const moodPts = Object.entries(data.mood || {}).slice(-14).map(([, v]) => ({ v }));
  const topStreaks = HABITS.filter(h => getStreak(h.id) > 0).sort((a, b) => getStreak(b.id) - getStreak(a.id)).slice(0, 8);
  const weeklyReview = data.weeklyReviews?.[weekKey()];
  const [q1, setQ1] = useState(weeklyReview?.q1 || "");
  const [q2, setQ2] = useState(weeklyReview?.q2 || "");
  const [q3, setQ3] = useState(weeklyReview?.q3 || "");
  const [rating, setRating] = useState(weeklyReview?.rating || 5);
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <Stat icon="📊" value={avg7 + "%"} label="7-day avg" color={avg7 >= 70 ? C.green : avg7 >= 40 ? C.amber : C.rose} />
        <Stat icon="🗓️" value={Object.keys(data.habits).length} label="Days tracked" color={C.purple} />
        <Stat icon="📓" value={Object.keys(data.journal).length} label="Journal days" color={C.pink} />
      </div>
      {last14.length > 1 && <Card color={C.purple}><LineChart points={last14} color={C.purple} label="Daily habit score (%) — last 14 days" unit="%" /></Card>}
      <Heatmap habitData={data.habits} color={C.purple} label="Full habit history" />
      {moodPts.length > 1 && <Card color={C.pink}><LineChart points={moodPts} color={C.pink} label="Mood trend (0–4)" /></Card>}
      {topStreaks.length > 0 && (
        <Card color={C.amber} title="🔥 Current Streaks">
          {topStreaks.map(h => <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}><span>{h.icon}</span><span style={{ flex: 1, color: "#bbb", fontSize: 13 }}>{h.label}</span><span style={{ color: HC[h.id] || C.purple, fontWeight: 700 }}>🔥 {getStreak(h.id)}d</span></div>)}
        </Card>
      )}
      <Card color={C.teal} title="📋 Weekly Review" sub={`Week of ${weekKey()}`}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: "#555", fontSize: 12, marginBottom: 6 }}>Rate your week:</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <div key={n} onClick={() => setRating(n)} style={{ width: 26, height: 26, borderRadius: 6, background: n <= rating ? C.teal : C.card2, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: n <= rating ? "#fff" : "#555", fontSize: 11, fontWeight: 700 }}>{n}</div>)}
          </div>
        </div>
        {[{ v: q1, s: setQ1, p: "3 biggest wins this week?" }, { v: q2, s: setQ2, p: "Habit you struggled with most?" }, { v: q3, s: setQ3, p: "What will you do differently?" }].map((q, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ color: "#555", fontSize: 12, marginBottom: 4 }}>Q{i + 1}: {q.p}</div>
            <textarea value={q.v} onChange={e => q.s(e.target.value)} style={{ ...inp, minHeight: 52, resize: "vertical" }} />
          </div>
        ))}
        <Btn full color={C.teal} onClick={() => save({ ...data, weeklyReviews: { ...data.weeklyReviews, [weekKey()]: { q1, q2, q3, rating, date: weekKey() } } })}>Save Review ✓</Btn>
      </Card>
      <AICoach data={data} />
    </div>
  );
}

// ── Tab: More ─────────────────────────────────────────────────────────────────
function TabMore({ data, save }) {
  const [section, setSection] = useState("balance");
  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {[{ k: "balance", l: "⚖️ Balance Wheel" }, { k: "pomodoro", l: "⏱ Pomodoro" }, { k: "annual", l: "💌 Annual Letter" }].map(s => <Chip key={s.k} label={s.l} active={section === s.k} color={C.purple} onClick={() => setSection(s.k)} />)}
      </div>
      {section === "balance" && <BalanceWheel data={data} save={save} />}
      {section === "pomodoro" && <Pomodoro />}
      {section === "annual" && (
        <div>
          <Card color={C.fuchsia} title={`💌 Letter to Future Self — ${new Date().getFullYear()}`} sub="Write to next year's you.">
            {(() => {
              const [text, setText] = useState(data.annualLetter?.[new Date().getFullYear()]?.text || "");
              return (
                <>
                  <textarea value={text} onChange={e => setText(e.target.value)} placeholder={`Dear future me,\n\nThis year I want to...\nBy next year I hope...`} style={{ ...inp, minHeight: 200, resize: "vertical", lineHeight: 1.8, marginBottom: 12 }} />
                  <Btn full color={C.fuchsia} onClick={() => save({ ...data, annualLetter: { ...data.annualLetter, [new Date().getFullYear()]: { text, date: todayISO() } } })}>Save Letter ✓</Btn>
                </>
              );
            })()}
          </Card>
        </div>
      )}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("Today");
  const [data, setData] = useState(defaultData);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get("bestself_v7"); if (r?.value) setData(JSON.parse(r.value)); } catch {}
      setLoaded(true);
    })();
  }, []);

  const save = useCallback(nd => { setData(nd); window.storage.set("bestself_v7", JSON.stringify(nd)).catch(() => {}); }, []);
  const toggleHabit = useCallback(id => { const k = todayISO(), cur = data.habits[k] || {}; save({ ...data, habits: { ...data.habits, [k]: { ...cur, [id]: !cur[id] } } }); }, [data, save]);
  const getStreak = useCallback(id => { let s = 0, d = new Date(); while (true) { const k = d.toISOString().split("T")[0]; if (data.habits[k]?.[id]) { s++; d.setDate(d.getDate() - 1); } else break; } return s; }, [data.habits]);

  const handleOnboard = useCallback(({ name, wakeTime, sleepTime, city, goal, meds }) => {
    save({ ...defaultData, profile: { name, wakeTime, sleepTime, city, goal }, medList: meds.map(n => ({ id: Date.now() + Math.random(), name: n, time: "08:00" })), onboarded: true });
  }, [save]);

  const TABS = ["Today", "Habits", "Routines", "Journal", "Sleep", "Exercise", "Body", "Food", "Reading", "Learn & Guitar", "Meditate", "Medicine", "Finance", "Content", "Travel", "Schedule", "Progress", "More"];
  const ICONS = { Today: "🏠", Habits: "✅", Routines: "☀️", Journal: "✍️", Sleep: "😴", Exercise: "🏋️", Body: "💪", Food: "🥗", Reading: "📚", "Learn & Guitar": "🎸", Meditate: "🧘", Medicine: "💊", Finance: "💰", Content: "📱", Travel: "✈️", Schedule: "📅", Progress: "📊", More: "⚙️" };
  const sp = { data, save, toggleHabit, getStreak };

  if (!loaded) return <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.purple, fontSize: 16, fontFamily: "Inter,sans-serif", flexDirection: "column", gap: 12 }}><div style={{ fontSize: 40 }}>🌟</div>Loading…</div>;
  if (!data.onboarded) return <Onboarding onDone={handleOnboard} />;

  const score = Math.round((HABITS.filter(h => (data.habits[todayISO()] || {})[h.id]).length / HABITS.length) * 100);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "-apple-system,BlinkMacSystemFont,'Inter',sans-serif", color: "#fff" }}>
      <div style={{ background: "#0c0c1a", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 20 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: C.purple }}>🌟 BestSelf OS</div>
          <div style={{ color: "#252535", fontSize: 10, marginTop: 1 }}>Hi {data.profile?.name || "there"} · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: score >= 70 ? C.green : score >= 40 ? C.amber : C.rose, fontWeight: 800, fontSize: 14 }}>{score}%</div>
          <div style={{ color: "#252535", fontSize: 9 }}>today</div>
        </div>
      </div>
      <div style={{ display: "flex", overflowX: "auto", padding: "8px 10px", gap: 5, background: C.bg, borderBottom: `1px solid ${C.border}`, scrollbarWidth: "none" }}>
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? C.purple : C.card, border: `1px solid ${tab === t ? C.purple : C.border}`, borderRadius: 99, padding: "6px 12px", color: tab === t ? "#fff" : "#555", cursor: "pointer", fontSize: 11, whiteSpace: "nowrap", fontWeight: tab === t ? 700 : 400, transition: "all .15s" }}>{ICONS[t]} {t}</button>)}
      </div>
      <div style={{ padding: 14, maxWidth: 560, margin: "0 auto" }}>
        {tab === "Today" && <TabToday {...sp} />}
        {tab === "Habits" && <TabHabits {...sp} />}
        {tab === "Routines" && <RoutineChecklist {...sp} />}
        {tab === "Journal" && <TabJournal {...sp} />}
        {tab === "Sleep" && <TabSleep {...sp} />}
        {tab === "Exercise" && <TabExercise {...sp} />}
        {tab === "Body" && <TabBody {...sp} />}
        {tab === "Food" && <TabFood {...sp} />}
        {tab === "Reading" && <TabReading {...sp} />}
        {tab === "Learn & Guitar" && <TabLearnGuitar {...sp} />}
        {tab === "Meditate" && <TabMeditate {...sp} />}
        {tab === "Medicine" && <TabMedicine {...sp} />}
        {tab === "Finance" && <TabFinance {...sp} />}
        {tab === "Content" && <TabContent {...sp} />}
        {tab === "Travel" && <TabTravel {...sp} />}
        {tab === "Schedule" && <TabSchedule />}
        {tab === "Progress" && <TabProgress {...sp} />}
        {tab === "More" && <TabMore {...sp} />}
      </div>
    </div>
  );
}
