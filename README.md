# autoupdaty
Simple auto-updater for Electron/NW.js apps.

Checks for new versions and downloads them.

It has two modes: 

1. Download and verify a new asar/nw file.
2. Download and verify a new installer

In our versions manifest, we specify ``runtimeVersion`` for every version. If the version has a different ``runtimeVersion``, that requires we do a full update (mode #2), otherwise we can do ASAR-only update - mode #1.

## Documentation

### Init
``new autoUpdater(options)`` - inits an instance of our auto-updater

### Options
``version`` - object describing our current version - the one we're running

**Example**
```javascript
{ version: "2.1", runtimeVersion: "2.0", released: "Sun Dec 27 2015 18:41:58 GMT+0200 (EET)" }
```

``manifestUrl`` - URL to .json of your versions manifest; could be an array of URLs if you want fallback(s)

``downloadUrl`` - base URL of your download server

``filter`` - filter function ran against every version from the manifest

**Example**
```javascript
function(ver) { return !ver.isBeta }
```

``getUpdateUrl`` - function to format the URL we get the new version from; arguments are ``getUpdateUrl(downloadUrl, isAsar, platform)``

``runtimeVerProp`` - property to use when parsing runtime version from the versions manifest; default is ``runtimeVersion``


### Versions manifest

Your versions manifest is a JSON file of array with objects describing each released version of your product.

```javascript
[
  { version: "2.1", runtimeVersion: "2.0", released: "Sun Dec 27 2015 18:41:58 GMT+0200 (EET)" },
  { version: "2.2", runtimeVersion: "2.0", released: "Sun Dec 28 2015 18:00:00 GMT+0200 (EET)", isBeta: true }
]
```

The required properties are ``version``, ``runtimeVersion`` and ``released``. Other than that, you can add any property you want for use in your ``filter`` function.

### Methods 

``autoupdater.check(cb)`` - checks for new versions

``autoupdater.prepare(options, cb)`` - prepares a new version


## Difference to Squirrel, Electron's default auto-updater

This was built primarily for in-house use for NW.js. It isn't documented well and developed for generic use cases, so please use Electron's auto-updater.

