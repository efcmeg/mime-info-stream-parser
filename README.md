# mime-info-stream-parser

[![Npm Version](https://img.shields.io/npm/v/mime-info-stream-parser.svg)](https://npmjs.com/package/mime-info-stream-parser)
[![Build Status](https://travis-ci.org/efcmeg/mime-info-stream-parser.svg?branch=master)](https://travis-ci.org/efcmeg/mime-info-stream-parser)
[![Coverage Status](https://coveralls.io/repos/github/efcmeg/mime-info-stream-parser/badge.svg?branch=master)](https://coveralls.io/github/efcmeg/mime-info-stream-parser?branch=master)

> Convert freedesktop mime info XML to a simple JSON dictionary.

The [freedesktop project](https://www.freedesktop.org/) provides an [XML spec](https://freedesktop.org/wiki/Specifications/shared-mime-info-spec/) and [700+ mime type descriptions](https://gitlab.freedesktop.org/xdg/shared-mime-info/-/blob/master/data/freedesktop.org.xml.in).

The parser implements a [transform stream](https://nodejs.org/api/stream.html#stream_implementing_a_transform_stream) using [sax js](https://www.npmjs.com/package/sax) internally, converting freedesktop mime info XML to a JSON stream. Written to file, the output can be used:

```ts
// tsconfig.json compilerOptions.resolveJsonModule = true
import db from './db.json';

console.log(db['text/plain']);
/*
{
    comment: 'plain text document',
}
*/
console.log(db['application/pdf']);
/*
{
    comment: 'PDF document',
    acronym: 'PDF',
    acronymExpanded: 'Portable Document Format'
}
*/
// PDF alias
console.log(db['image/pdf']);
/*
{
    comment: 'PDF document',
    acronym: 'PDF',
    acronymExpanded: 'Portable Document Format'
}
*/
```

Mime type aliases are expanded to full entries. Each entry value is of type:

```ts
export interface MimeInfoItem {
  comment: string;
  acronym?: string;
  acronymExpanded?: string;
}
```

```ts
import { MimeInfoItem } from 'mime-info-stream-parser';
```

## Usage

```sh
yarn add mime-info-stream-parser
```

Typescript

```ts
import { pipeline } from 'stream';
import { createWriteStream, createReadStream } from 'fs';
import { MimeInfoStreamParser } from 'mime-info-stream-parser';

const read = createReadStream('./freedesktop.org.xml.in', {
  encoding: 'utf-8',
});
const write = createWriteStream(`./db.json`, {
  encoding: 'utf-8',
});

const mimeInfo = new MimeInfoStreamParser();

pipeline(read, mimeInfo, write, (err) => {
  if (err) {
    console.error(err.message);
  }
});
```

Node.js

```js
const { MimeInfoStreamParser } = require('mime-info-stream-parser');
// ...
```

## Tests

```sh
yarn && yarn test
```

## License

MIT
