import { NextRequest, NextResponse } from 'next/server'
import { checkMigrationLimit, setMigrationCookie } from '@/lib/session'
// Removed buildZip, isValidTheme, ThemeKey, fs, path, compileMDX imports as they are not used here anymore

const BACKEND_SERVICE_URL =
  process.env.MIGRATION_BACKEND_URL || 'https://wpofframp-backend.fly.dev' // Your deployed backend URL
const GENERATE_ENDPOINT = '/generate-zip' // The endpoint defined in your backend's server.ts

export async function POST(request: NextRequest) {
  console.log('Frontend API: Received migration request, proxying to backend...')

  if (checkMigrationLimit(request)) {
    console.log('Frontend API: Migration limit reached for session.')
    return NextResponse.json(
      {
        error:
          'Limited to one migration per user session during the testing phase.',
      },
      { status: 429 }
    )
  }

  let requestPayload: any
  try {
    requestPayload = await request.json()

    // Perform basic validation on the payload received from the frontend client
    if (
      !requestPayload.theme ||
      !requestPayload.homepagePosts ||
      !Array.isArray(requestPayload.homepagePosts) ||
      requestPayload.homepagePosts.length === 0 ||
      !requestPayload.mostRecentPostMdx ||
      !requestPayload.mostRecentPostTitle ||
      !requestPayload.mostRecentPostSlug ||
      !requestPayload.wpUrl // Added check for wpUrl, needed for filename
    ) {
      throw new Error('Missing required parameters in request body')
    }
    // No need to call isValidTheme here, backend can validate
    console.log(
      `Frontend API: Forwarding request for theme ${requestPayload.theme}`
    )
  } catch (error: any) {
    console.error('Frontend API: Error parsing request body:', error)
    return NextResponse.json(
      { error: `Invalid request body: ${error.message}` },
      { status: 400 }
    )
  }

  try {
    const backendUrl = `${BACKEND_SERVICE_URL.replace(
      /\/$/,
      ''
    )}${GENERATE_ENDPOINT}`
    console.log(`Frontend API: Calling backend service at ${backendUrl}`)

    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers if you implement security on the backend
        // 'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
      },
      body: JSON.stringify(requestPayload), // Forward the validated payload
      cache: 'no-store', // Prevent caching of this API call
    })

    console.log(
      `Frontend API: Received response status from backend: ${backendResponse.status}`
    )

    if (!backendResponse.ok || !backendResponse.body) {
      let errorBody = 'Backend service returned an error.'
      try {
        const errorJson = await backendResponse.json()
        errorBody = errorJson.error || JSON.stringify(errorJson)
      } catch (e) {
        try {
           errorBody = await backendResponse.text()
        } catch(readErr) {
            console.error("Failed to read error body as text either")
        }
      }
      console.error(
        `Frontend API: Backend error response (${backendResponse.status}):`,
        errorBody
      )
      return NextResponse.json(
        {
          error: `Migration service failed: ${errorBody}`,
        },
        { status: backendResponse.status } // Forward the status code
      )
    }

    const contentType = backendResponse.headers.get('Content-Type')
    if (!contentType || !contentType.includes('application/zip')) {
      console.error(
        'Frontend API: Backend did not return application/zip content type.',
        contentType
      )
      return NextResponse.json(
        { error: 'Migration service returned unexpected content type.' },
        { status: 502 } // Bad Gateway
      )
    }

    // Prepare headers for the response to the browser
    const responseHeaders = new Headers()
    responseHeaders.set('Content-Type', 'application/zip')

    const contentDisposition = backendResponse.headers.get('Content-Disposition')
    if (contentDisposition) {
      responseHeaders.set('Content-Disposition', contentDisposition)
      console.log(`Frontend API: Forwarding Content-Disposition: ${contentDisposition}`)
    } else {
      // Fallback filename if backend didn't provide one
      const safeTitle = (
        requestPayload.mostRecentPostTitle || 'wp_offramp_site'
      )
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()
        .substring(0, 50)
      const filename = `${safeTitle}_${requestPayload.theme}.zip`
      responseHeaders.set(
        'Content-Disposition',
        `attachment; filename="${filename}"`
      )
       console.log(`Frontend API: Using fallback Content-Disposition: attachment; filename="${filename}"`)
    }
     // Forward Content-Length if provided by backend
     const contentLength = backendResponse.headers.get('Content-Length');
     if (contentLength) {
         responseHeaders.set('Content-Length', contentLength);
     }

    // Create the final response, streaming the body from the backend
    const response = new NextResponse(backendResponse.body, {
      status: 200,
      headers: responseHeaders,
    })

    // Set the session cookie
    setMigrationCookie(response)
    console.log(
      'Frontend API: Migration successful, cookie set, streaming ZIP.'
    )

    return response
  } catch (error: any) {
    console.error(
      'Frontend API: Unhandled error during migration proxy:',
      error
    )
    return NextResponse.json(
      { error: `Failed to connect to migration service: ${error.message}` },
      { status: 503 } // Service Unavailable
    )
  }
}