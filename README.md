https://github.com/visionmedia/mocha/wiki/Third-party-reporters describes using third party reporters in mocha.

Basically, have your project's package.json be like:

``` js
{
  "devDependencies": {
    "mocha-tree-json-reporter": ">=0.0.1"
  }
}
```

Then call mocha with:

`mocha --reporter mocha-tree-json-reporter test`
