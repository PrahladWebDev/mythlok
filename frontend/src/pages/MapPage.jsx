import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { COUNTRIES } from '../assets/data/countries';
import api from '../utils/api';
import './MapPage.css';

const MapPage = () => {
  const [countryStats, setCountryStats] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [countryStories, setCountryStories] = useState([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.get('/countries/stats').then(r => {
      const map = {};
      r.data.data.forEach(c => { map[c._id] = c; });
      setCountryStats(map);
    }).catch(() => {});
  }, []);

  const handleCountryClick = async (country) => {
    setSelectedCountry(country);
    setLoadingStories(true);
    try {
      const res = await api.get(`/countries/${encodeURIComponent(country.name)}`);
      setCountryStories(res.data.data.stories || []);
    } catch (_) {
      setCountryStories([]);
    }
    setLoadingStories(false);
  };

  const filteredCountries = useMemo(() => (
    COUNTRIES.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
  ), [searchQuery]);

  const maxCount = useMemo(() => (
    Math.max(1, ...Object.values(countryStats).map(s => s.storyCount || 0))
  ), [countryStats]);

  return (
    <div className="map-page">
      <div className="map-page__header">
        <div className="container">
          <p className="section-eyebrow">Interactive</p>
          <h1 className="map-page__title">World Folklore Map</h1>
          <p className="map-page__subtitle">
            Click any country to explore its myths, ghosts, and legends.
          </p>
        </div>
      </div>

      <div className="map-page__layout">
        {/* Country grid (no geo coordinates — purely country-wise) */}
        <div className="map-page__map-wrap">
          <div className="map-country-grid">
            {filteredCountries.map(country => {
              const stats = countryStats[country.name];
              const count = stats?.storyCount || 0;
              const intensity = Math.min(1, count / maxCount);
              return (
                <button
                  key={country.code}
                  className={`map-country-tile ${selectedCountry?.code === country.code ? 'map-country-tile--active' : ''}`}
                  style={{ '--intensity': intensity }}
                  onClick={() => handleCountryClick(country)}
                >
                  <span className="map-country-tile__emoji">{country.emoji}</span>
                  <span className="map-country-tile__name">{country.name}</span>
                  <span className="map-country-tile__count">{count} {count === 1 ? 'tale' : 'tales'}</span>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="map-legend">
            <h4>Map Legend</h4>
            <div className="map-legend__items">
              <div className="map-legend__item"><div className="map-legend__dot map-legend__dot--sm" />1–10 stories</div>
              <div className="map-legend__item"><div className="map-legend__dot map-legend__dot--md" />11–30 stories</div>
              <div className="map-legend__item"><div className="map-legend__dot map-legend__dot--lg" />31+ stories</div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="map-page__sidebar">
          {/* Search countries */}
          <div className="map-sidebar__search">
            <input
              className="form-input"
              placeholder="Search countries…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Country list */}
          {!selectedCountry ? (
            <div className="map-sidebar__state-list">
              <p className="map-sidebar__hint">Click a country on the grid or select below</p>
              {filteredCountries.map(country => {
                const count = countryStats[country.name]?.storyCount || 0;
                return (
                  <button
                    key={country.code}
                    className="map-sidebar__state-item"
                    onClick={() => handleCountryClick(country)}
                  >
                    <span className="map-sidebar__state-name">{country.emoji} {country.name}</span>
                    <span className="map-sidebar__state-count">{count} tales</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="map-sidebar__state-detail">
              <div className="map-sidebar__detail-header">
                <button
                  className="map-sidebar__back"
                  onClick={() => { setSelectedCountry(null); setCountryStories([]); }}
                >
                  ← All Countries
                </button>
                <h2 className="map-sidebar__state-title">{selectedCountry.emoji} {selectedCountry.name}</h2>
                <p className="map-sidebar__state-stat">
                  {countryStats[selectedCountry.name]?.storyCount || 0} stories
                  {countryStats[selectedCountry.name]?.totalViews > 0 &&
                    ` · ${countryStats[selectedCountry.name].totalViews.toLocaleString()} views`
                  }
                </p>
                <Link
                  to={`/countries/${encodeURIComponent(selectedCountry.name)}`}
                  className="btn btn-gold btn-sm btn-full"
                  style={{ marginTop: '0.75rem' }}
                >
                  Explore Full Page →
                </Link>
              </div>

              <hr className="divider" style={{ margin: '1rem 0' }} />

              {loadingStories ? (
                <div className="spinner" />
              ) : countryStories.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem 0' }}>
                  <div className="icon">🌑</div>
                  <h3>No stories yet</h3>
                  <p>Be the first to share a legend from {selectedCountry.name}!</p>
                </div>
              ) : (
                <div className="map-sidebar__stories">
                  {countryStories.slice(0, 8).map(story => (
                    <Link
                      key={story._id}
                      to={`/stories/${story.slug}`}
                      className="map-story-item"
                    >
                      <div
                        className="map-story-item__img"
                        style={{
                          backgroundImage: story.coverImage?.url
                            ? `url(${story.coverImage.url})`
                            : 'linear-gradient(135deg, var(--surface), var(--surface-2))'
                        }}
                      />
                      <div className="map-story-item__info">
                        <h4 className="map-story-item__title">{story.title}</h4>
                        <p className="map-story-item__meta">
                          ★ {story.averageRating?.toFixed(1) || 'N/A'} · {story.views || 0} views
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default MapPage;
