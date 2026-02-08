const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = "mongodb+srv://admin:vEzLx7wdVAvRZzag@ymatch.hecqj8p.mongodb.net/ymatch?retryWrites=true&w=majority";
const MONGODB_DB = "ymatch";

async function createAdminUser() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    const usersCollection = db.collection('users');
    
    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ email: 'admin@ymatch.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('\n=== ADMIN CREDENTIALS ===');
      console.log('Email: admin@ymatch.com');
      console.log('Password: Admin@2024');
      console.log('========================\n');
      return;
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('Admin@2024', 10);
    
    const adminUser = {
      email: 'admin@ymatch.com',
      password: hashedPassword,
      name: 'Admin User',
      phone: '+237600000000',
      role: 'admin',
      emailVerified: true,
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await usersCollection.insertOne(adminUser);
    
    console.log('Admin user created successfully!');
    console.log('\n=== ADMIN CREDENTIALS ===');
    console.log('Email: admin@ymatch.com');
    console.log('Password: Admin@2024');
    console.log('User ID:', result.insertedId);
    console.log('========================\n');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await client.close();
  }
}

createAdminUser();
