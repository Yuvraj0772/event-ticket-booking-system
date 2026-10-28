
// import { useCallback, useEffect, useMemo, useState } from "react";
// import "./App.css";
// import AuthPanel from "./components/AuthPanel";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// const categories = ["All", "Movie", "Concert", "Sports", "Theatre", "Other"];

// function formatDate(date) {
//   return new Date(date).toLocaleDateString("en-IN", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//   });
// }

// function formatTime(date) {
//   return new Date(date).toLocaleTimeString("en-IN", {
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

// function App() {
//   const [token, setToken] = useState(() => localStorage.getItem("token"));
//   const [authMode, setAuthMode] = useState("login");
//   const [authNotice, setAuthNotice] = useState("");

//   const [events, setEvents] = useState([]);
//   const [eventsLoading, setEventsLoading] = useState(false);
//   const [eventsError, setEventsError] = useState("");

//   const [search, setSearch] = useState("");
//   const [category, setCategory] = useState("All");

//   const [selectedEvent, setSelectedEvent] = useState(null);
//   const [eventShows, setEventShows] = useState([]);
//   const [showsLoading, setShowsLoading] = useState(false);
//   const [showsError, setShowsError] = useState("");

//   const [selectedShow, setSelectedShow] = useState(null);
//   const [selectedSeats, setSelectedSeats] = useState([]);
//   const [busySeats, setBusySeats] = useState([]);
//   const [bookingMessage, setBookingMessage] = useState("");
//   const [bookingError, setBookingError] = useState("");
//   const [actionLoading, setActionLoading] = useState(false);

//   const authHeaders = useMemo(
//     () => ({
//       "Content-Type": "application/json",
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//     }),
//     [token]
//   );

//   const loadEvents = useCallback(async () => {
//     setEventsLoading(true);
//     setEventsError("");

//     try {
//       const response = await fetch(`${API_URL}/api/events`);
//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || "Could not load events.");
//       }

//       const eventList = Array.isArray(data) ? data : data.events;

//       if (!Array.isArray(eventList)) {
//         throw new Error("The events API returned an unexpected response.");
//       }

//       setEvents(eventList);
//     } catch (error) {
//       setEventsError(error.message || "Could not connect to the server.");
//     } finally {
//       setEventsLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadEvents();
//   }, [loadEvents]);


 

import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import AuthPanel from "./components/AuthPanel";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const categories = ["All", "Movie", "Concert", "Sports", "Theatre", "Other"];

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [authMode, setAuthMode] = useState("login");
  const [authNotice, setAuthNotice] = useState("");

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventShows, setEventShows] = useState([]);
  const [showsLoading, setShowsLoading] = useState(false);
  const [showsError, setShowsError] = useState("");

  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [busySeats, setBusySeats] = useState([]);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError("");

    try {
      const response = await fetch(`${API_URL}/api/events`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load events.");
      }

      const eventList = Array.isArray(data) ? data : data.events;

      if (!Array.isArray(eventList)) {
        throw new Error("The events API returned an unexpected response.");
      }

      setEvents(eventList);
    } catch (error) {
      setEventsError(error.message || "Could not connect to the server.");
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesCategory =
        category === "All" || event.category === category;

      const searchableText = [
        event.title,
        event.description,
        event.city,
        event.venue,
        event.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesCategory && searchableText.includes(query);
    });
  }, [events, search, category]);

  async function releaseSeat(showId, seatNumber) {
    if (!token) return;

    const response = await fetch(`${API_URL}/api/seat-locks/unlock`, {
      method: "DELETE",
      headers: authHeaders,
      body: JSON.stringify({ showId, seatNumber }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || `Could not release seat ${seatNumber}.`);
    }
  }

  async function releaseSelectedSeats() {
    if (!selectedShow || selectedSeats.length === 0 || !token) return;

    const seatsToRelease = [...selectedSeats];
    const showId = selectedShow._id;

    await Promise.allSettled(
      seatsToRelease.map((seat) => releaseSeat(showId, seat))
    );

    setSelectedSeats([]);
    setBusySeats([]);
  }

  function switchAuthMode(mode, notice = "") {
    setAuthMode(mode);
    setAuthNotice(notice);
  }

  function handleLogin(newToken) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setAuthNotice("");
  }

  async function logout() {
    await releaseSelectedSeats();

    localStorage.removeItem("token");
    setToken(null);
    setAuthMode("login");
    setAuthNotice("You have been logged out.");

    setSelectedEvent(null);
    setEventShows([]);
    setSelectedShow(null);
    setSelectedSeats([]);
    setBookingMessage("");
    setBookingError("");
  }

  async function openShowtimes(event) {
    if (selectedEvent?._id === event._id) {
      await releaseSelectedSeats();
      setSelectedEvent(null);
      setEventShows([]);
      setSelectedShow(null);
      setShowsError("");
      setBookingMessage("");
      setBookingError("");
      return;
    }

    await releaseSelectedSeats();

    setSelectedEvent(event);
    setEventShows([]);
    setSelectedShow(null);
    setShowsError("");
    setBookingMessage("");
    setBookingError("");
    setShowsLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/shows/event/${event._id}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load showtimes.");
      }

      const showList = Array.isArray(data)
        ? data
        : Array.isArray(data.shows)
          ? data.shows
          : [];

      const now = Date.now();

      const upcomingShows = showList
        .filter(
          (show) =>
            show.status === "scheduled" &&
            new Date(show.startsAt).getTime() > now
        )
        .sort(
          (a, b) =>
            new Date(a.startsAt).getTime() -
            new Date(b.startsAt).getTime()
        );

      setEventShows(upcomingShows);
    } catch (error) {
      setShowsError(error.message || "Could not load showtimes.");
    } finally {
      setShowsLoading(false);
    }
  }

  async function toggleSeat(seatNumber) {
    if (!token) {
      setBookingError("Please log in before selecting seats.");
      return;
    }

    if (!selectedShow || busySeats.includes(seatNumber)) return;

    setBookingError("");
    setBookingMessage("");
    setBusySeats((previous) => [...previous, seatNumber]);

    try {
      const isSelected = selectedSeats.includes(seatNumber);

      if (isSelected) {
        await releaseSeat(selectedShow._id, seatNumber);

        setSelectedSeats((previous) =>
          previous.filter((seat) => seat !== seatNumber)
        );
      } else {
        const response = await fetch(`${API_URL}/api/seat-locks/lock`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            showId: selectedShow._id,
            seatNumber,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || `Seat ${seatNumber} is unavailable.`);
        }

        setSelectedSeats((previous) => [...previous, seatNumber]);
      }
    } catch (error) {
      setBookingError(error.message || "Could not update seat selection.");
    } finally {
      setBusySeats((previous) =>
        previous.filter((seat) => seat !== seatNumber)
      );
    }
  }

  async function continueBooking() {
    if (!token) {
      setBookingError("Please log in before booking.");
      return;
    }

    if (!selectedShow || selectedSeats.length === 0) {
      setBookingError("Please select a showtime and at least one seat.");
      return;
    }

    setActionLoading(true);
    setBookingError("");
    setBookingMessage("");

    try {
      const response = await fetch(`${API_URL}/api/bookings`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          showId: selectedShow._id,
          seats: selectedSeats,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not create booking.");
      }

      const booking = data.booking;

      setBookingMessage(
        `Booking created successfully!\n` +
        `Booking ID: ${booking.id || booking._id}\n` +
        `Seats: ${booking.seats.join(", ")}\n` +
        `Total: ₹${booking.totalAmount}\n` +
        `Payment status: ${booking.paymentStatus}`
      );

      setBookingError("");
      setSelectedSeats([]);
    } catch (error) {
      setBookingError(error.message || "Could not create booking.");
    } finally {
      setActionLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthPanel
        mode={authMode}
        onLogin={handleLogin}
        onSwitchMode={switchAuthMode}
        notice={authNotice}
      />
    );
  }

  return (
    <main className="app">
      <nav className="navbar">
        <a
          className="auth-brand"
          href="#home"
          onClick={(event) => {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          ShowNest<span>.</span>
        </a>

        <div className="nav-actions">
          <button
            className="secondary-button"
            onClick={() =>
              document
                .getElementById("events")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Explore events
          </button>

          <button className="secondary-button" onClick={logout}>
            Logout
          </button>
        </div>
      </nav>

      
<section className="hero" id="home">
  <div className="hero-background" />

  <div className="hero-content">
    <p className="eyebrow">YOUR NEXT EXPERIENCE STARTS HERE</p>

    <h1>
      Make plans.
      <br />
      Make memories.
    </h1>

    <p>
      Discover live shows, music, sports and movies around Indore.
      Choose your event, select your seats and get ready to go.
    </p>

    <button
      onClick={() =>
        document
          .getElementById("events")
          ?.scrollIntoView({ behavior: "smooth" })
      }
    >
      Explore events
    </button>
  </div>
</section>


      <section className="events-section" id="events">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FIND YOUR NEXT EXPERIENCE</p>
            <h2>Explore events</h2>
            <p>Find something worth stepping out for.</p>
          </div>

          <span>{filteredEvents.length} events</span>
        </div>

        <div className="filters">
          <input
            type="search"
            placeholder="Search events, venues or cities..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filter by category"
          >
            {categories.map((item) => (
              <option value={item} key={item}>
                {item === "All" ? "All categories" : item}
              </option>
            ))}
          </select>

          <button className="secondary-button" onClick={loadEvents}>
            Refresh
          </button>
        </div>

        {eventsLoading && <p>Loading events...</p>}

        {eventsError && (
          <div className="error">
            <p>{eventsError}</p>
            <button className="secondary-button" onClick={loadEvents}>
              Try again
            </button>
          </div>
        )}

        {!eventsLoading && !eventsError && filteredEvents.length === 0 && (
          <p>No events found. Try a different search or category.</p>
        )}

        <div className="event-grid">
          {filteredEvents.map((event) => {
            const isOpen = selectedEvent?._id === event._id;
            const categoryClass = `category-${String(
              event.category || "other"
            ).toLowerCase()}`;

            return (
              <div className="event-item" key={event._id}>
                
<article className="event-card">
  <div
    className={`event-visual category-${String(
      event.category || "other"
    ).toLowerCase()}`}
    style={
      event.posterUrl
        ? { backgroundImage: `url("${event.posterUrl}")` }
        : undefined
    }
  >
    <div className="event-visual-overlay" />

    <div className="event-visual-content">
      <span className="category-badge">
        {event.category || "Event"}
      </span>

      <h2>{event.title}</h2>

      <p>
        {[event.venue, event.city].filter(Boolean).join(" • ") ||
          "Discover something new"}
      </p>

      <strong>Starting at ₹{event.startingPrice ?? "—"}</strong>
    </div>
  </div>

  <div className="event-card-content">
    <p className="event-description">
      {event.description || "Discover this upcoming event."}
    </p>

    <button onClick={() => openShowtimes(event)}>
      {isOpen ? "Hide Showtimes" : "Explore Event"}
    </button>
  </div>
</article>


                {isOpen && (
                  <section className="inline-showtimes">
                    <h3>Choose a Showtime</h3>

                    {showsLoading ? (
                      <p>Loading showtimes...</p>
                    ) : showsError ? (
                      <div className="error">
                        <p>{showsError}</p>
                        <button
                          className="secondary-button"
                          onClick={() => openShowtimes(event)}
                        >
                          Try again
                        </button>
                      </div>
                    ) : eventShows.length === 0 ? (
                      <p>
                        No upcoming showtimes available. Please add future
                        scheduled shows for this event.
                      </p>
                    ) : (
                      <div className="show-list">
                        {eventShows.map((show) => (
                          <button
                            className={`show-card ${
                              selectedShow?._id === show._id ? "active" : ""
                            }`}
                            key={show._id}
                            onClick={() => {
                              setSelectedShow(show);
                              setSelectedSeats([]);
                              setBookingMessage("");
                              setBookingError("");
                            }}
                          >
                            <strong>{formatDate(show.startsAt)}</strong>
                            <span>{formatTime(show.startsAt)}</span>
                            <span>{show.venue || event.venue}</span>
                            <strong>₹{show.pricePerSeat} / seat</strong>
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedShow && (
                      <div className="seat-section">
                        <h3>Select your seats</h3>

                        <p>
                          {formatDate(selectedShow.startsAt)} at{" "}
                          {formatTime(selectedShow.startsAt)}
                        </p>

                        <div className="screen-label">SCREEN / STAGE</div>

                        <div className="seat-legend">
                          <span>
                            <i className="legend-available" /> Available
                          </span>
                          <span>
                            <i className="legend-selected" /> Selected
                          </span>
                        </div>

                        <div className="seat-grid">
                          {Array.from(
                            {
                              length: Math.min(
                                Math.max(
                                  Number(selectedShow.totalSeats) || 40,
                                  1
                                ),
                                40
                              ),
                            },
                            (_, index) => `S${index + 1}`
                          ).map((seat) => {
                            const isSelected = selectedSeats.includes(seat);
                            const isBusy = busySeats.includes(seat);

                            return (
                              <button
                                type="button"
                                key={seat}
                                className={`seat ${
                                  isSelected ? "selected" : ""
                                }`}
                                disabled={isBusy}
                                onClick={() => toggleSeat(seat)}
                                aria-pressed={isSelected}
                                title={seat}
                              >
                                {isBusy ? "..." : seat}
                              </button>
                            );
                          })}
                        </div>

                        <div className="booking-summary">
                          <p>
                            Selected seats:{" "}
                            {selectedSeats.length
                              ? selectedSeats.join(", ")
                              : "None"}
                          </p>

                          <p>
                            Total: ₹
                            {selectedSeats.length *
                              (Number(selectedShow.pricePerSeat) || 0)}
                          </p>

                          <button
                            onClick={continueBooking}
                            disabled={
                              actionLoading || selectedSeats.length === 0
                            }
                          >
                            {actionLoading
                              ? "Creating booking..."
                              : "Continue to Booking"}
                          </button>
                        </div>

                        {bookingError && (
                          <p
                            className="booking-feedback error"
                            role="alert"
                          >
                            {bookingError}
                          </p>
                        )}

                        {bookingMessage && (
                          <div
                            className="booking-feedback booking-success"
                            role="status"
                          >
                            <h3>Booking Created!</h3>
                            <p>{bookingMessage}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <footer className="app-footer">
        <p>ShowNest. — Discover more. Experience more.</p>
      </footer>
    </main>
  );
}

export default App;
