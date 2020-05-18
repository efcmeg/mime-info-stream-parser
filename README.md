# mime-info-stream-parser

> Convert freedesktop mime info XML to a simple JSON dictionary.

The freedesktop project provides an XML spec and 700+ mime type descriptions. SAX parser is used to convert the XML to a JSON string intended to be written to a file and imported:
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
## Usage
```ts
  const read = createReadStream('./freedesktop.xml', {
    encoding: 'utf-8',
  });
  const mimeInfo = new MimeInfoStreamParser();
  const stream = pipeline(read, mimeInfo, (err) => {
    if (err) {
      console.error(err.message);
    }
  });
```
