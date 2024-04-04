import 'dotenv/config';

export default {
    ENVIRONMENT: process.env.ENVIRONMENT ?? 'prod',
    PORT: process.env.PORT,
    DOCS_ROOT: process.env.DOCS_ROOT,
    PDFS_ROOT: process.env.PDFS_ROOT,
};
