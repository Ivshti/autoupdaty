var tape = require('tape')
var autoUpdater = require('..')

tape('basic check', function (t) {
  var updater = new autoUpdater({ 
    manifestUrl: 'http://www.strem.io/stremioVersions.json', downloadUrl: 'http://dl.strem.io',
    version: { version: '3.4.4', stremioRuntimeVersion: '3.2' } 
  })
  
  updater.check(function (err, newVersion) {
    console.log(err)
    console.log(newVersion)
    t.end()
  })
})