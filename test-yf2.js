import YahooFinanceClass from 'yahoo-finance2';
const yahooFinance = new YahooFinanceClass();
yahooFinance.quoteSummary('AAPL', { modules: ['summaryDetail'] })
  .then(d => console.log('Success:', !!d.summaryDetail))
  .catch(e => console.error('Error:', e.message));
