import AppViewer from '@/components/apps/AppViewer';

export const dynamic = 'force-dynamic';

// Note: The 'slug' parameter can now be typed as string
// because dynamic segment params are guaranteed to be strings.
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <AppViewer slug={slug} />;
}
