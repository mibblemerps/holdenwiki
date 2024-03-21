import path from 'path';
import fs from 'fs/promises';
import env from '../env.js';
import * as cheerio from 'cheerio';
import NotFoundError from './notFoundError.js';

const docsRoot = path.resolve(env.DOCS_ROOT);

/**
 * Sanitize a user-provided path to a doc. Ensures no path traversal is happening.
 *
 * @param docPath
 * @throws {Error}
 * @return {string}
 */
function sanitizeDocPath(docPath) {
    docPath = path.normalize(decodeURI(docPath.replace('\\', '/')));

    let absolutePath = path.join(docsRoot, docPath);
    if (absolutePath.indexOf(docsRoot) !== 0) {
        throw new Error("Path traversal in doc path");
    }

    return absolutePath;
}

/**
 *
 * @param {string} outline
 * @return {string}
 */
function processOutline(outline) {
    let $ = cheerio.load(outline);

    const links = $('a');

    // Remove outline if there's a single entry to just the first page
    if (links.length === 1 && links.first().attr('href') === '#pf1') {
        return '';
    }

    links.each(function (i, elm) {
        if ($(this).text() === 'MODEL SELECTION INDEX') {
            $(this).replaceWith('<a class="l" href="/docs">&lArr; Main Menu</a>');
        }

        // Remove JavaScript links
        if ($(this).attr('href').startsWith('javascript:')) {
            $(this).remove();
            return;
        }

        // ...
    });

    return $.html();
}

/**
 *
 * @param {string} docPath
 * @return {Promise<string>}
 */
export async function getDocument(docPath) {
    docPath = sanitizeDocPath(docPath);

    let doc;
    try {
        doc = await fs.readFile(docPath, 'utf-8');
    } catch (err) {
        if (err.code === 'ENOENT') {
            throw new NotFoundError();
        }
    }

    let outline = null;
    try {
        outline = await fs.readFile(docPath.substring(0, docPath.lastIndexOf('.')) + '.outline');
    } catch {}

    return processDocument(doc, outline);
}

