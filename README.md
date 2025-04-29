# Universal Log Viewer

A modern, React-based log viewer application that allows you to collect, store, and analyze logs from any application through a simple API. Built with Next.js and deployed on Vercel.

![Log Viewer Screenshot](https://raw.githubusercontent.com/username/log-viewer/main/public/screenshot.png)

## ✨ Features

- **Project Management**: Create and manage multiple projects for different applications
- **Real-time Log Viewing**: View logs in real-time with automatic updates
- **Advanced Filtering**: Filter logs by level, type, and content with a powerful search
- **Structured Log Details**: View formatted JSON data with collapsible tree view
- **Log Collection API**: Send logs from any application via a simple REST API
- **Version Control**: API versioning to ensure backward compatibility
- **Modern UI**: Clean, responsive interface built with shadcn/ui components

## 🛠️ Technologies

- **Next.js**: React framework with App Router
- **TypeScript**: Static type checking
- **shadcn/ui**: UI component library
- **Vercel KV**: For persistent storage
- **Vercel**: Hosting and deployment platform
- **Tailwind CSS**: Utility-first CSS framework

## 📋 Prerequisites

- Node.js 18.x or later
- npm or yarn
- Vercel account (for deployment)
- Vercel KV (for database)

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
   KV_URL=your_kv_url
   KV_REST_API_URL=your_kv_rest_api_url
   KV_REST_API_TOKEN=your_kv_rest_api_token
   KV_REST_API_READ_ONLY_TOKEN=your_kv_read_only_token
   ```

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

3. Set up Vercel KV:
   - In your Vercel dashboard, go to "Storage"
   - Add KV database (now Upstash Serverless DB on marketplace)
   - At install, choose the Redis database option
   - Connect it to your project
   - Vercel will automatically add the required environment variables

## 📖 Usage

### Creating Projects

1. Navigate to the home page
2. Click "Create Project"
3. Enter project name and description
4. Click "Create Project"
5. Note your project ID and API key for sending logs

### Viewing Logs

1. Select a project from the dropdown menu
2. Use filters to narrow down logs by level or content
3. Click on a log entry to view its details
4. Use the tabs to switch between regular and extended details
5. Copy logs to clipboard using the "Copy Log" button

### Sending Logs

Logs can be sent to the application using the REST API:

```javascript
// Example in JavaScript
async function sendLogs(projectId, logs) {
  try {
    const response = await fetch('https://your-log-viewer.vercel.app/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        schemaVersion: 'v1',
        logs,
      }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to send logs:', error);
    throw error;
  }
}
```

## 📝 API Documentation

### `POST /api/logs`

Send logs to the server.

**Request Body:**

```json
{
  "projectId": "your-project-id",
  "schemaVersion": "v1",
  "logs": "[2025-04-29, 08:40:24] [LOG] Your log message - {\"key\": \"value\"}"
}
```

**Response:**

```json
{
  "success": true,
  "savedCount": 1,
  "invalidCount": 0
}
```

**Error Responses:**

- `400 Bad Request`: Missing required fields or invalid log format
- `404 Not Found`: Invalid project ID
- `500 Internal Server Error`: Server-side error

### Log Format

The application supports logs in the following format:

```
[TIMESTAMP] [LEVEL] MESSAGE - JSON_DATA
```

- `TIMESTAMP`: Date and time in format `YYYY-MM-DD, HH:MM:SS`
- `LEVEL`: Log level (LOG, WARN, ERROR)
- `MESSAGE`: Log message text
- `JSON_DATA`: Optional JSON data as string (will be parsed into an object)

## 📂 Project Structure

```
/src
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── logs/             
│   │   │   └── route.ts      # Logs API
│   │   └── projects/         
│   │       └── route.ts      # Projects API
│   ├── projects/             
│   │   └── [id]/             
│   │       └── page.tsx      # Project log viewer page
│   └── page.tsx              # Home page
├── components/               # React components
│   ├── ui/                   # shadcn/ui components
│   ├── log-viewer/           # Log viewer components
│   ├── project-selector.tsx  # Project selector
│   └── create-project.tsx    # Project creation form
└── lib/                      # Utility functions
    ├── types.ts              # TypeScript interfaces
    ├── utils.ts              # Utility functions
    └── db.ts                 # Database client
```

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
- [Sonner](https://sonner.emilkowal.ski/) for toast notifications