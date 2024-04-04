import logger from 'morgan';
import createError from 'http-errors';
import express from 'express';
import cookieParser from 'cookie-parser';
import env from './env.js';
import fs from 'fs';

import indexRouter from './routes/index.js';
import docsRouter from './routes/docs.js';
import Index, {PdfIndex} from './docs/index.js';
import * as sitemapGenerator from './sitemap-generator.js';

console.log('holden.wiki startup');

// setup indexes
const index = new Index(env.DOCS_ROOT);
const pdfIndex = new PdfIndex(env.PDFS_ROOT)

console.log('Indexing HTML...');
index.indexDirectory();
console.log(`HTML Index completed with ${index.size} entries.`);

console.log('Indexing PDFs...')
pdfIndex.indexDirectory();
console.log(`PDF Index completed with ${pdfIndex.size} entries.`);

// generate sitemap
console.log('Generating sitemap...');
const sitemapPath = 'public/sitemap.xml'
sitemapGenerator.generate(index, [
    {
        path: '/',
        changeFrequency: 'monthly',
        priority: 1
    }
], sitemapPath);
console.log('Sitemap saved to ' + sitemapPath);

// setup express
const app = express();

// view engine setup
app.set('env', env.ENVIRONMENT);
app.set('views', 'views');
app.set('view engine', 'ejs');

app.use(logger(env.ENVIRONMENT));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static('public'));

//app.use('/', indexRouter);
app.get('/', (req, res) => { res.redirect('/docs/Main Menu'); })
app.use('/docs', docsRouter(index, pdfIndex));

app.get('/robots.txt', async (req, res) => {
    let robots = (await fs.promises.readFile('robots.txt')).toString();
    robots = robots.replaceAll('{base_url}', env.BASE_URL);
    res.contentType('text/plain');
    res.header('Content-Length', robots.length.toString());
    res.end(robots);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

app.listen(env.PORT, '0.0.0.0');
console.log('Web server listening on port ' + env.PORT);
