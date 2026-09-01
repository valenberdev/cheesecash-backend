exports.up = (pgm) => {
  pgm.addColumns('users', {
    reset_token: { type: 'text', unique: true },
    reset_token_expires: { type: 'timestamptz' },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('users', ['reset_token', 'reset_token_expires']);
};