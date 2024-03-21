import fs from 'fs';
import path from 'path';
import env from '../env.js';
import NotFoundError from './notFoundError.js';
import {pipeline} from 'node:stream/promises';
import {Transform} from 'node:stream';

const docsRoot = path.resolve(env.DOCS_ROOT);

const CSS_MARKER = '{css}';
const HTML_MARKER = '{html}';
const OUTLINE_MARKER = '{outline}';

const DEFAULT_HIGH_WATER_MARK = 4096;

/**
 * Converts doc URL to a valid local path while sanitizing against path traversal.
 * @param {string} docPath
 * @return {string}
 */
function docUrlToPath(docPath) {
    docPath = path.normalize(decodeURI(docPath.replace('\\', '/').toLowerCase()));

    let absolutePath = path.join(docsRoot, docPath);
    if (absolutePath.indexOf(docsRoot) !== 0) {
        throw new Error('Path traversal in doc path');
    }

    return absolutePath;
}

export default class Document {
    constructor(url) {
        /**
         * @var {string}
         */
        this.url = url;

        if (this.url.endsWith('.html')) {
            this.url = this.url.substring(0, this.url.lastIndexOf('/'));
        }
    }

    get name() {
        return decodeURI(this.url.substring(this.url.lastIndexOf('/') + 1)).toLowerCase();
    }

    get path() {
        return docUrlToPath(this.url);
    }

    /**
     * @param {string} template
     * @param {WritableStream} to
     */
    async output(template, to) {
        // Find content placeholder tags within the template
        let tags = [];
        let match = null;
        while ((match = template.match(/{(\w+)}/i)) !== null) {
            // remove match from template
            template = template.substring(0, match.index) + template.substring(match.index + match[0].length + 1);

            // Add match index
            // Since the matches should happen in order, this index shouldn't change
            //tags[match[1]] = match.index;
            tags.push({name: match[1], index: match.index});
        }

        let index = 0;
        for (const tag of tags) {
            to.write(template.substring(index, tag.index));

            switch (tag.name) {
                case 'html':
                    await pipeline(this._readHtml(), to, {end: false});
                    break;
                case 'css':
                    await pipeline(this._readCss(), to, {end: false});
                    break;
                case 'outline':
                    await pipeline(this._readOutline(), to, {end: false});
                    break;
            }

            index = tag.index;
        }

        to.write(template.substring(index));

        to.end();
    }

    async exists() {
        try {
            await fs.promises.access(this.path + '/' + this.name + '.html', fs.constants.R_OK);
            return true;
        } catch (err) {
            return false;
        }
    }

    _readOutline() {
        try {
            return fs.createReadStream(this.path + '/' + this.name + '.outline', {highWaterMark: DEFAULT_HIGH_WATER_MARK});
        } catch {
            return null;
        }
    }

    _readHtml() {
        try {
            return fs.createReadStream(this.path + '/' + this.name + '.html', {highWaterMark: DEFAULT_HIGH_WATER_MARK});
        } catch {
            throw new NotFoundError();
        }
    }

    _readCss() {
        try {
            return fs.createReadStream(this.path + '/' + this.name + '.css', {highWaterMark: DEFAULT_HIGH_WATER_MARK});
        } catch {
            throw new NotFoundError();
        }
    }
}

const processOutline = new Transform({
    transform(chunk, encoding, callback) {
        chunk = chunk.toString().replaceAll(/<li><a class="l" href="javascript:([^"]+)">([^<]+)<\/a><\/li>/gi, '');
        callback(null, chunk)
    }
});
