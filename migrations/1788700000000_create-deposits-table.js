exports.up = (pgm) => {
  pgm.createTable('deposits', {
    id: 'id',
    wallet_id: {
      type: 'integer',
      notNull: true,
      references: '"wallets"',
      onDelete: 'restrict',
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
    // Identificador del origen del depósito. En modo demo lo genera el
    // servidor; cuando entre una pasarela real será el id del pago.
    // La restricción de unicidad es lo que impide acreditar dos veces
    // el mismo depósito si el pedido se repite.
    reference: {
      type: 'varchar(80)',
      notNull: true,
      unique: true,
    },
    status: {
      type: 'varchar(10)',
      notNull: true,
      default: 'success',
      check: "status IN ('success', 'failed')",
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('deposits', 'wallet_id');
};

exports.down = (pgm) => {
  pgm.dropTable('deposits');
};