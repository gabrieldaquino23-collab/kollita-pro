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
  let res = await query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;");
  console.log('Public tables:', JSON.stringify(res, null, 2));

  res = await query("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND (table_name ILIKE '%coca%' OR table_name ILIKE '%cocapay%') ORDER BY table_name, ordinal_position;");
  console.log('\nCoca columns:', JSON.stringify(res, null, 2));
})();
