"use client";

import {
  useCallback,
  useEffect,
  useState
} from "react";

const DEFAULT_SERVICES = [
  {
    id: "18-marx",
    type: "tram",
    line: "18",
    station: "St. Marx",
    stopId: "293",
    color: "#e30613"
  },
  {
    id: "18-stadion",
    type: "tram",
    line: "18",
    station: "Stadion",
    stopId: "2422",
    color: "#b91c1c"
  },
  {
    id: "o-rennweg",
    type: "tram",
    line: "O",
    station: "Wien Mitte → Rennweg",
    stopId: "338",
    color: "#e30613"
  },
  {
    id: "71",
    type: "tram",
    line: "71",
    station: "Oberzellergasse",
    stopId: "2015,2044",
    color: "#d92d20"
  },
  {
    id: "74A",
    type: "bus",
    line: "74A",
    station: "Rabengasse",
    stopId: "283,7490",
    color: "#2563eb"
  },
  {
    id: "74a-stmarx",
    type: "bus",
    line: "74A",
    station: "Wien Mitte → St. Marx",
    stopId: "253",
    color: "#2563eb"
  },
  {
    id: "u4-wienmitte",
    type: "metro",
    line: "U4",
    station: "Wien Mitte",
    stopId: "4412",
    color: "#009640"
  },
  {
    id: "u4-heiligenstadt",
    type: "metro",
    line: "U4",
    station: "Heiligenstadt",
    stopId: "4425",
    color: "#009640"
  },
  {
    id: "S7",
    type: "sbahn",
    line: "S7",
    station: "Wien St. Marx",
    stopId: "",
    color: "#16a34a"
  }
];
export default function Page() {
  const [services, setServices] =
    useState(DEFAULT_SERVICES);

  const [results, setResults] =
    useState({});

  const [loading, setLoading] =
    useState({});

  const [settingsOpen, setSettingsOpen] =
    useState(false);

  const [initialized, setInitialized] =
    useState(false);

  const [lastUpdated, setLastUpdated] =
    useState(null);

  const groups = [
  {
    type: "tram",
    title: "🚋 Tram"
  },
  {
    type: "bus",
    title: "🚌 Bus"
  },
  {
    type: "metro",
    title: "🚇 U-Bahn"
  },
  {
    type: "sbahn",
    title: "🚆 S-Bahn"
  }
]; 
  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        "wien-live-settings"
      );

      if (saved) {
        const parsed = JSON.parse(saved);

        const merged = DEFAULT_SERVICES.map(
          (defaultService) => {
            const savedService = parsed.find(
              (item) =>
                item.id === defaultService.id
            );

            return savedService
              ? {
                  ...defaultService,
                  ...savedService
                }
              : defaultService;
          }
        );

        setServices(merged);
      }
    } catch (error) {
      console.error(
        "Greška pri učitavanju postavki:",
        error
      );
    } finally {
      setInitialized(true);
    }
  }, []);

  const loadService = useCallback(
    async (service) => {
      setLoading((previous) => ({
        ...previous,
        [service.id]: true
      }));

      try {
        if (service.line === "S7") {
          const response = await fetch(
            "/api/s7",
            {
              cache: "no-store"
            }
          );

          const data = await response.json();

          setResults((previous) => ({
            ...previous,
            [service.id]: {
              departures:
                data.departures ?? [],
              message:
                data.message ??
                "ÖBB API još nije povezan.",
              error: data.error ?? null
            }
          }));

          return;
        }

        if (!service.stopId.trim()) {
          setResults((previous) => ({
            ...previous,
            [service.id]: {
              departures: [],
              error: "StopID nije unesen."
            }
          }));

          return;
        }

        const url =
          `/api/departures?stopId=` +
          `${encodeURIComponent(
            service.stopId
          )}` +
          `&line=${encodeURIComponent(
            service.line
          )}`;

        const response = await fetch(url, {
          cache: "no-store"
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ??
              `API greška ${response.status}`
          );
        }

        setResults((previous) => ({
          ...previous,
          [service.id]: {
            departures:
              data.departures ?? [],
            stopIds: data.stopIds ?? [],
            error: null
          }
        }));
      } catch (error) {
        setResults((previous) => ({
          ...previous,
          [service.id]: {
            departures: [],
            error:
              error instanceof Error
                ? error.message
                : "Nepoznata greška"
          }
        }));
      } finally {
        setLoading((previous) => ({
          ...previous,
          [service.id]: false
        }));
      }
    },
    []
  );

  const loadAll = useCallback(async () => {
    await Promise.all(
      services.map((service) =>
        loadService(service)
      )
    );

    setLastUpdated(new Date());
  }, [services, loadService]);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    loadAll();

    const interval = setInterval(
      loadAll,
      60000
    );

    return () => clearInterval(interval);
  }, [initialized, loadAll]);

  function updateStopId(index, value) {
    setServices((previous) =>
      previous.map(
        (service, serviceIndex) =>
          serviceIndex === index
            ? {
                ...service,
                stopId: value
              }
            : service
      )
    );
  }

  async function saveSettings() {
    localStorage.setItem(
      "wien-live-settings",
      JSON.stringify(services)
    );

    setSettingsOpen(false);
    await loadAll();
  }

  function formatTime(value) {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString(
      "de-AT",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 20,
        background: "#f3f5f7",
        color: "#0f172a",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto"
        }}
      >
        <header
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent:
              "space-between",
            gap: 16,
            marginBottom: 24
          }}
        >
          <div>
            <div
              style={{
                color: "#dc2626",
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: 2
              }}
            >
              WIEN LIVE
            </div>

            <h1
              style={{
                margin: "6px 0",
                fontSize: 42
              }}
            >
              Moje linije
            </h1>

            <div
              style={{
                color: "#64748b"
              }}
            >
              Polasci uživo, osvježavanje
              svakih 60 sekundi
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10
            }}
          >
            <button
              onClick={() =>
                setSettingsOpen(
                  !settingsOpen
                )
              }
              style={secondaryButton}
            >
              ⚙ Postavke
            </button>

            <button
              onClick={loadAll}
              style={primaryButton}
            >
              Osvježi sve
            </button>
          </div>
        </header>

        {settingsOpen && (
          <section
            style={{
              padding: 20,
              marginBottom: 24,
              background: "white",
              borderRadius: 18,
              boxShadow:
                "0 8px 25px rgba(15,23,42,0.07)"
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              StopID postavke
            </h2>

            <p
              style={{
                color: "#64748b"
              }}
            >
              Za dva smjera unesi StopID
              brojeve odvojene zarezom.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(270px, 1fr))",
                gap: 16
              }}
            >
              {services.map(
                (service, index) => (
                  <div key={service.id}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: 7,
                  fontWeight: 700
                      }}
                    >
                      {service.line} –{" "}
                      {service.station}
                    </label>

                    <input
                      type="text"
                      value={service.stopId}
                      disabled={
                        service.line === "S7"
                      }
                      placeholder={
                        service.line === "S7"
                          ? "ÖBB API"
                          : "StopID"
                      }
                      onChange={(event) =>
                        updateStopId(
                          index,
                          event.target.value
                        )
                      }
                      style={{
                        boxSizing:
                          "border-box",
                        width: "100%",
                        padding: 11,
                        border:
                          "1px solid #cbd5e1",
                        borderRadius: 9,
                        background:
                          service.line === "S7"
                            ? "#f1f5f9"
                            : "white",
                        fontSize: 16
                      }}
                    />
                  </div>
                )
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 20
              }}
            >
              <button
                onClick={saveSettings}
                style={primaryButton}
              >
                Sačuvaj
              </button>

              <button
                onClick={() =>
                  setSettingsOpen(false)
                }
                style={secondaryButton}
              >
                Zatvori
              </button>
            </div>
          </section>
        )}

        <>
{groups.map(group => (
  <div key={group.type}>

    <h2
      style={{
        marginTop: 24,
        marginBottom: 14,
        fontSize: 28,
        fontWeight: 800
      }}
    >
      {group.title}
    </h2>

    <section
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(310px, 1fr))",
        gap: 18,
        marginBottom: 24
      }}
    >
      {services
        .filter(
          service =>
            service.type === group.type
        )
        .map((service) => {
            const result =
              results[service.id] ?? {};

            const serviceDepartures =
              result.departures ?? [];

            return (
              <article
                key={service.id}
                style={{
                  overflow: "hidden",
                  background: "white",
                  borderRadius: 20,
                  boxShadow:
                    "0 8px 25px rgba(15,23,42,0.07)"
                }}
              >
                <div
                  style={{
                    height: 7,
                    background:
                      service.color
                  }}
                />

                <div
                  style={{
                    padding: 18,
                    borderBottom:
                      "1px solid #eef2f7"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "space-between",
                      gap: 10
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 30,
                          fontWeight: 900
                        }}
                      >
                        {service.line}
                      </div>

                      <div
                        style={{
                          color: "#64748b"
                        }}
                      >
                        {service.station}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        loadService(service)
                      }
                      disabled={
                        loading[service.id]
                      }
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        border:
                          "1px solid #cbd5e1",
                        background: "white",
                        fontSize: 18,
                        cursor: "pointer"
                      }}
                    >
                      {loading[service.id]
                        ? "…"
                        : "↻"}
                    </button>
                  </div>

                  {service.line !== "S7" && (
                    <div
                      style={{
                        marginTop: 8,
                        color: "#64748b",
                        fontSize: 12
                      }}
                    >
                      StopID:{" "}
                      <strong>
                        {service.stopId ||
                          "nije unesen"}
                      </strong>
                    </div>
                  )}
                </div>

                <div>
                  {result.error ? (
                    <Message
                      color="#b45309"
                      text={result.error}
                    />
                  ) : service.line ===
                      "S7" &&
                    serviceDepartures.length ===
                      0 ? (
                    <Message
                      color="#64748b"
                      text={
                        result.message ??
                        "ÖBB API još nije povezan."
                      }
                    />
                  ) : loading[service.id] &&
                    serviceDepartures.length ===
                      0 ? (
                    <Message
                      color="#64748b"
                      text="Učitavanje polazaka…"
                    />
                  ) : serviceDepartures.length ===
                    0 ? (
                    <Message
                      color="#64748b"
                      text="Trenutno nema pronađenih polazaka."
                    />
                  ) : (
                    serviceDepartures.map(
                      (departure, index) => (
                        <div
                          key={`${service.id}-${index}`}
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "65px 1fr",
                            gap: 12,
                            padding:
                              "14px 18px",
                            borderBottom:
                              "1px solid #f1f5f9"
                          }}
                        >
                          <div
                            style={{
                              textAlign: "center"
                            }}
                          >
                            <div
                              style={{
                                color:
                                  index === 0
                                    ? service.color
                                    : "#0f172a",
                                fontSize: 25,
                                fontWeight: 900
                              }}
                            >
                              {departure.countdown ??
                                "–"}
                            </div>

                            <div
                              style={{
                                color: "#94a3b8",
                                fontSize: 10,
                                fontWeight: 700
                              }}
                            >
                              MIN
                            </div>
                          </div>

                          <div>
                            <div
                              style={{
                                fontWeight: 700
                              }}
                            >
                              {departure.direction ||
                                "Nepoznat smjer"}
                            </div>

                            <div
                              style={{
                                marginTop: 4,
                                color: "#64748b",
                                fontSize: 12
                              }}
                            >
                              {departure.real
                                ? "Uživo"
                                : "Planirano"}

                              {departure.real ||
                              departure.planned
                                ? ` · ${formatTime(
                                    departure.real ||
                                      departure.planned
                                  )}`
                                : ""}

                              {departure.platform
                                ? ` · Peron ${departure.platform}`
                                : ""}
                            </div>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
              </article>
            );
                  })}
    </section>

  </div>
))}
</>

        <footer
          style={{
            marginTop: 22,
            padding: 16,
            background: "white",
            borderRadius: 14,
            color: "#64748b",
            fontSize: 13
          }}
        >
          Izvor: Wiener Linien Open Data.

          {lastUpdated && (
            <>
              {" "}
              Posljednje osvježavanje:{" "}
              <strong>
                {lastUpdated.toLocaleTimeString(
                  "de-AT"
                )}
              </strong>
            </>
          )}
        </footer>
      </div>
    </main>
  );
}

function Message({ text, color }) {
  return (
    <div
      style={{
        padding: 20,
        color
      }}
    >
      {text}
    </div>
  );
}

const primaryButton = {
  padding: "12px 18px",
  border: 0,
  borderRadius: 12,
  background: "#111827",
  color: "white",
  fontWeight: 700,
  cursor: "pointer"
};

const secondaryButton = {
  padding: "12px 18px",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  background: "white",
  color: "#0f172a",
  fontWeight: 700,
  cursor: "pointer"
};