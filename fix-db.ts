import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

async function fix() {
  const client = createClient({
    url: 'file:./local.db',
  });

  try {
    console.log('Adding image_url column to questions table...');
    await client.execute('ALTER TABLE questions ADD COLUMN image_url TEXT;');
    console.log('Column added successfully!');
  } catch (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('Column already exists.');
    } else {
      console.error('Failed to add column:', err);
    }
  } finally {
    process.exit(0);
  }
}

fix();
