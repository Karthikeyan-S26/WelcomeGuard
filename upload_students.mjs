import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://ktfowjjcupsjngewghke.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0Zm93ampjdXBzam5nZXdnaGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTQyNzcsImV4cCI6MjA4NzQzMDI3N30.A6RAw5ocg3pHfqlnaeuRmQnl9p2Bs8-HUpWJLJ8SzY0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadStudent(studentName, folderPath) {
    if (!fs.existsSync(folderPath)) {
        console.log(`Folder not found: ${folderPath}`);
        return;
    }

    const files = fs.readdirSync(folderPath);
    if (files.length === 0) {
        console.log(`No files in ${folderPath}`);
        return;
    }
    const filename = files[0];
    const filepath = path.join(folderPath, filename);
    const fileExt = path.extname(filename).toLowerCase();

    console.log(`Uploading ${filename} for ${studentName}...`);

    // Read exact file contents correctly as ArrayBuffer for Supabase Storage
    const buffer = fs.readFileSync(filepath);

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(Date.now() + '-' + filename, buffer, {
            contentType: fileExt === '.png' ? 'image/png' : 'image/jpeg',
            upsert: true
        });

    if (uploadError) {
        console.error(`Error uploading photo for ${studentName}:`, uploadError);
        return;
    }

    const { data: publicUrlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(uploadData.path);

    const photoUrl = publicUrlData.publicUrl;

    // Check if exists
    const { data: existing } = await supabase.from('profiles').select('*').eq('name', studentName);

    if (existing && existing.length > 0) {
        console.log(`Updating existing profile ${studentName}...`);
        await supabase.from('profiles').update({ photo_url: photoUrl, role_type: 'student' }).eq('name', studentName);
    } else {
        console.log(`Inserting new profile ${studentName}...`);
        await supabase.from('profiles').insert([
            { name: studentName, role_type: 'student', designation: '', qualification: '', photo_url: photoUrl }
        ]);
    }
    console.log(`✅ Successfully added ${studentName}`);
}

async function main() {
    await uploadStudent('dheena', 'dataset/dheena');
    await uploadStudent('nithish kumar', 'dataset/nithish kumar');
}

main();
