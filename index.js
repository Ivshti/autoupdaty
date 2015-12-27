var needle = require('needle')
var async = require('async')

var reqOpts = { follow_max: 3, open_timeout: 5000, read_timeout: 5000 }

module.exports = function autoUpdater (options) {
  options = this.options = options || { }

  if (!options.version) throw new Error('specify current version object')
  if (!options.manifestUrl || !options.downloadUrl) throw new Error('specify manifestUrl and downloadUrl')

  options.filter = options.filter || function (ver) { return !(ver.beta || ver.alpha || ver.experimental) && !ver.disabled }

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

  this.prepare = function (version, cb) {
  }
}
