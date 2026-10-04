import 'dotenv/config';
import { repository } from '../src/server/repository.js';
import { initPostgres } from '../src/server/postgres.js';

async function main() {
  const newPin = process.argv[2];
  if (!newPin || newPin.trim().length < 4) {
    console.error('Usage: npm run set-admin-pin <new-pin>');
    console.error('Example: npm run set-admin-pin 9482');
    process.exit(1);
  }

  try {
    const cats = repository.findAllCategories();
    const prods = repository.findAllProducts();
    await initPostgres(cats, prods);
  } catch {
    // local fallback
  }

  await repository.setAdminPin(newPin.trim());
  console.log(`✅ Success! Owner Admin PIN has been updated.`);
  console.log(`🔑 New PIN: ${newPin.trim()}`);
  console.log(`🔒 Log in at: https://nectar-wellness.onrender.com/admin`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error updating Admin PIN:', err);
  process.exit(1);
});
