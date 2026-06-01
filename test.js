const BASE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Origin': 'https://finance.yahoo.com',
  'Referer': 'https://finance.yahoo.com/',
};
async function test() {
  const r1 = await fetch('https://finance.yahoo.com', { headers: BASE_HEADERS });
  const cookies = r1.headers.getSetCookie?.() || [];
  const cookie = cookies.map(c => c.split(';')[0]).join('; ');
  const r2 = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
    headers: { ...BASE_HEADERS, Cookie: cookie }
  });
  const crumb = await r2.text();
  console.log('Crumb:', crumb);
  
  const url = `https://query2.finance.yahoo.com/v11/finance/quoteSummary/AAPL?modules=summaryDetail&crumb=${encodeURIComponent(crumb)}`;
  const r3 = await fetch(url, { headers: { ...BASE_HEADERS, Cookie: cookie }});
  if(r3.ok) {
     const data = await r3.json();
     console.log('Success:', !!data.quoteSummary.result[0].summaryDetail);
  } else {
     console.log('Fail:', r3.status);
  }
}
test();
