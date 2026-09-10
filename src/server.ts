import 'dotenv/config';
import { env } from './config/env';
import { httpServer } from './config/socket';
import { logger } from './utils/logger';

httpServer.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);
});