import express from 'express';
import NotFoundError from '../docs/notFoundError.js';
import Document from '../docs/document.js';
import util from 'node:util';
import path from 'path';
import env from '../env.js';
import Index, {PdfIndex} from '../docs/index.js';

const docsRoot = path.resolve(env.DOCS_ROOT);
const pdfsRoot = path.resolve(env.PDFS_ROOT);

/**
 *
 * @param {Index} index
 * @param {PdfIndex} pdfIndex
 * @return {Router}
 */
export default function(index, pdfIndex) {
    const router = express.Router();

    router.use((req, res, next) => {
        req.url = req.url.toLowerCase();
        next();
    });

    router.get('/', (req, res) => {
        res.redirect('/docs/Main Menu');
    });

    // Common static assets
    router.use(express.static('public/docs'));

    router.get(/^\/pdf\/(.+).pdf$/i, async (req, res, next) => {
        if (!pdfIndex.exists(req.params[0])) {
            // not found!
            next();
            return;
        }

        res.contentType('application/pdf')
        res.sendFile(pdfsRoot + '/' + pdfIndex.lookup(req.params[0]));
    });

    // Actual document HTML
    router.get(/(.+).html$/i, async (req, res, next) => {
        try {
            const resRender = util.promisify(res.render.bind(res));
            const renderedTemplate = await resRender('doc');

            const document = new Document(index.lookup(req.url));
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

        // Determine file name from the URL
        let originalFileName = req.originalUrl;
        if (originalFileName.endsWith('/')) {
            originalFileName = originalFileName.substring(0, originalFileName.length - 1);
        }
        originalFileName = decodeURI(originalFileName.substring(originalFileName.lastIndexOf('/') + 1));

        let outline;
        let viewUrl;
        let isFallbackToPdf = false;
        if (index.exists(req.url)) {
            viewUrl = req.baseUrl + req.url + '/' + fileName + '.html';

            const document = new Document(index.lookup(req.url));

            let chunks = [];
            const outlineStream = document._readOutline();
            for await (const chunk of outlineStream) {
                chunks.push(chunk);
            }
            outline = Buffer.concat(chunks).toString();
        } else if (pdfIndex.exists(req.url)) {
            viewUrl = req.baseUrl + '/pdf/' + req.url + '.pdf';
            isFallbackToPdf = true;
        } else {
            next();
            return;
        }

        res.render('viewer', {
            url: viewUrl,
            fileName: originalFileName,
            isFallbackToPdf: isFallbackToPdf,
            sidebar: outline
        });
    });

    return router;
}

