import { Check } from "lucide-react";
import { useState } from "react";

const plans = [
  {
    name: "Free",
    price: { monthly: 0, annual: 0 },
    description: "Perfect for solo devs and small hackathon squads.",
    features: ["Up to 3 members", "5 active projects", "Unlimited issues", "1 GB file storage", "Community support"],
    cta: "Start for free",
    highlight: false,
    surface: "#211f26",
  },
  {
    name: "Team",
    price: { monthly: 12, annual: 9 },
    description: "For growing teams that need more power and flexibility.",
    features: ["Up to 20 members", "Unlimited projects", "Priority labels & milestones", "Git integrations", "10 GB file storage", "Email support"],
    cta: "Start free trial",
    highlight: true,
    surface: "#2d1f4a",
  },
  {
    name: "Studio",
    price: { monthly: 29, annual: 22 },
    description: "For small studios shipping multiple products.",
    features: ["Unlimited members", "Unlimited everything", "Advanced analytics", "Custom workflows", "SSO & access controls", "Priority support"],
    cta: "Contact us",
    highlight: false,
    surface: "#211f26",
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="px-6 pb-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-10">
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#938f99", letterSpacing: "0.08em" }}>
            PRICING
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
              marginBottom: "1.5rem",
            }}
          >
            Simple, honest pricing.
          </h2>

          {/* Toggle */}
          <div
            className="inline-flex items-center gap-1 p-1 rounded-full"
            style={{ background: "#2b2930", border: "1px solid #49454f" }}
          >
            {[
              { label: "Monthly", value: false },
              { label: "Annual", value: true, badge: "−25%" },
            ].map(({ label, value, badge }) => (
              <button
                key={label}
                onClick={() => setAnnual(value)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full transition-all text-sm"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  background: annual === value ? "#d0bcff" : "transparent",
                  color: annual === value ? "#381e72" : "#938f99",
                  fontWeight: annual === value ? 500 : 400,
                }}
              >
                {label}
                {badge && annual && value && (
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "9px",
                      background: "#633b48",
                      color: "#efb8c8",
                      padding: "1px 5px",
                      borderRadius: 999,
                    }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-3xl p-7 flex flex-col"
              style={{
                background: plan.surface,
                border: `1px solid ${plan.highlight ? "#7c5af6" : "#49454f"}`,
              }}
            >
              {plan.highlight && (
                <div
                  className="self-start mb-4 px-3 py-1 rounded-full text-xs"
                  style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", background: "#4f378b", color: "#d0bcff" }}
                >
                  MOST POPULAR
                </div>
              )}
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: "1.15rem", color: "#e6e0e9", marginBottom: "0.25rem" }}>
                {plan.name}
              </h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: "0.8rem", color: "#938f99", marginBottom: "1.25rem" }}>
                {plan.description}
              </p>

              <div style={{ marginBottom: "1.5rem" }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "2.75rem", color: plan.highlight ? "#d0bcff" : "#e6e0e9", letterSpacing: "-0.04em" }}>
                  ${annual ? plan.price.annual : plan.price.monthly}
                </span>
                {plan.price.monthly > 0 && (
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "#938f99", marginLeft: "0.25rem" }}>
                    / user / mo
                  </span>
                )}
              </div>

              <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5">
                    <Check size={14} style={{ color: plan.highlight ? "#d0bcff" : "#efb8c8", flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: "0.85rem", color: "#cac4d0" }}>
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                className="w-full py-3 rounded-full transition-opacity"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  background: plan.highlight ? "#d0bcff" : "#2b2930",
                  color: plan.highlight ? "#381e72" : "#cac4d0",
                  border: plan.highlight ? "none" : "1px solid #49454f",
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
