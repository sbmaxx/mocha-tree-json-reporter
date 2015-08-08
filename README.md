https://github.com/visionmedia/mocha/wiki/Third-party-reporters describes using third party reporters in mocha.

Basically, have your project's package.json be like:

``` js
{
  "devDependencies": {
    "mocha-tree-json-reporter": ">=0.0.12"
  }
}
```

Then call mocha with:

```
MOCHA_JSON_OUTPUT_FILE=output.json mocha --reporter mocha-tree-json-reporter test
```

