"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function CitySelect({ label, value, cities, onChange, disabled }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        {cities.map((city) => (
          <option key={city.code} value={city.code}>
            {city.name} ({city.code})
          </option>
        ))}
      </select>
    </label>
  );
}

export default function Home() {
  const [cities, setCities] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [from, setFrom] = useState("PAR");
  const [to, setTo] = useState("ROM");
  const [maxStops, setMaxStops] = useState(2);
  const [routes, setRoutes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedCity, setSelectedCity] = useState("PAR");
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [loadingHubs, setLoadingHubs] = useState(true);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [citiesResponse, hubsResponse] = await Promise.all([
          fetch("/api/cities"),
          fetch("/api/hubs"),
        ]);
        const citiesData = await citiesResponse.json();
        const hubsData = await hubsResponse.json();

        if (!citiesData.success || !hubsData.success) throw new Error("Unable to load travel data");
        setCities(citiesData.data);
        setHubs(hubsData.data);
      } catch {
        setError("We could not load the airport list. Please check your connection and try again.");
      } finally {
        setLoadingCities(false);
        setLoadingHubs(false);
      }
    }

    loadInitialData();
  }, []);

  async function findRoutes() {
    if (!from || !to || from === to) {
      setError("Choose two different cities to search.");
      return;
    }

    setLoadingRoutes(true);
    setRoutes([]);
    setError(null);
    try {
      const response = await fetch(`/api/routes?from=${from}&to=${to}&maxStops=${maxStops}`);
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error);
      setRoutes(data.data);
    } catch {
      setError("We could not find a route right now. Please try again.");
    } finally {
      setLoadingRoutes(false);
    }
  }

  async function loadConnections(code) {
    setSelectedCity(code);
    setLoadingConnections(true);
    try {
      const response = await fetch(`/api/search?code=${code}`);
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error);
      setConnections(data.data);
    } catch {
      setConnections([]);
    } finally {
      setLoadingConnections(false);
    }
  }

  function swapCities() {
    setFrom(to);
    setTo(from);
  }

  const selectedCityName = cities.find((city) => city.code === selectedCity)?.name || selectedCity;

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Wayfare home">
          <Image
            className="brand-logo"
            src="/Wayfare%20logo.png"
            alt="Wayfare"
            width={190}
            height={58}
            priority
          />
        </Link>
        <span className="topbar-note">Your next connection starts here</span>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Plan a better way</p>
          <h1>Go further,<br /><em>beautifully.</em></h1>
          <p className="hero-text">Compare city-to-city journeys and find the right balance of time, stops, and fare.</p>
        </div>

        <div className="search-ticket">
          <div className="ticket-heading">
            <div><span className="eyebrow">Journey search</span><h2>Where are you going?</h2></div>
            <span className="ticket-code">WF / 01</span>
          </div>
          <div className="route-fields">
            <CitySelect label="Leaving from" value={from} cities={cities} onChange={setFrom} disabled={loadingCities} />
            <button className="swap-button" type="button" onClick={swapCities} aria-label="Swap departure and arrival cities" title="Swap cities">&#8646;</button>
            <CitySelect label="Arriving at" value={to} cities={cities} onChange={setTo} disabled={loadingCities} />
          </div>
          <div className="ticket-bottom">
            <label className="stops-control"><span className="field-label">Maximum stops</span><select value={maxStops} onChange={(event) => setMaxStops(Number(event.target.value))}><option value={0}>Direct only</option><option value={1}>Up to 1 stop</option><option value={2}>Up to 2 stops</option><option value={3}>Up to 3 stops</option></select></label>
            <button className="primary-button" type="button" onClick={findRoutes} disabled={loadingRoutes || loadingCities}>{loadingRoutes ? "Finding journeys..." : "Find journeys"}<span aria-hidden="true">&#8594;</span></button>
          </div>
        </div>
      </section>

      {error && <div className="alert" role="alert">{error}</div>}

      <section className="content-grid">
        <div className="journeys-panel">
          <div className="section-heading"><div><p className="eyebrow">Suggested itineraries</p><h2>{from} <span>&rarr;</span> {to}</h2></div>{routes.length > 0 && <span className="result-count">{routes.length} options</span>}</div>
          {loadingRoutes && <div className="empty-state"><span className="loader" />Looking for your best journey...</div>}
          {!loadingRoutes && routes.length === 0 && <div className="empty-state">Choose your cities above to see available journeys.</div>}
          {!loadingRoutes && routes.length > 0 && <div className="journey-list">{routes.map((route, index) => <article className="journey-card" key={`${route.cityNames.join("-")}-${index}`}><div className="journey-main"><div className="route-line">{route.cityNames.map((city, cityIndex) => <span key={`${city}-${cityIndex}`} className="route-city">{cityIndex > 0 && <span className="route-arrow">&#8594;</span>}{city}</span>)}</div><div className="journey-meta"><span>{route.modes.join(" + ")}</span><span>{route.stops - 1} stop{route.stops - 1 === 1 ? "" : "s"}</span></div></div><div className="journey-stats"><div><span className="stat-label">Duration</span><strong>{Number(route.totalDuration).toFixed(1)}h</strong></div><div><span className="stat-label">From</span><strong>{inr.format(Number(route.totalPrice) * 83)}</strong></div></div></article>)}</div>}
        </div>

        <aside className="side-column">
          <section className="side-panel"><div className="section-heading compact"><div><p className="eyebrow">Most connected</p><h2>City hubs</h2></div><span className="panel-symbol">+</span></div>{loadingHubs ? <div className="small-empty">Loading cities...</div> : hubs.map((hub, index) => <div className="hub-row" key={hub.code}><span className="hub-rank">0{index + 1}</span><div><strong>{hub.city}</strong><span>{hub.country}</span></div><b>{hub.connections}</b></div>)}</section>
          <section className="side-panel connections-panel"><div className="section-heading compact"><div><p className="eyebrow">At a glance</p><h2>Connections</h2></div></div><select className="wide-select" value={selectedCity} onChange={(event) => loadConnections(event.target.value)} disabled={loadingCities}>{cities.map((city) => <option key={city.code} value={city.code}>{city.name} ({city.code})</option>)}</select><p className="connection-caption">Leaving {selectedCityName}</p>{loadingConnections ? <div className="small-empty">Loading connections...</div> : connections.length === 0 ? <div className="small-empty">Select a city to explore.</div> : <div className="connection-list">{connections.slice(0, 5).map((connection, index) => <div className="connection-row" key={`${connection.code}-${index}`}><div><strong>{connection.city}</strong><span>{connection.mode}{connection.airline ? ` / ${connection.airline}` : ""}</span></div><div className="connection-price"><strong>{Number(connection.duration).toFixed(1)}h</strong><span>{inr.format(Number(connection.price) * 83)}</span></div></div>)}</div>}</section>
        </aside>
      </section>

      <footer className="footer"><span>wayfare</span><span>Make the journey part of the destination.</span></footer>
    </main>
  );
}
