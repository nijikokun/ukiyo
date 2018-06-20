const http = require('http')
const mime = require('mime')
const path = require('path')
const url = require('url')
const fs = require('fs')

/**
 * Working directory
 * @type {String}
 */
const cwd = process.cwd()

/**
 * Server port
 * @type {Number}
 */
const port = process.env.UKIYO_PORT || 8080

/**
 * Server application entry point
 * @type {String}
 */
const entryPoint = process.env.UKIYO_ENTRY_POINT || 'index.html'

/**
 * Get file path from CWD
 * @param  {String} location File location
 * @return {String}          Local File Location
 */
const file = (location) => {
  return path.join(cwd, location)
}

const getClientAddress = req => {
  let address = req.headers['x-client-ip']
  let lookupKeys = [ 'x-real-ip', 'x-cluster-client-ip', 'x-forwarded', 'forwarded-for', 'forwarded' ]
  let forwardedForAlternative = req.headers['x-forwarded-for']

  if (address) return address
  if (forwardedForAlternative) return forwardedForAlternative.split(',')[0]

  for (let index = 0, len = lookupKeys.length; index < len; index++) {
    let header = req.headers[lookupKeys[index]]
    if (header) return header
  }

  if (req.connection && req.connection.remoteAddress) return req.connection.remoteAddress
  if (req.socket && req.socket.remoteAddress) return req.socket.remoteAddress
  if (req.connection && req.connection.socket && req.connection.socket.remoteAddress) return req.connection.socket.remoteAddress
  if (req.info && req.info.remoteAddress) return req.info.remoteAddress

  return null
}

const getClientIPV4Address = req => {
  let ip = getClientAddress(req)
  return ip.length < 15 ? ip : (ip.substr(0, 7) === '::ffff:' ? ip.substr(7) : null)
}

/**
 * Server request handler
 */
const handler = (req, res) => {
  let parts = url.parse(req.url)
  let filePath = file(parts.pathname)
  let ext = parts.pathname.substring(parts.pathname.indexOf('.'))
  let ipv4 = getClientIPV4Address(req)
  let stat

  try {
    stat = fs.statSync(filePath)
  } catch (e) {
    stat = null
  }

  // File exists
  if (stat && stat.isFile()) {
    return fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('[UKIYO]', ipv4, 500, parts.pathname, err.message)

        res.writeHead(500, { 'Content-Type': 'text/html' })
        res.write(`
          <h1>Internal Server Error</h1>
          <div><pre><code>${err.message}</code></pre></div>
          <div><pre><code>${err.stack}</code></pre></div>
          <div><small><em>Powered by Ukiyo</em></small></div>
        `)
      } else {
        console.log('[UKIYO]', ipv4, 200, parts.pathname, stat.size, 'b')

        res.writeHead(200, { 'Content-Type': mime.getType(filePath) })
        res.write(data)
      }

      return res.end()
    })
  }

  // Missing File
  if (ext && ext.indexOf('/') < 0) {
    console.log('[UKIYO]', ipv4, 404, parts.pathname)
    res.writeHead(404)
    return res.end()
  }

  // Go back to the entry point
  fs.readFile(entryPoint, (err, data) => {
    if (err) {
      console.error('[UKIYO]', 'Could not read entry file:', entryPoint)
      console.error('[UKIYO]', 'Are you sure it exists?')
      console.log('[UKIYO]', ipv4, 404, parts.pathname)
      res.writeHead(404)
      return res.end()
    }

    let stat = fs.statSync(entryPoint)

    console.log('[UKIYO]', ipv4, 200, entryPoint, stat.size, 'b')
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.write(data)
    return res.end()
  })
}

/**
 * Server instance
 * @type {Object}
 */
const server = http.createServer(handler)

/**
 * Initialize server
 */
fs.readFile(entryPoint, (err, data) => {
  if (err) {
    console.error('[UKIYO]', 'Could not read entry file:', entryPoint)
    console.error('[UKIYO]', 'Are you sure it exists?')
    return
  }

  server.listen(port, err => {
    if (err) {
      let from = port
      let overhead = 1000
      let rand = from + ~~(Math.random() * overhead)

      console.error('[UKIYO]', 'Unable to initialize server on port', port)
      console.error('[UKIYO]', 'How about a new port?', `ukiyo -p ${rand} -e ${entryPoint}`)
      return
    }

    console.log('[UKIYO]', `Server can be accessed at the following address:`)
    console.log('[UKIYO]', ' ', `http://127.0.0.1:${port}`)
  })
})
