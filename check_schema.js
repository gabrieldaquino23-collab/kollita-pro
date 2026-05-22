// Replace with environment variable SUPABASE_MANAGEMENT_TOKEN
const token = process.env.SUPABASE_MANAGEMENT_TOKEN;
const PROJECT_ID = 'wsqhzatsuymjoebzfhpg';

const sql = `
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pedidos' AND table_schema = 'public';
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
.then(data => console.log('Schema de pedidos:', data))
.catch(console.error);
