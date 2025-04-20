'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { COMMON_PROGRESSIONS } from './constants';
import { getAllKeys } from './progressionUtils';
import {
  filterProgressions,
  getUniqueGenres,
  getUniqueMoods,
  getUniqueComplexities,
  DEFAULT_FILTERS,
  type ProgressionFilters
} from './filterUtils';
import ProgressionCard from './ProgressionCard';
import ProgressionBuilder from './ProgressionBuilder';
import styles from './progressions.module.css';

export default function ProgressionsPage() {
  const [activeTab, setActiveTab] = useState<'browse' | 'builder'>('browse');
  const [filters, setFilters] = useState<ProgressionFilters>(DEFAULT_FILTERS);
  const [selectedKey, setSelectedKey] = useState('C');
  const [selectedMode, setSelectedMode] = useState<'major' | 'minor'>('major');

  // Get filter options
  const genres = useMemo(() => getUniqueGenres(COMMON_PROGRESSIONS), []);
  const moods = useMemo(() => getUniqueMoods(COMMON_PROGRESSIONS), []);
  const complexities = useMemo(() => getUniqueComplexities(), []);
  const keys = useMemo(() => getAllKeys(), []);

  // Filter progressions based on current filters
  const filteredProgressions = useMemo(
    () => filterProgressions(COMMON_PROGRESSIONS, filters),
    [filters]
  );

  // Filter by mode compatibility
  const compatibleProgressions = useMemo(
    () => filteredProgressions.filter(p => p.modes.includes(selectedMode)),
    [filteredProgressions, selectedMode]
  );

  const updateFilter = <K extends keyof ProgressionFilters>(
    key: K,
    value: ProgressionFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <div className="min-h-screen p-8 pb-20">
      <main className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Chord Progressions</h1>
          <Link href="/" className={styles.backButton}>
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M19 12H5M12 19l-7-7 7-7" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'browse' ? styles.active : ''}`}
            onClick={() => setActiveTab('browse')}
          >
            Browse Progressions
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'builder' ? styles.active : ''}`}
            onClick={() => setActiveTab('builder')}
          >
            Custom Builder
          </button>
        </div>

        {/* Key and Mode Selection (shared between tabs) */}
        <div className={styles.filters}>
          <div className={styles.filterGrid}>
            <div className={styles.filterGroup}>
              <label htmlFor="key-select" className={styles.filterLabel}>
                Key
              </label>
              <select
                id="key-select"
                className={styles.filterSelect}
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
              >
                {keys.map(key => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="mode-select" className={styles.filterLabel}>
                Mode
              </label>
              <select
                id="mode-select"
                className={styles.filterSelect}
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value as 'major' | 'minor')}
              >
                <option value="major">Major</option>
                <option value="minor">Minor</option>
              </select>
            </div>
          </div>
        </div>

        {/* Browse Tab */}
        {activeTab === 'browse' && (
          <>
            {/* Filters */}
            <div className={styles.filters}>
              <div className={styles.filterGrid}>
                <div className={styles.filterGroup}>
                  <label htmlFor="search" className={styles.filterLabel}>
                    Search
                  </label>
                  <input
                    id="search"
                    type="text"
                    className={styles.filterInput}
                    placeholder="Search progressions..."
                    value={filters.searchQuery}
                    onChange={(e) => updateFilter('searchQuery', e.target.value)}
                  />
                </div>

                <div className={styles.filterGroup}>
                  <label htmlFor="genre" className={styles.filterLabel}>
                    Genre
                  </label>
                  <select
                    id="genre"
                    className={styles.filterSelect}
                    value={filters.genre}
                    onChange={(e) => updateFilter('genre', e.target.value)}
                  >
                    <option value="all">All Genres</option>
                    {genres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label htmlFor="mood" className={styles.filterLabel}>
                    Mood
                  </label>
                  <select
                    id="mood"
                    className={styles.filterSelect}
                    value={filters.mood}
                    onChange={(e) => updateFilter('mood', e.target.value)}
                  >
                    <option value="all">All Moods</option>
                    {moods.map(mood => (
                      <option key={mood} value={mood}>{mood}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label htmlFor="complexity" className={styles.filterLabel}>
                    Complexity
                  </label>
                  <select
                    id="complexity"
                    className={styles.filterSelect}
                    value={filters.complexity}
                    onChange={(e) => updateFilter('complexity', e.target.value)}
                  >
                    <option value="all">All Levels</option>
                    {complexities.map(complexity => (
                      <option key={complexity.value} value={complexity.value}>
                        {complexity.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label htmlFor="min-length" className={styles.filterLabel}>
                    Min Length
                  </label>
                  <input
                    id="min-length"
                    type="number"
                    className={styles.filterInput}
                    min="2"
                    max="12"
                    placeholder="Min"
                    value={filters.minLength || ''}
                    onChange={(e) => updateFilter('minLength', e.target.value ? Number(e.target.value) : null)}
                  />
                </div>

                <div className={styles.filterGroup}>
                  <label htmlFor="max-length" className={styles.filterLabel}>
                    Max Length
                  </label>
                  <input
                    id="max-length"
                    type="number"
                    className={styles.filterInput}
                    min="2"
                    max="12"
                    placeholder="Max"
                    value={filters.maxLength || ''}
                    onChange={(e) => updateFilter('maxLength', e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
              </div>

              <div className={styles.filterStats}>
                Showing {compatibleProgressions.length} of {COMMON_PROGRESSIONS.length} progressions
                {compatibleProgressions.length !== filteredProgressions.length && (
                  <span> ({filteredProgressions.length - compatibleProgressions.length} filtered by mode)</span>
                )}
                {(filters.searchQuery || filters.genre !== 'all' || filters.mood !== 'all' || 
                  filters.complexity !== 'all' || filters.minLength || filters.maxLength) && (
                  <button
                    onClick={handleResetFilters}
                    style={{
                      marginLeft: '1rem',
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* Progressions List */}
            <div>
              {compatibleProgressions.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '3rem', 
                  color: 'rgba(0, 0, 0, 0.4)',
                  fontSize: '1.125rem'
                }}>
                  No progressions found matching your criteria. Try adjusting the filters.
                </div>
              ) : (
                compatibleProgressions.map(progression => (
                  <ProgressionCard
                    key={progression.id}
                    progression={progression}
                    selectedKey={selectedKey}
                    mode={selectedMode}
                    onGenreClick={(genre) => updateFilter('genre', genre)}
                    onComplexityClick={(complexity) => updateFilter('complexity', complexity)}
                  />
                ))
              )}
            </div>
          </>
        )}

        {/* Builder Tab */}
        {activeTab === 'builder' && (
          <ProgressionBuilder
            selectedKey={selectedKey}
            mode={selectedMode}
          />
        )}
      </main>
    </div>
  );
}
