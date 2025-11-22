import React, { useState } from "react";

// Local formatter so we don't depend on App.js helpers
const safeNum = (n) => (typeof n === "number" && isFinite(n) ? n : 0);

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(safeNum(n));

export default function MobileSummaryBar({
  total = 0,
  lineItems = [], // [{label, amount}]
  badges = [],    // [{label, value}]
  onRequestToBook,
  phoneNumber = "+91-0000000000", // change this to your real number
}) {
  const [open, setOpen] = useState(false);

  // If there is nothing meaningful, don't show on mobile at all
  const hasContent = safeNum(total) > 0 || (lineItems && lineItems.length);
  if (!hasContent) return null;

  return (
    <div
      className="mobile-summary-wrapper"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 40,
        pointerEvents: "none", // so only inner content is clickable
      }}
    >
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto 8px auto",
          padding: "0 10px",
          pointerEvents: "auto",
        }}
      >
        {/* Collapsed pill bar */}
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            width: "100%",
            borderRadius: 999,
            border: "1px solid #0ea5e9",
            background: "white",
            boxShadow: "0 8px 24px rgba(15,23,42,0.18)",
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 2,
            }}
          >
            <span
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                color: "#64748b",
              }}
            >
              Trip total (indicative)
            </span>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
              {formatINR(total)}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 4,
              minWidth: 80,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 4,
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              {badges.slice(0, 3).map((b) => (
                <span
                  key={b.label}
                  style={{
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: 999,
                    background: "#f1f5f9",
                    color: "#0f172a",
                  }}
                >
                  {b.label}: <b>{b.value}</b>
                </span>
              ))}
            </div>
            <span
              style={{
                fontSize: 11,
                color: "#0ea5e9",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {open ? "Hide details" : "View details"}{" "}
              <span style={{ fontSize: 14 }}>{open ? "▾" : "▴"}</span>
            </span>
          </div>
        </button>

        {/* Expanded drawer */}
        {open && (
          <div
            style={{
              marginTop: 6,
              borderRadius: 16,
              background: "white",
              border: "1px solid #e5e7eb",
              boxShadow: "0 18px 40px rgba(15,23,42,0.28)",
              padding: 12,
            }}
          >
            {/* Line item breakdown */}
            {lineItems && lineItems.length > 0 && (
              <div
                style={{
                  fontSize: 13,
                  color: "#475569",
                  display: "grid",
                  gap: 6,
                  marginBottom: 10,
                }}
              >
                {lineItems.map((li) => (
                  <div
                    key={li.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{li.label}</span>
                    <b>{formatINR(li.amount)}</b>
                  </div>
                ))}
                <div
                  style={{
                    borderTop: "1px dashed #e5e7eb",
                    marginTop: 4,
                    paddingTop: 6,
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 14,
                  }}
                >
                  <span>Total</span>
                  <b>{formatINR(total)}</b>
                </div>
              </div>
            )}

            {/* Buttons row */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <button
                onClick={onRequestToBook}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 999,
                  border: "1px solid #0ea5e9",
                  background:
                    "linear-gradient(90deg, #0ea5e9, #22d3ee, #06b6d4)",
                  color: "white",
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                Request to Book This Trip
              </button>

              <a
                href={`tel:${phoneNumber}`}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 999,
                  border: "1px solid #cbd5f5",
                  background: "#f8fafc",
                  color: "#0f172a",
                  fontWeight: 600,
                  fontSize: 13,
                  textAlign: "center",
                  textDecoration: "none",
                }}
              >
                Call Us for Quick Help
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
