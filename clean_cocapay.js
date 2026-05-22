const TOKEN = process.env.SUPABASE_MANAGEMENT_TOKEN || 'your-supabase-management-token';
const PROJECT_ID = 'wsqhzatsuymjoebzfhpg';
const BASE = 'https://api.supabase.com/v1/projects/' + PROJECT_ID + '/database/query';

function query(sql) {
  return fetch(BASE, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  }).then(r => r.json());
}

(async () => {
  // 1. CHECK current data
  console.log('=== CHECKING coca_config ===');
  let res = await query("SELECT data->>'caseros' as caseros_preview FROM coca_config LIMIT 1;");
  if (Array.isArray(res) && res.length > 0) {
    const preview = res[0].caseros_preview;
    console.log('caseros preview (first 500 chars):', preview ? preview.substring(0, 500) : 'NULL');
  } else {
    console.log('Result:', JSON.stringify(res).substring(0, 500));
  }

  // Check row count
  res = await query("SELECT count(*) as total FROM coca_config;");
  console.log('Rows in coca_config:', Array.isArray(res) ? res[0].total : res);

  // 2. CLEAN: keep only caseros, wipe everything else
  console.log('\n=== CLEANING: keep only caseros ===');
  res = await query("UPDATE coca_config SET data = jsonb_build_object('caseros', data->'caseros');");
  console.log('UPDATE result:', JSON.stringify(res));

  // 3. VERIFY
  console.log('\n=== VERIFY ===');
  res = await query("SELECT data FROM coca_config LIMIT 1;");
  if (Array.isArray(res) && res.length > 0) {
    const data = res[0].data;
    if (typeof data === 'object') {
      const keys = Object.keys(data);
      console.log('Keys remaining:', keys);
      console.log('caseros length:', data.caseros ? JSON.stringify(data.caseros).length : 0);
    } else {
      console.log('Raw data:', JSON.stringify(data).substring(0, 300));
    }
  } else {
    console.log('Result:', JSON.stringify(res).substring(0, 500));
  }

  console.log('\nDone.');
})();
