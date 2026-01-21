const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const exifReader = require('exif-reader');
const readline = require('readline');

// ===== Configuration =====
const CONFIG = {
    inputDir: path.join(__dirname, '../images/new'),
    galleryOutputDir: path.join(__dirname, '../images/gallery'),
    blogOutputDir: path.join(__dirname, '../images/blog'),
    metadataPath: path.join(__dirname, '../data/metadata.json'),
    supportedFormats: ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.heic'],
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 82
};

// ===== Helper Functions =====
function createReadlineInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

async function askQuestion(rl, question) {
    return new Promise(resolve => {
        rl.question(question, answer => resolve(answer.trim()));
    });
}

async function getImageFiles(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        return [];
    }

    const files = fs.readdirSync(dir);
    return files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return CONFIG.supportedFormats.includes(ext);
    });
}

async function extractExif(imagePath) {
    try {
        const metadata = await sharp(imagePath).metadata();
        let exif = {};

        if (metadata.exif) {
            try {
                exif = exifReader(metadata.exif);
            } catch (e) {
                console.log('  EXIF parsing failed, using defaults');
            }
        }

        return {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            // EXIF data
            make: exif.Image?.Make || exif.image?.Make || null,
            model: exif.Image?.Model || exif.image?.Model || null,
            aperture: exif.Photo?.FNumber || exif.exif?.FNumber || null,
            exposureTime: exif.Photo?.ExposureTime || exif.exif?.ExposureTime || null,
            iso: exif.Photo?.ISOSpeedRatings || exif.exif?.ISO || null,
            focalLength: exif.Photo?.FocalLength || exif.exif?.FocalLength || null,
            lensModel: exif.Photo?.LensModel || exif.exif?.LensModel || null,
            dateTimeOriginal: exif.Photo?.DateTimeOriginal || exif.exif?.DateTimeOriginal || null
        };
    } catch (error) {
        console.error('Error extracting metadata:', error.message);
        return { width: 0, height: 0 };
    }
}

async function convertToWebp(inputPath, outputPath) {
    try {
        await sharp(inputPath)
            .rotate() // Auto-rotate based on EXIF orientation
            .resize(CONFIG.maxWidth, CONFIG.maxHeight, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: CONFIG.quality })
            .toFile(outputPath);
        return true;
    } catch (error) {
        console.error('Error converting image:', error.message);
        return false;
    }
}

function loadMetadata() {
    if (fs.existsSync(CONFIG.metadataPath)) {
        const content = fs.readFileSync(CONFIG.metadataPath, 'utf-8');
        return JSON.parse(content);
    }
    return [];
}

function saveMetadata(metadata) {
    fs.writeFileSync(CONFIG.metadataPath, JSON.stringify(metadata, null, 2));
}

function generateFilename(index, existingFiles) {
    let num = existingFiles.length + index + 1;
    return `photo${num}.webp`;
}

// ===== Main Process =====
async function main() {
    console.log('\n========================================');
    console.log('   Photo Upload Script');
    console.log('========================================\n');

    // Check for images in input directory
    const imageFiles = await getImageFiles(CONFIG.inputDir);

    if (imageFiles.length === 0) {
        console.log(`No images found in: ${CONFIG.inputDir}`);
        console.log('\nUsage:');
        console.log('1. Put your photos in the "images/new" folder');
        console.log('2. Run: npm run add-photos');
        console.log('');
        return;
    }

    console.log(`Found ${imageFiles.length} image(s) to process.\n`);

    // Interactive prompts
    const rl = createReadlineInterface();

    // Ask for type: Gallery or Blog
    const photoType = await askQuestion(rl, 'Photo type - [g]allery or [b]log? (g/b): ');
    const isGallery = !photoType || photoType.toLowerCase() === 'g' || photoType.toLowerCase() === 'gallery';
    const isBlog = photoType.toLowerCase() === 'b' || photoType.toLowerCase() === 'blog';

    if (!isGallery && !isBlog) {
        console.log('Invalid choice. Aborting.');
        rl.close();
        return;
    }

    let country, year, folderName;

    if (isGallery) {
        country = await askQuestion(rl, 'Country (e.g., japan, korea, vietnam): ');
        if (!country) {
            console.log('Country is required. Aborting.');
            rl.close();
            return;
        }
        year = await askQuestion(rl, 'Year (press Enter for auto-detect from EXIF): ');
    } else {
        // Blog type
        folderName = await askQuestion(rl, 'Folder name (e.g., 2026-01-21 or my-trip): ');
        if (!folderName) {
            console.log('Folder name is required. Aborting.');
            rl.close();
            return;
        }
    }

    rl.close();

    // Create output directory based on type
    let fullOutputDir, outputSubDir;

    if (isGallery) {
        outputSubDir = year
            ? `${year}-${country.toLowerCase()}`
            : `new-${country.toLowerCase()}`;
        fullOutputDir = path.join(CONFIG.galleryOutputDir, outputSubDir);
    } else {
        // Blog type
        outputSubDir = folderName;
        fullOutputDir = path.join(CONFIG.blogOutputDir, outputSubDir);
    }

    if (!fs.existsSync(fullOutputDir)) {
        fs.mkdirSync(fullOutputDir, { recursive: true });
    }

    // Get existing files in output directory
    const existingFiles = fs.existsSync(fullOutputDir)
        ? fs.readdirSync(fullOutputDir).filter(f => f.endsWith('.webp'))
        : [];

    // Load existing metadata (only for gallery)
    const metadata = isGallery ? loadMetadata() : null;

    console.log('\nProcessing images...\n');
    console.log(`Target: ${isGallery ? 'Gallery' : 'Blog'}`);
    console.log(`Output: ${fullOutputDir}\n`);

    let successCount = 0;

    for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const inputPath = path.join(CONFIG.inputDir, file);

        console.log(`[${i + 1}/${imageFiles.length}] ${file}`);

        // Extract EXIF
        const exifData = await extractExif(inputPath);
        console.log(`  - Size: ${exifData.width}x${exifData.height}`);
        if (exifData.model) console.log(`  - Camera: ${exifData.model}`);

        let finalOutputDir, finalOutputSubDir, outputFilename;

        if (isGallery) {
            // Gallery: determine year from EXIF if not provided
            let photoYear = year;
            if (!photoYear && exifData.dateTimeOriginal) {
                const date = new Date(exifData.dateTimeOriginal);
                photoYear = date.getFullYear().toString();
                console.log(`  - Year (from EXIF): ${photoYear}`);
            }
            if (!photoYear) {
                photoYear = new Date().getFullYear().toString();
                console.log(`  - Year (default): ${photoYear}`);
            }

            // Update output directory if year was auto-detected
            finalOutputSubDir = `${photoYear}-${country.toLowerCase()}`;
            finalOutputDir = path.join(CONFIG.galleryOutputDir, finalOutputSubDir);
            if (!fs.existsSync(finalOutputDir)) {
                fs.mkdirSync(finalOutputDir, { recursive: true });
            }

            // Get existing files count for this specific directory
            const dirExistingFiles = fs.readdirSync(finalOutputDir).filter(f => f.endsWith('.webp'));

            // Generate output filename
            outputFilename = `photo${dirExistingFiles.length + 1}.webp`;
        } else {
            // Blog: use simple sequential naming or keep original name
            finalOutputDir = fullOutputDir;
            finalOutputSubDir = outputSubDir;

            // Get existing files count
            const dirExistingFiles = fs.readdirSync(finalOutputDir).filter(f => f.endsWith('.webp'));

            // Keep original filename (without extension) or use sequential naming
            const originalName = path.parse(file).name.toLowerCase().replace(/\s+/g, '-');
            const possibleFilename = `${originalName}.webp`;

            // Check if file already exists, if so use sequential naming
            if (fs.existsSync(path.join(finalOutputDir, possibleFilename))) {
                outputFilename = `photo${dirExistingFiles.length + 1}.webp`;
            } else {
                outputFilename = possibleFilename;
            }
        }

        const outputPath = path.join(finalOutputDir, outputFilename);

        // Convert to webp
        const success = await convertToWebp(inputPath, outputPath);

        if (success) {
            // Get final image dimensions
            const finalMetadata = await sharp(outputPath).metadata();

            if (isGallery) {
                // Create metadata entry for gallery
                const entry = {
                    filename: outputFilename,
                    width: finalMetadata.width,
                    height: finalMetadata.height,
                    format: 'webp',
                    make: exifData.make,
                    model: exifData.model,
                    aperture: exifData.aperture,
                    exposureTime: exifData.exposureTime,
                    iso: exifData.iso,
                    focalLength: exifData.focalLength,
                    lensModel: exifData.lensModel,
                    dateTimeOriginal: exifData.dateTimeOriginal ? new Date(exifData.dateTimeOriginal).toISOString() : null,
                    filePath: `${finalOutputSubDir}/${outputFilename}`,
                    year: finalOutputSubDir.split('-')[0], // Extract year from folder name
                    country: country.toLowerCase()
                };

                // Add to metadata array (at the beginning for newest first)
                metadata.unshift(entry);

                console.log(`  - Saved: ${entry.filePath}`);
            } else {
                // Blog: just log the saved path
                console.log(`  - Saved: images/blog/${finalOutputSubDir}/${outputFilename}`);
            }

            successCount++;

            // Delete original file
            fs.unlinkSync(inputPath);
            console.log(`  - Original deleted`);
        } else {
            console.log(`  - Failed to convert`);
        }

        console.log('');
    }

    // Save updated metadata (only for gallery)
    if (isGallery) {
        saveMetadata(metadata);
    }

    console.log('========================================');
    console.log(`Done! ${successCount}/${imageFiles.length} photos processed.`);
    if (isGallery) {
        console.log(`Metadata updated: ${CONFIG.metadataPath}`);
    } else {
        console.log(`Blog images saved to: ${fullOutputDir}`);
    }
    console.log('========================================\n');
}

main().catch(console.error);
