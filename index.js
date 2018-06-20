const http = require('http')
const mime = require('mime-types')
const path = require('path')
const url = require('url')
const fs = require('fs')
const pkg = require('./package')

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
 * @param {string} topic console[topic]
 * @param {*} messages ...messages
 */
const log = (topic, ...messages) => {
  messages.unshift('')
  messages.unshift(`${log.topics[topic]}`)
  messages.unshift(`[${pkg.name.toUpperCase()}]`)

  return (console[topic] || console.info).apply(console, messages)
}

/**
 * Log types
 */
log.topics = {
  info: '✅',
  warn: '⚠️ ',
  error: '🚨',
  issue: '🐛',
  ignore: '🙈',
  input: '🔺',
  output: '🔻',
  send: '📤',
  receive: '📥',
  fetch: '📡',
  finish: '🏁',
  launch: '🚀',
  terminate: '⛔️',
  spawn: '✨',
  broadcast: '📣',
  disk: '💾',
  timing: '⏱ ',
  money: '💰',
  numbers: '🔢',
  wtf: '👻'
}

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

// Internal Responses
const internalServerError = (res, err, path) => {
  res.statusCode = 500
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.write(`
    <h1>Internal Server Error</h1>
    <div><pre><code>${err.message}</code></pre></div>
    <div><pre><code>${err.stack}</code></pre></div>
    <div><small><em>Powered by ${pkg.name}</em></small></div>
  `)
  return res.end()
}

const notFound = (res, err, path) => {
  res.statusCode = 404
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.write(`
    <h1>Not Found</h1>
    <p>The requested URL <code>${path}</code> was not found on this server.</p>
    <div><small><em>Powered by ${pkg.name}</em></small></div>
  `)
  return res.end()
}

/**
 * Server request handler
 */
const handler = (req, res) => {
  let parts = url.parse(req.url)
  let filePath = file(parts.pathname)
  let {base} = path.parse(filePath)
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
        log('error', ipv4, 500, parts.pathname, err.message)
        return internalServerError(res, err, parts.pathname)
      } else {
        log('send', ipv4, 200, parts.pathname, stat.size, 'b')

        let contentType = mime.contentType(base)
        let headers = {
          'Last-Modified': stat.mtime.toUTCString(),
          'Content-Length': stat.size,
          'Content-Disposition': contentDisposition(base, {
            type: 'inline'
          })
        }

        if (contentType) {
          headers['Content-Type'] = contentType
        }
        
        res.writeHead(200, headers)
        res.write(data)
      }

      return res.end()
    })
  }

  // Missing File
  if (ext && ext.indexOf('/') < 0) {
    log('send', ipv4, 404, parts.pathname)
    return notFound(res, null, parts.pathname)
  }

  // Go back to the entry point
  fs.readFile(entryPoint, (err, data) => {
    if (err) {
      log('error', 'Could not read entry file:', entryPoint)
      log('wtf', 'Are you sure it exists?')
      log('send', ipv4, 404, parts.pathname)
      return notFound(res, err, parts.pathname)
    }

    let stat = fs.statSync(entryPoint)
    log('send', ipv4, 200, entryPoint, stat.size, 'b')
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
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
 * Handle server errors
 */
server.on('error', err => {
  log('terminate', 'Failed to serve:', err.stack)
  process.exit(1)
})

/**
 * Initialize server
 */
fs.readFile(entryPoint, (err, data) => {
  if (err) {
    log('terminate', 'Could not find entry point:', entryPoint)
    log('wtf', 'Are you sure it exists?')
    return process.exit(1)
  }

  server.listen(port, err => {
    if (err) {
      let from = port
      let overhead = 1000
      let rand = from + ~~(Math.random() * overhead)
      
      log('terminate', 'Unable to initialize server on port', port)
      log('wtf', 'How about a new port?', `ukiyo -p ${rand} -e ${entryPoint}`)
      return process.exit(1)
    }

    log('spawn', `${pkg.name} v${pkg.version}`)
    log('broadcast', `Serving content at:`, `http://127.0.0.1:${port}`)
  })
})
