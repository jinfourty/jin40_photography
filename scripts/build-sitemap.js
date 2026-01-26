#!/usr/bin/env node

/**
 * Sitemap Generator
 * Generates sitemap.xml including all blog posts with multilingual support
 */

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://jin40photo.com';
const INDEX_JSON = path.join(__dirname, '../posts/index.json');
const SITEMAP_PATH = path.join(__dirname, '../sitemap.xml');

// Language mappings for hreflang (jp -> ja for proper ISO code)
const LANG_CODES = {
    en: 'en',
    ko: 'ko',
    jp: 'ja'
};

// Static pages
const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/home', priority: '1.0', changefreq: 'weekly' },
    { url: '/gallery', priority: '0.9', changefreq: 'weekly' },
    { url: '/blog', priority: '0.8', changefreq: 'weekly' }
];

function getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Generate hreflang xhtml:link tags for a blog post
 */
function generateHreflangLinks(slug) {
    const enUrl = `${SITE_URL}/blog/${slug}/`;
    const koUrl = `${SITE_URL}/blog/${slug}/ko/`;
    const jaUrl = `${SITE_URL}/blog/${slug}/ja/`;

    return `        <xhtml:link rel="alternate" hreflang="en" href="${enUrl}"/>
        <xhtml:link rel="alternate" hreflang="ko" href="${koUrl}"/>
        <xhtml:link rel="alternate" hreflang="ja" href="${jaUrl}"/>
        <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}"/>`;
}

function generateSitemap() {
    console.log('Generating multilingual sitemap.xml...\n');

    // Read blog posts
    let blogPosts = [];
    if (fs.existsSync(INDEX_JSON)) {
        const content = fs.readFileSync(INDEX_JSON, 'utf-8');
        blogPosts = JSON.parse(content);
    }

    // Start XML with xhtml namespace for hreflang
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

    // Add static pages
    staticPages.forEach(page => {
        xml += '    <url>\n';
        xml += `        <loc>${SITE_URL}${page.url}</loc>\n`;
        xml += `        <lastmod>${getCurrentDate()}</lastmod>\n`;
        xml += `        <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `        <priority>${page.priority}</priority>\n`;
        xml += '    </url>\n';
    });

    // Add blog posts - each language version as separate URL with hreflang links
    let totalUrls = staticPages.length;

    blogPosts.forEach(post => {
        // Handle localized title for logging
        let displayTitle = 'Untitled';
        if (typeof post.title === 'string') {
            displayTitle = post.title;
        } else if (typeof post.title === 'object') {
            displayTitle = post.title.en || Object.values(post.title)[0] || 'Untitled';
        }

        const hreflangLinks = generateHreflangLinks(post.slug);

        // English version (default)
        xml += '    <url>\n';
        xml += `        <loc>${SITE_URL}/blog/${post.slug}/</loc>\n`;
        xml += `        <lastmod>${post.date}</lastmod>\n`;
        xml += `        <changefreq>monthly</changefreq>\n`;
        xml += `        <priority>0.7</priority>\n`;
        xml += hreflangLinks + '\n';
        xml += '    </url>\n';

        // Korean version
        xml += '    <url>\n';
        xml += `        <loc>${SITE_URL}/blog/${post.slug}/ko/</loc>\n`;
        xml += `        <lastmod>${post.date}</lastmod>\n`;
        xml += `        <changefreq>monthly</changefreq>\n`;
        xml += `        <priority>0.7</priority>\n`;
        xml += hreflangLinks + '\n';
        xml += '    </url>\n';

        // Japanese version
        xml += '    <url>\n';
        xml += `        <loc>${SITE_URL}/blog/${post.slug}/ja/</loc>\n`;
        xml += `        <lastmod>${post.date}</lastmod>\n`;
        xml += `        <changefreq>monthly</changefreq>\n`;
        xml += `        <priority>0.7</priority>\n`;
        xml += hreflangLinks + '\n';
        xml += '    </url>\n';

        totalUrls += 3;
        console.log(`  ✓ Added: ${displayTitle} (en, ko, ja)`);
    });

    xml += '</urlset>\n';

    // Write sitemap
    fs.writeFileSync(SITEMAP_PATH, xml);

    console.log(`\n✅ Sitemap generated with ${totalUrls} URLs`);
    console.log(`   - ${staticPages.length} static pages`);
    console.log(`   - ${blogPosts.length * 3} blog post pages (${blogPosts.length} posts × 3 languages)`);
    console.log(`📄 File: ${SITEMAP_PATH}\n`);
}

generateSitemap();
