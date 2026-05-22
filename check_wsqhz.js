// Replace with environment variable SUPABASE_MANAGEMENT_TOKEN
const token = process.env.SUPABASE_MANAGEMENT_TOKEN;
const PROJECT_ID = 'wsqhzatsuymjoebzfhpg';

const sql = `
SELECT relname as tabla FROM pg_stat_user_tables WHERE schemaname = 'public';
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
.then(data => {
   if(Array.isArray(data)) console.log('Tablas en wsqhzatsuymjoebzfhpg:', data.map(d => d.tabla).join(', '));
   else console.log(data);
})
.catch(console.error);
