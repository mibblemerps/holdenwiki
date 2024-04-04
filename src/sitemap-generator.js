import fs from 'fs';

import Index, {PdfIndex} from './docs/index.js';
import env from './env.js';

/**
 * @param {Index} index
 * @param {{path: string, priority: number, changeFrequency: ("always"|"hourly"|"daily"|"weekly"|"monthly"|"yearly"|"never")}[]} additionalUrls
 * @param {WritableStream|string} streamOrPath Output stream or path to file to save sitemap
 */
export function generate(index, additionalUrls, streamOrPath) {
    let stream = streamOrPath;
    if (typeof streamOrPath === 'string') {
        stream = fs.createWriteStream(streamOrPath);
    }

    stream.write('<?xml version=\'1.0\' encoding=\'UTF-8\'?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n');

    function writeUrl(url, changeFrequency = null, priority = null) {
        if (!(typeof url === 'string')) {
            throw new TypeError('url must be string');
        }

        stream.write('    <url>\n');
        stream.write(`        <loc>${encodeURI(url).replaceAll('&', '&amp;')}</loc>\n`);
        if (changeFrequency !== null) {
            stream.write(`        <changefreq>${changeFrequency}</changefreq>\n`);
        }
        if (priority !== null) {
            stream.write(`        <priority>${priority}</priority>\n`)
        }
        stream.write('    </url>\n');
    }

    for (let additionalUrl of additionalUrls) {
        let path = additionalUrl.path;
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        writeUrl(env.BASE_URL + path, additionalUrl.changeFrequency, additionalUrl.priority)
    }

    for (const url of Object.keys(index.index)) {
        writeUrl(env.BASE_URL + '/docs/' + url, 'never');
    }

    stream.end('</urlset>\n');
}