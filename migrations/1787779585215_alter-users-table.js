exports.up = (pgm) => {
  pgm.addColumns('users', {
    google_id: { type: 'text', unique: true },
    auth_provider: {
      type: 'varchar(20)',
      notNull: true,
      default: 'local',
      check: "auth_provider IN ('local', 'google')",
    },
  });

  pgm.alterColumn('users', 'password_hash', {
    notNull: false,
  });

  pgm.alterColumn('users', 'password_hash', {
    type: 'text',
  });
};

exports.down = (pgm) => {
  pgm.alterColumn('users', 'password_hash', {
    notNull: true,
  });

  pgm.dropColumns('users', ['google_id', 'auth_provider']);
};