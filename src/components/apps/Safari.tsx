'use client';
import { useState, useRef, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Lock, Search, ShieldAlert, ExternalLink, Book } from 'lucide-react';
import SafariStartPage from './SafariStartPage';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/hooks/use-i18n';


const BlockedUrlPage = ({ url, onOpenExternally, onGoBack }: { url: string; onOpenExternally: () => void; onGoBack: () => void; }) => {
    const { t } = useI18n();
    const displayUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    return (
        <div className="h-full w-full flex flex-col items-center justify-center text-center p-4 bg-neutral-100 text-black">
            <ShieldAlert className="w-12 h-12 text-neutral-400 mb-4" />
            <h2 className="text-xl font-semibold">{t('safari.blocked.title')}</h2>
            <p className="text-neutral-600 mt-2 max-w-sm">
                {t('safari.blocked.description', { url: displayUrl })}
            </p>
            <div className='flex gap-4 mt-6'>
                <Button variant="outline" onClick={onGoBack}>{t('back')}</Button>
                <Button onClick={onOpenExternally}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t('safari.blocked.openExternal')}
                </Button>
            </div>
        </div>
    );
};


const Safari = ({ children, initialUrl, initialContent, initialDisplayUrl }: { children?: ReactNode, initialUrl?: string, initialContent?: string, initialDisplayUrl?: string }) => {
  const { t } = useI18n();
  const [currentUrl, setCurrentUrl] = useState(initialUrl || '');
  const [displayUrl, setDisplayUrl] = useState(children ? initialDisplayUrl || '' : initialUrl || '');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [history, setHistory] = useState<(string)[]>([initialUrl || '']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [blockedUrl, setBlockedUrl] = useState<string | null>(null);

  const navigateTo = (url: string) => {
    let finalUrl = url.trim();
    setBlockedUrl(null);

    if (!finalUrl) {
        setCurrentUrl('');
        setDisplayUrl('');
        return;
    }
    
    if (finalUrl.startsWith('/app/')) {
        finalUrl = `https://www.google.com/search?igu=1&q=${encodeURIComponent(`Daniel Cabrera ${finalUrl.replace('/app/', '')}`)}`;
    } else if (!/^(https?:\/\/|data:)/i.test(finalUrl)) {
      const isUrlLike = finalUrl.includes('.') && !finalUrl.includes(' ');
      if (isUrlLike) {
        finalUrl = `https://${finalUrl}`;
      } else {
        finalUrl = `https://www.google.com/search?igu=1&q=${encodeURIComponent(finalUrl)}`;
      }
    }

    const blocklist = [
        'google.com',
        'github.com',
        'linkedin.com',
        'facebook.com',
        'instagram.com',
        'twitter.com',
        'x.com',
        'discord.com',
        'apple.com'
    ];
    
    try {
        if (!finalUrl.startsWith('data:')) {
             const urlObject = new URL(finalUrl);
             const hostname = urlObject.hostname.replace(/^www\./, '');
             if (blocklist.includes(hostname) && !finalUrl.includes('igu=1')) {
                 setBlockedUrl(finalUrl);
                 setDisplayUrl(url); 
                 setCurrentUrl(''); 
                 return;
             }
        }
    } catch (e) {
        // Ignore invalid URL errors here, they will be handled by search
    }

    
    setCurrentUrl(finalUrl);
    setDisplayUrl(finalUrl);
    
    const newHistory = history.slice(0, historyIndex + 1);
    if (newHistory[newHistory.length - 1] !== finalUrl) {
        newHistory.push(finalUrl);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }
  };

  const handleGo = () => {
    navigateTo(displayUrl);
  };
  
  const navigateHistory = (direction: 'back' | 'forward') => {
      const newIndex = direction === 'back' ? historyIndex - 1 : historyIndex + 1;
      if (newIndex >= 0 && newIndex < history.length) {
          setHistoryIndex(newIndex);
          const newUrl = history[newIndex];
          if(blockedUrl) setBlockedUrl(null);
          setCurrentUrl(newUrl);
          setDisplayUrl(newUrl);
      }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleGo();
    }
  };
  
  const handleReload = () => {
    if (currentUrl) {
      setIframeKey(Date.now());
    }
  };

  const handleOpenExternally = () => {
    if (blockedUrl) {
        window.open(blockedUrl, '_blank', 'noopener,noreferrer');
        setBlockedUrl(null);
        setCurrentUrl('');
        setDisplayUrl('');
    }
  };

  const isInternalPage = !!children;

  return (
    <>
    <div className="w-full h-full flex flex-col bg-transparent rounded-b-lg overflow-hidden text-black dark:text-white">
      <div className="flex items-center p-3 bg-transparent border-b border-neutral-300 dark:border-[#38383A]">
        <div className="flex gap-3 text-black dark:text-white">
          <button aria-label="Navegar atrás" onClick={() => navigateHistory('back')} disabled={isInternalPage || (historyIndex === 0 && !blockedUrl)} className="disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md"><ArrowLeft size={22} /></button>
          <button aria-label="Navegar adelante" onClick={() => navigateHistory('forward')} disabled={isInternalPage || historyIndex === history.length - 1} className="disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md"><ArrowRight size={22} /></button>
          <button aria-label="Recargar página" onClick={handleReload} disabled={isInternalPage || !currentUrl} className="disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md"><RotateCw size={20} /></button>
        </div>
        <div className="flex-1 mx-2">
          <div className="flex items-center bg-neutral-200/60 dark:bg-[#3A3A3C] rounded-md px-2 border border-transparent">
            {isInternalPage ? 
                <Book size={14} className="text-black dark:text-white"/> :
                <Lock size={14} className={cn("text-black dark:text-white", (displayUrl.startsWith('data:') || !displayUrl) && 'opacity-0')} />
            }
            <input
              type="text"
              aria-label="Barra de direcciones"
              value={displayUrl}
              onChange={(e) => setDisplayUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={(e) => e.target.select()}
              className="w-full bg-transparent py-1.5 text-center text-sm text-black dark:text-white placeholder:text-black/60 dark:placeholder:text-white/60 focus:outline-none"
              placeholder={t('safari.placeholder')}
              readOnly={isInternalPage}
            />
             <button aria-label="Ir a la dirección" onClick={handleGo} disabled={isInternalPage} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md">
                <Search size={16} className={cn("text-blue-500", isInternalPage && "opacity-40")} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="w-full flex-1 min-h-0 flex flex-col bg-transparent overflow-hidden">
        {isInternalPage ? (
          <div className="flex-1 min-h-0 w-full h-full overflow-y-auto overflow-x-hidden bg-white dark:bg-black overscroll-y-contain webkit-overflow-scrolling-touch [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="pb-14 min-h-full">
              {children}
            </div>
          </div>
        ) : blockedUrl ? (
            <BlockedUrlPage 
                url={blockedUrl}
                onOpenExternally={handleOpenExternally}
                onGoBack={() => { setBlockedUrl(null); setDisplayUrl(''); }}
            />
        ) : currentUrl ? (
            <iframe
                key={iframeKey}
                ref={iframeRef}
                src={currentUrl.startsWith('data:') ? undefined : currentUrl}
                srcDoc={currentUrl.startsWith('data:') ? initialContent : undefined}
                className="w-full h-full border-none"
                title="Safari Content"
            />
        ) : (
            <SafariStartPage onNavigate={navigateTo} />
        )}
      </div>
    </div>
    </>
  );
};

export default Safari;
