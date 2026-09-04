exports.up = (pgm) => {
  pgm.addColumns('users', {
    birth_date: { type: 'date' },
    threshold_ars: { type: 'numeric(18,2)', notNull: true, default: 500000 },
    threshold_usd: { type: 'numeric(18,2)', notNull: true, default: 500 },
    threshold_eur: { type: 'numeric(18,2)', notNull: true, default: 500 },
    threshold_btc_usd: { type: 'numeric(18,2)', notNull: true, default: 1000 },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('users', ['birth_date', 'threshold_ars', 'threshold_usd', 'threshold_eur', 'threshold_btc_usd']);
};