import {globSync} from 'glob';
import path from 'path';

export default class Index {
    constructor(directory) {
        this.directory = directory;
        this.index = {};
    }

    get size() {
        return Object.keys(this.index).length;
    }

    /**
     *
     * @param {string} path
     * @return {string|null}
     */
    lookup(path) {
        return this.index[this._normalize(path)]?.replaceAll('\\', '/') ?? null;
    }

    indexDirectory() {
        for (let file of globSync(this.directory + '/**/*.html')) {
            file = path.relative(this.directory, file);
            this.index[this._normalize(file)] = file;
        }
    }

    _normalize(path) {
        path = decodeURIComponent(path.toLowerCase().replaceAll('\\', '/'));

        if (path.endsWith('.html')) {
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
