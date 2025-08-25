# Appwrite Setup Guide

## 🚀 Setting up Appwrite for Fantasy Football Draft App

### Step 1: Create Appwrite Project

1. Go to [Appwrite Cloud](https://cloud.appwrite.io) and create an account
2. Create a new project called "Fantasy Football Draft"
3. Copy your Project ID from the project dashboard

### Step 2: Configure Environment Variables

1. Update your `.env` file in the frontend directory:
```bash
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-actual-project-id-here
```

### Step 3: Create Database

1. In your Appwrite console, go to "Databases"
2. Create a new database called `fantasy-football`
3. Note the Database ID (should be `fantasy-football`)

### Step 4: Create Collections

#### Collection 1: Drafts
- **Collection ID**: `drafts`
- **Name**: Drafts
- **Permissions**: 
  - Create: Users
  - Read: Users (document-level permission)
  - Update: Users (document-level permission)  
  - Delete: Users (document-level permission)

**Attributes**:
```
userId (string, required, size: 255)
draftName (string, required, size: 255)
status (enum, required, elements: ["draft", "in-progress", "completed", "paused"])
config (relationship/json - store as JSON string)
currentPick (integer, required, min: 1)
currentRound (integer, required, min: 1)  
currentTeam (integer, required, min: 1)
isDraftStarted (boolean, required, default: false)
teams (relationship/json - store as JSON string)
draftBoard (relationship/json - store as JSON string)
```

#### Collection 2: Draft History
- **Collection ID**: `draft-history`
- **Name**: Draft History
- **Permissions**: Same as Drafts

**Attributes**:
```
draftId (string, required, size: 255)
userId (string, required, size: 255)
picks (relationship/json - store as JSON string)
```

### Step 5: Set Document-Level Permissions

For both collections, create these permission rules:

1. **Create Documents**: 
   - Role: `user:*`
   - Permission: `create`

2. **Read Documents**:
   - Role: `user:userId` (where userId is the document's userId field)
   - Permission: `read`

3. **Update Documents**:
   - Role: `user:userId` (where userId is the document's userId field)
   - Permission: `update`

4. **Delete Documents**:
   - Role: `user:userId` (where userId is the document's userId field)  
   - Permission: `delete`

### Step 6: Configure Authentication

1. In Appwrite console, go to "Authentication"
2. Enable "Email/Password" provider
3. Optional: Configure other providers (Google, GitHub, etc.)
4. Set password requirements as needed

### Step 7: Update Your App Configuration

Replace the placeholder in your `.env` file with your actual Appwrite Project ID:

```bash
VITE_APPWRITE_PROJECT_ID=65f1234567890abcdef12345  # Your actual Project ID
```

### Step 8: Run the Database Setup Script

Use the automated setup script to create your collections:

```bash
# From the root directory
npm run setup-database

# Or directly from the backend directory
cd backend && node setup-database.js
```

This script will:
- Create the `drafts` collection with all required attributes
- Create the `draft-history` collection with all required attributes  
- Set up proper permissions for both collections
- Handle existing collections gracefully

### Step 9: Test the Integration

1. Start your development servers:
```bash
npm run dev
```

2. Try creating a user account
3. Create a draft and verify it saves to the database
4. Check the Appwrite console to see your data

## 🔧 Troubleshooting

- **Environment Variables**: Make sure to restart your dev server after updating .env
- **CORS**: Appwrite Cloud should handle CORS automatically for localhost
- **Permissions**: Double-check document-level permissions are set correctly
- **Network**: Ensure you can reach cloud.appwrite.io from your network

## 📚 Additional Resources

- [Appwrite Documentation](https://appwrite.io/docs)
- [Appwrite React SDK](https://appwrite.io/docs/quick-starts/react)
- [Database Permissions Guide](https://appwrite.io/docs/permissions)

Happy Drafting! 🏈
