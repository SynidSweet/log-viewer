// This page uses a client wrapper to handle authentication
// The actual performance test UI is in client-page.tsx

export { default } from './client-page'

// Force dynamic to prevent static generation
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'