import React, { useState } from "react";

/**
 * LocationModal
 *
 * Lightweight 70% height modal for location details.
 *
 * Expects `location` object shaped roughly like:
 * {
 *   id: "PB001",
 *   name: "Cellular Jail",
 *   island: "Port Blair",
 *   overview: "Short text...",
 *   whyGo: [ "...", "..." ],
 *   visitTips: [ "...", "..." ],
 *   highlights: [ "...", "..." ],
 *   bestTime: "October to May, evenings for the show",
 *   durationSuggested: "1.5–2 hours",
 *   galleryImages: [ "/img/cellular-1.jpg", "/img/cellular-2.jpg" ],
 *   nearby: [ { id, name, island }, ... ],
 *   adventures: [ { id, name, basePriceINR, price, type, category }, ... ]
 * }
 *
 * Callbacks:
 * - onAddLocation(locId)
 * - onAddAdventure(adventureId)
 * - onOpenLocation(locId)   // used when clicking a nearby place
 */

function formatINR(n) {
  const num = typeof n === "number" ? n : Number(n) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

function LocationModal({
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
  const [addedNearby, setAddedNearby] = useState({});
  const [addedAdv, setAddedAdv] = useState({});

  // normalise nearby & adventures in case some are plain strings
  const nearbyItems = nearby.map((n, idx) =>
    typeof n === "string" ? { id: `nearby_${idx}`, name: n, island } : n
  );

  const adventureItems = adventures.map((a, idx) =>
    typeof a === "string"
      ? { id: `adv_${idx}`, name: a, type: "Adventure" }
      : a
  );

  const handleToggleNearby = (item) => {
    setAddedNearby((prev) => ({
      ...prev,
      [item.id]: !prev[item.id],
    }));
    if (onAddLocation) {
      // pass the real location id when available, otherwise fallback to this modal's location id
      onAddLocation(item.id || id);
    }
  };

  const handleToggleAdventure = (adv) => {
    setAddedAdv((prev) => ({
      ...prev,
      [adv.id]: !prev[adv.id],
    }));
    if (onAddAdventure) {
      onAddAdventure(adv.id);
    }
  };

  return (
    <div
      className="location-modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.35)", // soft dark overlay
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: "12px",
      }}
      onClick={onClose}
    >
      <div
        className="location-modal"
        style={{
          width: "100%",
          maxWidth: "900px",
          height: "70vh", // ~70% of screen height
          background: "#FFFFFF",
          color: "#111827",
          borderRadius: "18px",
          padding: "20px 22px",
          boxShadow: "0 18px 60px rgba(15, 23, 42, 0.30)",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "10px",
            gap: "12px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "1.35rem",
                fontWeight: 600,
                margin: 0,
                marginBottom: "4px",
              }}
            >
              {name}
            </h2>
            <p
              style={{
                fontSize: "0.9rem",
                margin: 0,
                color: "#6B7280",
              }}
            >
              {island}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "#6B7280",
              fontSize: "1.25rem",
              cursor: "pointer",
              lineHeight: 1,
            }}
            aria-label="Close location details"
          >
            ✕
          </button>
        </div>

        {/* Overview */}
        {overview && (
          <section style={{ marginBottom: "12px" }}>
            <h3
              style={{
                fontSize: "0.95rem",
                fontWeight: 600,
                margin: 0,
                marginBottom: "4px",
              }}
            >
              Overview
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                lineHeight: 1.55,
                margin: 0,
                color: "#4B5563",
              }}
            >
              {overview}
            </p>
          </section>
        )}

        {/* Why you should go */}
        {whyGo.length > 0 && (
          <section style={{ marginBottom: "12px" }}>
            <h3
              style={{
                fontSize: "0.95rem",
                fontWeight: 600,
                margin: 0,
                marginBottom: "4px",
              }}
            >
              Why you should go
            </h3>
            <ul
              style={{
                paddingLeft: "1.1rem",
                margin: 0,
                fontSize: "0.9rem",
                color: "#374151",
              }}
            >
              {whyGo.map((point, idx) => (
                <li key={idx} style={{ marginBottom: "3px" }}>
                  {point}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Highlights + Quick info */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.2fr)",
            gap: "16px",
            marginBottom: "12px",
          }}
        >
          {highlights.length > 0 && (
            <section>
              <h3
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  margin: 0,
                  marginBottom: "4px",
                }}
              >
                Highlights
              </h3>
              <ul
                style={{
                  paddingLeft: "1.1rem",
                  margin: 0,
                  fontSize: "0.9rem",
                  color: "#374151",
                }}
              >
                {highlights.map((h, idx) => (
                  <li key={idx} style={{ marginBottom: "3px" }}>
                    {h}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section
            style={{
              background: "#F9FAFB",
              borderRadius: "12px",
              padding: "10px 12px",
              border: "1px solid #E5E7EB",
            }}
          >
            <h3
              style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                margin: 0,
                marginBottom: "4px",
              }}
            >
              Quick info
            </h3>
            <p
              style={{
                fontSize: "0.85rem",
                margin: 0,
                marginBottom: "4px",
                color: "#4B5563",
              }}
            >
              <strong>Best time:</strong>{" "}
              <span style={{ fontWeight: 400 }}>
                {bestTime || "October to May"}
              </span>
            </p>
            <p
              style={{
                fontSize: "0.85rem",
                margin: 0,
                marginBottom: "2px",
                color: "#4B5563",
              }}
            >
              <strong>Suggested duration:</strong>{" "}
              <span style={{ fontWeight: 400 }}>
                {durationSuggested || "1–2 hours"}
              </span>
            </p>
          </section>
        </div>

        {/* Visit tips */}
        {visitTips.length > 0 && (
          <section style={{ marginBottom: "12px" }}>
            <h3
              style={{
                fontSize: "0.95rem",
                fontWeight: 600,
                margin: 0,
                marginBottom: "4px",
              }}
            >
              Visit tips
            </h3>
            <ul
              style={{
                paddingLeft: "1.1rem",
                margin: 0,
                fontSize: "0.9rem",
                color: "#374151",
              }}
            >
              {visitTips.map((tip, idx) => (
                <li key={idx} style={{ marginBottom: "3px" }}>
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Gallery */}
        {galleryImages.length > 0 && (
          <section style={{ marginBottom: "12px" }}>
            <h3
              style={{
                fontSize: "0.95rem",
                fontWeight: 600,
                margin: 0,
                marginBottom: "4px",
              }}
            >
              Gallery
            </h3>
            <div
              style={{
                display: "flex",
                gap: "8px",
                overflowX: "auto",
              }}
            >
              {galleryImages.map((src, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: "0 0 150px",
                    height: "95px",
                    borderRadius: "10px",
                    overflow: "hidden",
                    background: "#E5E7EB",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <img
                    src={src}
                    alt={`${name} ${idx + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Nearby places – expanded, collapsible */}
        <section style={{ marginBottom: "10px" }}>
          <button
            type="button"
            onClick={() => setShowNearby((v) => !v)}
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 10px",
              borderRadius: "10px",
              border: "1px solid #E5E7EB",
              background: "#F9FAFB",
              cursor: "pointer",
              marginBottom: showNearby ? "8px" : "12px",
            }}
          >
            <div style={{ textAlign: "left" }}>
              <div
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                Nearby places
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#6B7280",
                }}
              >
                {nearbyItems.length
                  ? `${nearbyItems.length} options`
                  : "No nearby places added yet"}
              </div>
            </div>
            <span style={{ fontSize: "1rem", color: "#6B7280" }}>
              {showNearby ? "▴" : "▾"}
            </span>
          </button>

          {showNearby && nearbyItems.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              {nearbyItems.map((n) => {
                const active = !!addedNearby[n.id];
                return (
                  <div
                    key={n.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 10px",
                      borderRadius: "10px",
                      border: "1px solid #E5E7EB",
                      background: "#FFFFFF",
                    }}
                  >
                    <div
                      style={{
                        marginRight: "8px",
                        cursor: onOpenLocation ? "pointer" : "default",
                      }}
                      onClick={() =>
                        onOpenLocation && onOpenLocation(n.id)
                      }
                    >
                      <div
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 500,
                          color: "#111827",
                        }}
                      >
                        {n.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#6B7280",
                        }}
                      >
                        {n.island}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleNearby(n)}
                      style={{
                        borderRadius: "999px",
                        padding: "6px 11px",
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        border: active
                          ? "1px solid #16A34A"
                          : "1px solid #D1D5DB",
                        background: active
                          ? "rgba(22,163,74,0.08)"
                          : "#FFFFFF",
                        color: active ? "#166534" : "#111827",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {active ? "Added ✓" : "Add to trip"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Adventures – expanded, collapsible */}
        <section style={{ marginBottom: "12px" }}>
          <button
            type="button"
            onClick={() => setShowAdventures((v) => !v)}
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 10px",
              borderRadius: "10px",
              border: "1px solid #E5E7EB",
              background: "#F9FAFB",
              cursor: "pointer",
              marginBottom: showAdventures ? "8px" : "12px",
            }}
          >
            <div style={{ textAlign: "left" }}>
              <div
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                Adventures available here
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#6B7280",
                }}
              >
                {adventureItems.length
                  ? `${adventureItems.length} options`
                  : "No adventures linked yet"}
              </div>
            </div>
            <span style={{ fontSize: "1rem", color: "#6B7280" }}>
              {showAdventures ? "▴" : "▾"}
            </span>
          </button>

          {showAdventures && adventureItems.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              {adventureItems.map((adv) => {
                const active = !!addedAdv[adv.id];
                const price =
                  adv.basePriceINR != null
                    ? adv.basePriceINR
                    : adv.price != null
                    ? adv.price
                    : 0;

                return (
                  <div
                    key={adv.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 10px",
                      borderRadius: "10px",
                      border: "1px solid #E5E7EB",
                      background: "#FFFFFF",
                    }}
                  >
                    <div style={{ marginRight: "8px" }}>
                      <div
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 500,
                          color: "#111827",
                        }}
                      >
                        {adv.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#6B7280",
                        }}
                      >
                        {adv.type || adv.category || "Adventure"}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#0F172A",
                          marginTop: "2px",
                        }}
                      >
                        {formatINR(price)}{" "}
                        <span style={{ color: "#6B7280" }}>
                          per person (indicative)
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleAdventure(adv)}
                      style={{
                        borderRadius: "999px",
                        padding: "6px 11px",
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        border: active
                          ? "1px solid #16A34A"
                          : "1px solid #D1D5DB",
                        background: active
                          ? "rgba(22,163,74,0.08)"
                          : "#FFFFFF",
                        color: active ? "#166534" : "#111827",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {active ? "Added ✓" : "Add"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* CTA row */}
        <div
          style={{
            marginTop: "10px",
            paddingTop: "10px",
            borderTop: "1px solid #E5E7EB",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => onAddLocation && onAddLocation(id)}
              style={{
                border: "none",
                padding: "8px 14px",
                borderRadius: "999px",
                background: "#2563EB",
                color: "#FFFFFF",
                fontSize: "0.9rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Add location
            </button>
            <button
              onClick={() =>
                onAddAdventure &&
                adventureItems[0] &&
                onAddAdventure(adventureItems[0].id)
              }
              style={{
                border: "1px solid #D1D5DB",
                padding: "8px 14px",
                borderRadius: "999px",
                background: "#FFFFFF",
                color: "#111827",
                fontSize: "0.9rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Add adventures
            </button>
          </div>

          <button
            onClick={onClose}
            style={{
              border: "none",
              padding: "8px 14px",
              borderRadius: "999px",
              background: "#F3F4F6",
              color: "#374151",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default LocationModal;
