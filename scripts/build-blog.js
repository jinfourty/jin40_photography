#!/usr/bin/env node

/**
 * Blog Build Script
 * Scans posts/ folder for .md files and generates index.json
 *
 * Usage: node scripts/build-blog.js
 * Or: npm run build-blog
 */

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '..', 'posts');
const INDEX_FILE = path.join(POSTS_DIR, 'index.json');

/**
 * Parse frontmatter from markdown content
 */
function parseFrontmatter(content) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
        return null;
    }

    const frontmatter = match[1];
    const metadata = {};

    frontmatter.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > -1) {
            const key = line.slice(0, colonIndex).trim();
            let value = line.slice(colonIndex + 1).trim();
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            metadata[key] = value;
        }
    });

    return metadata;
}

/**
 * Get slug from filename
 * Example: 2024-03-15-golden-hour.md -> 2024-03-15-golden-hour
 */
function getSlugFromFilename(filename) {
    return filename.replace(/\.md$/, '');
}

/**
 * Main build function
 */
function buildBlogIndex() {
    console.log('Building blog index...\n');

    // Check if posts directory exists
    if (!fs.existsSync(POSTS_DIR)) {
        console.error('Error: posts/ directory not found');
        process.exit(1);
    }

    // Get all .md files (exclude template files starting with _)
    const files = fs.readdirSync(POSTS_DIR)
        .filter(file => file.endsWith('.md') && !file.startsWith('_'));

    console.log(`Found ${files.length} markdown file(s)\n`);

    const posts = [];

    for (const file of files) {
        const filePath = path.join(POSTS_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const metadata = parseFrontmatter(content);

        if (!metadata) {
            console.warn(`Warning: No frontmatter found in ${file}, skipping...`);
            continue;
        }

        const slug = getSlugFromFilename(file);

        // Validate required fields
        const requiredFields = ['title', 'date', 'category', 'thumbnail', 'excerpt'];
        const missingFields = requiredFields.filter(field => !metadata[field]);

        if (missingFields.length > 0) {
            console.warn(`Warning: ${file} is missing fields: ${missingFields.join(', ')}`);
        }

        const post = {
            slug,
            title: metadata.title || 'Untitled',
            date: metadata.date || '',
            category: metadata.category || 'General',
            thumbnail: metadata.thumbnail || '',
            excerpt: metadata.excerpt || ''
        };

        posts.push(post);
        console.log(`  ✓ ${file}`);
        console.log(`    Title: ${post.title}`);
        console.log(`    Date: ${post.date}\n`);
    }

    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Write index.json
    fs.writeFileSync(INDEX_FILE, JSON.stringify(posts, null, 2) + '\n');

    console.log(`\nSuccess! Generated index.json with ${posts.length} post(s)`);
}

// Run
buildBlogIndex();
