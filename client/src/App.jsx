
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [shows, setShows] = useState([]);
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showsLoading, setShowsLoading] = useState(false);
  const [showsError, setShowsError] = useState("");

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch(`${API_URL}/api/events`);
        if (!response.ok) throw new Error("Could not load events.");

        const data = await response.json();
        setEvents(Array.isArray(data) ? data : data.events || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const term = search.toLowerCase();

      const matchesSearch = [
        event.title,
        event.city,
        event.venue,
        event.description,
      ].some((value) => (value || "").toLowerCase().includes(term));

      const matchesCategory =
        category === "All" || event.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [events, search, category]);

  async function openShowtimes(event) {
    setSelectedEvent(event);
    setSelectedShow(null);
    setSelectedSeats([]);
    setShows([]);
    setShowsError("");
    setShowsLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/shows/event/${event._id}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load showtimes.");
      }

      setShows(data.shows || []);
    } catch (err) {
      setShowsError(err.message);
    } finally {
      setShowsLoading(false);
    }
  }

  function toggleSeat(seatNumber) {
    setSelectedSeats((previous) =>
      previous.includes(seatNumber)
        ? previous.filter((seat) => seat !== seatNumber)
        : [...previous, seatNumber]
    );
  }

  const totalPrice = selectedSeats.length * (selectedShow?.pricePerSeat || 0);

  return (
    <main className="app">
      <header className="page-header">
        <h1>Event Booking</h1>
        <p>Find your next experience.</p>
      </header>

      <section className="filters">
        <input
          type="text"
          placeholder="Search events, cities, venues..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          <option value="Movie">Movie</option>
          <option value="Concert">Concert</option>
          <option value="Sports">Sports</option>
          <option value="Theatre">Theatre</option>
          <option value="Other">Other</option>
        </select>
      </section>

      {loading && <p>Loading events...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <section className="event-grid">
          {filteredEvents.map((event) => (
            <article className="event-card" key={event._id}>
              {event.posterUrl && (
                <img
                  className="event-poster"
                  src={event.posterUrl}
                  alt={event.title}
                />
              )}

              <div className="event-card-content">
                <span className="category-badge">{event.category}</span>
                <h2>{event.title}</h2>
                <p>{event.description}</p>
                <p>
                  {event.venue} {event.city ? `• ${event.city}` : ""}
                </p>
                <p>
                  Starting at ₹{event.startingPrice ?? "—"}
                </p>

                <button onClick={() => openShowtimes(event)}>
                  View Showtimes
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {!loading && !error && filteredEvents.length === 0 && (
        <p>No events match your search.</p>
      )}

      {selectedEvent && (
        <section className="booking-section">
          <button
            className="secondary-button"
            onClick={() => {
              setSelectedEvent(null);
              setSelectedShow(null);
              setSelectedSeats([]);
            }}
          >
            ← Back to Events
          </button>

          <h2>Showtimes: {selectedEvent.title}</h2>

          {showsLoading && <p>Loading showtimes...</p>}
          {showsError && <p className="error">{showsError}</p>}

          {!showsLoading && !showsError && shows.length === 0 && (
            <p>No upcoming showtimes are available for this event.</p>
          )}

          <div className="show-list">
            {shows.map((show) => (
              <button
                key={show._id}
                className={`show-card ${
                  selectedShow?._id === show._id ? "active" : ""
                }`}
                onClick={() => {
                  setSelectedShow(show);
                  setSelectedSeats([]);
                }}
              >
                <strong>
                  {new Date(show.startsAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </strong>
                <span>{show.venue}</span>
                <span>₹{show.pricePerSeat} per seat</span>
              </button>
            ))}
          </div>

          {selectedShow && (
            <div className="seat-section">
              <h2>Select Your Seats</h2>
              <p className="screen-label">SCREEN / STAGE</p>

              <div className="seat-grid">
                {Array.from(
                  { length: Math.min(selectedShow.totalSeats, 40) },
                  (_, index) => {
                    const seat = `S${index + 1}`;
                    const isSelected = selectedSeats.includes(seat);

                    return (
                      <button
                        key={seat}
                        className={`seat ${isSelected ? "selected" : ""}`}
                        aria-pressed={isSelected}
                        onClick={() => toggleSeat(seat)}
                      >
                        {seat}
                      </button>
                    );
                  }
                )}
              </div>

              <p>Green = selected; grey = available.</p>
              <div className="booking-summary">
                <p>Seats selected: {selectedSeats.length}</p>
                <h3>Total: ₹{totalPrice}</h3>
                <button
                  disabled={selectedSeats.length === 0}
                  onClick={() =>
                    alert(
                      "Seat selection demo only. Booking and payment are not implemented yet."
                    )
                  }
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default App;


