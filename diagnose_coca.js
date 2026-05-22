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
  // Check row counts in coca tables
  console.log('=== ROW COUNTS ===');
  let res = await query("SELECT count(*) as total FROM coca_registros;");
  console.log('coca_registros:', JSON.stringify(res));
  res = await query("SELECT count(*) as total FROM coca_pagos;");
  console.log('coca_pagos:', JSON.stringify(res));

  // Get distinct caseros from both tables
  console.log('\n=== CASEROS in registros ===');
  res = await query("SELECT DISTINCT casero FROM coca_registros ORDER BY casero;");
  console.log(JSON.stringify(res));

  console.log('\n=== CASEROS in pagos ===');
  res = await query("SELECT DISTINCT casero FROM coca_pagos ORDER BY casero;");
  console.log(JSON.stringify(res));

  // Check if there's any coca_config, coca_caseros, or similar table
  res = await query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name ILIKE '%casero%';");
  console.log('\nCasero tables:', JSON.stringify(res));

  // Check encargados table (might relate to caseros)
  res = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='encargados';");
  console.log('\nencargados columns:', JSON.stringify(res));

  // Sample a few records to understand data
  console.log('\n=== SAMPLE registros (2 rows) ===');
  res = await query("SELECT * FROM coca_registros LIMIT 2;");
  console.log(JSON.stringify(res, null, 2));

  console.log('\n=== SAMPLE pagos (2 rows) ===');
  res = await query("SELECT * FROM coca_pagos LIMIT 2;");
  console.log(JSON.stringify(res, null, 2));
})();
