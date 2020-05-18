import test from 'ava';

import { createReadStream } from 'fs';
import getStream from 'get-stream';
import { pipeline } from 'stream';
import { resolve } from 'path';

import { MimeInfoStreamParser, MimeInfoItem } from './mime-info-stream-parser';

const fixturesDir = resolve('fixtures');

test('writeMimeInfo empty input', async (t) => {
  const read = createReadStream(`${fixturesDir}/mime-info-empty.xml`, {
    encoding: 'utf-8',
  });
  const mimeInfo = new MimeInfoStreamParser();
  const output = await getStream(read.pipe(mimeInfo));
  t.is(!output, true);
});

test('Mime info stream parser produces valid JSON', async (t) => {
  const read = createReadStream(`${fixturesDir}/mime-info-sample.xml`, {
    encoding: 'utf-8',
  });
  const mimeInfo = new MimeInfoStreamParser();
  const stream = pipeline(read, mimeInfo, (err) => {
    if (err) {
      t.fail(err.message);
    }
  });
  t.notThrows(async () => JSON.parse(await getStream(stream)));
});

test('Mime info loads acronyms and aliases for PDF', async (t) => {
  const read = createReadStream(`${fixturesDir}/mime-info-sample.xml`, {
    encoding: 'utf-8',
  });
  const mimeInfo = new MimeInfoStreamParser();
  const stream = pipeline(read, mimeInfo, (err) => {
    if (err) {
      t.fail(err.message);
    }
  });
  const db: { [mime: string]: MimeInfoItem } = JSON.parse(
    await getStream(stream)
  );

  t.is(db['application/pdf'].comment === 'PDF document', true);
  t.is(db['application/pdf'].acronym === 'PDF', true);
  t.is(
    db['application/pdf'].acronymExpanded === 'Portable Document Format',
    true
  );
  // Aliases
  t.is(db['image/pdf'].comment === 'PDF document', true);
  t.is(db['image/pdf'].acronym === 'PDF', true);
  t.is(db['image/pdf'].acronymExpanded === 'Portable Document Format', true);
});

test('Mime text/plain has no acronym', async (t) => {
  const read = createReadStream(`${fixturesDir}/mime-info-sample.xml`, {
    encoding: 'utf-8',
  });
  const mimeInfo = new MimeInfoStreamParser();
  const stream = pipeline(read, mimeInfo, (err) => {
    if (err) {
      t.fail(err.message);
    }
  });
  const db: { [mime: string]: MimeInfoItem } = JSON.parse(
    await getStream(stream)
  );

  t.is(db['text/plain'].acronym === undefined, true);
  t.is(db['text/plain'].acronymExpanded === undefined, true);
});

test.cb('writeMimeInfo malformed xml', (t) => {
  t.plan(1);
  const read = createReadStream(`${fixturesDir}/mime-info-malformed.xml`, {
    encoding: 'utf-8',
  });
  const mimeInfo = new MimeInfoStreamParser();
  read
    .pipe(mimeInfo)
    .on('close', () => {
      t.fail('success is failure');
    })
    .on('error', (error) => {
      t.is(error && error.message.indexOf('Unexpected close tag') === 0, true);
      t.end();
    });
});

test('writeMimeInfo missing mime info tag', async (t) => {
  const read = createReadStream(`${fixturesDir}/mime-info-no-mime-info.xml`, {
    encoding: 'utf-8',
  });
  const mimeInfo = new MimeInfoStreamParser();
  const output = await getStream(read.pipe(mimeInfo));
  t.is(!output, true);
});

test('writeMimeInfo empty mime type tags', async (t) => {
  const read = createReadStream(
    `${fixturesDir}/mime-info-empty-mime-types.xml`,
    {
      encoding: 'utf-8',
    }
  );
  const mimeInfo = new MimeInfoStreamParser();
  const output = await getStream(read.pipe(mimeInfo));
  t.is(!output, true);
});
