'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
} from 'firebase/auth';
import { useI18n } from '@/hooks/use-i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser } from '@/firebase';
import type {
    AppStoreApiResponse,
    AppStoreApp,
    NicknameAvailability,
    PublicDeveloperProfile,
    SocialRelationStatus,
    UserProfile,
} from '@/lib/appstore/contracts';

type AuthMode = 'login' | 'register';

type PublicProfileApi = AppStoreApiResponse<PublicDeveloperProfile>;
type OwnProfileApi = AppStoreApiResponse<UserProfile>;
type AppsListApi = AppStoreApiResponse<{ apps: AppStoreApp[]; count: number }>;
type RelationApi = AppStoreApiResponse<{ relation: SocialRelationStatus }>;

function extractNickFromEmail(email: string | null | undefined): string {
    const candidate = (email ?? 'usuario').split('@')[0] ?? 'usuario';
    return candidate.replace(/[^A-Za-zÀ-ÖØ-öø-ÿÑñ0-9 ]/g, '').slice(0, 24) || 'usuario';
}

const insetInput =
    'h-12 rounded-xl border-0 bg-[#EFEFF4] dark:bg-[#2C2C2E] text-[15px] focus-visible:ring-2 focus-visible:ring-[#0A84FF]';

const primaryButton =
    'h-12 rounded-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white font-semibold text-[15px]';

const AppStore = () => {
    const { locale } = useI18n();
    const { toast } = useToast();
    const auth = useAuth();
    const { data: firebaseUser } = useUser();

    const [apps, setApps] = useState<AppStoreApp[]>([]);
    const [appsLoading, setAppsLoading] = useState(false);
    const [authOpen, setAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState<AuthMode>('login');
    const [authLoading, setAuthLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState(false);
    const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    const [ownProfile, setOwnProfile] = useState<UserProfile | null>(null);
    const [selectedNickname, setSelectedNickname] = useState<string | null>(null);
    const [publicProfile, setPublicProfile] = useState<PublicDeveloperProfile | null>(null);
    const [editProfileOpen, setEditProfileOpen] = useState(false);

    const today = new Date();
    const dateString = today.toLocaleDateString(locale, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    const developers = useMemo(() => {
        const map = new Map<string, string>();
        for (const app of apps) {
            map.set(app.ownerNickname, app.ownerId);
        }
        return [...map.keys()];
    }, [apps]);

    async function authHeaders(): Promise<Record<string, string>> {
        if (!firebaseUser) {
            return {};
        }

        const token = await firebaseUser.getIdToken();
        return { Authorization: `Bearer ${token}` };
    }

    async function fetchApps() {
        setAppsLoading(true);
        try {
            const response = await fetch('/api/appstore/apps?status=published&limit=20', {
                method: 'GET',
            });
            const json = (await response.json()) as AppsListApi;

            if (!json.success) {
                toast({ title: 'AppStore', description: json.error.message, variant: 'destructive' });
                return;
            }

            setApps(json.data.apps);
        } catch {
            toast({ title: 'AppStore', description: 'No se pudieron cargar las apps.', variant: 'destructive' });
        } finally {
            setAppsLoading(false);
        }
    }

    async function fetchOwnProfile() {
        if (!firebaseUser) {
            setOwnProfile(null);
            return;
        }

        setProfileLoading(true);

        try {
            const headers = await authHeaders();
            const response = await fetch('/api/appstore/users/profile', {
                method: 'GET',
                headers,
            });

            const json = (await response.json()) as OwnProfileApi;

            if (!json.success) {
                if (json.error.code === 'PROFILE_NOT_FOUND') {
                    setNeedsProfileCompletion(true);
                    setDisplayName(firebaseUser.displayName ?? '');
                    setNickname(extractNickFromEmail(firebaseUser.email));
                    return;
                }

                toast({ title: 'Perfil', description: json.error.message, variant: 'destructive' });
                return;
            }

            setOwnProfile(json.data);
            if (!selectedNickname) {
                setSelectedNickname(json.data.nickname);
            }
        } catch {
            toast({ title: 'Perfil', description: 'No se pudo cargar tu perfil.', variant: 'destructive' });
        } finally {
            setProfileLoading(false);
        }
    }

    async function fetchPublicProfile(targetNickname: string) {
        setProfileLoading(true);
        try {
            const headers = await authHeaders();
            const query = encodeURIComponent(targetNickname);
            const response = await fetch(`/api/appstore/users/public?nickname=${query}`, {
                method: 'GET',
                headers,
            });

            const json = (await response.json()) as PublicProfileApi;

            if (!json.success) {
                toast({ title: 'Perfil', description: json.error.message, variant: 'destructive' });
                return;
            }

            setPublicProfile(json.data);
        } catch {
            toast({ title: 'Perfil', description: 'No se pudo abrir este perfil.', variant: 'destructive' });
        } finally {
            setProfileLoading(false);
        }
    }

    async function checkNicknameAvailability(candidate: string): Promise<boolean> {
        const response = await fetch(`/api/appstore/users/check-nickname?nickname=${encodeURIComponent(candidate)}`);
        const json = (await response.json()) as AppStoreApiResponse<NicknameAvailability>;

        if (!json.success) {
            toast({ title: 'Nickname', description: json.error.message, variant: 'destructive' });
            return false;
        }

        if (!json.data.available) {
            toast({ title: 'Nickname ocupado', description: 'Elige otro nickname para continuar.', variant: 'destructive' });
            return false;
        }

        return true;
    }

    async function upsertProfile() {
        if (!firebaseUser) {
            return false;
        }

        const isAvailable = await checkNicknameAvailability(nickname);
        if (!isAvailable) {
            return false;
        }

        const headers = await authHeaders();

        const response = await fetch('/api/appstore/users/profile', {
            method: 'PUT',
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nickname,
                displayName,
                bio,
                avatarUrl,
            }),
        });

        const json = (await response.json()) as OwnProfileApi;
        if (!json.success) {
            toast({ title: 'Perfil', description: json.error.message, variant: 'destructive' });
            return false;
        }

        setOwnProfile(json.data);
        setSelectedNickname(json.data.nickname);
        setNeedsProfileCompletion(false);
        toast({ title: 'Perfil actualizado', description: 'Tu perfil está listo.' });
        return true;
    }

    async function handleLogin() {
        if (!email || !password) {
            toast({ title: 'Faltan datos', description: 'Introduce email y contraseña.', variant: 'destructive' });
            return;
        }

        setAuthLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setAuthOpen(false);
            setEmail('');
            setPassword('');
        } catch {
            toast({ title: 'Login fallido', description: 'No se pudo iniciar sesión.', variant: 'destructive' });
        } finally {
            setAuthLoading(false);
        }
    }

    async function handleRegister() {
        if (!email || !password || !nickname || !displayName) {
            toast({ title: 'Faltan datos', description: 'Completa todos los campos requeridos.', variant: 'destructive' });
            return;
        }

        setAuthLoading(true);
        try {
            const available = await checkNicknameAvailability(nickname);
            if (!available) {
                return;
            }

            await createUserWithEmailAndPassword(auth, email, password);
            const profileOk = await upsertProfile();

            if (profileOk) {
                setAuthOpen(false);
                setEmail('');
                setPassword('');
                setBio('');
                setAvatarUrl('');
            }
        } catch {
            toast({ title: 'Registro fallido', description: 'No se pudo completar el registro.', variant: 'destructive' });
        } finally {
            setAuthLoading(false);
        }
    }

    async function handleGoogleLogin() {
        setAuthLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            if (result.user) {
                setDisplayName(result.user.displayName ?? '');
                setNickname(extractNickFromEmail(result.user.email));
            }

            setAuthOpen(false);
        } catch {
            toast({ title: 'Google Login', description: 'No se pudo iniciar con Google.', variant: 'destructive' });
        } finally {
            setAuthLoading(false);
        }
    }

    async function handleFollow() {
        if (!selectedNickname) {
            return;
        }

        if (!firebaseUser) {
            setAuthOpen(true);
            return;
        }

        setSocialLoading(true);

        try {
            const headers = await authHeaders();
            const response = await fetch('/api/appstore/social/follow', {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    targetNickname: selectedNickname,
                }),
            });

            const json = (await response.json()) as RelationApi;

            if (!json.success) {
                toast({ title: 'Sistema social', description: json.error.message, variant: 'destructive' });
                return;
            }

            await Promise.all([fetchOwnProfile(), fetchPublicProfile(selectedNickname)]);
        } catch {
            toast({ title: 'Sistema social', description: 'No se pudo seguir al desarrollador.', variant: 'destructive' });
        } finally {
            setSocialLoading(false);
        }
    }

    async function handleUnfollow() {
        if (!selectedNickname || !firebaseUser) {
            return;
        }

        setSocialLoading(true);

        try {
            const headers = await authHeaders();
            const response = await fetch(`/api/appstore/social/follow?targetNickname=${encodeURIComponent(selectedNickname)}`, {
                method: 'DELETE',
                headers,
            });

            const json = (await response.json()) as RelationApi;

            if (!json.success) {
                toast({ title: 'Sistema social', description: json.error.message, variant: 'destructive' });
                return;
            }

            await Promise.all([fetchOwnProfile(), fetchPublicProfile(selectedNickname)]);
        } catch {
            toast({ title: 'Sistema social', description: 'No se pudo dejar de seguir.', variant: 'destructive' });
        } finally {
            setSocialLoading(false);
        }
    }

    useEffect(() => {
        fetchApps();
    }, []);

    useEffect(() => {
        fetchOwnProfile();
    }, [firebaseUser]);

    useEffect(() => {
        if (!selectedNickname) {
            setPublicProfile(null);
            return;
        }

        fetchPublicProfile(selectedNickname);
    }, [selectedNickname, firebaseUser]);

    useEffect(() => {
        if (!ownProfile) {
            return;
        }

        setNickname(ownProfile.nickname);
        setDisplayName(ownProfile.displayName);
        setBio(ownProfile.bio ?? '');
        setAvatarUrl(ownProfile.avatarUrl ?? '');
    }, [ownProfile]);

    const relation = publicProfile?.relation ?? 'not_following';
    const relationLabel =
        relation === 'friends'
            ? 'Amigos'
            : relation === 'following'
                ? 'Siguiendo'
                : relation === 'self'
                    ? 'Tu perfil'
                    : 'Seguir';

    const reverseActionLabel = relation === 'friends' ? 'Dejar de ser Amigos' : 'Dejar de seguir';

    return (
        <ScrollArea className="h-full w-full bg-[#F2F2F7] dark:bg-black text-black dark:text-white">
            <div className="max-w-xl mx-auto p-4 space-y-4">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93] font-semibold uppercase">{dateString}</p>
                        <h1 className="text-4xl font-bold tracking-tight">App Store</h1>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            if (ownProfile?.nickname) {
                                setSelectedNickname(ownProfile.nickname);
                            } else {
                                setAuthOpen(true);
                            }
                        }}
                        className="h-10 w-10 relative"
                    >
                        <Image src={ownProfile?.avatarUrl || 'https://s6.imgcdn.dev/Yrcy4v.png'} fill alt="Profile" className="rounded-full object-cover" data-ai-hint="male portrait" />
                    </button>
                </div>

                {!firebaseUser && (
                    <div className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-[#38383A] p-5">
                        <p className="text-[15px] text-[#3A3A3C] dark:text-[#D1D1D6] mb-3">
                            Inicia sesión para crear tu perfil de desarrollador y conectar con otros creadores.
                        </p>
                        <Button className={`${primaryButton} w-full`} onClick={() => setAuthOpen(true)}>
                            Iniciar sesión / Registrarse
                        </Button>
                    </div>
                )}

                {profileLoading && (
                    <div className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-[#38383A] p-5 text-sm text-[#8A8A8E] dark:text-[#8E8E93]">
                        Cargando perfil...
                    </div>
                )}

                {publicProfile && (
                    <div className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-[#38383A] p-5">
                        <div className="flex items-center gap-3">
                            <div className="relative h-16 w-16">
                                <Image
                                    src={publicProfile.avatarUrl || 'https://s6.imgcdn.dev/Yrcy4v.png'}
                                    fill
                                    alt={publicProfile.nickname}
                                    className="rounded-2xl object-cover"
                                />
                            </div>
                            <div className="flex-1">
                                <p className="text-lg font-semibold">{publicProfile.displayName}</p>
                                <p className="text-sm text-[#8A8A8E] dark:text-[#8E8E93]">@{publicProfile.nickname}</p>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl bg-[#EFEFF4] dark:bg-[#2C2C2E] p-3 text-center">
                                <p className="text-2xl font-semibold">{publicProfile.followersCount}</p>
                                <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93] uppercase">Seguidores</p>
                            </div>
                            <div className="rounded-2xl bg-[#EFEFF4] dark:bg-[#2C2C2E] p-3 text-center">
                                <p className="text-2xl font-semibold">{publicProfile.followingCount}</p>
                                <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93] uppercase">Siguiendo</p>
                            </div>
                        </div>

                        {publicProfile.isOwner ? (
                            <div className="mt-4 space-y-2">
                                <Button className={`${primaryButton} w-full`} onClick={() => setEditProfileOpen(true)}>
                                    Editar Perfil
                                </Button>
                                <Button className="w-full h-11 rounded-full bg-[#34C759] hover:bg-[#34C759]/90 text-white font-semibold">
                                    Publicar nueva App (Paso 3)
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full h-10 rounded-full text-[#FF3B30] hover:text-[#FF3B30]"
                                    onClick={async () => {
                                        await signOut(auth);
                                        setOwnProfile(null);
                                        setSelectedNickname(null);
                                    }}
                                >
                                    Cerrar sesión
                                </Button>
                            </div>
                        ) : (
                            <div className="mt-4 space-y-2">
                                <Button
                                    className={`${primaryButton} w-full ${relation !== 'not_following' ? 'bg-[#34C759] hover:bg-[#34C759]/90' : ''}`}
                                    onClick={relation === 'not_following' ? handleFollow : undefined}
                                    disabled={socialLoading || relation !== 'not_following'}
                                >
                                    {socialLoading ? 'Actualizando...' : relationLabel}
                                </Button>

                                {(relation === 'following' || relation === 'friends') && (
                                    <Button
                                        variant="ghost"
                                        className="w-full h-10 rounded-full text-[#FF3B30] hover:text-[#FF3B30]"
                                        onClick={handleUnfollow}
                                        disabled={socialLoading}
                                    >
                                        {reverseActionLabel}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="relative rounded-3xl overflow-hidden border border-neutral-200 dark:border-[#38383A] bg-white dark:bg-[#1C1C1E]">
                    <Image
                        src="https://picsum.photos/seed/appstore-main/800/500"
                        alt="Main Feature"
                        width={800}
                        height={500}
                        className="w-full h-56 object-cover"
                        data-ai-hint="abstract art"
                    />
                    <div className="absolute bottom-0 left-0 p-4 text-white bg-gradient-to-t from-black/60 to-transparent w-full">
                        <p className="text-xs font-semibold uppercase">App Destacada</p>
                        <h2 className="text-2xl font-bold">Crea. Publica. Conecta.</h2>
                        <p className="text-sm">Tu perfil social de desarrollador en estilo iOS.</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl overflow-hidden border border-neutral-200 dark:border-[#38383A]">
                    <div className="px-4 pt-4 pb-2">
                        <h3 className="text-lg font-semibold">Apps publicadas</h3>
                        <p className="text-sm text-[#8A8A8E] dark:text-[#8E8E93]">Pulsa sobre el desarrollador para ver su perfil.</p>
                    </div>

                    {appsLoading ? (
                        <p className="px-4 pb-4 text-sm text-[#8A8A8E] dark:text-[#8E8E93]">Cargando apps...</p>
                    ) : apps.length === 0 ? (
                        <p className="px-4 pb-4 text-sm text-[#8A8A8E] dark:text-[#8E8E93]">Aún no hay apps publicadas.</p>
                    ) : (
                        apps.map((app) => (
                            <div key={app.id} className="border-t border-neutral-200 dark:border-[#38383A] px-4 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 rounded-2xl bg-[#EFEFF4] dark:bg-[#2C2C2E] flex items-center justify-center text-xs text-center px-2">
                                        {app.title.slice(0, 4).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate">{app.title}</p>
                                        <p className="text-sm text-[#8A8A8E] dark:text-[#8E8E93] truncate">{app.category}</p>
                                        <button
                                            type="button"
                                            className="text-sm text-[#0A84FF] mt-1"
                                            onClick={() => setSelectedNickname(app.ownerNickname)}
                                        >
                                            @{app.ownerNickname}
                                        </button>
                                    </div>
                                    <Button className="h-9 px-5 rounded-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white">Abrir</Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {developers.length > 0 && (
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-neutral-200 dark:border-[#38383A] p-4">
                        <h3 className="text-lg font-semibold mb-2">Desarrolladores</h3>
                        <div className="flex flex-wrap gap-2">
                            {developers.map((dev) => (
                                <Button
                                    key={dev}
                                    variant="secondary"
                                    className="rounded-full h-9"
                                    onClick={() => setSelectedNickname(dev)}
                                >
                                    @{dev}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={authOpen} onOpenChange={setAuthOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl border-0 p-0 overflow-hidden bg-[#F2F2F7] dark:bg-[#1C1C1E]">
                    <DialogHeader className="px-6 pt-6 pb-2 text-left">
                        <DialogTitle className="text-2xl font-semibold">
                            {authMode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-[#8A8A8E] dark:text-[#8E8E93]">
                            {authMode === 'login'
                                ? 'Accede con Email/Password o Google.'
                                : 'Regístrate con nickname único de desarrollador.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 pb-6 space-y-3">
                        <div className="rounded-2xl bg-white dark:bg-[#2C2C2E] p-2 grid grid-cols-2 gap-2">
                            <Button
                                variant={authMode === 'login' ? 'default' : 'ghost'}
                                className={`rounded-xl h-10 ${authMode === 'login' ? 'bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90' : ''}`}
                                onClick={() => setAuthMode('login')}
                            >
                                Login
                            </Button>
                            <Button
                                variant={authMode === 'register' ? 'default' : 'ghost'}
                                className={`rounded-xl h-10 ${authMode === 'register' ? 'bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90' : ''}`}
                                onClick={() => setAuthMode('register')}
                            >
                                Registro
                            </Button>
                        </div>

                        <div className="rounded-2xl bg-white dark:bg-[#2C2C2E] p-3 space-y-2">
                            <Input className={insetInput} placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
                            <Input
                                type="password"
                                className={insetInput}
                                placeholder="Contraseña"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                            />
                            {authMode === 'register' && (
                                <>
                                    <Input
                                        className={insetInput}
                                        placeholder="Nickname"
                                        value={nickname}
                                        onChange={(event) => setNickname(event.target.value)}
                                    />
                                    <Input
                                        className={insetInput}
                                        placeholder="Nombre visible"
                                        value={displayName}
                                        onChange={(event) => setDisplayName(event.target.value)}
                                    />
                                </>
                            )}
                        </div>

                        <Button className={`${primaryButton} w-full`} onClick={authMode === 'login' ? handleLogin : handleRegister} disabled={authLoading}>
                            {authLoading ? 'Procesando...' : authMode === 'login' ? 'Entrar' : 'Crear cuenta'}
                        </Button>

                        <Button
                            variant="secondary"
                            className="w-full h-12 rounded-full text-[15px] font-semibold"
                            onClick={handleGoogleLogin}
                            disabled={authLoading}
                        >
                            Continuar con Google
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={needsProfileCompletion} onOpenChange={setNeedsProfileCompletion}>
                <DialogContent className="sm:max-w-md rounded-3xl border-0 p-0 overflow-hidden bg-[#F2F2F7] dark:bg-[#1C1C1E]">
                    <DialogHeader className="px-6 pt-6 pb-2 text-left">
                        <DialogTitle className="text-2xl font-semibold">Completa tu perfil</DialogTitle>
                        <DialogDescription className="text-sm text-[#8A8A8E] dark:text-[#8E8E93]">
                            Necesitas nickname único para usar el sistema social.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 pb-6 space-y-3">
                        <div className="rounded-2xl bg-white dark:bg-[#2C2C2E] p-3 space-y-2">
                            <Input className={insetInput} placeholder="Nickname" value={nickname} onChange={(event) => setNickname(event.target.value)} />
                            <Input
                                className={insetInput}
                                placeholder="Nombre visible"
                                value={displayName}
                                onChange={(event) => setDisplayName(event.target.value)}
                            />
                            <Input className={insetInput} placeholder="Bio (opcional)" value={bio} onChange={(event) => setBio(event.target.value)} />
                            <Input
                                className={insetInput}
                                placeholder="Avatar URL (opcional)"
                                value={avatarUrl}
                                onChange={(event) => setAvatarUrl(event.target.value)}
                            />
                        </div>

                        <Button className={`${primaryButton} w-full`} onClick={upsertProfile}>
                            Guardar perfil
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl border-0 p-0 overflow-hidden bg-[#F2F2F7] dark:bg-[#1C1C1E]">
                    <DialogHeader className="px-6 pt-6 pb-2 text-left">
                        <DialogTitle className="text-2xl font-semibold">Editar Perfil</DialogTitle>
                        <DialogDescription className="text-sm text-[#8A8A8E] dark:text-[#8E8E93]">
                            Actualiza tu perfil de desarrollador.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 pb-6 space-y-3">
                        <div className="rounded-2xl bg-white dark:bg-[#2C2C2E] p-3 space-y-2">
                            <Input className={insetInput} placeholder="Nickname" value={nickname} onChange={(event) => setNickname(event.target.value)} />
                            <Input
                                className={insetInput}
                                placeholder="Nombre visible"
                                value={displayName}
                                onChange={(event) => setDisplayName(event.target.value)}
                            />
                            <Input className={insetInput} placeholder="Bio" value={bio} onChange={(event) => setBio(event.target.value)} />
                            <Input
                                className={insetInput}
                                placeholder="Avatar URL"
                                value={avatarUrl}
                                onChange={(event) => setAvatarUrl(event.target.value)}
                            />
                        </div>

                        <Button
                            className={`${primaryButton} w-full`}
                            onClick={async () => {
                                const saved = await upsertProfile();
                                if (saved) {
                                    setEditProfileOpen(false);
                                }
                            }}
                        >
                            Guardar cambios
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </ScrollArea>
    );
};

export default AppStore;
