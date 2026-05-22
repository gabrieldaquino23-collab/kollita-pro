// Replace with environment variable SUPABASE_MANAGEMENT_TOKEN
const token = process.env.SUPABASE_MANAGEMENT_TOKEN;
const PROJECT_ID = 'wsqhzatsuymjoebzfhpg';

const sql = `
SELECT relname as tabla, n_live_tup as filas FROM pg_stat_user_tables WHERE schemaname = 'public';
`;

fetch('https://api.supabase.com/v1/projects/' + PROJECT_ID + '/database/query', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query: sql })
})
.then(r => r.json())
.then(data => console.table(data))
.catch(console.error);
