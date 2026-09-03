exports.up = (pgm) => {
  pgm.createTable('transfers', {
    id: 'id',
    from_wallet_id: {
      type: 'integer',
      notNull: true,
      references: 'wallets',
      onDelete: 'RESTRICT',
    },
    to_wallet_id: {
      type: 'integer',
      notNull: true,
      references: 'wallets',
      onDelete: 'RESTRICT',
    },
    currency: {
      type: 'varchar(10)',
      notNull: true,
      check: "currency IN ('ARS', 'USD', 'EUR', 'BTC')",
    },
    amount: {
      type: 'numeric(18, 8)',
      notNull: true,
      check: 'amount > 0',
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'pending',
      check: "status IN ('pending', 'success', 'failed')",
    },
    confirmation_token: { type: 'text', unique: true },
    expires_at: { type: 'timestamptz' },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.addConstraint('transfers', 'no_self_transfer', {
    check: 'from_wallet_id != to_wallet_id',
  });

  pgm.createIndex('transfers', 'from_wallet_id');
  pgm.createIndex('transfers', 'to_wallet_id');
};

exports.down = (pgm) => {
  pgm.dropTable('transfers');
};