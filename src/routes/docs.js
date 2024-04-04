import express from 'express';
import NotFoundError from '../docs/notFoundError.js';
import Document from '../docs/document.js';
import util from 'node:util';
import path from 'path';
import env from '../env.js';
import Index from '../docs/index.js';

const router = express.Router();

const docsRoot = path.resolve(env.DOCS_ROOT);

const index = new Index(env.DOCS_ROOT);

console.log('Indexing docs...');
index.indexDirectory();
console.log(`Index completed with ${index.size} entries.`);

// router.use((req, res, next) => {
//     req.url = req.url.toLowerCase();
//     next();
// });

router.get('/', (req, res) => {
    res.redirect('/docs/Main Menu');
});

// Common static assets
router.use(express.static('public/docs'));

// Actual document HTML
router.get(/(.+).html$/i, async (req, res, next) => {
    try {
        const resRender = util.promisify(res.render.bind(res));
        const renderedTemplate = await resRender('doc');

        const document = new Document(index.lookup(req.url))
        if (!await document.exists()) {
            next();
            return;
        }

        res.contentType('text/html');
        await document.output(renderedTemplate, res);
    } catch (err) {
        if (err instanceof NotFoundError) {
            next();
        } else {
            throw err;
        }
    }
});

// Document static assets (mainly used for images)
router.use(express.static(docsRoot));

// Document viewer
router.get(/^(.+)$/i, async (req, res, next) => {
    if (req.url.endsWith('/')) {
        req.url = req.url.substring(0, req.url.length - 1);
    }
    const fileName = req.url.substring(req.url.lastIndexOf('/') + 1);

    // Check document exists
    let path = index.lookup(req.url);
    if (path === null) {
        next();
        return;
    }
    const document = new Document(path);

    let chunks = [];
    const outlineStream = document._readOutline();
    for await (const chunk of outlineStream) {
        chunks.push(chunk);
    }
    let outline = Buffer.concat(chunks).toString();

    // Determine file name from the URL
    let originalFileName = req.originalUrl;
    if (originalFileName.endsWith('/')) {
        originalFileName = originalFileName.substring(0, originalFileName.length - 1);
    }
    originalFileName = decodeURI(originalFileName.substring(originalFileName.lastIndexOf('/') + 1));

    res.render('viewer', {
        url: req.baseUrl + req.url + '/' + fileName + '.html',
        fileName: originalFileName,
        sidebar: outline
    });
});

export default router;
