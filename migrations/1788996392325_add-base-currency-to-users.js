exports.up = (pgm) => {
  pgm.addColumns('users', {
    base_currency: {
      type: 'varchar(10)',
      notNull: true,
      default: 'ARS',
      check: "base_currency IN ('ARS', 'USD', 'EUR')",
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('users', ['base_currency']);
};