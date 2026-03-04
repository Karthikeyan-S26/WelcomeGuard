import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ktfowjjcupsjngewghke.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0Zm93ampjdXBzam5nZXdnaGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTQyNzcsImV4cCI6MjA4NzQzMDI3N30.A6RAw5ocg3pHfqlnaeuRmQnl9p2Bs8-HUpWJLJ8SzY0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('profiles').select('name, photo_url');
    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}
check();
