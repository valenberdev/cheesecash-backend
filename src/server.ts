import 'dotenv/config';
import { env } from './config/env';
import { httpServer } from './config/socket';

httpServer.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});