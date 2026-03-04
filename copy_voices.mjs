import fs from 'fs';
import path from 'path';

const srcDir = 'dataset/IT Staffs';
const destDir = 'public/voices';

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

const folders = fs.readdirSync(srcDir);
for (const folder of folders) {
    const folderPath = path.join(srcDir, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const files = fs.readdirSync(folderPath);
    const oggFile = files.find(f => f.endsWith('.ogg'));

    if (oggFile) {
        const srcPath = path.join(folderPath, oggFile);
        // Sanitize folder name to use as filename: lowercase, no spaces
        const cleanName = folder.toLowerCase().replace(/\s+/g, '_');
        const destPath = path.join(destDir, `${cleanName}.ogg`);
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied ${folder}/${oggFile} -> public/voices/${cleanName}.ogg`);
    }
}
