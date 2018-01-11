# Ukiyo

Barebones Single Page Application Development Server

> Quickly iterate and modify your single-page application without hassle

[![version][npm-version]][npm-url]
[![Downloads][npm-downloads]][npm-url]

**Features**

- No build process
- Instant content reload on refresh
- Serves static files from entire filesystem
- All routes other than files load the entry-point

## Installation

```
$ npm i ukiyo -g
```

## Usage

```
$ ukiyo --port=8080 --entry-point=index.html
```

## Documentation

```
$ ukiyo --help

  --help, -h
    Displays help information about this script
    'binary -h' or 'binary --help'

  --entry-point, -e
    SPA Entry Point (defaults to index.html)

  --port, -p
    Server port (defaults to 8080)
```

## FAQ

**Q** What if I need a build process?

Use Gulp or Grunt to build your files.

## License

[MIT](LICENSE) &copy; 2016 [Nijiko Yonskai](https://nijikokun.com)

[npm-url]: https://www.npmjs.com/package/ukiyo
[npm-license]: https://img.shields.io/npm/l/ukiyo.svg?style=flat-square
[npm-version]: https://img.shields.io/npm/v/ukiyo.svg?style=flat-square
[npm-downloads]: https://img.shields.io/npm/dm/ukiyo.svg?style=flat-square
