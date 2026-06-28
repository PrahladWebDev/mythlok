import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import StoryCard from '../components/story/StoryCard';
import api from '../utils/api';
import { INDIAN_STATES } from '../assets/data/states';
import './Explore.css';

const CATEGORIES = [
  { slug: 'ghost-stories', name: 'Ghost Stories', icon: '👻' },
  { slug: 'mythological-creatures', name: 'Mythological Creatures', icon: '🐉' },
  { slug: 'tribal-legends', name: 'Tribal Legends', icon: '🪘' },
  { slug: 'sacred-places', name: 'Sacred Places', icon: '🛕' },
  { slug: 'folk-tales', name: 'Folk Tales', icon: '📜' },
  { slug: 'demigods-heroes', name: 'Demigods & Heroes', icon: '⚔️' },
  { slug: 'nature-spirits', name: 'Nature Spirits', icon: '🌿' },
  { slug: 'cursed-places', name: 'Cursed Places', icon: '⛓️' },
];

const SORTS = [
  { value: '-createdAt',     label: 'Newest' },
  { value: '-views',         label: 'Most Viewed' },
  { value: '-averageRating', label: 'Highest Rated' },
  { value: 'title',          label: 'A–Z' },
];

const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stories, setStories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  const search   = searchParams.get('search')   || '';
  const state    = searchParams.get('state')     || '';
  const category = searchParams.get('category') || '';
  const sort     = searchParams.get('sort')      || '-createdAt';
  const page     = Number(searchParams.get('page') || 1);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const fetchStories = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, sort };
      if (search) params.search = search;
      if (state) params.state = state;
      if (category) {
        // find category id by slug
        const cat = categories.find(c => c.slug === category);
        if (cat) params.category = cat._id;
      }
      const res = await api.get('/stories', { params });
      setStories(res.data.data);
      setPagination(res.data.pagination);
    } catch (_) {
      setStories([]);
    }
    setLoading(false);
  }, [search, state, category, sort, page, categories]);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const setPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', p);
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => setSearchParams({});

  const hasFilters = search || state || category || sort !== '-createdAt';

  return (
    <div className="explore">
      {/* Top bar */}
      <div className="explore__topbar">
        <div className="container">
          <h1 className="explore__title">Explore Stories</h1>
          <p className="explore__subtitle">
            {pagination ? `${pagination.total.toLocaleString()} stories from across India` : 'Searching the archives…'}
          </p>
        </div>
      </div>

      <div className="container">
        <div className="explore__layout">
          {/* Sidebar Filters */}
          <aside className="explore__sidebar">
            <div className="explore__filter-section">
              <div className="explore__filter-header">
                <h3>Filters</h3>
                {hasFilters && (
                  <button className="explore__clear-btn" onClick={clearFilters}>Clear all</button>
                )}
              </div>

              {/* Search */}
              <div className="explore__filter-group">
                <label className="form-label">Search</label>
                <input
                  className="form-input"
                  placeholder="Title, creature, place…"
                  value={search}
                  onChange={e => updateParam('search', e.target.value)}
                />
              </div>

              {/* Sort */}
              <div className="explore__filter-group">
                <label className="form-label">Sort By</label>
                <select className="form-select" value={sort} onChange={e => updateParam('sort', e.target.value)}>
                  {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              {/* State */}
              <div className="explore__filter-group">
                <label className="form-label">State</label>
                <select className="form-select" value={state} onChange={e => updateParam('state', e.target.value)}>
                  <option value="">All States</option>
                  {INDIAN_STATES.map(s => (
                    <option key={s.code} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="explore__filter-group">
                <label className="form-label">Category</label>
                <div className="explore__cat-list">
                  <button
                    className={`explore__cat-btn ${!category ? 'explore__cat-btn--active' : ''}`}
                    onClick={() => updateParam('category', '')}
                  >All</button>
                  {CATEGORIES.map(c => (
                    <button
                      key={c.slug}
                      className={`explore__cat-btn ${category === c.slug ? 'explore__cat-btn--active' : ''}`}
                      onClick={() => updateParam('category', category === c.slug ? '' : c.slug)}
                    >
                      {c.icon} {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Results */}
          <main className="explore__results">
            {/* Active filters */}
            {hasFilters && (
              <div className="explore__active-filters">
                {search   && <span className="explore__filter-chip">🔍 "{search}" <button onClick={() => updateParam('search', '')}>✕</button></span>}
                {state    && <span className="explore__filter-chip">📍 {state} <button onClick={() => updateParam('state', '')}>✕</button></span>}
                {category && <span className="explore__filter-chip">🏷 {CATEGORIES.find(c => c.slug === category)?.name || category} <button onClick={() => updateParam('category', '')}>✕</button></span>}
              </div>
            )}

            {loading ? (
              <div className="loading-screen">
                <div className="spinner" />
                <p>Searching the archives…</p>
              </div>
            ) : stories.length === 0 ? (
              <div className="empty-state">
                <div className="icon">🌑</div>
                <h3>No stories found</h3>
                <p>Try adjusting your filters or search for something else.</p>
                <button className="btn btn-gold" style={{ margin: '1rem auto 0' }} onClick={clearFilters}>Clear Filters</button>
              </div>
            ) : (
              <>
                <div className="explore__grid">
                  {stories.map(s => <StoryCard key={s._id} story={s} />)}
                </div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="explore__pagination">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >← Prev</button>
                    <div className="explore__page-nums">
                      {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
                        const p = i + 1;
                        return (
                          <button
                            key={p}
                            className={`explore__page-num ${p === page ? 'explore__page-num--active' : ''}`}
                            onClick={() => setPage(p)}
                          >{p}</button>
                        );
                      })}
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= pagination.pages}
                    >Next →</button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Explore;
