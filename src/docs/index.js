import {globSync} from 'glob';
import path from 'path';
import NotFoundError from './notFoundError.js';

export default class Index {
    constructor(directory) {
        this.directory = directory;
        this.fileType = 'html';
        this.index = {};
    }

    get size() {
        return Object.keys(this.index).length;
    }

    /**
     * Does URL exist in index?
     *
     * @param url
     * @return {boolean}
     */
    exists(url) {
        let path = this.index[this._normalize(url)]?.replaceAll('\\', '/') ?? null;
        return path !== null;
    }

    /**
     *
     * @param {string} url
     * @throws {NotFoundError}
     * @return {string}
     */
    lookup(url) {
        let path = this.index[this._normalize(url)]?.replaceAll('\\', '/') ?? null;
        if (path === null) {
            throw new NotFoundError();
        }
        return path;
    }

    indexDirectory() {
        for (let file of globSync(this.directory + '/**/*.' + this.fileType)) {
            file = path.relative(this.directory, file);
            this.index[this._normalize(file)] = file;
        }
    }

    _normalize(path) {
        path = decodeURIComponent(path.toLowerCase().replaceAll('\\', '/'));

        if (path.endsWith('.' + this.fileType)) {
            path = path.substring(0, path.lastIndexOf('/'));
        }
        while (path.endsWith('/')) {
            path = path.substring(0, path.length - 1);
        }
        while (path.startsWith('/')) {
            path = path.substring(1);
        }

        return path;
    }
}

export class PdfIndex extends Index {
    constructor(directory) {
        super(directory);
        this.fileType = 'pdf';
    }

    _normalize(path) {
        path = decodeURIComponent(path.toLowerCase().replaceAll('\\', '/'));

        if (path.lastIndexOf('.') > path.lastIndexOf('/')) {
            path = path.substring(0, path.lastIndexOf('.'));
        }

        while (path.endsWith('/')) {
            path = path.substring(0, path.length - 1);
        }
        while (path.startsWith('/')) {
            path = path.substring(1);
        }

        return path;
    }
}
