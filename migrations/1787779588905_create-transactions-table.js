exports.up = (pgm) => {
  pgm.createTable('transactions', {
    id: 'id',
    wallet_id: {
      type: 'integer',
      notNull: true,
      references: 'wallets',
      onDelete: 'RESTRICT',
    },
    type: {
      type: 'varchar(10)',
      notNull: true,
      check: "type IN ('buy', 'sell', 'exchange')",
    },
    from_currency: {
      type: 'varchar(10)',
      check: "from_currency IN ('ARS', 'USD', 'EUR', 'BTC')",
    },
    to_currency: {
      type: 'varchar(10)',
      check: "to_currency IN ('ARS', 'USD', 'EUR', 'BTC')",
    },
    from_amount: {
      type: 'numeric(18, 8)',
      check: 'from_amount > 0',
    },
    to_amount: {
      type: 'numeric(18, 8)',
      check: 'to_amount > 0',
    },
    exchange_rate_used: {
      type: 'numeric(18, 8)',
      notNull: true,
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'pending',
      check: "status IN ('pending', 'success', 'failed')",
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('transactions', 'wallet_id');
};

exports.down = (pgm) => {
  pgm.dropTable('transactions');
};