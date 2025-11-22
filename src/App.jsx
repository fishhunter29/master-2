import React, { useEffect, useMemo, useState } from "react";
import MobileSummaryBar from "./components/MobileSummaryBar.jsx";
import LocationModal from "./components/LocationModal.jsx";

/* -----------------------------------
   Helpers & Normalisers
------------------------------------ */
const safeNum = (n) =>
  typeof n === "number" && isFinite(n) ? n : 0;

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(safeNum(n));

const addDays = (yyyy_mm_dd, n) => {
  if (!yyyy_mm_dd) return null;
  const d = new Date(yyyy_mm_dd);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

// Normalise locations no matter how JSON is shaped
function normalizeLocation(raw) {
  const name = raw.name || raw.location || "Unnamed spot";
  const durationHrs =
    Number.isFinite(raw.durationHrs) ? raw.durationHrs :
    Number.isFinite(raw.typicalHours) ? raw.typicalHours : 2;
  const bestTimes = Array.isArray(raw.bestTimes)
    ? raw.bestTimes
    : raw.bestTime
    ? [raw.bestTime]
    : [];
  const moods = Array.isArray(raw.moods) ? raw.moods : null;
  const image = raw.image || "";

  return {
    ...raw,
    name,
    durationHrs,
    bestTimes,
    moods,
    image,
  };
}

function inferMoods(loc) {
  const moods = new Set();
  const text = `${loc.name || ""} ${loc.brief || ""}`.toLowerCase();
  const dur = Number.isFinite(loc.durationHrs) ? loc.durationHrs : 2;

  if (dur <= 2) moods.add("Relaxed");
  if (dur >= 3) moods.add("Balanced");
  if (dur >= 4) moods.add("Active");

  if (/snorkel|scuba|dive|trek|kayak|surf|jet|parasail|surf/.test(text))
    moods.add("Adventure");
  if (/beach|sunset|view|cove|lagoon|bay|sandbar/.test(text))
    moods.add("Romantic");
  if (/museum|culture|heritage|jail|cellular|memorial|museum/.test(text))
    moods.add("Family");
  if (/wildlife|reef|coral|mangrove|bird|nature|peak|national park/.test(text))
    moods.add("Photography");
  if (/lighthouse|mangrove|cave|long island|mud volcano|baratang|saddle peak|remote/.test(text))
    moods.add("Offbeat");

  if (!moods.size) moods.add("Balanced");
  return Array.from(moods);
}

const DEFAULT_ISLANDS = [
  "Port Blair (South Andaman)",
  "Havelock (Swaraj Dweep)",
  "Neil (Shaheed Dweep)",
  "Long Island (Middle Andaman)",
  "Rangat (Middle Andaman)",
  "Mayabunder (Middle Andaman)",
  "Diglipur (North Andaman)",
  "Little Andaman",
];

// Pricing
const FERRY_BASE_ECON = 1500;
const FERRY_CLASS_MULT = { Economy: 1, Deluxe: 1.4, Luxury: 1.9 };

const CAB_MODELS = [
  { id: "sedan", label: "Sedan", dayRate: 2500 },
  { id: "suv", label: "SUV", dayRate: 3200 },
  { id: "innova", label: "Toyota Innova", dayRate: 3800 },
  { id: "traveller", label: "Tempo Traveller (12)", dayRate: 5200 },
];

const P2P_RATE_PER_HOP = 500;
const SCOOTER_DAY_RATE = 800;

const SEATMAP_URL = "https://seatmap.example.com";

/* -----------------------------------
   Itinerary generator
------------------------------------ */

function orderByBestTime(items) {
  const rank = (it) => {
    const arr = (it.bestTimes || []).map((x) => String(x).toLowerCase());
    if (arr.some((t) => t.includes("morning") || t.includes("sunrise"))) return 0;
    if (arr.some((t) => t.includes("afternoon"))) return 1;
    if (arr.some((t) => t.includes("evening") || t.includes("sunset"))) return 2;
    return 3;
  };
  return [...items].sort((a, b) => rank(a) - rank(b));
}

// Always: Day 1 = arrival at IXZ
// Always: last day = mandatory departure from IXZ
function generateItineraryDays(selectedLocs, startFromPB = true) {
  const days = [];

  // Day 1: arrival
  days.push({
    island: "Port Blair (South Andaman)",
    items: [
      { type: "arrival", name: "Arrival - Veer Savarkar Intl. Airport (IXZ)" },
      { type: "transfer", name: "Airport → Hotel (Port Blair)" },
    ],
    transport: "Point-to-Point",
  });

  if (!selectedLocs.length) {
    // still ensure mandatory departure day
    days.push({
      island: "Port Blair (South Andaman)",
      items: [{ type: "departure", name: "Airport Departure (IXZ) — Fly Out" }],
      transport: "—",
    });
    return days;
  }

  // group by island
  const byIsland = {};
  selectedLocs.forEach((l) => {
    (byIsland[l.island] ||= []).push(l);
  });

  // island visit order
  let order = Object.keys(byIsland).sort(
    (a, b) => DEFAULT_ISLANDS.indexOf(a) - DEFAULT_ISLANDS.indexOf(b)
  );
  if (startFromPB) {
    const pb = "Port Blair (South Andaman)";
    if (order.includes(pb)) order = [pb, ...order.filter((x) => x !== pb)];
    else order = [pb, ...order];
  }

  // Fill days ~7 hours per day
  order.forEach((island, idx) => {
    const locs = orderByBestTime(byIsland[island] || []);
    let bucket = [];
    let timeUsed = 0;

    const flush = () => {
      if (!bucket.length) return;
      days.push({
        island,
        items: bucket.map((x) => ({
          type: "location",
          ref: x.id,
          name: x.name,
          durationHrs: x.durationHrs ?? 2,
          bestTimes: x.bestTimes || [],
        })),
        transport:
          bucket.length >= 3
            ? "Day Cab"
            : /Havelock|Neil/.test(island)
            ? "Scooter"
            : "Point-to-Point",
      });
      bucket = [];
      timeUsed = 0;
    };

    while (locs.length) {
      const x = locs.shift();
      const dur = Number.isFinite(x.durationHrs) ? x.durationHrs : 2;
      const would = timeUsed + dur;
      if (bucket.length >= 4 || would > 7) flush();
      bucket.push(x);
      timeUsed += dur;
    }
    flush();

    const nextIsland = order[idx + 1];
    if (nextIsland) {
      days.push({
        island,
        items: [
          {
            type: "ferry",
            name: `Ferry ${island} → ${nextIsland}`,
            time: "08:00–09:30",
          },
        ],
        transport: "—",
      });
    }
  });

  // Ensure we end back at PB + mandatory departure
  const lastIsland = days[days.length - 1]?.island;
  if (lastIsland && lastIsland !== "Port Blair (South Andaman)") {
    days.push({
      island: lastIsland,
      items: [
        {
          type: "ferry",
          name: `Ferry ${lastIsland} → Port Blair (South Andaman)`,
        },
      ],
      transport: "—",
    });
  }

  days.push({
    island: "Port Blair (South Andaman)",
    items: [{ type: "departure", name: "Airport Departure (IXZ) — Fly Out" }],
    transport: "—",
  });

  return days;
}

/* -----------------------------------
   Main App component
------------------------------------ */

export default function App() {
  // Data state
  const [rawLocations, setRawLocations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [locAdventures, setLocAdventures] = useState([]);
  const [dataStatus, setDataStatus] = useState("loading"); // loading | ready | error

  // Trip basics
  const [step, setStep] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [infants, setInfants] = useState(0);
  const [startPB, setStartPB] = useState(true);

  // Location selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [islandFilter, setIslandFilter] = useState("All");
  const [moodFilter, setMoodFilter] = useState("All");

  // Itinerary / transport
  const [days, setDays] = useState([]);
  const [scooterIslands, setScooterIslands] = useState(() => new Set());
  const [chosenHotels, setChosenHotels] = useState({});
  const [essentials, setEssentials] = useState({
    ferryClass: "Deluxe",
    cabModelId: CAB_MODELS[1].id,
  });

  // Adventures
  const [addonIds, setAddonIds] = useState([]);

  <LocationModal
  location={openLoc}
  onClose={closeModal}
  onAddLocation={(locId) => {
    if (!locId) return;
    setSelectedIds((prev) =>
      prev.includes(locId) ? prev : [...prev, locId]
    );
  }}
  onAddAdventure={(advId) => {
    if (!advId) return;
    setAddonIds((prev) =>
      prev.includes(advId) ? prev : [...prev, advId]
    );
  }}
  onOpenLocation={(locId) => {
    const target = locations.find((l) => l.id === locId);
    if (target) setOpenLoc(target);
  }}
/>

    const fetchJSON = async (path, label) => {
      try {
        const res = await withTimeout(fetch(path, { cache: "no-store" }), 8000, label);
        if (!res.ok)
          throw new Error(`${label} ${res.status} ${res.statusText}`);
        return res.json();
      } catch (e) {
        console.error(`[data] ${label} failed:`, e);
        return null;
      }
    };

    (async () => {
      try {
        const [locs, acts, map] = await Promise.all([
          fetchJSON("/data/locations.json", "locations"),
          fetchJSON("/data/activities.json", "activities"),
          fetchJSON("/data/location_adventures.json", "location_adventures"),
        ]);

        const safeLocs = Array.isArray(locs) ? locs.map(normalizeLocation) : [];
        const safeActs = Array.isArray(acts) ? acts : [];
        const safeMap = Array.isArray(map) ? map : [];

        setRawLocations(safeLocs);
        setActivities(safeActs);
        setLocAdventures(safeMap);
        setDataStatus("ready");
      } catch (e) {
        console.error("Data load fatal error:", e);
        setDataStatus("error");
      }
    })();
  }, []);

  // Derived data
  const locations = useMemo(
    () =>
      rawLocations.map((l) => ({
        ...l,
        moods: Array.isArray(l.moods) && l.moods.length ? l.moods : inferMoods(l),
      })),
    [rawLocations]
  );

  const islandsList = useMemo(() => {
    const s = new Set(locations.map((l) => l.island).filter(Boolean));
    return s.size ? Array.from(s) : DEFAULT_ISLANDS;
  }, [locations]);

  const selectableLocations = useMemo(
    () =>
      locations.filter(
        (l) => !/airport/i.test(l.name || "") // hide airport from selection
      ),
    [locations]
  );

  const filteredLocations = useMemo(
    () =>
      selectableLocations.filter(
        (l) =>
          (islandFilter === "All" || l.island === islandFilter) &&
          (moodFilter === "All" ||
            (Array.isArray(l.moods) && l.moods.includes(moodFilter)))
      ),
    [selectableLocations, islandFilter, moodFilter]
  );

  const selectedLocs = useMemo(
    () => locations.filter((l) => selectedIds.includes(l.id)),
    [locations, selectedIds]
  );

  // Itinerary auto-generate whenever locations / startPB change
  useEffect(() => {
    setDays(generateItineraryDays(selectedLocs, startPB));
  }, [selectedLocs, startPB]);

  // Day tools
  const addEmptyDayAfter = (index) => {
    setDays((prev) => {
      const copy = [...prev];
      const baseIsland =
        copy[index]?.island || "Port Blair (South Andaman)";
      copy.splice(index + 1, 0, {
        island: baseIsland,
        items: [],
        transport: "Point-to-Point",
      });
      return copy;
    });
  };

  const deleteDay = (index) => {
    setDays((prev) => {
      if (prev.length <= 1) return prev;
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
  };

  const moveItem = (fromDay, itemIdx, dir = 1) => {
    setDays((prev) => {
      const toDay = fromDay + dir;
      if (toDay < 0 || toDay >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy[fromDay].items.splice(itemIdx, 1);
      copy[toDay].items.push(item);
      return copy;
    });
  };

  const setTransportForDay = (i, mode) => {
    setDays((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], transport: mode };
      return copy;
    });
  };

  // Hotels logic
  const nightsByIsland = useMemo(() => {
    const map = {};
    days.forEach((day) => {
      const hasFerry = day.items.some((i) => i.type === "ferry");
      const hasDeparture = day.items.some((i) => i.type === "departure");
      if (hasFerry || hasDeparture) return;
      map[day.island] = (map[day.island] || 0) + 1;
    });
    return map;
  }, [days]);

  const MOCK_HOTELS = useMemo(
    () => ({
      "Port Blair (South Andaman)": [
        { id: "pb_h1", name: "PB Value Hotel", tier: "Value", sell_price: 3299 },
        { id: "pb_h2", name: "PB Mid Hotel", tier: "Mid", sell_price: 5499 },
        { id: "pb_h3", name: "PB Premium Hotel", tier: "Premium", sell_price: 8899 },
      ],
      "Havelock (Swaraj Dweep)": [
        { id: "hl_h1", name: "HL Value Hotel", tier: "Value", sell_price: 4499 },
        { id: "hl_h2", name: "HL Mid Hotel", tier: "Mid", sell_price: 6999 },
        { id: "hl_h3", name: "HL Premium Hotel", tier: "Premium", sell_price: 10999 },
      ],
      "Neil (Shaheed Dweep)": [
        { id: "nl_h1", name: "NL Value Hotel", tier: "Value", sell_price: 3399 },
        { id: "nl_h2", name: "NL Mid Hotel", tier: "Mid", sell_price: 5699 },
      ],
      "Long Island (Middle Andaman)": [
        { id: "li_h1", name: "LI Mid Hotel", tier: "Mid", sell_price: 6199 },
      ],
      "Rangat (Middle Andaman)": [
        { id: "rg_h1", name: "Rangat Lodge", tier: "Value", sell_price: 2599 },
      ],
      "Mayabunder (Middle Andaman)": [
        { id: "mb_h1", name: "Mayabunder Stay", tier: "Value", sell_price: 2399 },
      ],
      "Diglipur (North Andaman)": [
        { id: "dg_h1", name: "DG Lodge", tier: "Value", sell_price: 2899 },
      ],
      "Little Andaman": [
        { id: "la_h1", name: "Hut Stay", tier: "Value", sell_price: 2199 },
      ],
    }),
    []
  );

  const chooseHotel = (island, hotelId) => {
    setChosenHotels((prev) => ({ ...prev, [island]: hotelId }));
  };

  // Adventure suggestions
  const suggestedActivities = useMemo(() => {
    const selectedSet = new Set(selectedIds);

    // mapped by locationId
    const mappedIds = new Set();
    locAdventures.forEach((m) => {
      if (selectedSet.has(m.locationId)) {
        (m.adventureIds || []).forEach((id) => mappedIds.add(id));
      }
    });

    const mapped = activities.filter((a) => mappedIds.has(a.id));
    if (mapped.length) return mapped;

    const selectedIslands = new Set(selectedLocs.map((l) => l.island));
    const islandMatch = activities.filter((a) =>
      (a.islands || []).some((i) => selectedIslands.has(i))
    );
    return islandMatch.length ? islandMatch : activities;
  }, [activities, selectedIds, selectedLocs, locAdventures]);

  // Costs
  const hotelsTotal = useMemo(() => {
    let sum = 0;
    Object.entries(nightsByIsland).forEach(([island, nights]) => {
      const hid = chosenHotels[island];
      if (!hid) return;
      const hotel = (MOCK_HOTELS[island] || []).find((h) => h.id === hid);
      if (hotel) sum += safeNum(hotel.sell_price) * nights;
    });
    return sum;
  }, [nightsByIsland, chosenHotels, MOCK_HOTELS]);

  const addonsTotal = useMemo(
    () =>
      addonIds.reduce((acc, id) => {
        const ad = activities.find((a) => a.id === id);
        return acc + safeNum(ad?.basePriceINR ?? ad?.price);
      }, 0),
    [addonIds, activities]
  );

  const ferryLegCount = useMemo(
    () =>
      days.reduce(
        (acc, d) => acc + d.items.filter((i) => i.type === "ferry").length,
        0
      ),
    [days]
  );

  const ferryTotal = useMemo(() => {
    const mult = FERRY_CLASS_MULT[essentials.ferryClass] ?? 1;
    return ferryLegCount * FERRY_BASE_ECON * mult * Math.max(1, adults);
  }, [ferryLegCount, essentials.ferryClass, adults]);

  const cabDayRate = useMemo(() => {
    const found = CAB_MODELS.find((c) => c.id === essentials.cabModelId);
    return found ? found.dayRate : CAB_MODELS[0].dayRate;
  }, [essentials.cabModelId]);

  const logisticsTotal = useMemo(() => {
    let sum = 0;
    days.forEach((day) => {
      const hasFerry = day.items.some((i) => i.type === "ferry");
      const hasDeparture = day.items.some((i) => i.type === "departure");
      if (hasFerry || hasDeparture) return;

      const stops = day.items.filter((i) => i.type === "location").length;

      if (scooterIslands.has(day.island)) {
        sum += SCOOTER_DAY_RATE;
        return;
      }

      if (day.transport === "Day Cab") sum += cabDayRate;
      else if (day.transport === "Scooter") sum += SCOOTER_DAY_RATE;
      else sum += Math.max(1, stops - 1) * P2P_RATE_PER_HOP;
    });
    return sum;
  }, [days, scooterIslands, cabDayRate]);

  const grandTotal = hotelsTotal + addonsTotal + logisticsTotal + ferryTotal;
  const pax = adults + infants;

  const toggleScooter = (island) => {
    setScooterIslands((prev) => {
      const next = new Set(prev);
      if (next.has(island)) next.delete(island);
      else next.add(island);
      return next;
    });
  };

  // Early UI for loading / error (no hooks below this point!)
  if (dataStatus === "loading") {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui, Arial" }}>
        Loading Andaman data…
      </div>
    );
  }
  if (dataStatus === "error") {
    return (
      <div
        style={{
          padding: 24,
          fontFamily: "system-ui, Arial",
          color: "#b91c1c",
        }}
      >
        Could not load data. Please check{" "}
        <code>/public/data/*.json</code> in the repo.
      </div>
    );
  }

  const openModalFor = (loc) => {
  // 1) Nearby = other locations on same island (max 6)
  const nearby = locations
    .filter(
      (l) =>
        l.island === loc.island &&
        l.id !== loc.id
    )
    .slice(0, 6)
    .map((l) => ({
      id: l.id,
      name: l.name,
      island: l.island,
    }));

  // 2) Adventures from location_adventures.json
  const advIds = new Set();

  locAdventures.forEach((m) => {
    const locId = m.locationId || m.location_id;        // support both
    const advList = m.adventureIds || m.adventure_ids || [];

    if (locId && locId === loc.id) {
      advList.forEach((id) => advIds.add(id));
    }
  });

  const adventures = activities
    .filter((a) => advIds.has(a.id))
    .map((a) => ({
      id: a.id,
      name: a.name,
      type: a.category || a.type || "Adventure",
    }));

  // 3) Pass enriched object into modal
  setOpenLoc({
    ...loc,
    nearby,
    adventures,
  });
};

  const closeModal = () => setOpenLoc(null);

  /* ---------- UI ---------- */

  return (
    <div
      style={{
        fontFamily: "system-ui, Arial",
        background: "#f6f7f8",
        minHeight: "100vh",
        color: "#0f172a",
      }}
    >
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "white",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background:
                  "linear-gradient(90deg, #0891b2, #06b6d4, #22d3ee)",
              }}
            />
            <b>Create Your Andaman Tour</b>
          </div>
          <span
            style={{
              fontSize: 12,
              display: "inline-flex",
              gap: 6,
              alignItems: "center",
            }}
          >
            <span style={{ color: "#64748b" }}>Step</span>
            <span
              style={{
                fontWeight: 800,
                background: "white",
                border: "1px solid #e5e7eb",
                padding: "2px 8px",
                borderRadius: 999,
              }}
            >
              {step + 1} / 6
            </span>
          </span>
        </div>
        <Stepper step={step} setStep={setStep} />
      </header>

      {/* Body */}
      <main className="app-main">
        <section>
          {/* STEP 0: basics */}
          {step === 0 && (
            <Card title="Trip Basics">
              <div
                style={{
                  fontSize: 12,
                  color: "#475569",
                  marginBottom: 8,
                }}
              >
                Start date is optional. If you skip it, the itinerary will show
                Day 1, Day 2… without fixed calendar dates.
              </div>
              <Row>
                <Field label="Start date (optional)">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </Field>
                <Field label="Adults">
                  <input
                    type="number"
                    min={1}
                    value={adults}
                    onChange={(e) =>
                      setAdults(Number(e.target.value) || 0)
                    }
                  />
                </Field>
                <Field label="Infants">
                  <input
                    type="number"
                    min={0}
                    value={infants}
                    onChange={(e) =>
                      setInfants(Number(e.target.value) || 0)
                    }
                  />
                </Field>
              </Row>
              <Row>
                <label>
                  <input
                    type="checkbox"
                    checked={startPB}
                    onChange={() => setStartPB((v) => !v)}
                    style={{ marginRight: 6 }}
                  />
                  Start from Port Blair if present
                </label>
              </Row>
              <FooterNav onNext={() => setStep(1)} />
            </Card>
          )}

          {/* STEP 1: locations */}
          {step === 1 && (
            <Card title="Select Locations">
              <Row>
                <Field label="Island">
                  <select
                    value={islandFilter}
                    onChange={(e) => setIslandFilter(e.target.value)}
                  >
                    <option>All</option>
                    {islandsList.map((i) => (
                      <option key={i}>{i}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Mood of tour">
                  <select
                    value={moodFilter}
                    onChange={(e) => setMoodFilter(e.target.value)}
                  >
                    <option>All</option>
                    <option>Relaxed</option>
                    <option>Balanced</option>
                    <option>Active</option>
                    <option>Family</option>
                    <option>Adventure</option>
                    <option>Romantic</option>
                    <option>Offbeat</option>
                    <option>Photography</option>
                  </select>
                </Field>

                <div
                  style={{
                    fontSize: 12,
                    color: "#475569",
                    alignSelf: "end",
                  }}
                >
                  {selectedLocs.length} selected
                </div>
              </Row>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(240px,1fr))",
                  gap: 12,
                }}
              >
                {filteredLocations.map((l) => {
                  const picked = selectedIds.includes(l.id);
                  return (
                    <div
                      key={l.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        background: "white",
                        borderRadius: 12,
                        padding: 12,
                        position: "relative",
                      }}
                    >
                      <div
                        onClick={() => openModalFor(l)}
                        style={{ cursor: "pointer" }}
                      >
                        {l.image ? (
                          <div
                            style={{
                              height: 120,
                              borderRadius: 8,
                              marginBottom: 8,
                              background: `url(${l.image}) center/cover`,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              height: 120,
                              marginBottom: 8,
                              borderRadius: 8,
                              background:
                                "linear-gradient(135deg,#bae6fd,#f9fafb)",
                            }}
                          />
                        )}
                        <b style={{ fontSize: 14 }}>{l.name}</b>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#64748b",
                            marginTop: 4,
                          }}
                        >
                          {l.island} • {l.durationHrs}h
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 6,
                            marginTop: 6,
                          }}
                        >
                          {(l.moods || []).slice(0, 3).map((m) => (
                            <span
                              key={m}
                              style={{
                                fontSize: 10,
                                padding: "2px 6px",
                                borderRadius: 999,
                                border: "1px solid #e5e7eb",
                                color: "#334155",
                                background: "#f8fafc",
                              }}
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>

                     <button
  onClick={() =>
    setSelectedIds((prev) =>
      prev.includes(l.id)
        ? prev.filter((x) => x !== l.id)
        : [...prev, l.id]
    )
  }
  style={{
    marginTop: 8,
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #0ea5e9",
    background: picked ? "#0ea5e9" : "white",
    color: picked ? "white" : "#0ea5e9",
    fontWeight: 600,
  }}
>
  {picked ? "Added ✓" : "Add Location"}
</button>
                    </div>
                  );
                })}
              </div>

              <FooterNav onPrev={() => setStep(0)} onNext={() => setStep(2)} />
            </Card>
          )}

          {/* STEP 2: adventures & add-ons */}
          {step === 2 && (
            <Card title="Adventures & Add-ons">
              <div
                style={{
                  fontSize: 12,
                  color: "#475569",
                  marginBottom: 8,
                }}
              >
                First we show adventures suggested from your selected
                locations. Below that, you’ll see all available adventures.
              </div>

              {/* Suggested first */}
              <h4 style={{ fontSize: 13, margin: "4px 0 8px" }}>
                Suggested for your trip
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(240px,1fr))",
                  gap: 12,
                }}
              >
                {suggestedActivities.map((a) => {
                  const on = addonIds.includes(a.id);
                  return (
                    <AdventureCard
                      key={a.id}
                      adventure={a}
                      active={on}
                      onToggle={() =>
                        setAddonIds((prev) =>
                          on
                            ? prev.filter((x) => x !== a.id)
                            : [...prev, a.id]
                        )
                      }
                    />
                  );
                })}
              </div>

              {/* All adventures */}
              <h4
                style={{
                  fontSize: 13,
                  margin: "16px 0 8px",
                  borderTop: "1px dashed #e5e7eb",
                  paddingTop: 8,
                }}
              >
                All adventures
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(240px,1fr))",
                  gap: 12,
                }}
              >
                {activities.map((a) => {
                  const on = addonIds.includes(a.id);
                  return (
                    <AdventureCard
                      key={`all-${a.id}`}
                      adventure={a}
                      active={on}
                      onToggle={() =>
                        setAddonIds((prev) =>
                          on
                            ? prev.filter((x) => x !== a.id)
                            : [...prev, a.id]
                        )
                      }
                    />
                  );
                })}
              </div>

              <FooterNav onPrev={() => setStep(1)} onNext={() => setStep(3)} />
            </Card>
          )}

          {/* STEP 3: itinerary */}
          {step === 3 && (
            <Card title="Itinerary (Editable)">
              {!days.length && (
                <p style={{ fontSize: 14 }}>
                  Select a few locations first; the itinerary will appear here.
                </p>
              )}

              <div style={{ display: "grid", gap: 12 }}>
                {days.map((day, i) => {
                  const calendarDate = startDate
                    ? addDays(startDate, i)
                    : null;
                  const dateLabel = calendarDate || "No date set";

                  return (
                    <div
                      key={i}
                      style={{
                        border: "1px solid #e5e7eb",
                        background: "white",
                        borderRadius: 12,
                        padding: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <b>
                            Day {i + 1} — {day.island}
                          </b>
                          {day.items.some((it) => it.type === "ferry") && (
                            <Chip tone="blue">Ferry</Chip>
                          )}
                          {day.items.some((it) => it.type === "arrival") && (
                            <Chip tone="green">Arrival</Chip>
                          )}
                          {day.items.some(
                            (it) => it.type === "departure"
                          ) && <Chip tone="red">Departure</Chip>}
                        </div>
                        <span style={{ fontSize: 12, color: "#334155" }}>
                          {dateLabel}
                        </span>
                      </div>

                      <ul
                        style={{
                          marginTop: 8,
                          paddingLeft: 18,
                          fontSize: 14,
                        }}
                      >
                        {day.items.map((it, k) => (
                          <li
                            key={k}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 8,
                              alignItems: "center",
                            }}
                          >
                            <span>
                              {it.type === "location"
                                ? `${it.name} (${it.durationHrs}h)`
                                : it.name}
                            </span>
                            <span
                              style={{
                                display: "inline-flex",
                                gap: 6,
                              }}
                            >
                              <button
                                onClick={() => moveItem(i, k, -1)}
                                style={miniBtn}
                                title="Move to previous day"
                              >
                                ◀︎
                              </button>
                              <button
                                onClick={() => moveItem(i, k, +1)}
                                style={miniBtn}
                                title="Move to next day"
                              >
                                ▶︎
                              </button>
                            </span>
                          </li>
                        ))}
                      </ul>

                      {!day.items.some((it) => it.type === "ferry") &&
                        !day.items.some((it) => it.type === "departure") && (
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              marginTop: 8,
                              alignItems: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            <label
                              style={{
                                fontSize: 12,
                                color: "#475569",
                              }}
                            >
                              Transport:
                            </label>
                            <select
                              value={day.transport}
                              onChange={(e) =>
                                setTransportForDay(i, e.target.value)
                              }
                            >
                              <option>Point-to-Point</option>
                              <option>Day Cab</option>
                              <option>Scooter</option>
                              <option>—</option>
                            </select>
                            <button
                              onClick={() => addEmptyDayAfter(i)}
                              style={pillBtn}
                            >
                              + Add empty day after
                            </button>
                            <button
                              onClick={() => deleteDay(i)}
                              style={dangerBtn}
                              disabled={days.length <= 1}
                            >
                              Delete day
                            </button>
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 10 }}>
                <button
                  onClick={() => addEmptyDayAfter(days.length - 1)}
                  style={pillBtn}
                >
                  + Add another day
                </button>
              </div>

              <FooterNav onPrev={() => setStep(2)} onNext={() => setStep(4)} />
            </Card>
          )}

          {/* STEP 4: hotels */}
          {step === 4 && (
            <Card title="Hotels by Island">
              {Object.entries(nightsByIsland).map(([island, nights]) => (
                <div key={island} style={{ marginBottom: 16 }}>
                  <b>
                    {island} — {nights} night(s)
                  </b>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(220px,1fr))",
                      gap: 10,
                      marginTop: 8,
                    }}
                  >
                    {(MOCK_HOTELS[island] || []).map((h) => {
                      const picked = chosenHotels[island] === h.id;
                      return (
                        <div
                          key={h.id}
                          style={{
                            border: "1px solid #e5e7eb",
                            background: "white",
                            borderRadius: 12,
                            padding: 12,
                          }}
                        >
                          <div
                            style={{
                              height: 80,
                              background: "#e2e8f0",
                              borderRadius: 8,
                              marginBottom: 8,
                            }}
                          />
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                            }}
                          >
                            {h.name}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#475569",
                            }}
                          >
                            {h.tier} • From {formatINR(h.sell_price)}/night
                          </div>
                          <button
                            onClick={() => chooseHotel(island, h.id)}
                            style={{
                              marginTop: 8,
                              width: "100%",
                              padding: "8px 10px",
                              borderRadius: 8,
                              border: "1px solid #16a34a",
                              background: picked ? "#16a34a" : "white",
                              color: picked ? "white" : "#16a34a",
                              fontWeight: 600,
                            }}
                          >
                            {picked ? "Selected" : "Select"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <FooterNav onPrev={() => setStep(3)} onNext={() => setStep(5)} />
            </Card>
          )}

          {/* STEP 5: transport */}
          {step === 5 && (
            <Card title="Transport & Ferries">
              <div style={{ display: "grid", gap: 14 }}>
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: 12,
                    background: "white",
                  }}
                >
                  <b>Ferry</b>
                  <Row>
                    <Field label="Class">
                      <select
                        value={essentials.ferryClass}
                        onChange={(e) =>
                          setEssentials((prev) => ({
                            ...prev,
                            ferryClass: e.target.value,
                          }))
                        }
                      >
                        <option>Economy</option>
                        <option>Deluxe</option>
                        <option>Luxury</option>
                      </select>
                    </Field>
                    <Field label="Seat map">
                      <button
                        onClick={() =>
                          window.open(SEATMAP_URL, "_blank")
                        }
                        style={{
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "1px solid #0ea5e9",
                          background: "white",
                          color: "#0ea5e9",
                          fontWeight: 700,
                        }}
                      >
                        Open Seat Map
                      </button>
                    </Field>
                  </Row>
                </div>

                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: 12,
                    background: "white",
                  }}
                >
                  <b>Ground Transport</b>
                  <Row>
                    <Field label="Cab model (Day Cab days)">
                      <select
                        value={essentials.cabModelId}
                        onChange={(e) =>
                          setEssentials((prev) => ({
                            ...prev,
                            cabModelId: e.target.value,
                          }))
                        }
                      >
                        {CAB_MODELS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label} — {formatINR(c.dayRate)}/day
                          </option>
                        ))}
                      </select>
                    </Field>
                  </Row>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#475569",
                      marginBottom: 6,
                    }}
                  >
                    Scooter per island (separate from cab, overrides to scooter
                    on those islands):
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    {Array.from(
                      new Set(days.map((d) => d.island))
                    )
                      .filter(Boolean)
                      .map((isl) => (
                        <label
                          key={isl}
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 8,
                            padding: "6px 10px",
                            background: "white",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={scooterIslands.has(isl)}
                            onChange={() => toggleScooter(isl)}
                            style={{ marginRight: 6 }}
                          />
                          {isl} — {formatINR(SCOOTER_DAY_RATE)}/day
                        </label>
                      ))}
                  </div>
                </div>
              </div>
              <FooterNav
                onPrev={() => setStep(4)}
                onNext={() =>
                  alert(
                    "This would submit a lead / enquiry for the full itinerary."
                  )
                }
                nextLabel="Request to Book"
              />
            </Card>
          )}
        </section>

        {/* Desktop summary */}
        <aside className="sidebar">
          <div style={{ position: "sticky", top: 80 }}>
            <div
              style={{
                border: "1px solid #e5e7eb",
                background: "white",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 8px 24px rgba(2,132,199,0.08)",
              }}
            >
              <div
                style={{
                  padding: "12px 14px",
                  color: "white",
                  background:
                    "linear-gradient(90deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    background: "rgba(255,255,255,.15)",
                    border: "1px solid rgba(255,255,255,.25)",
                    padding: "4px 8px",
                    borderRadius: 999,
                    letterSpacing: 0.3,
                  }}
                >
                  TRIP SUMMARY
                </span>
                <span
                  style={{
                    background: "white",
                    color: "#0f172a",
                    padding: "6px 10px",
                    borderRadius: 10,
                    fontWeight: 900,
                    boxShadow: "0 2px 8px rgba(0,0,0,.12)",
                  }}
                >
                  {formatINR(grandTotal)}
                </span>
              </div>

              <div style={{ padding: 16 }}>
                <div
                  style={{
                    fontSize: 14,
                    color: "#334155",
                    display: "grid",
                    gap: 4,
                  }}
                >
                  <div>
                    Start date: <b>{startDate || "Not set"}</b>
                  </div>
                  <div>
                    Days planned: <b>{days.length}</b>
                  </div>
                  <div>
                    Travellers:{" "}
                    <b>
                      {adults} adult(s)
                      {infants ? `, ${infants} infant(s)` : ""}
                    </b>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 12,
                    borderTop: "1px dashed #e5e7eb",
                    paddingTop: 12,
                    display: "grid",
                    gap: 8,
                    fontSize: 14,
                  }}
                >
                  <RowSplit
                    label="Hotels"
                    value={formatINR(hotelsTotal)}
                  />
                  <RowSplit
                    label="Ferries"
                    value={formatINR(ferryTotal)}
                  />
                  <RowSplit
                    label="Ground transport"
                    value={formatINR(logisticsTotal)}
                  />
                  <RowSplit
                    label="Adventures & add-ons"
                    value={formatINR(addonsTotal)}
                  />
                  <div
                    style={{
                      borderTop: "2px solid #0ea5e9",
                      paddingTop: 10,
                      fontSize: 16,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>Total (indicative)</span>
                    <b>{formatINR(grandTotal)}</b>
                  </div>
                </div>

                <button
                  onClick={() =>
                    alert(
                      "This would submit a single Request-to-Book for the full trip."
                    )
                  }
                  style={{
                    marginTop: 12,
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid #0ea5e9",
                    background: "#0ea5e9",
                    color: "white",
                    fontWeight: 800,
                  }}
                >
                  Request to Book Full Trip
                </button>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Location detail modal */}
      <LocationModal
        location={openLoc}
        onClose={closeModal}
        onAddLocation={() => {
          console.log("Add location to trip:", openLoc?.id);
          // Later: push this location into the trip summary selection
        }}
        onAddAdventure={() => {
          console.log("Add adventures for location:", openLoc?.id);
          // Later: open an adventures picker based on this location / island
        }}
      />
      {/* Mobile summary bar */}
      <MobileSummaryBar
        total={grandTotal}
        lineItems={[
          { label: "Hotels", amount: hotelsTotal },
          { label: "Ferries", amount: ferryTotal },
          { label: "Ground transport", amount: logisticsTotal },
          { label: "Adventures", amount: addonsTotal },
        ]}
        badges={[
          { label: "days", value: String(days.length) },
          { label: "travellers", value: String(pax) },
        ]}
        onRequestToBook={() =>
          alert("This would submit a lead for the full itinerary.")
        }
      />
    </div>
  );
}

/* -----------------------------------
   Tiny UI helpers
------------------------------------ */

const miniBtn = {
  border: "1px solid #e5e7eb",
  background: "white",
  borderRadius: 6,
  padding: "3px 8px",
  fontSize: 12,
};

const pillBtn = {
  border: "1px solid #0ea5e9",
  background: "white",
  color: "#0ea5e9",
  borderRadius: 999,
  padding: "6px 10px",
  fontWeight: 700,
};

const dangerBtn = {
  border: "1px solid #ef4444",
  background: "white",
  color: "#ef4444",
  borderRadius: 999,
  padding: "6px 10px",
  fontWeight: 700,
};

function RowSplit({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        background: "white",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 6px 16px rgba(2,132,199,0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background:
                "linear-gradient(90deg, #0891b2, #06b6d4, #22d3ee)",
            }}
          />
          <div style={{ fontWeight: 800 }}>{title}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function Row({ children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
        gap: 12,
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label
      style={{
        fontSize: 12,
        color: "#475569",
        display: "grid",
        gap: 6,
      }}
    >
      <span>{label}</span>
      {children}
    </label>
  );
}

function FooterNav({ onPrev, onNext, nextLabel = "Next" }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginTop: 12,
      }}
    >
      <button
        onClick={onPrev}
        disabled={!onPrev}
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          background: "white",
        }}
      >
        Back
      </button>
      <button
        onClick={onNext}
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid #0ea5e9",
          background: "#0ea5e9",
          color: "white",
          fontWeight: 700,
        }}
      >
        {nextLabel}
      </button>
    </div>
  );
}

function Stepper({ step, setStep }) {
  const labels = [
    "Trip Basics",
    "Select Locations",
    "Adventures & Add-ons",
    "Itinerary",
    "Hotels",
    "Transport",
  ];
  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 16px 12px 16px",
        display: "grid",
        gridTemplateColumns: `repeat(${labels.length},1fr)`,
        gap: 6,
      }}
    >
      {labels.map((label, i) => (
        <button
          key={label}
          onClick={() => setStep(i)}
          style={{
            borderRadius: 10,
            padding: "8px 10px",
            border: "1px solid #e5e7eb",
            background: i === step ? "#0ea5e9" : "white",
            color: i === step ? "white" : "#0f172a",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {i + 1}. {label}
        </button>
      ))}
    </div>
  );
}

function Chip({ children, tone }) {
  const tones = {
    blue: {
      bg: "#ecfeff",
      border: "#bae6fd",
      color: "#0369a1",
    },
    green: {
      bg: "#f0fdf4",
      border: "#bbf7d0",
      color: "#166534",
    },
    red: {
      bg: "#fef2f2",
      border: "#fecaca",
      color: "#991b1b",
    },
  };
  const t = tones[tone] || tones.blue;
  return (
    <span
      style={{
        fontSize: 11,
        padding: "2px 6px",
        borderRadius: 999,
        background: t.bg,
        color: t.color,
        border: `1px solid ${t.border}`,
      }}
    >
      {children}
    </span>
  );
}

function AdventureCard({ adventure, active, onToggle }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        background: "white",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div
        style={{
          height: 80,
          background: "#e2e8f0",
          borderRadius: 8,
          marginBottom: 8,
        }}
      />
      <div style={{ fontSize: 13, fontWeight: 600 }}>
        {adventure.name}
      </div>
      <div style={{ fontSize: 12, color: "#475569" }}>
        {formatINR(adventure.basePriceINR ?? adventure.price ?? 0)}
      </div>
      <button
        onClick={onToggle}
        style={{
          marginTop: 8,
          width: "100%",
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid #0ea5e9",
          background: active ? "#0ea5e9" : "white",
          color: active ? "white" : "#0ea5e9",
          fontWeight: 600,
        }}
      >
        {active ? "Added" : "Add"}
      </button>
    </div>
  );
}
