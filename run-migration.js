const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function main() {
  // Use the same DB path as the app
  const DB_PATH = path.join(process.cwd(), 'data', 'subscriptions.db');
  
  console.log('Opening database...');
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });
  
  try {
    console.log('Checking if background_url column exists...');
    const tableInfo = await db.all("PRAGMA table_info(user_configuration)");
    const backgroundUrlExists = tableInfo.some(col => col.name === 'background_url');
    
    if (!backgroundUrlExists) {
      console.log('Adding background_url column...');
      await db.exec("ALTER TABLE user_configuration ADD COLUMN background_url TEXT");
      
      console.log('Setting default background URL...');
      await db.run(
        "UPDATE user_configuration SET background_url = ? WHERE background_url IS NULL",
        ['https://cdn.midjourney.com/1f46fbfe-102d-49d8-aa96-b54f1ea9a19a/0_0.png']
      );
      console.log('Migration completed successfully!');
    } else {
      console.log('Column already exists. No migration needed.');
    }
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await db.close();
  }
}

main(); 