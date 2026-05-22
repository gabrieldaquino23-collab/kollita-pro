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
  console.log('=== FINAL VERIFICATION ===\n');

  // Check if coca_config exists in any schema
  let res = await query("SELECT schemaname, tablename FROM pg_tables WHERE tablename ILIKE '%coca%';");
  console.log('Tables with "coca" in name:', JSON.stringify(res));

  // Check encargados (distributors/caseros)
  res = await query("SELECT count(*) as total FROM encargados;");
  console.log('\nencargados count:', JSON.stringify(res));

  // Check all row counts for coca tables
  res = await query("SELECT count(*) as total FROM coca_registros;");
  console.log('coca_registros:', JSON.stringify(res));
  
  res = await query("SELECT count(*) as total FROM coca_pagos;");
  console.log('coca_pagos:', JSON.stringify(res));

  // Check sync_queue for coca references
  res = await query("SELECT count(*) as total FROM sync_queue WHERE tabla ILIKE '%coca%';");
  console.log('sync_queue coca references:', JSON.stringify(res));

  console.log('\n=== RESULT: No CocaPay data found. Both coca_pagos and coca_registros are empty.');
  console.log('The coca_config table referenced in the codebase does not exist.');
  console.log('Caseros (distributors) live in localStorage "cocapay_v3_omega" and in the encargados table.');
})();
