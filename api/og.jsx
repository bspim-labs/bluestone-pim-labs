import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || 'Bluestone PIM Labs';
  const isLanding = !searchParams.get('title');

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:8000';

  const logoUrl = `${baseUrl}/public/bluestone_pim_logo_white.webp`;

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0f172a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        <img src={logoUrl} width="72" height="72" style={{ marginBottom: 36 }} />
        <div
          style={{
            color: '#f1f5f9',
            fontSize: isLanding ? 64 : 54,
            fontWeight: 700,
            lineHeight: 1.1,
            maxWidth: 960,
          }}
        >
          {title}
        </div>
        {isLanding && (
          <div
            style={{
              color: '#64748b',
              fontSize: 28,
              marginTop: 20,
              lineHeight: 1.4,
            }}
          >
            Community projects for Bluestone PIM builders
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
