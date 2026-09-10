function timestamp(): string {
  return new Date().toISOString();
}

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    console.log(`[${timestamp()}] [INFO] ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[${timestamp()}] [ERROR] ${message}`, ...args);
  },
};