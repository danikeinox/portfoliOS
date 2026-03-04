import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '64px',
          background:
            'linear-gradient(135deg, rgba(11,15,26,1) 0%, rgba(20,33,61,1) 55%, rgba(58,123,213,1) 100%)',
          color: 'white',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        }}
      >
        <div style={{ fontSize: 30, opacity: 0.8, marginBottom: 12 }}>Portfolio</div>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05 }}>Daniel Cabrera</div>
        <div style={{ fontSize: 28, opacity: 0.9, marginTop: 18 }}>Experiencia iOS en web, móvil y PWA opcional</div>
      </div>
    ),
    size
  );
}
