const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function seedDemoUsers() {
  const passwordHash = await bcrypt.hash("123456", 10);

  const operations = Array.from({ length: 24 }, (_, index) => {
    const houseNumber = String(index + 1);
    return {
      updateOne: {
        filter: { houseNumber },
        update: {
          $set: {
            houseNumber,
            name: `Usuario ${houseNumber}`,
            email: `usuario${houseNumber}@test.local`,
            passwordHash,
          },
        },
        upsert: true,
      },
    };
  });

  const result = await User.bulkWrite(operations);
  const created = result.upsertedCount || 0;
  const updated = result.modifiedCount || 0;

  console.log(
    `[seed] Usuarios de prueba 1-24 preparados (creados: ${created}, actualizados: ${updated}).`
  );
}

module.exports = { seedDemoUsers };
