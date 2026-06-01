import axios from 'axios';

const BASE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Origin': 'https://finance.yahoo.com',
  'Referer': 'https://finance.yahoo.com/',
};

async function test() {
  try {
    const r1 = await axios.get('https://finance.yahoo.com', {
      headers: BASE_HEADERS,
      maxRedirects: 0,
      validateStatus: () => true,
      maxHeaderSize: 65536
    });
    
    const setCookie = r1.headers['set-cookie'];
    const cookie = setCookie ? setCookie.map(c => c.split(';')[0]).join('; ') : '';
    console.log('Cookie obtained');

    const r2 = await axios.get('https://query2.finance.yahoo.com/v1/test/getcrumb', {
      headers: { ...BASE_HEADERS, Cookie: cookie }
    });
    const crumb = r2.data;
    console.log('Crumb:', crumb);
    
    const modules = 'summaryDetail,defaultKeyStatistics,financialData,assetProfile';
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/AAPL?modules=${modules}&crumb=${encodeURIComponent(crumb)}`;
    const r3 = await axios.get(url, { headers: { ...BASE_HEADERS, Cookie: cookie } });
    
    console.log('Success:', !!r3.data.quoteSummary.result[0].summaryDetail);
  } catch (err) {
    console.error('Fail:', err.message);
  }
}
test();
