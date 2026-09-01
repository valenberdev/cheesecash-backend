exports.up = (pgm) => {
  pgm.addColumns('transactions', {
    confirmation_token: { type: 'text', unique: true },
    expires_at: { type: 'timestamptz' },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('transactions', ['confirmation_token', 'expires_at']);
};