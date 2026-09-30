import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

async function importData() {
  const url = 'mongodb://localhost:27017/UniMap';
  const client = new MongoClient(url);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db('UniMap');
    
    const collections = ['buildings', 'floors', 'nodes', 'edges'];
    
    for (const coll of collections) {
      const dataPath = path.join(process.cwd(), 'init-data', `${coll}.json`);
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      
      const collection = db.collection(coll);
      // Clear existing data to avoid duplicates
      await collection.deleteMany({});
      
      // Insert new data
      if (data.length > 0) {
        await collection.insertMany(data);
        console.log(`Imported ${data.length} records into ${coll}`);
      }
    }
    
    console.log('Import complete');
  } catch (e) {
    console.error('Error importing:', e);
  } finally {
    await client.close();
  }
}

importData();
