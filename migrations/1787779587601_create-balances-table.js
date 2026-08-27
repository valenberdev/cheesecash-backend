exports.up = (pgm) => {
  pgm.createTable('balances', {
    id: 'id',
    wallet_id: {
      type: 'integer',
      notNull: true,
      references: 'wallets',
      onDelete: 'CASCADE',
    },
    currency: {
      type: 'varchar(10)',
      notNull: true,
      check: "currency IN ('ARS', 'USD', 'EUR', 'BTC')",
    },
    amount: {
      type: 'numeric(18, 8)',
      notNull: true,
      default: 0,
      check: 'amount >= 0',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.addConstraint('balances', 'unique_wallet_currency', {
    unique: ['wallet_id', 'currency'],
  });
};

exports.down = (pgm) => {
  pgm.dropTable('balances');
};