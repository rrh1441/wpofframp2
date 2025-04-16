// scripts/testBuildZip.ts
import { buildZip } from '../lib/buildZip'; // Adjust path if necessary
import { promises as fs } from 'fs';
import path from 'path';
import type { ThemeKey } from '../lib/constants'; // Adjust path if necessary

// --- Configuration ---
const OUTPUT_FILENAME = 'test-build-output.zip'; // Name of the output ZIP file
const TEST_THEME: ThemeKey = 'matrix'; // Choose the theme to test

// --- Mock Data (Replace with realistic test data) ---
const mockHomepagePosts = [
  { id: 1, title: 'Test Post 1', link: 'http://example.com/test-post-1', excerpt: '<p>Excerpt 1...</p>', featuredMediaUrl: null, authorName: 'Tester', date: new Date().toISOString() },
  { id: 2, title: 'Test Post 2', link: 'http://example.com/test-post-2', excerpt: '<p>Excerpt 2...</p>', featuredMediaUrl: 'http://example.com/image.jpg', authorName: 'Tester', date: new Date().toISOString() },
];
const mockMostRecentPostMdx = `---