var needle = require('needle')
var async = require('async')
var path = require('path')
var os = require('os')
var crypto = require('crypto')
var pump = require('pump')
var gunzip = require('gunzip-maybe')
var url = require('url')

var reqOpts = { follow_max: 3, open_timeout: 5000, read_timeout: 5000 }

module.exports = function autoUpdater (options) {
  options = this.options = options || { }

  var fs = options.fs || require('fs')

  if (!options.version) throw new Error('specify current version object')
  if (!options.manifestUrl || !options.downloadUrl) throw new Error('specify manifestUrl and downloadUrl')

  options.filter = options.filter || function (ver) { return !(ver.beta || ver.alpha || ver.experimental) && !ver.disabled }
  options.getUpdateUrl = options.getUpdateUrl || function (downloadUrl, version, platform) {
    return downloadUrl + version.version + ({
      asar: '.asar.gz',
      win32: '.exe',
      darwin: '.dmg',
      linux: '.tar.gz'
    })[platform]
  }
  options.runtimeVerProp = options.runtimeVerProp || 'runtimeVersion'

  this.manifest = function (cb) {
    var err, body
    var urls = Array.isArray(options.manifestUrl) ? [].concat(options.manifestUrl) : [options.manifestUrl]

    async.whilst(function () { return !body && urls.length }, function (next) {
      needle.get(urls.shift(), reqOpts, function (e, resp, b) {
        err = e
        body = b
        next()
      })
    }, function () {
      cb(body ? null : err, body)
    })
  }

  this.check = function (cb) {
    this.manifest(function (err, body) {
      if (err) return cb(err)

      if (!Array.isArray(body)) return cb(new Error('expecting array from downloadUrl'))

      var versions = body
        .map(function (x) { x.released = new Date(x.released); return x })
        .sort(function (b, a) { return a.released.getTime() - b.released.getTime() })
        .filter(options.filter)

      var newest = versions[0]
      cb(null, newest.version === options.version.version ? null : newest)
    })
  }

  this.prepare = function (version, opts, cb) {
    cb = typeof (opts) === 'function' ? opts : cb
    opts = typeof (opts) === 'function' ? { } : opts

    var isAsarUpdate = version[options.runtimeVerProp] === options.version[options.runtimeVerProp]
    var updateUrl = options.getUpdateUrl(options.downloadUrl, version, opts.platform || (isAsarUpdate ? 'asar' : process.platform))
    var saveTo = path.join(os.tmpdir(), path.basename(decodeURIComponent(url.parse(updateUrl).pathname), isAsarUpdate ? '.gz' : undefined))

    var hash = crypto.createHash('sha256')
    // var verify = crypto.createVerify('DSA-SHA1')

    async.auto({
      download: function (next) {
        var stream = needle.get(updateUrl, { follow_max: 3, headers: opts.headers })
        stream.on('error', next)
        stream.on('headers', function () {
          var res = stream.request.res
          if (!res) return next(new Error('no res'))
          if (res.statusCode !== 200) return next(new Error('downloading returned ' + res.statusCode))

          // Consider using res.headers for verifying content-length and content-disposition for saveTo

          res.on('error', next)

          res.on('data', function (d) { hash.update(d) })

          if (isAsarUpdate && updateUrl.match('.gz$')) {
            pump(stream, gunzip(), fs.createWriteStream(saveTo), function (err) { next(err) })
          } else {
            pump(stream, fs.createWriteStream(saveTo), function (err) { next(err) })
          }
        })
      },
      checksum: function (next) {
        needle.get(updateUrl + '.sha256', { follow_max: 3 }, function (err, resp, body) {
          if (err) return next(err)
          if (resp.statusCode !== 200) return next(new Error('checksum status code ' + resp.statusCode))
          next(null, body)
        })
      },
      verify: ['download', 'checksum', function (next, res) {
        // if ( ! verify.verify(options.publicKey, signature, 'base64') return next(new Error('signing verification failed'))
        if (res.checksum.toString() !== hash.digest('hex')) return next(new Error('checksum verification failed'))
        next()
      }]
    }, function (err) {
      cb(err, { saveTo: saveTo, updateUrl: updateUrl, isAsarUpdate: isAsarUpdate, version: version, current: options.version })
    })
  }
}
