import http from 'http'
import { Buffer } from 'buffer'
import path from 'path'
import { buildZip } from './lib/buildZip'
import { ThemeKey, isValidTheme } from './lib/constants'

const DEFAULT_PORT = 8080
const portString: string = process.env.PORT || String(DEFAULT_PORT)
let PORT: number

try {
  PORT = parseInt(portString, 10)
  if (isNaN(PORT) || PORT <= 0) {
    console.warn(
      `Invalid PORT value "${portString}". Using default ${DEFAULT_PORT}.`
    )
    PORT = DEFAULT_PORT
  }
} catch (e) {
  console.error(
    `Error parsing PORT value "${portString}". Using default ${DEFAULT_PORT}.`,
    e
  )
  PORT = DEFAULT_PORT
}

const HOSTNAME = '0.0.0.0'
const GENERATE_PATH = '/generate-zip'

const requestListener: http.RequestListener = async (req, res) => {
  console.log(`Received request: ${req.method} ${req.url}`)

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Method Not Allowed' }))
    return
  }

  if (req.url !== GENERATE_PATH) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not Found' }))
    return
  }

  let body = ''
  req.on('data', (chunk) => {
    body += chunk.toString()
  })

  req.on('end', async () => {
    try {
      console.log('Request body received, attempting parse...')
      const parsedBody = JSON.parse(body)

      const {
        theme,
        homepagePosts,
        mostRecentPostMdx,
        mostRecentPostTitle,
        mostRecentPostSlug,
      } = parsedBody

      if (!theme || typeof theme !== 'string' || !isValidTheme(theme)) {
        throw new Error('Missing or invalid theme parameter')
      }
      if (!homepagePosts || !Array.isArray(homepagePosts)) {
        throw new Error('Missing or invalid homepagePosts parameter')
      }
      if (
        !mostRecentPostMdx ||
        typeof mostRecentPostMdx !== 'string' ||
        !mostRecentPostTitle ||
        typeof mostRecentPostTitle !== 'string' ||
        !mostRecentPostSlug ||
        typeof mostRecentPostSlug !== 'string'
      ) {
        throw new Error('Missing required post content (MDX, title, or slug)')
      }

      console.log(
        `Validated request data. Theme: ${theme}, Posts: ${homepagePosts.length}`
      )

      console.log('Starting buildZip...')
      const zipBuffer = await buildZip({
        theme: theme as ThemeKey,
        homepagePosts,
        mostRecentPostMdx,
        mostRecentPostTitle,
        mostRecentPostSlug,
      })
      console.log('buildZip completed successfully.')

      const safeTitle =
        mostRecentPostTitle
          .replace(/[^a-z0-9]/gi, '_')
          .toLowerCase()
          .substring(0, 50) || 'wp_offramp_site'
      const filename = `${safeTitle}_${theme}.zip`

      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.length,
      })
      res.end(zipBuffer)
      console.log(`Sent ZIP response: ${filename}`)
    } catch (error: any) {
      console.error('Error processing request:', error)
      let statusCode: number = 500
      let errorMessage: string = 'Failed to process request'

      if (error instanceof Error) {
        errorMessage = error.message || errorMessage
        if (
          error.message.includes('parameter') ||
          error.message.includes('Missing required')
        ) {
          statusCode = 400
        }
      } else if (typeof error === 'string') {
        errorMessage = error
      }

      if (typeof statusCode !== 'number') {
        statusCode = 500
      }

      res.writeHead(statusCode, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: errorMessage }))
    }
  })

  req.on('error', (err) => {
    console.error('Request error:', err)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Server request error' }))
  })
}

const server = http.createServer(requestListener)

server.listen(PORT, HOSTNAME, () => {
  console.log(`Server listening on http://${HOSTNAME}:${PORT}`)
})

server.on('error', (err) => {
  console.error('Server failed to start:', err)
  process.exit(1)
})