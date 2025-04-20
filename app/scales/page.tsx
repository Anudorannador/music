'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { getAllScales } from './scaleUtils';
import { 
  filterScales, 
  DEFAULT_FILTERS,
  getUniqueTonics,
  getUniqueScaleTypes,
  getUniqueNoteCounts,
  getUniqueFamilies,
  type ScaleFilters,
} from './filterUtils';
import ScalesList from './ScalesList';
import styles from './scales.module.css';

export default function ScalesPage() {
  const [filters, setFilters] = useState<ScaleFilters>(DEFAULT_FILTERS);
  const [allScales, setAllScales] = useState<ReturnType<typeof getAllScales>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [useColors, setUseColors] = useState(true); // Color mode toggle - default ON
  const [showPlayedNotes, setShowPlayedNotes] = useState<boolean>(false); // Show played notes toggle - default OFF

  // Load all scales on mount
  useEffect(() => {
    setIsLoading(true);
    try {
      const scales = getAllScales();
      setAllScales(scales);
    } catch (error) {
      console.error('Error loading scales:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter options
  const tonics = useMemo(() => getUniqueTonics(allScales), [allScales]);
  const scaleTypes = useMemo(() => getUniqueScaleTypes(allScales), [allScales]);
  const noteCounts = useMemo(() => getUniqueNoteCounts(allScales), [allScales]);
  const families = useMemo(() => getUniqueFamilies(allScales), [allScales]);

  // Filtered scales
  const filteredScales = useMemo(
    () => filterScales(allScales, filters),
    [allScales, filters]
  );

  const updateFilter = <K extends keyof ScaleFilters>(
    key: K,
    value: ScaleFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 items-center">
        {/* Header: Title on the left, Back to Home on the right */}
        <div className="w-full max-w-[1400px] flex items-center justify-between gap-4">
          <h1 className="text-4xl font-bold tracking-tight">Musical Scales</h1>
          <Link
            href="/"
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm h-10 px-4 gap-2"
            aria-label="Back to Home"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M19 12H5M5 12L12 19M5 12L12 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Filters */}
        <div className={styles.container}>
          <div className={styles.filtersSection}>
            <div className={styles.filterRow}>
              {/* Root/Tonic Filter */}
              <div className={styles.filterGroup}>
                <label htmlFor="tonic-filter" className={styles.filterLabel}>
                  Root Note
                </label>
                <select
                  id="tonic-filter"
                  className={styles.filterSelect}
                  value={filters.tonic}
                  onChange={(e) => updateFilter('tonic', e.target.value)}
                >
                  <option value="all">All Notes</option>
                  {tonics.map(tonic => (
                    <option key={tonic} value={tonic}>{tonic}</option>
                  ))}
                </select>
              </div>

              {/* Family Filter */}
              <div className={styles.filterGroup}>
                <label htmlFor="family-filter" className={styles.filterLabel}>
                  Scale Family
                </label>
                <select
                  id="family-filter"
                  className={styles.filterSelect}
                  value={filters.family}
                  onChange={(e) => updateFilter('family', e.target.value)}
                >
                  <option value="all">All Families</option>
                  {families.map(family => (
                    <option key={family} value={family}>{family}</option>
                  ))}
                </select>
              </div>

              {/* Note Count Filter */}
              <div className={styles.filterGroup}>
                <label htmlFor="notecount-filter" className={styles.filterLabel}>
                  Number of Notes
                </label>
                <select
                  id="notecount-filter"
                  className={styles.filterSelect}
                  value={filters.noteCount || 'all'}
                  onChange={(e) => updateFilter('noteCount', e.target.value === 'all' ? null : Number(e.target.value))}
                >
                  <option value="all">Any Count</option>
                  {noteCounts.map(count => (
                    <option key={count} value={count}>{count} notes</option>
                  ))}
                </select>
              </div>

              {/* Scale Type Filter */}
              <div className={styles.filterGroup}>
                <label htmlFor="type-filter" className={styles.filterLabel}>
                  Scale Type
                </label>
                <select
                  id="type-filter"
                  className={styles.filterSelect}
                  value={filters.scaleType}
                  onChange={(e) => updateFilter('scaleType', e.target.value)}
                >
                  <option value="all">All Types</option>
                  {scaleTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search */}
            <div className={styles.filterRow}>
              <div className={styles.filterGroup} style={{ flex: 2 }}>
                <label htmlFor="search-filter" className={styles.filterLabel}>
                  Search
                </label>
                <input
                  id="search-filter"
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search by name, notes, or type..."
                  value={filters.searchQuery}
                  onChange={(e) => updateFilter('searchQuery', e.target.value)}
                />
              </div>

              <div className={styles.filterGroup} style={{ flex: 1, justifyContent: 'flex-end', display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
                <button
                  className={styles.colorToggleButton}
                  onClick={() => setUseColors(!useColors)}
                  title={useColors ? 'Disable octave-aware colors' : 'Enable octave-aware colors'}
                  aria-label={useColors ? 'Disable octave-aware colors' : 'Enable octave-aware colors'}
                >
                  {useColors ? '🎨 Colors On' : '🎨 Colors Off'}
                </button>
                <button
                  className={styles.colorToggleButton}
                  onClick={() => setShowPlayedNotes(!showPlayedNotes)}
                  title={showPlayedNotes ? 'Hide played notes' : 'Show played notes'}
                  aria-label={showPlayedNotes ? 'Hide played notes' : 'Show played notes'}
                >
                  {showPlayedNotes ? '♫ Played Notes On' : '♫ Played Notes Off'}
                </button>
                <span className={styles.statsText}>
                  Showing {filteredScales.length} of {allScales.length} scales
                </span>
              </div>
            </div>
          </div>

          {/* Scales List */}
          {isLoading ? (
            <div className={styles.loading}>Loading scales...</div>
          ) : (
            <ScalesList scales={filteredScales} useColors={useColors} showPlayedNotes={showPlayedNotes} />
          )}
        </div>
      </main>
    </div>
  );
}
