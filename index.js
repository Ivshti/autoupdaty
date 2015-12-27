var needle = require('needle')

module.exports = function autoUpdater (options) {
  options = this.options = options || { }

  if (!options.version) throw new Error('specify current version object')
  if (!options.manifestUrl || !options.downloadUrl) throw new Error('specify manifestUrl and downloadUrl')

  var filter = options.filter || function (ver) { return !(ver.beta || ver.alpha || ver.experimental) && !ver.disabled }
  var current = options.version

  this.check = function (cb) {
    needle.get(options.manifestUrl, function (err, resp, body) {
      if (err) return cb(err)

      if (!Array.isArray(body)) return cb(new Error('expecting array from downloadUrl'))

      var versions = body
        .map(function (x) { x.released = new Date(x.released); return x })
        .sort(function (b, a) { return a.released.getTime() - b.released.getTime() })
        .filter(filter)

      var newest = versions[0]
      cb(null, newest.version === current.version ? null : newest)
    })
  }

  this.prepare = function (version, cb) {
  }
}
