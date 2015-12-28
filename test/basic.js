var tape = require('tape')
var autoUpdater = require('..')

tape('check for new version', function (t) {
  var updater = new autoUpdater({ 
    manifestUrl: 'http://www.strem.io/stremioVersions.json', downloadUrl: 'http://dl.strem.io/Stremio',
    version: { version: '3.4.4', stremioRuntimeVersion: '3.2' } 
  })

  updater.check(function (err, newVersion) {
    t.error(err, 'no error')
    t.ok(newVersion, 'has new version object')
    t.ok(newVersion && newVersion.version, 'has new version code')
    t.end()
  })
})


tape('check for new version - we have the newest', function (t) {
  var updater = new autoUpdater({ 
    manifestUrl: 'http://www.strem.io/stremioVersions.json', downloadUrl: 'http://dl.strem.io/Stremio',
    version: { version: '3.4.4', stremioRuntimeVersion: '3.2' } 
  })

  updater.manifest(function (err, versions) {
    var latest = versions.filter(updater.options.filter).pop()
    updater.options.version = latest

    updater.check(function (err, newVersion) {
      t.error(err, 'no error')
      t.ok(!newVersion, 'has no new version object')
      t.end()
    })
  })
})


tape('basic check for new version - handle errors', function (t) {
  var updater = new autoUpdater({ 
    manifestUrl: 'http://ewrqwerqwreqw.io/stremioVersions.json', downloadUrl: 'http://dl.strem.io/Stremio',
    version: { version: '3.4.4', stremioRuntimeVersion: '3.2' } 
  })

  updater.check(function (err, newVersion) {
    t.ok(err, 'we have an error')
    t.end()
  })
})

tape('basic check for new version - use fallback urls', function (t) {
  var updater = new autoUpdater({ 
    manifestUrl: ['http://ewrqwerqwreqw.io/stremioVersions.json', 'http://www.strem.io/stremioVersions.json'], downloadUrl: 'http://dl.strem.io/Stremio',
    version: { version: '3.4.4', stremioRuntimeVersion: '3.2' } 
  })

  updater.check(function (err, newVersion) {
    t.error(err, 'no error')
    t.ok(newVersion, 'has new version object')
    t.ok(newVersion && newVersion.version, 'has new version code')
    t.end()
  })
})


tape('update to new version via asar', function (t) {
  var updater = new autoUpdater({ 
    manifestUrl: 'http://www.strem.io/stremioVersions.json', downloadUrl: 'http://dl.strem.io/Stremio',
    runtimeVerProp: 'stremioRuntimeVersion',
    version: { version: '3.4.4', stremioRuntimeVersion: '3.1' } 
  })

  updater.check(function (err, newVersion) {
    t.error(err, 'no error')
    t.ok(newVersion, 'has new version object')
    t.ok(newVersion && newVersion.version, 'has new version code')
    t.ok(newVersion.stremioRuntimeVersion === '3.1', 'asar only update')

    updater.prepare(newVersion, function (err, res) {
      t.error(err, 'no error')
      t.ok(res.isAsarUpdate, 'is asar update')
      t.ok(res.saveTo.match('.asar$'), 'downloaded .asar file')
      t.end()
    })
  })
})


tape('update to new version - full update', function (t) {
  var updater = new autoUpdater({ 
    manifestUrl: 'http://www.strem.io/stremioVersions.json', downloadUrl: 'http://dl.strem.io/Stremio',
    runtimeVerProp: 'stremioRuntimeVersion',
    version: { version: '3.0.0', stremioRuntimeVersion: '3.0' },
    getUpdateUrl: function (downloadUrl, version, platform) {
      return downloadUrl + (platform == 'asar' ? '' : '%20') + version.version + ({
          asar: '.asar.gz',
          win32: '.exe',
          darwin: '.dmg',
          linux: '.tar.gz'
        })[platform]
    }
  })

  updater.check(function (err, newVersion) {
    t.error(err, 'no error')
    t.ok(newVersion, 'has new version object')
    t.ok(newVersion && newVersion.version, 'has new version code')

    updater.prepare(newVersion, function (err, res) {
      t.error(err, 'no error')
      t.ok(!res.isAsarUpdate, 'is not asar update')
      t.ok(res.saveTo.match('.dmg$') || res.saveTo.match('.exe$') || res.saveTo.match('.tar.gz$'), 'downloaded full installer/bundle')
      t.end()
    })
  })
})