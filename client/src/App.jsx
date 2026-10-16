
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

function App() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchEvents() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/api/events`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load events.");
        }

        const data = await response.json();
        setEvents(data.events || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Something went wrong.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchEvents();

    return () => controller.abort();
  }, []);

  const categories = [
    "All",
    "Movie",
    "Concert",
    "Sports",
    "Theatre",
    "Other",
  ];

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch =
        event.title?.toLowerCase().includes(query) ||
        event.city?.toLowerCase().includes(query) ||
        event.venue?.toLowerCase().includes(query);

      const matchesCategory =
        category === "All" || event.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [events, search, category]);

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="/">
          <span className="brand-icon">E</span>
          Eventify
        </a>
        <span className="nav-caption">Discover experiences</span>
      </header>

      <main className="container">
        <section className="hero">
          <p className="eyebrow">YOUR NEXT EXPERIENCE STARTS HERE</p>
          <h1>Find events worth remembering.</h1>
          <p className="hero-description">
            Discover concerts, movies, sports, and live experiences
            around you.
          </p>

          <div className="search-bar">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search by event, city or venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search events"
            />
          </div>
        </section>

        <section className="events-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">EXPLORE</p>
              <h2>Discover events</h2>
            </div>
            <span className="event-count">
              {filteredEvents.length} events
            </span>
          </div>

          <div className="filters" aria-label="Filter by category">
            {categories.map((item) => (
              <button
                key={item}
                className={`filter-chip ${
                  category === item ? "active" : ""
                }`}
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
              >
                {item}
              </button>
            ))}
          </div>

          {loading && (
            <p className="state-message">Loading events...</p>
          )}

          {!loading && error && (
            <div className="state-message error">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>
                Try again
              </button>
            </div>
          )}

          {!loading && !error && filteredEvents.length === 0 && (
            <div className="state-message">
              <h3>No events found</h3>
              <p>Try another search or select a different category.</p>
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                }}
              >
                Clear filters
              </button>
            </div>
          )}

          {!loading && !error && filteredEvents.length > 0 && (
            <div className="event-grid">
              {filteredEvents.map((event) => (
                <article className="event-card" key={event._id}>
                  <div className="event-image">
                    {event.posterUrl ? (
                      <img
                        src={event.posterUrl}
                        alt={event.title}
                        loading="lazy"
                      />
                    ) : (
                      <div className="poster-placeholder">
                        <span>{event.category}</span>
                        <strong>{event.title}</strong>
                      </div>
                    )}
                    <span className="category-badge">
                      {event.category}
                    </span>
                  </div>

                  <div className="event-content">
                    <h3>{event.title}</h3>
                    <p className="event-location">
                      {event.venue}, {event.city}
                    </p>
                    <p className="event-description">
                      {event.description}
                    </p>

                    <div className="event-footer">
                      <div>
                        <span className="price-label">Starting from</span>
                        <strong className="event-price">
                          ₹{Number(event.startingPrice).toLocaleString("en-IN")}
                        </strong>
                      </div>
                      <button
                        className="view-button"
                        onClick={() =>
                          alert(
                            "Show and seat selection will be added in a later project step."
                          )
                        }
                      >
                        Explore
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        Eventify · Built as a full-stack learning project
      </footer>
    </div>
  );
}

export default App;

