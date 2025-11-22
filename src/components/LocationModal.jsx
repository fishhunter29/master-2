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
}) {
  if (!location) return null;

  const {
    name,
    island,
    durationHrs,
    moods = [],
    bestTimes = [],
    brief,
    description,
    whyGo,
    tips,
    nearby = [],
    adventures = [],
    image,
  } = location;

  const displayDuration =
    typeof durationHrs === "number" && isFinite(durationHrs)
      ? `${durationHrs} hour${durationHrs === 1 ? "" : "s"}`
      : "2–3 hours";

  const displayBestTimes =
    bestTimes.length ? bestTimes.join(", ") : "Morning or Evening";

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
          maxWidth: 620,
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
          {/* CLOSE BUTTON (FIXED) */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              right: 12,
              top: 12,
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

          <div style={{ fontSize: 12, color: "#94a3b8" }}>Location Details</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{name}</div>

          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            {island} • {displayDuration} • Best: {displayBestTimes}
          </div>
        </div>

        {/* BODY */}
        <div style={{ padding: 16, maxHeight: "70vh", overflowY: "auto" }}>
          {/* IMAGE */}
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

          {/* MOODS */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {moods.slice(0, 5).map((m) => (
              <span
                key={m}
                style={{
                  fontSize: 10,
                  padding: "3px 7px",
                  borderRadius: 999,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  color: "#334155",
                }}
              >
                {m}
              </span>
            ))}
          </div>

          {/* WHY GO */}
          <div style={{ marginTop: 12 }}>
            <h4 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700 }}>
              Why you should go
            </h4>
            <div style={{ fontSize: 13, color: "#334155", whiteSpace: "pre-line" }}>
              {whyGo || brief || description || "Beautiful spot worth visiting."}
            </div>
          </div>

          {/* TIPS */}
          <div
            style={{
              marginTop: 12,
              padding: 10,
              background: "#f0f9ff",
              border: "1px solid #bae6fd",
              borderRadius: 10,
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
              Tips & Suggestions
            </h4>

            <ul
              style={{
                margin: 0,
                paddingLeft: 16,
                fontSize: 12.5,
                color: "#0f172a",
                display: "grid",
                gap: 4,
              }}
            >
              {tips ? (
                <li style={{ whiteSpace: "pre-line" }}>{tips}</li>
              ) : (
                <>
                  <li>Keep at least {displayDuration} here.</li>
                  <li>Best combined with 1–2 nearby spots on the same island.</li>
                  <li>Great light for photos: {displayBestTimes}.</li>
                </>
              )}
            </ul>
          </div>

          {/* ADVENTURES */}
          {adventures.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700 }}>
                Adventures Available
              </h4>

              <div style={{ display: "grid", gap: 8 }}>
                {adventures.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: "#475569" }}>
                        {formatINR(a.basePriceINR ?? a.price ?? 0)} per person
                      </div>
                    </div>

                    <button
                      onClick={() => onAddAdventure(a.id)}
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
            </div>
          )}

          {/* NEARBY */}
          {nearby.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 6px" }}>
                Nearby Spots
              </h4>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {nearby.map((n) => (
                  <span
                    key={n.id}
                    style={{
                      padding: "4px 8px",
                      fontSize: 11.5,
                      borderRadius: 999,
                      background: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {n.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER BUTTONS */}
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
            }}
          >
            Close
          </button>

          <button
            onClick={onAddLocation}
            style={{
              flex: 1,
              borderRadius: 8,
              padding: "10px 12px",
              border: "1px solid #0ea5e9",
              background: "#0ea5e9",
              color: "white",
              fontWeight: 700,
            }}
          >
            Add Location
          </button>
        </div>
      </div>
    </div>
  );
}
