'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, type DocumentData } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, ChevronLeft, Pen } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/hooks/use-i18n';
import { cn } from '@/lib/utils';
import DrawingCanvas, { type DrawingCanvasHandles } from './notes/DrawingCanvas';
import DrawingToolbar, { type Tool, COLORS } from './notes/DrawingToolbar';
import { useTheme } from '@/hooks/use-theme';
import Image from 'next/image';

// Debounce hook for auto-saving
const useDebounce = (value: any, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};


const Notes = () => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { t } = useI18n();
    const { theme } = useTheme();

    const [selectedNote, setSelectedNote] = useState<DocumentData | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    
    // Editor state
    const contentRef = useRef<HTMLTextAreaElement>(null);
    const [noteTitle, setNoteTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [drawingData, setDrawingData] = useState<string | undefined>(undefined);
    
    // Drawing Mode State
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [activeTool, setActiveTool] = useState<Tool>('pen');
    const [activeColor, setActiveColor] = useState<string>(COLORS[0]);
    const drawingCanvasRef = useRef<DrawingCanvasHandles>(null);

    // Debounce for auto-saving
    const debouncedTitle = useDebounce(noteTitle, 1000);
    const debouncedContent = useDebounce(noteContent, 1000);
    const debouncedDrawing = useDebounce(drawingData, 1000);
    const isSaving = useRef(false);

    const notesQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'notes'), orderBy('updatedAt', 'desc'));
    }, [firestore]);

    const { data: notes, loading } = useCollection(notesQuery);

    // Auto-focus text area on edit/create
    useEffect(() => {
        if (isCreating || selectedNote) {
            const timer = setTimeout(() => {
                if (contentRef.current) {
                    contentRef.current.focus();
                    const len = contentRef.current.value.length;
                    contentRef.current.setSelectionRange(len, len);
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isCreating, selectedNote]);

    // Auto-save effect
    useEffect(() => {
        if (!firestore || !selectedNote || isSaving.current || isDrawingMode) return;

        const originalNote = notes?.find(n => n.id === selectedNote.id);
        if (!originalNote) return;

        const hasChanges = originalNote.title !== debouncedTitle || originalNote.content !== debouncedContent || originalNote.drawing !== debouncedDrawing;

        if (hasChanges) {
            isSaving.current = true;
            const noteRef = doc(firestore, 'notes', selectedNote.id);
            updateDoc(noteRef, {
                title: debouncedTitle,
                content: debouncedContent,
                drawing: debouncedDrawing || null,
                updatedAt: serverTimestamp(),
            }).finally(() => {
                isSaving.current = false;
            });
        }
    }, [debouncedTitle, debouncedContent, debouncedDrawing, selectedNote, firestore, notes, isDrawingMode]);

    const handleCreateNote = async () => {
        if (!firestore) return;
        if (!noteTitle.trim() && !noteContent.trim() && !drawingData) return;

        await addDoc(collection(firestore, 'notes'), {
            title: noteTitle,
            content: noteContent,
            drawing: drawingData || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        setNoteTitle('');
        setNoteContent('');
        setDrawingData(undefined);
        setIsCreating(false);
        toast({ title: t('notes.noteCreated') });
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!firestore) return;
        await deleteDoc(doc(firestore, `notes`, noteId));
        setSelectedNote(null);
        toast({ title: t('notes.noteDeleted'), variant: 'destructive' });
    };

    const handleSelectNote = (note: DocumentData) => {
        setSelectedNote(note);
        setNoteTitle(note.title);
        setNoteContent(note.content || '');
        setDrawingData(note.drawing);
        setIsDrawingMode(false);
    };

    const handleBack = () => {
        if(isCreating && (noteTitle || noteContent || drawingData)) {
            handleCreateNote();
        }
        setSelectedNote(null);
        setIsCreating(false);
        setNoteTitle('');
        setNoteContent('');
        setDrawingData(undefined);
        setIsDrawingMode(false);
    }
    
    if (loading) {
        return (
            <div className="w-full min-h-full bg-[#F2F2F7] dark:bg-black text-black dark:text-white pb-12">
                <div className="max-w-xl mx-auto py-4 px-4 space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        )
    }

    if (selectedNote || isCreating) {
        const eraserColor = theme === 'dark' ? '#000000' : '#fefce8';
        return (
             <div className="flex flex-col w-full h-full bg-[#F2F2F7] dark:bg-black text-black dark:text-white relative">
                <div className="flex-1 w-full max-w-xl mx-auto py-4 px-4 flex flex-col min-h-0 relative">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <Button variant="ghost" onClick={handleBack} className="text-system-yellow hover:text-system-yellow flex items-center">
                        <ChevronLeft size={24} className="-ml-2"/> {t('notes.title')}
                    </Button>
                    <div className="flex items-center gap-1">
                        {selectedNote && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-system-yellow hover:text-system-yellow/80">
                                        <Trash2 size={20} />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-neutral-800/80 backdrop-blur-xl border-none rounded-2xl text-white w-[270px]">
                                    <AlertDialogHeader className="items-center space-y-1">
                                        <AlertDialogTitle className="font-semibold">{t('notes.deleteTitle')}</AlertDialogTitle>
                                        <AlertDialogDescription className="text-sm text-center">
                                            {t('notes.deleteConfirm', {noteTitle: selectedNote.title})}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="flex flex-col -mx-6 -mb-6 mt-4">
                                        <AlertDialogAction onClick={() => handleDeleteNote(selectedNote.id)} className="w-full rounded-none justify-center bg-transparent text-red-500 hover:bg-neutral-700/70 border-t border-neutral-500/30 h-11 text-base font-normal">
                                            {t('delete')}
                                        </AlertDialogAction>
                                        <AlertDialogCancel className="w-full rounded-none justify-center bg-transparent text-system-yellow hover:bg-neutral-700/70 border-t border-neutral-500/30 mt-0 h-11 text-base font-semibold">
                                            {t('cancel')}
                                        </AlertDialogCancel>
                                    </div>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => setIsDrawingMode(p => !p)} className="text-system-yellow hover:text-system-yellow">
                            <Pen size={20} />
                        </Button>
                        {(isCreating || isDrawingMode) && (
                            <Button variant="ghost" onClick={() => { if(isDrawingMode) setIsDrawingMode(false); else handleBack(); }} disabled={isCreating && !noteTitle.trim() && !noteContent.trim() && !drawingData} className="text-system-yellow hover:text-system-yellow font-bold disabled:text-system-yellow/50">
                                {t('done')}
                            </Button>
                        )}
                    </div>
                </div>
                <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden">
                    <div className="p-4 pt-2 flex-1 relative">
                        <Input 
                            value={noteTitle}
                            onChange={(e) => setNoteTitle(e.target.value)}
                            placeholder={t('notes.creatingTitle')}
                            className="bg-transparent border-none text-2xl font-bold p-0 focus-visible:ring-0 text-black dark:text-white flex-shrink-0"
                            readOnly={isDrawingMode}
                        />
                        <div className="flex-1 relative mt-2 min-h-0">
                            <Textarea 
                                ref={contentRef}
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                placeholder={t('notes.creatingContent')}
                                className="bg-transparent border-none p-0 focus-visible:ring-0 text-black dark:text-white flex-1 resize-none w-full h-full absolute top-0 left-0 leading-relaxed"
                                readOnly={isDrawingMode}
                            />
                            {drawingData && !isDrawingMode && (
                                <Image
                                    src={drawingData}
                                    alt="User drawing"
                                    fill
                                    sizes="100vw"
                                    className="w-full h-full absolute top-0 left-0 pointer-events-none"
                                />
                            )}

                            {isDrawingMode && (
                                <div className="w-full h-full absolute top-0 left-0">
                                    <DrawingCanvas 
                                        ref={drawingCanvasRef}
                                        initialData={drawingData}
                                        strokeColor={activeColor}
                                        strokeWidth={activeTool === 'pen' ? 2 : 20}
                                        mode={activeTool === 'pen' ? 'draw' : 'erase'}
                                        eraserColor={eraserColor}
                                        onDrawEnd={(data) => setDrawingData(data)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                 </div>

                 {isDrawingMode && (
                    <DrawingToolbar
                        activeTool={activeTool}
                        setActiveTool={setActiveTool}
                        activeColor={activeColor}
                        setActiveColor={setActiveColor}
                        onClear={() => {
                            drawingCanvasRef.current?.clear();
                        }}
                    />
                )}
            </div>
            </div>
        )
    }

    return (
        <div className="w-full min-h-full bg-[#F2F2F7] dark:bg-black text-black dark:text-white pb-12">
            <div className="max-w-xl mx-auto py-4">
            <div className="px-4 text-xs text-[#8A8A8E] dark:text-[#8E8E93] mb-2">{t('notes.iCloud')}</div>
            <div className="flex justify-between items-center mb-4 px-4">
                <h1 className="text-3xl font-bold">{t('notes.title')}</h1>
                <Button variant="ghost" size="icon" onClick={() => setIsCreating(true)} className="text-system-yellow hover:text-system-yellow">
                    <Plus size={24} />
                </Button>
            </div>
            
            <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mx-4 my-4">
                {notes && notes.length > 0 ? (
                    <div>
                        {notes.map((note: DocumentData) => (
                            <button key={note.id} onClick={() => handleSelectNote(note)} className="w-full text-left p-3 border-b border-neutral-200 dark:border-[#38383A] last:border-none ml-4">
                                <h3 className="font-semibold truncate text-black dark:text-white">{note.title || t('notes.creatingTitle')}</h3>
                                <p className="text-sm text-[#8A8A8E] dark:text-[#8E8E93] truncate">{note.content || t('notes.noAdditionalText')}</p>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-[#8A8A8E] dark:text-[#8E8E93] py-16">
                        <p className="text-black dark:text-white">{t('notes.noNotes')}</p>
                        <p>{t('notes.noNotesHint')}</p>
                    </div>
                )}
            </div>
             <p className="text-center text-[#8A8A8E] dark:text-[#8E8E93] text-sm mt-4">
                {t('notes.notesCount', { count: notes?.length || 0 })}
            </p>
            </div>
        </div>
    );
};

export default Notes;
