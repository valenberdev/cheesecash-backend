exports.up = (pgm) => {
  pgm.createTable("transactions", {
    id: "id",
    from_user_id: {
      type: "integer",
      notNull: true,
      references: "users",
      onDelete: "RESTRICT",
    },
    to_user_id: {
      type: "integer",
      notNull: true,
      references: "users",
      onDelete: "RESTRICT",
    },
    currency: {
      type: "varchar(10)",
      notNull: true,
      check: "currency IN ('ARS', 'USD', 'EUR', 'BTC')",
    },
    amount: {
      type: "numeric(20, 8)",
      notNull: true,
      check: "amount > 0",
    },
    status: {
      type: "varchar(20)",
      notNull: true,
      default: "completed",
      check: "status IN ('pending', 'completed', 'failed')",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.addConstraint("transactions", "no_self_transfer", {
    check: "from_user_id != to_user_id",
  });

  pgm.createIndex("transactions", "from_user_id");
  pgm.createIndex("transactions", "to_user_id");
};

exports.down = (pgm) => {
  pgm.dropTable("transactions");
};
