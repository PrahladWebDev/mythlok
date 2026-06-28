import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, ZoomControl, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { INDIAN_STATES } from '../assets/data/states';
import api from '../utils/api';
import './MapPage.css';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom gold marker icon for state totals
const createStateIcon = (count = 0) => {
  const size = Math.min(40, Math.max(20, 20 + count * 1.5));
  return L.divIcon({
    className: 'map-custom-icon',
    html: `<div class="map-marker" style="width:${size}px;height:${size}px;font-size:${Math.max(9, size / 3.5)}px">
             <span>${count || '?'}</span>
           </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Fly-to helper component
const FlyTo = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 9, { duration: 1.2 });
  }, [target, map]);
  return null;
};

const MapPage = () => {
  const [stateStats, setStateStats] = useState({});
  const [selectedState, setSelectedState] = useState(null);
  const [stateStories, setStateStories] = useState([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Stories with precise coordinates for individual pins
  const [pinnedStories, setPinnedStories] = useState([]);
  const [showPins, setShowPins] = useState(true);
  const [flyTarget, setFlyTarget] = useState(null);

  useEffect(() => {
    api.get('/states/stats').then(r => {
      const map = {};
      r.data.data.forEach(s => { map[s._id] = s; });
      setStateStats(map);
    }).catch(() => {});

    // Fetch approved stories that have a real coordinate (not [0,0])
    api.get('/stories', {
      params: { status: 'approved', limit: 500, sort: '-createdAt' },
    }).then(r => {
      const stories = r.data.data || [];
      const withCoords = stories.filter(s => {
        const coords = s.location?.coordinates;
        return Array.isArray(coords)
          && coords.length === 2
          && (coords[0] !== 0 || coords[1] !== 0)
          && !isNaN(coords[0]) && !isNaN(coords[1]);
      });
      setPinnedStories(withCoords);
    }).catch(() => {});
  }, []);

  const handleStateClick = async (state) => {
    setSelectedState(state);
    setFlyTarget([state.lat, state.lng]);
    setLoadingStories(true);
    try {
      const res = await api.get(`/states/${encodeURIComponent(state.name)}`);
      setStateStories(res.data.data.stories || []);
    } catch (_) {
      setStateStories([]);
    }
    setLoadingStories(false);
  };

  const filteredStates = INDIAN_STATES.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="map-page">
      <div className="map-page__header">
        <div className="container">
          <p className="section-eyebrow">Interactive</p>
          <h1 className="map-page__title">India Folklore Map</h1>
          <p className="map-page__subtitle">
            Click any state to explore its myths, ghosts, and legends.
            {pinnedStories.length > 0 && (
              <> Golden pins mark {pinnedStories.length} story
              {pinnedStories.length !== 1 ? 'locations' : ' location'} with precise coordinates.</>
            )}
          </p>
        </div>
      </div>

      <div className="map-page__layout">
        {/* Map */}
        <div className="map-page__map-wrap">
          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            className="map-page__map"
            zoomControl={false}
            minZoom={4}
            maxZoom={15}
          >
            <ZoomControl position="bottomright" />
            <FlyTo target={flyTarget} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* State-level markers */}
            {filteredStates.map(state => {
              const stats = stateStats[state.name];
              const count = stats?.storyCount || 0;
              return (
                <Marker
                  key={state.code}
                  position={[state.lat, state.lng]}
                  icon={createStateIcon(count)}
                  eventHandlers={{ click: () => handleStateClick(state) }}
                >
                  <Popup className="map-popup">
                    <div className="map-popup__content">
                      <h4 className="map-popup__state">{state.name}</h4>
                      <p className="map-popup__count">{count} stories</p>
                      {stats?.totalViews > 0 && (
                        <p className="map-popup__views">{stats.totalViews.toLocaleString()} total views</p>
                      )}
                      <Link
                        to={`/states/${encodeURIComponent(state.name)}`}
                        className="map-popup__link"
                      >
                        Explore {state.name} →
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Per-story CircleMarker pins */}
            {showPins && pinnedStories.map(story => {
              const [lng, lat] = story.location.coordinates;
              return (
                <CircleMarker
                  key={story._id}
                  center={[lat, lng]}
                  radius={7}
                  pathOptions={{
                    color: '#d4af37',
                    fillColor: '#d4af37',
                    fillOpacity: 0.85,
                    weight: 1.5,
                  }}
                >
                  <Popup className="map-popup">
                    <div className="map-popup__content">
                      {story.coverImage?.url && (
                        <div
                          style={{
                            width: '100%', height: '80px',
                            backgroundImage: `url(${story.coverImage.url})`,
                            backgroundSize: 'cover', backgroundPosition: 'center',
                            borderRadius: '4px', marginBottom: '0.5rem',
                          }}
                        />
                      )}
                      <p style={{ fontSize: '0.7rem', color: 'var(--muted)', margin: '0 0 0.2rem' }}>
                        {story.category?.icon} {story.category?.name} · {story.state}
                      </p>
                      <h4 className="map-popup__state" style={{ fontSize: '0.9rem' }}>{story.title}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--ash-2)', margin: '0.25rem 0' }}>
                        ★ {story.averageRating?.toFixed(1) || 'N/A'} · {story.views || 0} views
                      </p>
                      <Link to={`/stories/${story.slug}`} className="map-popup__link">
                        Read story →
                      </Link>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>

          {/* Map Legend */}
          <div className="map-legend">
            <h4>Map Legend</h4>
            <div className="map-legend__items">
              <div className="map-legend__item"><div className="map-legend__dot map-legend__dot--sm" />1–10 stories</div>
              <div className="map-legend__item"><div className="map-legend__dot map-legend__dot--md" />11–30 stories</div>
              <div className="map-legend__item"><div className="map-legend__dot map-legend__dot--lg" />31+ stories</div>
            </div>
            {pinnedStories.length > 0 && (
              <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.6rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--ash-2)' }}>
                  <input
                    type="checkbox"
                    checked={showPins}
                    onChange={e => setShowPins(e.target.checked)}
                    style={{ accentColor: 'var(--gold)' }}
                  />
                  Show {pinnedStories.length} story pins
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="map-page__sidebar">
          {/* Search states */}
          <div className="map-sidebar__search">
            <input
              className="form-input"
              placeholder="Search states…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* State list */}
          {!selectedState ? (
            <div className="map-sidebar__state-list">
              <p className="map-sidebar__hint">Click a state on the map or select below</p>
              {filteredStates.map(state => {
                const count = stateStats[state.name]?.storyCount || 0;
                return (
                  <button
                    key={state.code}
                    className="map-sidebar__state-item"
                    onClick={() => handleStateClick(state)}
                  >
                    <span className="map-sidebar__state-name">{state.name}</span>
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
                  onClick={() => { setSelectedState(null); setStateStories([]); setFlyTarget(null); }}
                >
                  ← All States
                </button>
                <h2 className="map-sidebar__state-title">{selectedState.name}</h2>
                <p className="map-sidebar__state-stat">
                  {stateStats[selectedState.name]?.storyCount || 0} stories
                  {stateStats[selectedState.name]?.totalViews > 0 &&
                    ` · ${stateStats[selectedState.name].totalViews.toLocaleString()} views`
                  }
                </p>
                <Link
                  to={`/states/${encodeURIComponent(selectedState.name)}`}
                  className="btn btn-gold btn-sm btn-full"
                  style={{ marginTop: '0.75rem' }}
                >
                  Explore Full Page →
                </Link>
              </div>

              <hr className="divider" style={{ margin: '1rem 0' }} />

              {loadingStories ? (
                <div className="spinner" />
              ) : stateStories.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem 0' }}>
                  <div className="icon">🌑</div>
                  <h3>No stories yet</h3>
                  <p>Be the first to share a legend from {selectedState.name}!</p>
                </div>
              ) : (
                <div className="map-sidebar__stories">
                  {stateStories.slice(0, 8).map(story => (
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
                        <p className="map-story-item__cat">
                          {story.category?.icon} {story.category?.name}
                        </p>
                        <h4 className="map-story-item__title">{story.title}</h4>
                        <p className="map-story-item__meta">
                          {story.location?.coordinates &&
                           (story.location.coordinates[0] !== 0 || story.location.coordinates[1] !== 0)
                            ? '📍 ' : ''}
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
