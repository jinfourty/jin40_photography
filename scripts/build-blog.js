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
const BLOG_DIR = path.join(__dirname, '..', 'blog');
const POST_TEMPLATE = path.join(__dirname, '..', 'post.html');
const SITE_URL = 'https://jin40photo.com';
const SUPPORTED_LANGS = ['en', 'ko', 'ja'];

// Language code mappings (internal code -> ISO code)
const LANG_CODES = {
    en: 'en',
    ko: 'ko',
    ja: 'ja'
};

const OG_LOCALES = {
    en: 'en_US',
    ko: 'ko_KR',
    ja: 'ja_JP'
};

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

    // Get all directories (excluding those starting with _)
    const items = fs.readdirSync(POSTS_DIR, { withFileTypes: true });
    const directories = items
        .filter(item => item.isDirectory() && !item.name.startsWith('_'))
        .map(item => item.name);

    console.log(`Found ${directories.length} post directory(s)\n`);

    const posts = [];

    for (const slug of directories) {
        const postDir = path.join(POSTS_DIR, slug);
        const supportedLangs = ['en', 'ko', 'ja'];

        let baseMetadata = null;
        let titleObj = {};
        let excerptObj = {};

        // Find available languages
        const availableLangs = supportedLangs.filter(lang =>
            fs.existsSync(path.join(postDir, `${lang}.md`))
        );

        if (availableLangs.length === 0) {
            console.warn(`Warning: No markdown files found in ${slug}, skipping...`);
            continue;
        }

        // Process each language file
        for (const lang of availableLangs) {
            const content = fs.readFileSync(path.join(postDir, `${lang}.md`), 'utf-8');
            const metadata = parseFrontmatter(content);

            if (!metadata) continue;

            // Use first available metadata as base (usually 'en' if available)
            if (!baseMetadata) {
                baseMetadata = metadata;
            }

            // Aggregate localized strings
            titleObj[lang] = metadata.title || '';
            excerptObj[lang] = metadata.excerpt || '';

            // If base metadata was set from a non-EN file but now we have EN, 
            // maybe update base metadata to EN for consistency? 
            // For now, first found is fine.
        }

        if (!baseMetadata) {
            console.warn(`Warning: Failed to parse metadata for ${slug}, skipping...`);
            continue;
        }

        const post = {
            slug,
            title: titleObj,
            excerpt: excerptObj,
            date: baseMetadata.date || '',
            category: baseMetadata.category || 'General',
            thumbnail: baseMetadata.thumbnail || ''
        };

        posts.push(post);
        console.log(`  ✓ ${slug}`);
        console.log(`    Languages: ${availableLangs.join(', ')}`);
        console.log(`    Date: ${post.date}\n`);
    }

    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Write index.json
    fs.writeFileSync(INDEX_FILE, JSON.stringify(posts, null, 2) + '\n');

    console.log(`\nSuccess! Generated index.json with ${posts.length} post(s)`);

    return posts;
}

/**
 * Generate hreflang tags for a post
 */
function generateHreflangTags(slug) {
    const enUrl = `${SITE_URL}/blog/${slug}/`;
    const koUrl = `${SITE_URL}/blog/${slug}/ko/`;
    const jaUrl = `${SITE_URL}/blog/${slug}/ja/`;

    return `<link rel="alternate" hreflang="en" href="${enUrl}">
    <link rel="alternate" hreflang="ko" href="${koUrl}">
    <link rel="alternate" hreflang="ja" href="${jaUrl}">
    <link rel="alternate" hreflang="x-default" href="${enUrl}">`;
}

/**
 * Get localized value with fallback
 */
function getLocalizedValue(obj, lang) {
    if (typeof obj === 'string') return obj;
    return obj[lang] || obj['en'] || Object.values(obj)[0] || '';
}

/**
 * Generate individual blog post HTML files
 * Creates blog/{slug}/index.html and blog/{slug}/{lang}/index.html for each post
 */
function generatePostPages(posts) {
    console.log('\nGenerating multilingual post pages...\n');

    // Read the post.html template
    if (!fs.existsSync(POST_TEMPLATE)) {
        console.error('Error: post.html template not found');
        process.exit(1);
    }

    const template = fs.readFileSync(POST_TEMPLATE, 'utf-8');

    // Create blog directory if it doesn't exist
    if (!fs.existsSync(BLOG_DIR)) {
        fs.mkdirSync(BLOG_DIR, { recursive: true });
    }

    // Clean up old blog post directories (keep only current posts)
    const existingDirs = fs.readdirSync(BLOG_DIR, { withFileTypes: true })
        .filter(item => item.isDirectory())
        .map(item => item.name);

    const currentSlugs = posts.map(p => p.slug);

    for (const dir of existingDirs) {
        if (!currentSlugs.includes(dir)) {
            const dirPath = path.join(BLOG_DIR, dir);
            fs.rmSync(dirPath, { recursive: true });
            console.log(`  🗑️  Removed old: ${dir}`);
        }
    }

    let totalGenerated = 0;

    // Generate HTML for each post in each language
    for (const post of posts) {
        const postBaseDir = path.join(BLOG_DIR, post.slug);

        // Create post directory
        if (!fs.existsSync(postBaseDir)) {
            fs.mkdirSync(postBaseDir, { recursive: true });
        }

        // Generate hreflang tags (same for all language versions)
        const hreflangTags = generateHreflangTags(post.slug);

        // Thumbnail URL (absolute)
        const thumbnailUrl = post.thumbnail
            ? `${SITE_URL}/${post.thumbnail}`
            : `${SITE_URL}/images/hero/hero-photo.webp`;

        // Generate for each language
        for (const lang of SUPPORTED_LANGS) {
            // Determine output directory and URL
            const isDefaultLang = (lang === 'en');
            const outputDir = isDefaultLang
                ? postBaseDir
                : path.join(postBaseDir, lang);
            const canonicalUrl = isDefaultLang
                ? `${SITE_URL}/blog/${post.slug}/`
                : `${SITE_URL}/blog/${post.slug}/${lang}/`;

            // Create language subdirectory if needed
            if (!isDefaultLang && !fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Get localized content
            const title = getLocalizedValue(post.title, lang);
            const description = getLocalizedValue(post.excerpt, lang);

            // Start with template
            let html = template;

            // Replace SEO placeholders
            html = html.replaceAll('{{LANG}}', LANG_CODES[lang]);
            html = html.replaceAll('{{LANG_CODE}}', LANG_CODES[lang]);
            html = html.replaceAll('{{TITLE}}', title);
            html = html.replaceAll('{{DESCRIPTION}}', description);
            html = html.replaceAll('{{CANONICAL_URL}}', canonicalUrl);
            html = html.replaceAll('{{THUMBNAIL_URL}}', thumbnailUrl);
            html = html.replaceAll('{{OG_LOCALE}}', OG_LOCALES[lang]);
            html = html.replaceAll('{{DATE}}', post.date);
            html = html.replace('{{HREFLANG_TAGS}}', hreflangTags);

            // Fix relative paths based on directory depth
            const depth = isDefaultLang ? '../../' : '../../../';

            // Fix CSS path
            html = html.replace('href="css/style.css"', `href="${depth}css/style.css"`);

            // Fix script paths
            html = html.replace('src="js/main.js"', `src="${depth}js/main.js"`);
            html = html.replace('src="js/comments.js"', `src="${depth}js/comments.js"`);
            html = html.replace('src="js/blog.js"', `src="${depth}js/blog.js"`);

            // Fix navigation links
            html = html.replaceAll('href="/"', `href="${depth}"`);
            html = html.replaceAll('href="gallery"', `href="${depth}gallery"`);
            html = html.replaceAll('href="blog"', `href="${depth}blog"`);
            html = html.replaceAll('href="guestbook"', `href="${depth}guestbook"`);

            // Write the file
            const indexFile = path.join(outputDir, 'index.html');
            fs.writeFileSync(indexFile, html);
            totalGenerated++;
        }

        console.log(`  ✓ ${post.slug}/ (en, ko, ja)`);
    }

    console.log(`\n✅ Generated ${totalGenerated} post page(s) for ${posts.length} post(s) in blog/`);
}

// Run
const posts = buildBlogIndex();
generatePostPages(posts);
