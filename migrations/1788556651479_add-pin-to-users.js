exports.up = (pgm) => {
  pgm.addColumns('users', {
    user_pin: { type: 'varchar(6)', unique: true },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('users', ['user_pin']);
}; 