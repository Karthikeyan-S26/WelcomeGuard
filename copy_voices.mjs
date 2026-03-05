import fs from 'fs';
import path from 'path';

const srcDir = 'dataset';
const destDir = 'public/voices';

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

const voiceMap = {};

function copyVoicesRecursively(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    // Find if current dir has an audio file
    const oggFile = entries.find(e => e.isFile() && (e.name.endsWith('.ogg') || e.name.endsWith('.wav') || e.name.endsWith('.mp3')));
    if (oggFile) {
        const folderName = path.basename(dir);
        if (folderName !== 'dataset') {
            const cleanName = folderName.toLowerCase().replace(/\s+/g, '_');
            const ext = path.extname(oggFile.name);
            const srcPath = path.join(dir, oggFile.name);
            const destPath = path.join(destDir, `${cleanName}${ext}`);
            fs.copyFileSync(srcPath, destPath);
            console.log(`Copied ${dir}/${oggFile.name} -> ${destPath}`);

            // Generate a clean keyword for text matching
            let words = folderName.toLowerCase()
                .replace(/[-.\_]/g, ' ')
                .split(/\s+/);
            const stopWords = ['dr', 'mr', 'mrs', 'prof', 'mam', 'sir', 'dean', 'cse', 'mech', 'ece', 'eee', 'civil', 'age', 'bme'];
            let keyWords = words.filter(w => w.length > 2 && !stopWords.includes(w));
            let key = keyWords.length > 0 ? keyWords[0] : cleanName.split('_')[0];

            // Map both the clean key and the strict folder name
            voiceMap[key] = `/voices/${cleanName}${ext}`;
            voiceMap[folderName.toLowerCase()] = `/voices/${cleanName}${ext}`;
        }
    }

    // Recurse into subdirectories
    for (const entry of entries) {
        if (entry.isDirectory()) {
            copyVoicesRecursively(path.join(dir, entry.name));
        }
    }
}

copyVoicesRecursively(srcDir);

const mapPath = path.join('src', 'voiceMap.json');
fs.writeFileSync(mapPath, JSON.stringify(voiceMap, null, 2));
console.log(`Generated voice map at ${mapPath}`);
