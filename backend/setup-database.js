const { Client, Databases, Permission, Role, ID } = require('node-appwrite')
const dotenv = require('dotenv')

// Load environment variables from frontend/.env
dotenv.config({ path: './frontend/.env' })

const client = new Client()
const databases = new Databases(client)

// Configuration from your .env file
const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1'
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY
const DATABASE_ID = '68aca4e90038b2ac2c28'

if (!APPWRITE_PROJECT_ID) {
  console.error('❌ VITE_APPWRITE_PROJECT_ID not found in environment variables')
  process.exit(1)
}

if (!APPWRITE_API_KEY) {
  console.error('❌ APPWRITE_API_KEY not found in environment variables')
  console.error('💡 Please add your API key to frontend/.env file')
  process.exit(1)
}

// Initialize Appwrite client
client
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY)

console.log('🚀 Starting database setup...')
console.log(`📊 Database ID: ${DATABASE_ID}`)
console.log(`🔧 Project ID: ${APPWRITE_PROJECT_ID}`)

async function createDraftsCollection() {
  try {
    console.log('\n📝 Creating "drafts" collection...')
    
    // Create the collection
    const collection = await databases.createCollection(
      DATABASE_ID,
      'drafts', // Collection ID
      'Drafts', // Collection Name
      [
        Permission.create(Role.users()),
        Permission.read(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]
    )
    
    console.log('✅ Collection "drafts" created successfully')
    
    // Create attributes
    const attributes = [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'draftName', type: 'string', size: 255, required: true },
      { key: 'status', type: 'enum', elements: ['draft', 'in-progress', 'completed', 'paused'], required: true },
      { key: 'config', type: 'string', size: 65535, required: true },
      { key: 'currentPick', type: 'integer', min: 1, max: 999, required: true },
      { key: 'currentRound', type: 'integer', min: 1, max: 50, required: true },
      { key: 'currentTeam', type: 'integer', min: 1, max: 50, required: true },
      { key: 'isDraftStarted', type: 'boolean', required: true, default: false },
      { key: 'teams', type: 'string', size: 65535, required: true },
      { key: 'draftBoard', type: 'string', size: 65535, required: true }
    ]
    
    for (const attr of attributes) {
      console.log(`  📌 Creating attribute: ${attr.key}`)
      
      try {
        if (attr.type === 'string') {
          await databases.createStringAttribute(
            DATABASE_ID,
            'drafts',
            attr.key,
            attr.size,
            attr.required
          )
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(
            DATABASE_ID,
            'drafts',
            attr.key,
            attr.required,
            attr.min,
            attr.max
          )
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(
            DATABASE_ID,
            'drafts',
            attr.key,
            false, // Make it not required so we can set default
            attr.default
          )
        } else if (attr.type === 'enum') {
          await databases.createEnumAttribute(
            DATABASE_ID,
            'drafts',
            attr.key,
            attr.elements,
            attr.required
          )
        }
        
        console.log(`    ✅ ${attr.key} created`)
        
        // Wait a bit between attribute creations to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (error) {
        if (error.message?.includes('already exists')) {
          console.log(`    ⚠️  ${attr.key} already exists, skipping`)
        } else {
          console.error(`    ❌ Error creating ${attr.key}:`, error.message)
        }
      }
    }
    
    console.log('✅ Drafts collection setup complete!')
    
  } catch (error) {
    if (error.message?.includes('already exists')) {
      console.log('⚠️  Collection "drafts" already exists, updating attributes...')
      
      // Still try to create missing attributes
      const attributes = [
        { key: 'userId', type: 'string', size: 255, required: true },
        { key: 'draftName', type: 'string', size: 255, required: true },
        { key: 'status', type: 'enum', elements: ['draft', 'in-progress', 'completed', 'paused'], required: true },
        { key: 'config', type: 'string', size: 65535, required: true },
        { key: 'currentPick', type: 'integer', min: 1, max: 999, required: true },
        { key: 'currentRound', type: 'integer', min: 1, max: 50, required: true },
        { key: 'currentTeam', type: 'integer', min: 1, max: 50, required: true },
        { key: 'isDraftStarted', type: 'boolean', required: true, default: false },
        { key: 'teams', type: 'string', size: 65535, required: true },
        { key: 'draftBoard', type: 'string', size: 65535, required: true }
      ]
      
      for (const attr of attributes) {
        try {
          console.log(`  📌 Checking attribute: ${attr.key}`)
          
          if (attr.type === 'string') {
            await databases.createStringAttribute(
              DATABASE_ID,
              'drafts',
              attr.key,
              attr.size,
              attr.required
            )
          } else if (attr.type === 'integer') {
            await databases.createIntegerAttribute(
              DATABASE_ID,
              'drafts',
              attr.key,
              attr.required,
              attr.min,
              attr.max
            )
          } else if (attr.type === 'boolean') {
            await databases.createBooleanAttribute(
              DATABASE_ID,
              'drafts',
              attr.key,
              attr.required,
              attr.default
            )
          } else if (attr.type === 'enum') {
            await databases.createEnumAttribute(
              DATABASE_ID,
              'drafts',
              attr.key,
              attr.elements,
              attr.required
            )
          }
          
          console.log(`    ✅ ${attr.key} created`)
          
        } catch (error) {
          if (error.message?.includes('already exists')) {
            console.log(`    ✅ ${attr.key} already exists`)
          } else {
            console.error(`    ❌ Error creating ${attr.key}:`, error.message)
          }
        }
        
        // Wait between requests
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } else {
      console.error('❌ Error creating drafts collection:', error.message)
    }
  }
}

async function createDraftHistoryCollection() {
  try {
    console.log('\n📝 Creating "draft-history" collection...')
    
    const collection = await databases.createCollection(
      DATABASE_ID,
      'draft-history',
      'Draft History',
      [
        Permission.create(Role.users()),
        Permission.read(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]
    )
    
    console.log('✅ Collection "draft-history" created successfully')
    
    // Create attributes
    const attributes = [
      { key: 'draftId', type: 'string', size: 255, required: true },
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'picks', type: 'string', size: 65535, required: true }
    ]
    
    for (const attr of attributes) {
      console.log(`  📌 Creating attribute: ${attr.key}`)
      
      try {
        await databases.createStringAttribute(
          DATABASE_ID,
          'draft-history',
          attr.key,
          attr.size,
          attr.required
        )
        
        console.log(`    ✅ ${attr.key} created`)
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (error) {
        if (error.message?.includes('already exists')) {
          console.log(`    ⚠️  ${attr.key} already exists, skipping`)
        } else {
          console.error(`    ❌ Error creating ${attr.key}:`, error.message)
        }
      }
    }
    
    console.log('✅ Draft History collection setup complete!')
    
  } catch (error) {
    if (error.message?.includes('already exists')) {
      console.log('⚠️  Collection "draft-history" already exists')
    } else {
      console.error('❌ Error creating draft-history collection:', error.message)
    }
  }
}

async function main() {
  try {
    console.log('🏗️  Setting up Fantasy Football Draft Database...\n')
    
    await createDraftsCollection()
    await createDraftHistoryCollection()
    
    console.log('\n🎉 Database setup complete!')
    console.log('\n📋 Next steps:')
    console.log('1. ✅ Database and collections are ready')
    console.log('2. 🔄 Refresh your app - it should now work!')
    console.log('3. 🏈 Try creating a new draft')
    
  } catch (error) {
    console.error('💥 Setup failed:', error.message)
    process.exit(1)
  }
}

// Run the setup
main()
