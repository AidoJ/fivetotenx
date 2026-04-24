import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  image?: string;
}

const SITE_URL = 'https://5to10x.app';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

const SEO = ({
  title = '5to10X — Custom AI Apps for Small & Medium Businesses | UK & Ireland',
  description = 'Custom AI apps that grow SMBs 5–10X. Free 2-minute ROI calculator, zero-risk build model. We design, build and launch automation apps for trades, services & ops teams.',
  canonical = SITE_URL + '/',
  noindex = false,
  image = DEFAULT_IMAGE,
}: SEOProps) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    {noindex && <meta name="robots" content="noindex, nofollow" />}
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={image} />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={image} />
  </Helmet>
);

export default SEO;
