
// Colorful LocationModal.jsx
import React, { useState } from "react";

function LocationModal({ location, onClose, onAddLocation, onAddAdventure, onOpenLocation }) {
  if (!location) return null;

  const {
    id,
    name,
    island,
    overview,
    whyGo = [],
    visitTips = [],
    highlights = [],
    bestTime,
    durationSuggested,
    galleryImages = [],
    nearby = [],
    adventures = [],
  } = location;

  const [showNearby, setShowNearby] = useState(true);
  const [showAdventures, setShowAdventures] = useState(true);

  const nearbyItems = nearby.map((n, idx) =>
    typeof n === "string" ? { id: `near_${idx}`, name: n } : n
  );

  const adventureItems = adventures;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 99999,
        padding: "12px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          height: "70vh",
          background: "#ffffff",
          borderRadius: "18px",
          overflowY: "auto",
          padding: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700 }}>{name}</h2>
            <div style={{ fontSize: "0.9rem", color: "#64748b" }}>{island}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              fontSize: "1.3rem",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              color: "#475569",
            }}
          >
            ✕
          </button>
        </div>

        {/* OVERVIEW */}
        {overview && (
          <section style={{ marginTop: 10 }}>
            <h3 style={{ fontWeight: 600, marginBottom: 4 }}>Overview</h3>
            <p style={{ fontSize: "0.9rem", color: "#475569" }}>{overview}</p>
          </section>
        )}

        {/* WHY GO */}
        {whyGo.length > 0 && (
          <section style={{ marginTop: 12 }}>
            <h3 style={{ fontWeight: 600 }}>Why you should go</h3>
            <ul style={{ paddingLeft: "1.2rem", color: "#334155" }}>
              {whyGo.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </section>
        )}

        {/* NEARBY - COLORFUL */}
        <section style={{ marginTop: 14 }}>
          <button
            onClick={() => setShowNearby(!showNearby)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "12px",
              background: "linear-gradient(90deg,#38bdf8,#0ea5e9)",
              color: "white",
              border: 0,
              fontWeight: 600,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Nearby places</span>
            <span>{showNearby ? "▴" : "▾"}</span>
          </button>

          {showNearby &&
            nearbyItems.map((n) => (
              <div
                key={n.id}
                style={{
                  marginTop: 8,
                  padding: "10px",
                  background: "#f0f9ff",
                  border: "1px solid #bae6fd",
                  borderRadius: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{ cursor: "pointer", fontWeight: 600, color: "#0369a1" }}
                  onClick={() => onOpenLocation && onOpenLocation(n.id)}
                >
                  {n.name}
                </div>
                <button
                  style={{
                    background: "#0369a1",
                    color: "white",
                    border: 0,
                    borderRadius: "20px",
                    padding: "6px 12px",
                    cursor: "pointer",
                  }}
                  onClick={() => onAddLocation && onAddLocation(n.id)}
                >
                  Add +
                </button>
              </div>
            ))}
        </section>

        {/* ADVENTURES - COLORFUL */}
        <section style={{ marginTop: 18 }}>
          <button
            onClick={() => setShowAdventures(!showAdventures)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "12px",
              background: "linear-gradient(90deg,#f472b6,#ec4899)",
              color: "white",
              border: 0,
              fontWeight: 600,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Adventures here</span>
            <span>{showAdventures ? "▴" : "▾"}</span>
          </button>

          {showAdventures &&
            adventureItems.map((a) => (
              <div
                key={a.id}
                style={{
                  marginTop: 8,
                  padding: "12px",
                  background: "#fdf2f8",
                  border: "1px solid #fbcfe8",
                  borderRadius: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: "#9d174d" }}>{a.name}</div>
                  <div style={{ fontSize: "0.85rem", color: "#be185d" }}>
                    ₹ {a.basePriceINR || a.price || 0}
                  </div>
                </div>

                <button
                  style={{
                    background: "#be185d",
                    color: "white",
                    border: 0,
                    borderRadius: "20px",
                    padding: "6px 12px",
                    cursor: "pointer",
                  }}
                  onClick={() => onAddAdventure && onAddAdventure(a.id)}
                >
                  Add +
                </button>
              </div>
            ))}
        </section>

        {/* CTA */}
        <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
          <button
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              background: "#0ea5e9",
              color: "white",
              border: 0,
              fontWeight: 700,
            }}
            onClick={() => onAddLocation && onAddLocation(id)}
          >
            Add Location
          </button>

          <button
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              background: "#f43f5e",
              color: "white",
              border: 0,
              fontWeight: 700,
            }}
            onClick={() => onAddAdventure && console.log("open adventure selector")}
          >
            Add Adventures
          </button>
        </div>
      </div>
    </div>
  );
}

export default LocationModal;
