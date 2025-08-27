import { Client, Databases } from 'node-appwrite'
import dotenv from 'dotenv'

// Load environment variables from frontend/.env
dotenv.config({ path: '../frontend/.env' })

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

console.log('🔄 Starting migration to remove isDraftStarted field...')
console.log(`📊 Database ID: ${DATABASE_ID}`)
console.log(`🔧 Project ID: ${APPWRITE_PROJECT_ID}`)

async function deleteIsDraftStartedAttribute() {
  try {
    console.log('\n🗑️  Attempting to delete "isDraftStarted" attribute from drafts collection...')
    
    // Try to delete the attribute
    await databases.deleteAttribute(DATABASE_ID, 'drafts', 'isDraftStarted')
    
    console.log('✅ Successfully deleted "isDraftStarted" attribute!')
    
  } catch (error) {
    if (error.message?.includes('Attribute not found') || error.message?.includes('does not exist')) {
      console.log('ℹ️  Attribute "isDraftStarted" does not exist - already migrated or never existed')
    } else {
      console.error('❌ Error deleting isDraftStarted attribute:', error.message)
      
      // Common reasons why deletion might fail
      if (error.message?.includes('dependent') || error.message?.includes('index')) {
        console.log('\n💡 This might fail if there are indexes or relationships on this attribute.')
        console.log('   You may need to delete indexes first or manually remove the attribute via Appwrite console.')
      }
    }
  }
}

async function main() {
  try {
    console.log('🔄 Migrating database schema...\n')
    
    await deleteIsDraftStartedAttribute()
    
    console.log('\n🎉 Migration complete!')
    console.log('\n📋 What happened:')
    console.log('✅ Removed isDraftStarted boolean field')
    console.log('✅ Draft state is now tracked via the "status" field')
    console.log('   - status: "draft" = not started')
    console.log('   - status: "in-progress" = draft has begun')
    console.log('   - status: "completed" = draft finished')
    console.log('\n🔄 Your app now uses the simplified schema!')
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message)
    process.exit(1)
  }
}

// Run the migration
main()
