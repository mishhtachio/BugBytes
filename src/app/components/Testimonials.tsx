const quotes = [
  {
    text: "We used BugBytes at HackMIT and shipped a full product in 36 hours. Having issues organised meant we never blocked each other.",
    author: "Aisha Okonkwo",
    role: "CS student, MIT",
    avatar: "A",
    avatarBg: "#4f378b",
    avatarColor: "#d0bcff",
  },
  {
    text: "Finally a tool that doesn't feel like it was built for Fortune 500 companies. Setup took 2 minutes and we were tracking bugs immediately.",
    author: "Dev Patel",
    role: "Indie developer",
    avatar: "D",
    avatarBg: "#1f3140",
    avatarColor: "#9ecadf",
  },
  {
    text: "The Linear-style interface is perfect. Fast, clean, and keyboard shortcuts make context switching painless.",
    author: "Léa Fontaine",
    role: "Designer & co-founder",
    avatar: "L",
    avatarBg: "#633b48",
    avatarColor: "#efb8c8",
  },
  {
    text: "We used Jira at my last job. BugBytes does 80% of the same things in 20% of the mental overhead. Easy switch.",
    author: "Marcus Webb",
    role: "Software engineer, early-stage startup",
    avatar: "M",
    avatarBg: "#4f378b",
    avatarColor: "#d0bcff",
  },
];

export function Testimonials() {
  return (
    <section className="px-6 pb-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#938f99", letterSpacing: "0.08em" }}>
            FROM THE COMMUNITY
          </span>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
              color: "#e6e0e9",
              letterSpacing: "-0.02em",
              lineHeight: 1.25,
              marginTop: "0.5rem",
            }}
          >
            Builders love BugBytes.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quotes.map((q) => (
            <div
              key={q.author}
              className="rounded-3xl p-7"
              style={{ background: "#211f26", border: "1px solid #49454f" }}
            >
              {/* Opening quote mark */}
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", color: "#4f378b", lineHeight: 1, marginBottom: "0.25rem" }}>
                "
              </div>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 300,
                  fontSize: "0.9rem",
                  lineHeight: 1.75,
                  color: "#cac4d0",
                  marginBottom: "1.25rem",
                }}
              >
                {q.text}
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: q.avatarBg, color: q.avatarColor, fontSize: "14px", fontWeight: 600 }}
                >
                  {q.avatar}
                </div>
                <div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: "0.875rem", color: "#e6e0e9" }}>
                    {q.author}
                  </p>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#938f99" }}>
                    {q.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
