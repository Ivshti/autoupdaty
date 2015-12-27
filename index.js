var needle = require('needle')

module.exports = function autoUpdater (options) {
  options = options || { }

  if (!options.manifestUrl || !options.downloadUrl) throw new Error('specify manifestUrl and downloadUrl')

  this.check = function (cb) {
    needle.get(options.manifestUrl, function (err, body) {
      if (err) return cb(err)

      console.log(body)
    })
  }

  this.prepare = function (version, cb) {
  }
}
