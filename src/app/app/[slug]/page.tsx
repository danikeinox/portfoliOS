import type { Metadata } from 'next';
import AppViewer from '@/components/apps/AppViewer';
import { getAppSeoMetadata } from '@/lib/seo/routes';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return getAppSeoMetadata(slug);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <AppViewer slug={slug} />;
}
