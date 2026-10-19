
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import AuthPanel from "./components/AuthPanel";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || ""
  );
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

  const [seatMessage, setSeatMessage] = useState("");
  const [seatError, setSeatError] = useState("");
  const [busySeats, setBusySeats] = useState([]);

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

  async function releaseSeat(showId, seatNumber) {
    if (!token) return;

    const response = await fetch(`${API_URL}/api/seat-locks/unlock`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ showId, seatNumber }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Could not release ${seatNumber}.`);
    }

    return data;
  }

  async function releaseSelectedSeats() {
    if (!selectedShow || selectedSeats.length === 0 || !token) return;

    const results = await Promise.allSettled(
      selectedSeats.map((seat) => releaseSeat(selectedShow._id, seat))
    );

    const failed = results.filter((result) => result.status === "rejected");

    if (failed.length > 0) {
      setSeatError(
        "Some locks could not be released. They will expire automatically."
      );
    }
  }

  async function openShowtimes(event) {
  console.log("1. View Showtimes clicked:", event._id);

  await releaseSelectedSeats();
  console.log("2. Finished releasing previous seats");

  setSelectedEvent(event);
  setSelectedShow(null);
  setSelectedSeats([]);
  setSeatMessage("");
  setSeatError("");
  setShows([]);
  setShowsError("");
  setShowsLoading(true);

  console.log("3. Starting showtime API request");

  try {
    const response = await fetch(
      `${API_URL}/api/shows/event/${event._id}`
    );

    console.log("4. Showtime API status:", response.status);

    const data = await response.json();
    console.log("5. Showtime API response:", data);

    if (!response.ok) {
      throw new Error(data.message || "Could not load showtimes.");
    }

    // setShows(data.shows || []);
    const availableShows = Array.isArray(data.shows) ? data.shows : [];
    console.log("Available shows:", availableShows);
    setShows(availableShows);
  

  } catch (err) {
    console.error("Showtime error:", err);
    setShowsError(err.message);
  } finally {
    setShowsLoading(false);
  }
}


  
  
  

  async function toggleSeat(seatNumber) {
    if (!token) {
      setSeatError("Please log in before selecting seats.");
      setSeatMessage("");
      return;
    }

    if (!selectedShow || busySeats.includes(seatNumber)) return;

    setSeatError("");
    setSeatMessage("");
    setBusySeats((previous) => [...previous, seatNumber]);

    try {
      if (selectedSeats.includes(seatNumber)) {
        await releaseSeat(selectedShow._id, seatNumber);

        setSelectedSeats((previous) =>
          previous.filter((seat) => seat !== seatNumber)
        );
        setSeatMessage(`${seatNumber} lock released.`);
      } else {
        const response = await fetch(`${API_URL}/api/seat-locks/lock`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            showId: selectedShow._id,
            seatNumber,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not lock this seat.");
        }

        setSelectedSeats((previous) =>
          previous.includes(seatNumber)
            ? previous
            : [...previous, seatNumber]
        );

        setSeatMessage(
          `${seatNumber} locked for you for up to ${
            Math.ceil((data.expiresInSeconds || 600) / 60)
          } minutes.`
        );
      }
    } catch (err) {
      setSeatError(err.message);
    } finally {
      setBusySeats((previous) =>
        previous.filter((seat) => seat !== seatNumber)
      );
    }
  }

  const totalPrice =
    selectedSeats.length * (selectedShow?.pricePerSeat || 0);

  return (
    <main className="app">
      <header className="page-header">
        <h1>Event Booking</h1>
        <AuthPanel onLogin={setToken} />
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
                <p>Starting at ₹{event.startingPrice ?? "—"}</p>

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
            onClick={async () => {
              await releaseSelectedSeats();
              setSelectedEvent(null);
              setSelectedShow(null);
              setSelectedSeats([]);
              setSeatMessage("");
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
                onClick={async () => {
                  await releaseSelectedSeats();
                  setSelectedShow(show);
                  setSelectedSeats([]);
                  setSeatMessage("");
                  setSeatError("");
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

              {!token && (
                <p className="error">Log in before selecting a seat.</p>
              )}

              <div className="seat-grid">
                {Array.from(
                  { length: Math.min(selectedShow.totalSeats, 40) },
                  (_, index) => {
                    const seat = `S${index + 1}`;
                    const isSelected = selectedSeats.includes(seat);
                    const isBusy = busySeats.includes(seat);

                    return (
                      <button
                        key={seat}
                        className={`seat ${isSelected ? "selected" : ""}`}
                        aria-pressed={isSelected}
                        disabled={!token || isBusy}
                        onClick={() => toggleSeat(seat)}
                      >
                        {isBusy ? "..." : seat}
                      </button>
                    );
                  }
                )}
              </div>

              <p>Selected seats are temporarily locked for your account.</p>

              {seatMessage && <p role="status">{seatMessage}</p>}
              {seatError && <p className="error" role="alert">{seatError}</p>}

              <div className="booking-summary">
                <p>Seats selected: {selectedSeats.length}</p>
                <h3>Total: ₹{totalPrice}</h3>
                <button
                  disabled={selectedSeats.length === 0}
                  onClick={() =>
                    alert(
                      "Seat locks are active. Confirmed booking and payment will be implemented later."
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



