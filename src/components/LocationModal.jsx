import React from "react";

const safeNum = (n) =>
  typeof n === "number" && isFinite(n) ? n : 0;

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(safeNum(n));

export default function LocationModal({
  location,
  onClose,
  onAddLocation,
  onAddAdventure,
  onOpenLocation,
}) {
  if (!location) return null;

  const {
    id,
    name,
    island,
    durationHrs,
    moods = [],
    bestTimes = [],
    brief,
    description,
    overview,
    whyGo,
    tips,
    notes,
    nearby = [],
    adventures = [],
    image,
  } = location;

  const displayDuration =
    typeof durationHrs === "number" && isFinite(durationHrs)
      ? `${durationHrs} hour${durationHrs === 1 ? "" : "s"}`
      : "2–3 hours";

  const displayBestTimes =
    bestTimes && bestTimes.length
      ? bestTimes.join(", ")
      : "Morning or Evening";

  // Normalise whyGo and tips into bullet arrays
  const whyGoList = Array.isArray(whyGo)
    ? whyGo
    : typeof whyGo === "string"
    ? whyGo.split("\n").filter(Boolean)
    : [];

  const tipsList = Array.isArray(tips)
    ? tips
    : typeof tips === "string"
    ? tips.split("\n").filter(Boolean)
    : [];

  const mainOverview =
    overview || brief || description || "Beautiful Andaman experience worth including in your trip.";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "40px 12px",
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 640,
          background: "white",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 15px 40px rgba(0,0,0,0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div
          style={{
            padding: 14,
            borderBottom: "1px solid #e5e7eb",
            position: "relative",
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              right: 10,
              top: 10,
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "white",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            ×
          </button>

          <div style={{ fontSize: 11, color: "#94a3b8" }}>Location overview</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{name}</div>

          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            {island} • {displayDuration} • Best time: {displayBestTimes}
          </div>

          {moods && moods.length > 0 && (
            <div
              style={{
                marginTop: 6,
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              {moods.slice(0, 5).map((m) => (
                <span
                  key={m}
                  style={{
                    fontSize: 10,
                    padding: "3px 7px",
                    borderRadius: 999,
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    color: "#334155",
                  }}
                >
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* BODY */}
        <div style={{ padding: 16, maxHeight: "70vh", overflowY: "auto" }}>
          {/* Hero image */}
          {image && (
            <div
              style={{
                height: 180,
                borderRadius: 12,
                background: `url(${image}) center/cover`,
                marginBottom: 12,
              }}
            />
          )}

          {/* Overview */}
          <section style={{ marginBottom: 12 }}>
            <h4
              style={{
                margin: "0 0 4px",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Overview
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "#334155",
                whiteSpace: "pre-line",
              }}
            >
              {mainOverview}
            </p>
          </section>

          {/* Why you should go */}
          <section style={{ marginBottom: 12 }}>
            <h4
              style={{
                margin: "0 0 4px",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Why you should go
            </h4>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                fontSize: 13,
                color: "#0f172a",
                display: "grid",
                gap: 4,
              }}
            >
              {whyGoList.length > 0 ? (
                whyGoList.map((item, idx) => <li key={idx}>{item}</li>)
              ) : (
                <>
                  <li>Signature Andaman experience for this island.</li>
                  <li>Easy to combine with 1–2 nearby places in the same half day.</li>
                  <li>Great for {moods && moods.length ? moods.join(", ") : "mixed traveller types"}.</li>
                </>
              )}
            </ul>
          </section>

          {/* Tips & Notes */}
          <section
            style={{
              marginBottom: 12,
              padding: 10,
              borderRadius: 10,
              background: "#f0f9ff",
              border: "1px solid #bae6fd",
            }}
          >
            <h4
              style={{
                margin: "0 0 4px",
                fontSize: 13,
                fontWeight: 700,
                color: "#0369a1",
              }}
            >
              Tips & notes
            </h4>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                fontSize: 12.5,
                color: "#0f172a",
                display: "grid",
                gap: 3,
              }}
            >
              {tipsList.length > 0 ? (
                tipsList.map((t, idx) => <li key={idx}>{t}</li>)
              ) : (
                <>
                  <li>Plan for about {displayDuration} including photo stops.</li>
                  <li>
                    Try to visit in {displayBestTimes.toLowerCase()} for better light and
                    cooler weather.
                  </li>
                  <li>Carry water, light snacks and some cash; card/UPI may not work everywhere.</li>
                </>
              )}
              {notes && (
                <li
                  style={{
                    color: "#b91c1c",
                    fontWeight: 500,
                  }}
                >
                  Note: {notes}
                </li>
              )}
            </ul>
          </section>

          {/* Adventures from this location */}
          {adventures && adventures.length > 0 && (
            <section style={{ marginBottom: 14 }}>
              <h4
                style={{
                  margin: "0 0 6px",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Adventures you can add here
              </h4>
              <div
                style={{
                  display: "grid",
                  gap: 8,
                }}
              >
                {adventures.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                      padding: 10,
                      background: "#f8fafc",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {a.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#64748b",
                        }}
                      >
                        {a.type || "Adventure"} •{" "}
                        {formatINR(a.basePriceINR ?? a.price ?? 0)} per person
                      </div>
                    </div>
                    <button
                      onClick={() => onAddAdventure && onAddAdventure(a.id)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: "1px solid #0ea5e9",
                        background: "white",
                        color: "#0ea5e9",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Nearby attractions (max 6, as per concept) */}
          {nearby && nearby.length > 0 && (
            <section style={{ marginBottom: 4 }}>
              <h4
                style={{
                  margin: "0 0 6px",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Nearby attractions (same island)
              </h4>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                {nearby.slice(0, 6).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (onOpenLocation) {
                        onOpenLocation(n.id);
                      }
                    }}
                    style={{
                      padding: "5px 9px",
                      borderRadius: 999,
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      fontSize: 11.5,
                      cursor: onOpenLocation ? "pointer" : "default",
                    }}
                  >
                    {n.name}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div
          style={{
            padding: 12,
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            gap: 8,
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              borderRadius: 8,
              padding: "10px 12px",
              background: "white",
              border: "1px solid #e5e7eb",
              fontSize: 13,
            }}
          >
            Close
          </button>
          <button
            onClick={() => onAddLocation && onAddLocation(id)}
            style={{
              flex: 1,
              borderRadius: 8,
              padding: "10px 12px",
              border: "1px solid #0ea5e9",
              background: "#0ea5e9",
              color: "white",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Add location to trip
          </button>
        </div>
      </div>
    </div>
  );
}
