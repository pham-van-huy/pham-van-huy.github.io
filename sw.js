const addResourcesToCache = async (resources) => {
    const cache = await caches.open('v1')
    await cache.addAll(resources)
}

const putInCache = async (request, response) => {
    const cache = await caches.open('v1')
    await cache.put(request, response)
}

const cacheFirst = async ({ request, preloadResponsePromise, fallbackUrl }) => {
    try {
        const preloadResponse = await preloadResponsePromise
        if (preloadResponse) {
            putInCache(request, preloadResponse.clone())

            return preloadResponse
        }

        const responseFromNetwork = await fetch(request)
        putInCache(request, responseFromNetwork.clone())

        return responseFromNetwork
    } catch (error) {
        console.log(error)
        const responseFromCache = await caches.match(request)
        if (responseFromCache) {
            return responseFromCache
        }

        const fallbackResponse = await caches.match(fallbackUrl)
        if (fallbackResponse) {
            return fallbackResponse
        }

        return new Response('Network error happened', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' }
        })
    }
}

const enableNavigationPreload = async () => {
    if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable()
    }
}

self.addEventListener('activate', (event) => {
    event.waitUntil(enableNavigationPreload())
})

self.addEventListener('install', (event) => {
    event.waitUntil(
        addResourcesToCache([
            '/',
            '/index.html',
            '/about.html',
            '/contact.html',
            '/app.js',
            '/app.css',
            '/image.png'
        ])
    )
})

self.addEventListener('fetch', (event) => {
    event.respondWith(
        cacheFirst({
            request: event.request,
            preloadResponsePromise: event.preloadResponse,
            fallbackUrl: '/'
        })
    )
})
