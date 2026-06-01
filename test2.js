import { YahooFinance } from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function test() {
  try {
    const modules = ['summaryDetail', 'defaultKeyStatistics', 'financialData', 'assetProfile'];
    const data = await yahooFinance.quoteSummary('AAPL', { modules });
    console.log('Success:', !!data.summaryDetail);
  } catch (err) {
    console.error('Fail:', err.message);
  }
}
test();
