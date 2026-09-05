import 'dotenv/config';
import { getExchangeRate } from './src/services/exchangeRate.service';

async function run() {
  console.log('USD -> ARS:', await getExchangeRate('USD', 'ARS'));
  console.log('ARS -> USD:', await getExchangeRate('ARS', 'USD'));
}

run().catch((error) => console.error('Error:', error.message));