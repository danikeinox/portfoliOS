'use client';

import { useState, useRef } from 'react';
import { 
    GoogleAuthProvider, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    Auth
} from 'firebase/auth';
import { useI18n } from '@/hooks/use-i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Chrome } from 'lucide-react';
import Image from 'next/image';

type AuthMode = 'login' | 'register';

interface AuthScreenProps {
    auth: Auth;
    onSuccess?: () => void;
    title?: string;
    description?: string;
}

const insetInput = 'h-12 rounded-xl border-0 bg-[#EFEFF4] dark:bg-[#2C2C2E] text-[15px] focus-visible:ring-2 focus-visible:ring-[#0A84FF]';
const primaryButton = 'h-12 rounded-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white font-semibold text-[15px]';

export default function AuthScreen({ auth, onSuccess, title, description }: AuthScreenProps) {
    const { t } = useI18n();
    const { toast } = useToast();
    const [authMode, setAuthMode] = useState<AuthMode>('login');
    const [loading, setLoading] = useState(false);
    
    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [uploadLoading, setUploadLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const authErrorMessage = (error: any): string => {
        const code = error?.code || '';
        switch (code) {
            case 'auth/invalid-email': return t('appstore.invalidEmail') || 'Email inválido';
            case 'auth/user-not-found':
            case 'auth/invalid-credential':
            case 'auth/wrong-password': return t('appstore.invalidCredentials') || 'Credenciales inválidas';
            case 'auth/email-already-in-use': return t('appstore.emailInUse') || 'Email en uso';
            case 'auth/weak-password': return t('appstore.weakPassword') || 'Contraseña débil';
            case 'auth/too-many-requests': return t('appstore.tooManyRequests') || 'Demasiados intentos';
            default: return t('appstore.authError') || 'Error de autenticación';
        }
    };

    const handleLogin = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!email || !password) return;
        
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast({ title: t('appstore.welcomeBack') || 'Bienvenido de nuevo' });
            onSuccess?.();
        } catch (error) {
            toast({ 
                title: t('appstore.loginError') || 'Error al entrar', 
                description: authErrorMessage(error),
                variant: 'destructive' 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!email || !password || !nickname || !displayName) {
            toast({ title: t('appstore.formIncomplete') || 'Completa todos los campos' });
            return;
        }

        setLoading(true);
        try {
            // First check nickname availability via API (mocking the intention here, 
            // the user might need a real API call later as in AppStore.tsx)
            const checkRes = await fetch(`/api/appstore/users/check-nickname?nickname=${encodeURIComponent(nickname)}`);
            const checkData = await checkRes.json();
            
            if (!checkData.success || !checkData.data.available) {
                toast({ title: t('appstore.nicknameTaken') || 'Nickname ocupado', variant: 'destructive' });
                setLoading(false);
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Create profile
            const profileRes = await fetch('/api/appstore/users/profile', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await userCredential.user.getIdToken()}`
                },
                body: JSON.stringify({
                    nickname,
                    displayName,
                    bio,
                    avatarUrl
                })
            });

            if (!profileRes.ok) {
                throw new Error('Failed to create profile');
            }

            toast({ title: t('appstore.accountCreated') || 'Cuenta creada con éxito' });
            onSuccess?.();
        } catch (error) {
            toast({ 
                title: t('appstore.registerError') || 'Error al registrarse', 
                description: authErrorMessage(error),
                variant: 'destructive' 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            // Profile completion check happens globally via onAuthStateChanged & AppStore logic
            onSuccess?.();
        } catch (error) {
            toast({ 
                title: 'Google Login', 
                description: authErrorMessage(error),
                variant: 'destructive' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#1C1C1E] text-black dark:text-white p-6 overflow-y-auto">
            <div className="mb-8 text-center sm:text-left">
                <h2 className="text-3xl font-bold tracking-tight mb-2">
                    {title || (authMode === 'login' ? t('appstore.loginTitle') : t('appstore.registerTitle'))}
                </h2>
                <p className="text-[#8A8A8E] dark:text-[#8E8E93]">
                    {description || (authMode === 'login' ? t('appstore.loginDescription') : t('appstore.registerDescription'))}
                </p>
            </div>

            <div className="flex-1 max-w-md mx-auto w-full space-y-6">
                <div className="rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] p-1.5 flex gap-1">
                    <button
                        onClick={() => setAuthMode('login')}
                        className={`flex-1 h-9 rounded-xl text-sm font-semibold transition ${authMode === 'login' ? 'bg-white dark:bg-[#636366] shadow-sm' : 'text-[#8A8A8E]'}`}
                    >
                        {t('appstore.login')}
                    </button>
                    <button
                        onClick={() => setAuthMode('register')}
                        className={`flex-1 h-9 rounded-xl text-sm font-semibold transition ${authMode === 'register' ? 'bg-white dark:bg-[#636366] shadow-sm' : 'text-[#8A8A8E]'}`}
                    >
                        {t('appstore.register')}
                    </button>
                </div>

                <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
                    <div className="space-y-3">
                        <Input 
                            type="email"
                            placeholder={t('appstore.email')}
                            className={insetInput}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Input 
                            type="password"
                            placeholder={t('appstore.password')}
                            className={insetInput}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        {authMode === 'register' && (
                            <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2">
                                <Input 
                                    placeholder={t('appstore.nickname')}
                                    className={insetInput}
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    required
                                />
                                <Input 
                                    placeholder={t('appstore.displayName')}
                                    className={insetInput}
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    required
                                />
                                <textarea 
                                    placeholder={t('appstore.bioOptional')}
                                    className="w-full min-h-[80px] rounded-xl border-0 bg-[#EFEFF4] dark:bg-[#2C2C2E] p-3 text-[15px] focus:ring-2 focus:ring-[#0A84FF] outline-none"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <Button 
                        type="submit" 
                        className={`${primaryButton} w-full mt-2`}
                        disabled={loading}
                    >
                        {loading ? t('appstore.processing') : (authMode === 'login' ? t('appstore.enter') : t('appstore.createAccount'))}
                    </Button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-neutral-200 dark:border-neutral-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-[#1C1C1E] px-2 text-[#8A8A8E]">{t('settings.general.or') || 'O'}</span>
                    </div>
                </div>

                <Button 
                    variant="outline" 
                    className="h-12 w-full rounded-xl border-neutral-200 dark:border-neutral-800 font-semibold flex items-center justify-center gap-2"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                >
                    <Chrome className="h-5 w-5 text-[#4285F4]" />
                    {t('appstore.continueGoogle')}
                </Button>
            </div>
        </div>
    );
}
