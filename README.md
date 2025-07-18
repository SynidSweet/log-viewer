# Universal Log Viewer

A modern, React-based log viewer application that allows you to collect, store, and analyze logs from any application through a simple API. Built with Next.js and deployed on Vercel.

![Log Viewer Screenshot](https://raw.githubusercontent.com/username/log-viewer/main/public/screenshot.png)

## ✨ Features

- **Project Management**: Create and manage multiple projects for different applications
- **Real-time Log Viewing**: View logs in real-time with automatic updates
- **Advanced Filtering**: Filter logs by level, type, content, and tags with powerful search and multi-select dropdowns
- **Enhanced Sort Controls**: Sort logs by timestamp (ascending/descending) with keyboard shortcuts (press 's')
- **Multi-Select Copy**: Select multiple log entries with checkboxes and copy formatted logs to clipboard
- **Tag-Based Organization**: Use `_tags` arrays in log data for visual badges and advanced filtering
- **Structured Log Details**: View formatted JSON data with collapsible tree view
- **Performance Optimized**: Smooth scrolling through large log datasets with minimal animations
- **Log Collection API**: Send logs from any application via a simple REST API
- **Multi-line Support**: Process multiple log entries in a single API request
- **Modern UI**: Clean, responsive interface built with shadcn/ui components
- **Google Authentication**: Secure user access with Google Sign-In while keeping API endpoints public

## 🛠️ Technologies

- **Next.js**: React framework with App Router
- **TypeScript**: Static type checking
- **shadcn/ui**: UI component library
- **Turso SQLite**: For persistent storage with edge performance
- **Vercel**: Hosting and deployment platform
- **Tailwind CSS**: Utility-first CSS framework
- **NextAuth.js**: Authentication with Google provider

## 📋 Prerequisites

- Node.js 18.x or later
- npm or yarn
- Vercel account (for deployment)
- Turso database (for persistent storage)
- Google Developer account (for authentication)

## 🚀 Getting Started

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/username/log-viewer.git
   cd log-viewer
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env.local` file with the following variables:
   ```
   TURSO_DATABASE_URL=your_turso_database_url
   TURSO_AUTH_TOKEN=your_turso_auth_token
   
   # Authentication (for Google Sign-In)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```
   
   > **Note**: Generate a secure NEXTAUTH_SECRET using `openssl rand -base64 32`
   >
   > For local development with Google authentication, add these URLs in Google Cloud Console:
   > - Authorized JavaScript origin: `http://localhost:3000`
   > - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to access the application.

### Deployment on Vercel

1. Push your code to a GitHub repository.

2. Connect your repository to Vercel:
   - Go to [Vercel](https://vercel.com) and sign in
   - Click "Add New..." > "Project"
   - Select your GitHub repository
   - Configure environment variables
   - Click "Deploy"

3. Set up Turso Database:
   - Create a Turso account at [turso.tech](https://turso.tech)
   - Create a new database
   - Get your database URL and auth token
   - Add these to your Vercel environment variables:
     - TURSO_DATABASE_URL
     - TURSO_AUTH_TOKEN

4. Set up Google Authentication:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or use an existing one
   - Navigate to "APIs & Services" > "Credentials"
   - Create an OAuth 2.0 Client ID for a web application
   - Add authorized JavaScript origins: `https://your-vercel-domain.vercel.app`
   - Add authorized redirect URIs: `https://your-vercel-domain.vercel.app/api/auth/callback/google`
   - Add the credentials to your Vercel environment variables:
     - GOOGLE_CLIENT_ID
     - GOOGLE_CLIENT_SECRET
     - NEXTAUTH_SECRET (generate with `openssl rand -base64 32`)
     - NEXTAUTH_URL (your Vercel deployment URL)
   - To restrict access to specific users, add these optional variables:
     - ALLOWED_EMAILS - comma-separated list of allowed email addresses (e.g., `user1@example.com,user2@example.com`)
     - ALLOWED_DOMAINS - comma-separated list of allowed email domains (e.g., `company.com,myorg.org`)
     - If neither variable is set, all authenticated Google accounts will be allowed

## 📖 Usage

### Creating Projects

1. Navigate to the home page
2. Click "Create Project"
3. Enter project name and description
4. Click "Create Project"
5. Note your project ID and API key for sending logs

### Viewing Logs

1. Select a project from the projects list (left column)
2. Choose a log from the log entries list (middle column)
3. View detailed log information in the details panel (right column)

**Enhanced Navigation Features:**
- **Sort Control**: Click the sort button or press 's' to toggle timestamp sorting (ascending/descending)
- **Level Filtering**: Use checkboxes to show/hide specific log levels (LOG, INFO, WARN, ERROR, DEBUG)
- **Tag Filtering**: Use the Tags dropdown for multi-select filtering by log tags
- **Search**: Filter logs and entries using the search boxes
- **Multi-Select**: Use checkboxes next to each entry to select multiple logs
- **Copy to Clipboard**: Click "Copy (X)" button to copy selected entries in formatted text
- **Visual Selection**: Selected items are highlighted with blue background and left border

### Sending Logs

Logs can be sent to the application using the REST API:

```javascript
// Example in JavaScript
async function sendLogs(projectId, apiKey, logContent, comment) {
  try {
    const response = await fetch('https://your-log-viewer.vercel.app/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        apiKey,
        content: logContent,
        comment: comment || ''
      }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to send logs:', error);
    throw error;
  }
}

// Usage examples:
// Single log entry
await sendLogs('project-id', 'api-key', '[2025-04-29, 08:40:24] [LOG] Application started');

// Log with data
await sendLogs('project-id', 'api-key', '[2025-04-29, 08:40:24] [ERROR] Database error - {"code": "ER_DUP_ENTRY"}');

// Log with tags for filtering
await sendLogs('project-id', 'api-key', '[2025-04-29, 08:40:24] [ERROR] Payment failed - {"transactionId": "txn_123", "error": "insufficient_funds", "_tags": ["payment", "error", "critical"]}');

// Multiple log entries
const multiLineLogs = `[2025-04-29, 08:40:24] [INFO] Processing batch job
[2025-04-29, 08:40:25] [INFO] Processed 100 records
[2025-04-29, 08:40:26] [INFO] Batch job completed`;
await sendLogs('project-id', 'api-key', multiLineLogs);
```

### Authentication

The application uses Google authentication to secure the user interface while keeping the API endpoints public. This means:
- All UI routes are protected behind Google login
- API endpoints remain accessible for integrations with your applications

## 📝 API Documentation

### `POST /api/logs`

Send logs to the server.

**Request Body:**

```json
{
  "projectId": "your-project-id",       // Required
  "apiKey": "your-project-api-key",     // Required
  "content": "log content",             // Required (see examples below)
  "comment": "Optional comment"         // Optional
}
```

**Content Examples:**

```json
// Simple log without data
"content": "[2025-04-29, 08:40:24] [LOG] User logged in successfully"

// Log with JSON data
"content": "[2025-04-29, 08:40:24] [ERROR] Payment failed - {\"code\": 500, \"reason\": \"timeout\"}"

// Log with tags for filtering
"content": "[2025-04-29, 08:40:24] [ERROR] Payment failed - {\"transactionId\": \"txn_123\", \"error\": \"insufficient_funds\", \"_tags\": [\"payment\", \"error\", \"critical\"]}"

// Log with nested JSON data
"content": "[2025-04-29, 08:40:24] [DEBUG] API request completed - {\"user\": {\"id\": 123, \"name\": \"John\"}, \"response\": {\"status\": 200, \"data\": {\"items\": [1, 2, 3]}}}"

// Multiple log entries in one request
"content": "[2025-04-29, 08:40:24] [INFO] Server started\n[2025-04-29, 08:40:25] [INFO] Database connected\n[2025-04-29, 08:40:26] [INFO] Ready to accept connections"
```

**Response:**

```json
{
  "success": true,
  "logId": "generated-log-id",
  "timestamp": "2025-04-29T08:40:24Z"
}
```

**Error Responses:**

- `400 Bad Request`: Missing required fields or invalid log format
- `403 Forbidden`: Invalid API key
- `404 Not Found`: Invalid project ID
- `500 Internal Server Error`: Server-side error

### Log Format

The application supports logs in the following format:

```
[YYYY-MM-DD, HH:MM:SS] [LEVEL] MESSAGE
[YYYY-MM-DD, HH:MM:SS] [LEVEL] MESSAGE - DATA
```

- `TIMESTAMP`: Date and time in format `YYYY-MM-DD, HH:MM:SS`
- `LEVEL`: Log level - must be one of: `LOG`, `ERROR`, `INFO`, `WARN`, `DEBUG`
- `MESSAGE`: Log message text (required)
- `DATA`: Additional data after the hyphen (optional)

**Features:**
- The `- DATA` portion is completely optional
- Supports multiple log entries in a single request (separated by newlines)
- Each line must follow the format above
- DATA can contain nested JSON objects of any complexity
- Include `_tags` array in JSON data for tag-based filtering and organization

### Extended Logging

The application supports extended logging with detailed data. When parsing the DATA portion of your logs, if you include an `_extended` field in your JSON data, it will be shown in a separate "Extended Data" tab in the log details view:

```javascript
// Example of sending a log with extended data
const logWithExtendedData = {
  projectId: "your-project-id",
  apiKey: "your-project-api-key",
  content: "[2025-04-29, 08:40:24] [ERROR] Database connection failed - {\"error\":\"timeout\",\"_extended\":{\"stackTrace\":\"Error: Connection timed out\\n    at Database.connect (/app/db.js:42:15)\\n    at Server.start (/app/server.js:28:7)\",\"connectionDetails\":{\"host\":\"db.example.com\",\"port\":5432,\"user\":\"app_user\",\"timeout\":30}}}"
};

await fetch('https://your-log-viewer.vercel.app/api/logs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(logWithExtendedData)
});
```

When viewed in the log viewer, this log will show:
- Basic error information in the "Details" tab
- Detailed stack trace and connection information in the "Extended Data" tab

This feature is useful for:
- Keeping log messages concise while still capturing detailed debug information
- Storing stack traces, request payloads, or other verbose data
- Organizing log data with a clear separation between summary and details

## 🔧 Troubleshooting

### Authentication Issues

If you encounter authentication errors like `[next-auth][error][CLIENT_FETCH_ERROR]` with "Unexpected token '<', '<!DOCTYPE'" error:

1. Make sure your environment variables are correctly set:
   - `NEXTAUTH_URL` should match your actual URL (e.g., `http://localhost:3000` for local development)
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` must be valid

2. Check that your Google Cloud Console OAuth credentials have the correct authorized origins and redirect URIs

3. Restart your development server after making environment variable changes

4. Clear browser cookies and local storage if you continue to experience issues

### Capturing Transient Errors

If you're seeing errors that disappear quickly due to redirects:

1. Open your browser's Developer Tools before triggering the authentication flow (F12 or Ctrl+Shift+I)
2. Go to the Network tab and enable "Preserve log" option to keep logs even after page redirects
3. Check the Console tab for any error messages from NextAuth
4. Look for failed requests in the Network tab, especially those to `/api/auth/...` endpoints
5. Check your terminal/server logs where your Next.js application is running

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👏 Acknowledgements

- [shadcn/ui](https://ui.shadcn.com/) for the UI components
- [Next.js](https://nextjs.org/) for the React framework
- [Vercel](https://vercel.com/) for hosting and KV database