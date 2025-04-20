'use client';
import Link from 'next/link';
import CircleOfFifths from './CircleOfFifths';
import RelativeKeys from './RelativeKeys';
import styles from './keys.module.css';

/**
 * Keys page - Display key signatures, parallel/relative keys, and circle of fifths
 */
export default function KeysPage() {
  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 items-center">
        {/* Header */}
        <div className="w-full max-w-[1400px] flex items-center justify-between gap-4">
          <Link
            href="/"
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm h-10 px-4 gap-2"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
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

        <h1 className="text-4xl font-bold tracking-tight">Musical Keys & Key Signatures</h1>

        <div className={styles.container}>
          {/* Circle of Fifths Section */}
          <section className={styles.section}>
            <CircleOfFifths />
          </section>

          {/* Relative Keys Section */}
          <section className={styles.section}>
            <RelativeKeys />
          </section>
        </div>
      </main>
    </div>
  );
}
