const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzcWh6YXRzdXltam9lYnpmaHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTUyMTMsImV4cCI6MjA5NDYzMTIxM30.bFCJBY9PAa8WviEwE8HdO2TjE3ytYM3sD6qFgxJ0pPM';
const SUPA_URL = 'https://wsqhzatsuymjoebzfhpg.supabase.co';

(async () => {
  // Try to read coca_config via REST
  var r = await fetch(SUPA_URL + '/rest/v1/coca_config?select=*&limit=3', {
    headers: { 'apikey': TOKEN, 'Authorization': 'Bearer ' + TOKEN }
  });
  console.log('REST status:', r.status, r.statusText);
  var text = await r.text();
  console.log('REST response (first 1000 chars):', text.substring(0, 1000));

  // Also try with key filter
  r = await fetch(SUPA_URL + '/rest/v1/coca_config?key=eq.cocapay_v3_omega&select=data&limit=1', {
    headers: { 'apikey': TOKEN, 'Authorization': 'Bearer ' + TOKEN }
  });
  console.log('\nKey-filtered status:', r.status, r.statusText);
  text = await r.text();
  console.log('Response:', text.substring(0, 2000));
})();
