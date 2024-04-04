import 'dotenv/config';

export default {
    BASE_URL: process.env.BASE_URL,
    ENVIRONMENT: process.env.ENVIRONMENT ?? 'prod',
    PORT: process.env.PORT,
    DOCS_ROOT: process.env.DOCS_ROOT,
    PDFS_ROOT: process.env.PDFS_ROOT,
};
