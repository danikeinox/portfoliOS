'use client';
import { useMemo } from 'react';
import Image from 'next/image';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, type DocumentData } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/hooks/use-i18n';
import { splitBlogParagraphs } from '@/lib/blog';
import { Rss } from 'lucide-react';

const Blog = () => {
    const firestore = useFirestore();
    const { t, locale } = useI18n();

    const blogQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'blog'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: posts, loading } = useCollection(blogQuery);

    const formatDate = (date: any) => {
        if (!date) return '';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
    }

    return (
        <div className="w-full min-h-full bg-[#F2F2F7] dark:bg-black text-black dark:text-white pb-12">
            <div className="max-w-xl mx-auto py-4">
            <div className="px-4">
                <h1 className="text-3xl font-bold mb-8">{t('blog.title')}</h1>
            </div>
            
            {loading && (
                <div className="space-y-6 bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mx-4 my-4 p-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                    ))}
                </div>
            )}

            {!loading && posts && posts.length > 0 && (
                <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mx-4 my-4">
                    {posts.map((post: DocumentData) => (
                        <div key={post.id} className="border-b border-neutral-200 dark:border-[#38383A] last:border-none ml-4 py-6 pr-4">
                            <p className="text-xs font-semibold text-[#8A8A8E] dark:text-[#8E8E93] uppercase tracking-wider">{post.author}</p>
                            <h2 className="text-2xl font-bold mt-1 tracking-tight text-black dark:text-white">{post.title}</h2>
                            {typeof post.coverImage === 'string' && post.coverImage && (
                                <div className="mt-4 overflow-hidden rounded-lg">
                                    <Image
                                        src={post.coverImage}
                                        alt={post.title || ''}
                                        width={1200}
                                        height={630}
                                        className="w-full h-auto object-cover"
                                    />
                                </div>
                            )}
                            <div className="mt-2 space-y-3">
                                {splitBlogParagraphs(post.content || '').map((paragraph, i) => (
                                    <p
                                        key={i}
                                        className="text-[#8A8A8E] dark:text-[#8E8E93] text-base leading-relaxed whitespace-pre-line"
                                    >
                                        {paragraph}
                                    </p>
                                ))}
                            </div>
                            {Array.isArray(post.images) && post.images.length > 0 && (
                                <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                                    {post.images.map((src: string) => (
                                        <Image
                                            key={src}
                                            src={src}
                                            alt=""
                                            width={195}
                                            height={422}
                                            className="h-64 w-auto rounded-lg border border-neutral-200 dark:border-[#38383A] object-cover shrink-0"
                                        />
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93] mt-4">{formatDate(post.createdAt)}</p>
                        </div>
                    ))}
                </div>
            )}
            
            {!loading && (!posts || posts.length === 0) && (
                <div className="text-center text-[#8A8A8E] dark:text-[#8E8E93] py-24 bg-white dark:bg-[#1C1C1E] rounded-xl mx-4 my-4">
                    <Rss className="w-12 h-12 mx-auto text-[#8A8A8E] dark:text-[#8E8E93] mb-4" />
                    <p className="text-lg font-semibold text-black dark:text-white">{t('blog.empty')}</p>
                    <p className="text-sm mt-2 max-w-xs mx-auto">{t('blog.emptyHint')}</p>
                </div>
            )}
            </div>
        </div>
    );
};

export default Blog;
