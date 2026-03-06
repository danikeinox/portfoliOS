'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser } from '@/firebase';
import { useHomeScreen } from '@/hooks/use-home-screen';
import {
    getInstalledAppById,
    saveInstalledApp,
    toInstalledSlug,
} from '@/lib/installed-apps';
import type {
    AppStoreApiResponse,
    AppStoreApp,
    NicknameAvailability,
    PublicDeveloperProfile,
    SocialRelationStatus,
    UserProfile,
} from '@/lib/appstore/contracts';

type AuthMode = 'login' | 'register';
type AppSort = 'recent' | 'downloads';
type HomeTab = 'home' | 'categories';

type PublicProfileApi = AppStoreApiResponse<PublicDeveloperProfile>;
type OwnProfileApi = AppStoreApiResponse<UserProfile>;
type AppsListApi = AppStoreApiResponse<{ apps: AppStoreApp[]; count: number }>;
type RelationApi = AppStoreApiResponse<{ relation: SocialRelationStatus }>;
type AppDetailApi = AppStoreApiResponse<AppStoreApp>;
type CategoriesApi = AppStoreApiResponse<{
    categories: Array<{ category: string; count: number }>;
}>;

type AppFormState = {
    id: string | null;
    title: string;
    description: string;
    iconUrl: string;
    externalUrl: string;
    screenshotsText: string;
    categories: string[];
    categoryInput: string;
    status: 'draft' | 'published';
};

const fallbackCategories = [
    'Productividad',
    'Juegos',
    'Utilidades',
    'Educación',
    'Salud',
    'Creatividad',
    'Social',
    'Música',
];

const insetInput =
    'h-12 rounded-xl border-0 bg-[#EFEFF4] dark:bg-[#2C2C2E] text-[15px] focus-visible:ring-2 focus-visible:ring-[#0A84FF]';

const primaryButton =
    'h-12 rounded-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white font-semibold text-[15px]';

const cardBase =
    'rounded-3xl border border-neutral-200 dark:border-[#38383A] bg-white dark:bg-[#1C1C1E]';

function extractNickFromEmail(email: string | null | undefined): string {
    const candidate = (email ?? 'usuario').split('@')[0] ?? 'usuario';
    return (
        candidate.replace(/[^A-Za-zÀ-ÖØ-öø-ÿÑñ0-9 ]/g, '').slice(0, 24) || 'usuario'
    );
}

function toTitleCase(value: string): string {
    return value
        .trim()
        .replace(/\s+/g, ' ')
        .toLocaleLowerCase('es-ES')
        .split(' ')
        .map((part) =>
            part ? `${part[0].toLocaleUpperCase('es-ES')}${part.slice(1)}` : part,
        )
        .join(' ');
}

function isValidCategory(value: string): boolean {
    return /^[A-Za-zÀ-ÖØ-öø-ÿÑñ0-9 ]+$/.test(value);
}

function emptyAppForm(): AppFormState {
    return {
        id: null,
        title: '',
        description: '',
        iconUrl: '',
        externalUrl: '',
        screenshotsText: '',
        categories: [],
        categoryInput: '',
        status: 'published',
    };
}

const AppStore = () => {
    const { locale } = useI18n();
    const { toast } = useToast();
    const auth = useAuth();
    const { data: firebaseUser } = useUser();
    const { addApp } = useHomeScreen();

    const [tab, setTab] = useState<HomeTab>('home');
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
    const [publicProfile, setPublicProfile] = useState<PublicDeveloperProfile | null>(
        null,
    );
    const [editProfileOpen, setEditProfileOpen] = useState(false);

    const [recentApps, setRecentApps] = useState<AppStoreApp[]>([]);
    const [popularApps, setPopularApps] = useState<AppStoreApp[]>([]);
    const [categoryApps, setCategoryApps] = useState<AppStoreApp[]>([]);
    const [appsLoading, setAppsLoading] = useState(false);

    const [categories, setCategories] = useState<Array<{ category: string; count: number }>>(
        [],
    );
    const [categoriesSearch, setCategoriesSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [categoriesLoading, setCategoriesLoading] = useState(false);

    const [detailAppId, setDetailAppId] = useState<string | null>(null);
    const [detailApp, setDetailApp] = useState<AppStoreApp | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const [publishOpen, setPublishOpen] = useState(false);
    const [publishLoading, setPublishLoading] = useState(false);
    const [form, setForm] = useState<AppFormState>(emptyAppForm());

    const nicknameCheckInFlightRef = useRef(false);
    const lastNicknameCheckAtRef = useRef(0);
    const installInFlightRef = useRef(false);
    const lastInstallAtRef = useRef(0);

    const today = new Date();
    const dateString = today.toLocaleDateString(locale, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    const mergedCategories = useMemo(() => {
        const map = new Map<string, number>();
        categories.forEach((item) => map.set(item.category, item.count));
        fallbackCategories.forEach((category) => {
            if (!map.has(category)) {
                map.set(category, 0);
            }
        });

        return [...map.entries()]
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category, 'es'))
            .slice(0, 50);
    }, [categories]);

    const visibleCategories = useMemo(
        () => mergedCategories.filter((item) => {
            if (!categoriesSearch.trim()) {
                return true;
            }
            return item.category
                .toLocaleLowerCase('es-ES')
                .includes(categoriesSearch.toLocaleLowerCase('es-ES'));
        }),
        [mergedCategories, categoriesSearch],
    );

    const featuredCategories = useMemo(() => mergedCategories.slice(0, 6), [mergedCategories]);

    const ownerApps = useMemo(() => {
        if (!ownProfile) {
            return [] as AppStoreApp[];
        }

        const all = [...recentApps, ...popularApps, ...categoryApps];
        const dedupe = new Map<string, AppStoreApp>();
        all.forEach((app) => {
            if (app.ownerId === ownProfile.uid) {
                dedupe.set(app.id, app);
            }
        });
        return [...dedupe.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }, [ownProfile, recentApps, popularApps, categoryApps]);

    async function authHeaders(): Promise<Record<string, string>> {
        if (!firebaseUser) {
            return {};
        }

        const token = await firebaseUser.getIdToken();
        return { Authorization: `Bearer ${token}` };
    }

    async function fetchAppsBySort(sort: AppSort, target: (apps: AppStoreApp[]) => void) {
        setAppsLoading(true);
        try {
            const response = await fetch(
                `/api/appstore/apps?status=published&sort=${sort}&limit=20`,
            );
            const json = (await response.json()) as AppsListApi;

            if (!json.success) {
                toast({ title: 'AppStore', description: json.error.message, variant: 'destructive' });
                return;
            }

            target(json.data.apps);
        } catch {
            toast({
                title: 'AppStore',
                description: 'No se pudieron cargar las apps.',
                variant: 'destructive',
            });
        } finally {
            setAppsLoading(false);
        }
    }

    async function fetchAppsByCategory(category: string) {
        setAppsLoading(true);
        try {
            const response = await fetch(
                `/api/appstore/apps?status=published&category=${encodeURIComponent(category)}&limit=20`,
            );
            const json = (await response.json()) as AppsListApi;

            if (!json.success) {
                toast({ title: 'Categorías', description: json.error.message, variant: 'destructive' });
                return;
            }

            setCategoryApps(json.data.apps);
        } catch {
            toast({
                title: 'Categorías',
                description: 'No se pudieron cargar apps de la categoría.',
                variant: 'destructive',
            });
        } finally {
            setAppsLoading(false);
        }
    }

    async function fetchCategories(search?: string) {
        setCategoriesLoading(true);
        try {
            const query = search?.trim() ? `?q=${encodeURIComponent(search.trim())}` : '';
            const response = await fetch(`/api/appstore/categories${query}`);
            const json = (await response.json()) as CategoriesApi;

            if (!json.success) {
                toast({ title: 'Categorías', description: json.error.message, variant: 'destructive' });
                return;
            }

            setCategories(json.data.categories);
        } catch {
            toast({
                title: 'Categorías',
                description: 'No se pudo cargar el buscador de categorías.',
                variant: 'destructive',
            });
        } finally {
            setCategoriesLoading(false);
        }
    }

    async function fetchAppDetail(appId: string) {
        setDetailLoading(true);
        try {
            const response = await fetch(`/api/appstore/apps/${appId}`);
            const json = (await response.json()) as AppDetailApi;

            if (!json.success) {
                toast({ title: 'Detalle de app', description: json.error.message, variant: 'destructive' });
                return;
            }

            setDetailApp(json.data);
        } catch {
            toast({ title: 'Detalle de app', description: 'No se pudo abrir esta app.', variant: 'destructive' });
        } finally {
            setDetailLoading(false);
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
            const response = await fetch('/api/appstore/users/profile', { method: 'GET', headers });
            const json = (await response.json()) as OwnProfileApi;

            if (!json.success) {
                if (json.error.code === 'PROFILE_NOT_FOUND') {
                    setDisplayName(firebaseUser.displayName ?? '');
                    setNickname(extractNickFromEmail(firebaseUser.email));
                    setOwnProfile(null);
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
        const now = Date.now();
        if (nicknameCheckInFlightRef.current) {
            toast({
                title: 'Espera un momento',
                description: 'Ya estamos comprobando el nickname.',
                variant: 'destructive',
            });
            return false;
        }

        if (now - lastNicknameCheckAtRef.current < 900) {
            toast({
                title: 'Demasiadas peticiones',
                description: 'Vuelve a intentarlo en un instante.',
                variant: 'destructive',
            });
            return false;
        }

        nicknameCheckInFlightRef.current = true;
        lastNicknameCheckAtRef.current = now;

        try {
            await new Promise((resolve) => setTimeout(resolve, 300));

            const response = await fetch(
                `/api/appstore/users/check-nickname?nickname=${encodeURIComponent(candidate)}`,
            );
            const json = (await response.json()) as AppStoreApiResponse<NicknameAvailability>;

            if (!json.success) {
                toast({ title: 'Nickname', description: json.error.message, variant: 'destructive' });
                return false;
            }

            if (!json.data.available) {
                toast({
                    title: 'Nickname ocupado',
                    description: 'Elige otro nickname para continuar.',
                    variant: 'destructive',
                });
                return false;
            }

            return true;
        } catch {
            toast({ title: 'Nickname', description: 'No se pudo validar el nickname.', variant: 'destructive' });
            return false;
        } finally {
            nicknameCheckInFlightRef.current = false;
        }
    }

    async function upsertProfile() {
        if (!firebaseUser) {
            return false;
        }

        const normalizedNickname = nickname.trim();
        const normalizedDisplayName = displayName.trim();
        const normalizedBio = bio.trim();
        const normalizedAvatar = avatarUrl.trim();

        if (!normalizedNickname || !normalizedDisplayName) {
            toast({
                title: 'Perfil incompleto',
                description: 'Nickname y nombre visible son obligatorios.',
                variant: 'destructive',
            });
            return false;
        }

        if (!/^[A-Za-zÀ-ÖØ-öø-ÿÑñ0-9 ]+$/.test(normalizedNickname)) {
            toast({
                title: 'Nickname inválido',
                description: 'Solo se permiten letras, números y espacios.',
                variant: 'destructive',
            });
            return false;
        }

        if (ownProfile?.nickname !== normalizedNickname) {
            const isAvailable = await checkNicknameAvailability(normalizedNickname);
            if (!isAvailable) {
                return false;
            }
        }

        const headers = await authHeaders();

        const response = await fetch('/api/appstore/users/profile', {
            method: 'PUT',
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nickname: normalizedNickname,
                displayName: normalizedDisplayName,
                bio: normalizedBio || undefined,
                avatarUrl: normalizedAvatar || undefined,
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

        if (!ownProfile) {
            setDisplayName(firebaseUser.displayName ?? '');
            setNickname((current) => current || extractNickFromEmail(firebaseUser.email));
            setNeedsProfileCompletion(true);
            return;
        }

        setSocialLoading(true);
        try {
            const headers = await authHeaders();
            const response = await fetch('/api/appstore/social/follow', {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetNickname: selectedNickname }),
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
            const response = await fetch(
                `/api/appstore/social/follow?targetNickname=${encodeURIComponent(selectedNickname)}`,
                { method: 'DELETE', headers },
            );

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

    function setFormFromApp(app: AppStoreApp | null) {
        if (!app) {
            setForm(emptyAppForm());
            return;
        }

        setForm({
            id: app.id,
            title: app.title,
            description: app.description,
            iconUrl: app.iconUrl ?? '',
            externalUrl: app.externalUrl ?? '',
            screenshotsText: (app.screenshotsUrls ?? []).join('\n'),
            categories: app.categories ?? [app.category],
            categoryInput: '',
            status: app.status,
        });
    }

    function addCategoryToForm() {
        const formatted = toTitleCase(form.categoryInput);
        if (!formatted) {
            return;
        }

        if (!isValidCategory(formatted)) {
            toast({ title: 'Categoría inválida', description: 'Solo texto Title Case sin símbolos.', variant: 'destructive' });
            return;
        }

        if (form.categories.includes(formatted)) {
            setForm((current) => ({ ...current, categoryInput: '' }));
            return;
        }

        if (form.categories.length >= 5) {
            toast({ title: 'Máximo alcanzado', description: 'Puedes añadir hasta 5 categorías.', variant: 'destructive' });
            return;
        }

        setForm((current) => ({
            ...current,
            categories: [...current.categories, formatted],
            categoryInput: '',
        }));
    }

    async function submitAppForm() {
        if (!firebaseUser) {
            setAuthOpen(true);
            return;
        }

        if (!ownProfile) {
            setDisplayName(firebaseUser.displayName ?? '');
            setNickname((current) => current || extractNickFromEmail(firebaseUser.email));
            setNeedsProfileCompletion(true);
            return;
        }

        if (form.categories.length < 1) {
            toast({ title: 'Categorías requeridas', description: 'Añade al menos una categoría.', variant: 'destructive' });
            return;
        }

        const screenshotsUrls = form.screenshotsText
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean);

        setPublishLoading(true);
        try {
            const headers = await authHeaders();
            const payload = {
                title: form.title,
                description: form.description,
                iconUrl: form.iconUrl || undefined,
                externalUrl: form.externalUrl,
                screenshotsUrls,
                categories: form.categories,
                category: form.categories[0],
                status: form.status,
                tags: form.categories,
            };

            const isEdit = !!form.id;
            const response = await fetch(
                isEdit ? `/api/appstore/apps/${form.id}` : '/api/appstore/apps',
                {
                    method: isEdit ? 'PATCH' : 'POST',
                    headers: {
                        ...headers,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                },
            );

            const json = (await response.json()) as AppDetailApi;
            if (!json.success) {
                toast({ title: 'Publicación', description: json.error.message, variant: 'destructive' });
                return;
            }

            toast({
                title: isEdit ? 'App actualizada' : 'App publicada',
                description: isEdit ? 'Tus cambios se han guardado.' : 'Tu app ya aparece en AppStore.',
            });

            setPublishOpen(false);
            setForm(emptyAppForm());

            await Promise.all([
                fetchAppsBySort('recent', setRecentApps),
                fetchAppsBySort('downloads', setPopularApps),
                fetchCategories(categoriesSearch),
            ]);

            if (selectedCategory) {
                await fetchAppsByCategory(selectedCategory);
            }
        } catch {
            toast({ title: 'Publicación', description: 'No se pudo guardar la app.', variant: 'destructive' });
        } finally {
            setPublishLoading(false);
        }
    }

    async function handleInstallApp() {
        if (!detailApp) {
            return;
        }

        const now = Date.now();
        if (installInFlightRef.current || now - lastInstallAtRef.current < 1200) {
            toast({
                title: 'Espera un momento',
                description: 'Estamos procesando la instalación.',
            });
            return;
        }

        installInFlightRef.current = true;
        lastInstallAtRef.current = now;

        const alreadyInstalled = getInstalledAppById(detailApp.id);

        saveInstalledApp({
            id: detailApp.id,
            name: detailApp.title,
            iconUrl:
                detailApp.iconUrl ||
                'https://picsum.photos/seed/installed-app-fallback/180/180',
            externalUrl: detailApp.externalUrl,
        });

        addApp(toInstalledSlug(detailApp.id));

        try {
            if (!alreadyInstalled) {
                try {
                    await fetch(`/api/appstore/apps/${detailApp.id}`, { method: 'POST' });
                } catch {
                    toast({
                        title: 'Instalación',
                        description: 'La app se instaló, pero no se pudo actualizar el contador.',
                    });
                }
            }

            toast({
                title: alreadyInstalled ? 'App ya instalada' : 'App instalada',
                description: alreadyInstalled
                    ? 'La app ya estaba disponible en tu iPhone.'
                    : 'La app ya aparece en tu pantalla de inicio.',
            });
        } finally {
            installInFlightRef.current = false;
        }
    }

    useEffect(() => {
        fetchAppsBySort('recent', setRecentApps);
        fetchAppsBySort('downloads', setPopularApps);
        fetchCategories();
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
        if (!detailAppId) {
            setDetailApp(null);
            return;
        }

        fetchAppDetail(detailAppId);
    }, [detailAppId]);

    useEffect(() => {
        if (!selectedCategory) {
            setCategoryApps([]);
            return;
        }

        fetchAppsByCategory(selectedCategory);
    }, [selectedCategory]);

    useEffect(() => {
        fetchCategories(categoriesSearch);
    }, [categoriesSearch]);

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
    const featuredApp = recentApps[0] ?? popularApps[0] ?? null;

    function renderCarouselSection(title: string, apps: AppStoreApp[]) {
        return (
            <div>
                <h3 className="text-2xl font-bold tracking-tight px-1 mb-3">{title}</h3>
                <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden">
                    {apps.map((app) => (
                        <div key={app.id} className="border-b border-neutral-200 dark:border-[#38383A] last:border-none ml-4 py-4 pr-4">
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => setDetailAppId(app.id)}
                                    className="relative w-20 h-20 rounded-2xl overflow-hidden bg-neutral-200 shrink-0"
                                >
                                    <Image
                                        src={app.iconUrl || 'https://picsum.photos/seed/appicon-fallback/120/120'}
                                        fill
                                        alt={app.title}
                                        className="object-cover"
                                    />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDetailAppId(app.id)}
                                    className="flex-1 text-left min-w-0"
                                >
                                    <h4 className="font-bold text-lg truncate">{app.title}</h4>
                                    <p className="text-sm text-[#8A8A8E] dark:text-[#8E8E93] truncate">{app.category}</p>
                                </button>

                                <div className="flex flex-col items-center">
                                    <Button
                                        className="bg-[#EFEFF4] text-[#0A84FF] dark:bg-[#2C2C2E] rounded-full font-bold px-6"
                                        onClick={() => setDetailAppId(app.id)}
                                    >
                                        Obtener
                                    </Button>
                                    <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93] mt-1">
                                        Compras integradas
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {apps.length === 0 && (
                        <div className="ml-4 py-5 pr-4 text-sm text-[#8A8A8E] dark:text-[#8E8E93]">Sin resultados.</div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full w-full bg-[#F2F2F7] dark:bg-black text-black dark:text-white">
            <div className="max-w-xl mx-auto p-4 space-y-4">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93] font-semibold uppercase">
                            {dateString}
                        </p>
                        <h1 className="text-5xl font-bold tracking-tight leading-none">Hoy</h1>
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
                        <Image
                            src={ownProfile?.avatarUrl || 'https://s6.imgcdn.dev/Yrcy4v.png'}
                            fill
                            alt="Profile"
                            className="rounded-full object-cover"
                        />
                    </button>
                </div>

                <div className="rounded-2xl bg-white dark:bg-[#1C1C1E] p-2 grid grid-cols-2 gap-2 border border-neutral-200 dark:border-[#38383A]">
                    <Button
                        variant={tab === 'home' ? 'default' : 'ghost'}
                        className={`rounded-xl h-10 ${tab === 'home' ? 'bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90' : ''}`}
                        onClick={() => setTab('home')}
                    >
                        Inicio
                    </Button>
                    <Button
                        variant={tab === 'categories' ? 'default' : 'ghost'}
                        className={`rounded-xl h-10 ${tab === 'categories' ? 'bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90' : ''}`}
                        onClick={() => setTab('categories')}
                    >
                        Categorías
                    </Button>
                </div>

                {!firebaseUser && (
                    <div className={`${cardBase} p-5`}>
                        <p className="text-[15px] text-[#3A3A3C] dark:text-[#D1D1D6] mb-3">
                            Inicia sesión para publicar y editar tus apps.
                        </p>
                        <Button className={`${primaryButton} w-full`} onClick={() => setAuthOpen(true)}>
                            Iniciar sesión / Registrarse
                        </Button>
                    </div>
                )}

                {publicProfile && (
                    <div className={`${cardBase} p-5`}>
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
                                <Button
                                    className="w-full h-11 rounded-full bg-[#34C759] hover:bg-[#34C759]/90 text-white font-semibold"
                                    onClick={() => {
                                        setForm(emptyAppForm());
                                        setPublishOpen(true);
                                    }}
                                >
                                    Publicar nueva App
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

                {tab === 'home' ? (
                    <>
                        {featuredApp && (
                            <button
                                type="button"
                                onClick={() => setDetailAppId(featuredApp.id)}
                                className="relative rounded-xl overflow-hidden mb-8 border border-neutral-200 dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] text-left"
                            >
                                <Image
                                    src={featuredApp.screenshotsUrls[0] || 'https://picsum.photos/seed/appstore-main/800/500'}
                                    alt={featuredApp.title}
                                    width={800}
                                    height={500}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-0 left-0 p-4 text-white bg-gradient-to-t from-black/50 to-transparent w-full">
                                    <p className="text-xs font-semibold uppercase">App destacada</p>
                                    <h2 className="text-2xl font-bold">{featuredApp.title}</h2>
                                    <p className="text-sm">Por @{featuredApp.ownerNickname}</p>
                                </div>
                            </button>
                        )}

                        {renderCarouselSection('Recién añadidas', recentApps)}
                        {renderCarouselSection('Más descargadas', popularApps)}

                        <div className={`${cardBase} p-4`}>
                            <h3 className="text-lg font-semibold mb-3">Categorías destacadas</h3>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {featuredCategories.map((item) => (
                                    <Button
                                        key={item.category}
                                        variant="secondary"
                                        className="rounded-full h-9 shrink-0"
                                        onClick={() => {
                                            setTab('categories');
                                            setSelectedCategory(item.category);
                                        }}
                                    >
                                        {item.category} · {item.count}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className={`${cardBase} p-4 space-y-3`}>
                        <div>
                            <h3 className="text-lg font-semibold">Explorar por categorías</h3>
                            <p className="text-sm text-[#8A8A8E] dark:text-[#8E8E93]">
                                Ordenadas de mayor a menor cantidad de apps.
                            </p>
                        </div>

                        <Input
                            className={insetInput}
                            placeholder="Buscar categoría"
                            value={categoriesSearch}
                            onChange={(event) => setCategoriesSearch(event.target.value)}
                        />

                        <div className="grid grid-cols-2 gap-2">
                            {visibleCategories.slice(0, 12).map((item) => (
                                <button
                                    key={item.category}
                                    type="button"
                                    onClick={() => setSelectedCategory(item.category)}
                                    className={`rounded-2xl p-3 text-left border ${selectedCategory === item.category ? 'border-[#0A84FF] bg-[#E9F2FF] dark:bg-[#10233D]' : 'border-neutral-200 dark:border-[#38383A] bg-[#F8F8FA] dark:bg-[#2C2C2E]'}`}
                                >
                                    <p className="font-semibold text-sm">{item.category}</p>
                                    <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93]">{item.count} apps</p>
                                </button>
                            ))}
                        </div>

                        {categoriesLoading && (
                            <p className="text-sm text-[#8A8A8E] dark:text-[#8E8E93]">Cargando categorías...</p>
                        )}

                        {selectedCategory && (
                            <div className="space-y-2">
                                <h4 className="font-semibold">{selectedCategory}</h4>
                                {categoryApps.map((app) => (
                                    <button
                                        key={app.id}
                                        type="button"
                                        onClick={() => setDetailAppId(app.id)}
                                        className="w-full rounded-2xl bg-[#EFEFF4] dark:bg-[#2C2C2E] p-3 flex items-center gap-3 text-left"
                                    >
                                        <div className="relative h-12 w-12">
                                            <Image
                                                src={app.iconUrl || 'https://picsum.photos/seed/appicon-fallback-2/120/120'}
                                                fill
                                                alt={app.title}
                                                className="rounded-xl object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate">{app.title}</p>
                                            <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93] truncate">
                                                @{app.ownerNickname}
                                            </p>
                                        </div>
                                    </button>
                                ))}

                                {!appsLoading && categoryApps.length === 0 && (
                                    <p className="text-sm text-[#8A8A8E] dark:text-[#8E8E93]">No hay apps en esta categoría.</p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {profileLoading && (
                    <div className={`${cardBase} p-4 text-sm text-[#8A8A8E] dark:text-[#8E8E93]`}>
                        Cargando perfil...
                    </div>
                )}

                {publicProfile?.isOwner && ownerApps.length > 0 && (
                    <div className={`${cardBase} p-4`}>
                        <h3 className="text-lg font-semibold mb-3">Tus apps publicadas</h3>
                        <div className="space-y-2">
                            {ownerApps.map((app) => (
                                <div key={app.id} className="rounded-2xl bg-[#EFEFF4] dark:bg-[#2C2C2E] p-3 flex items-center gap-3">
                                    <div className="relative h-12 w-12">
                                        <Image src={app.iconUrl || 'https://picsum.photos/seed/ownerapp/120/120'} fill alt={app.title} className="rounded-xl object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate">{app.title}</p>
                                        <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93]">{app.status}</p>
                                    </div>
                                    <Button
                                        className="h-9 rounded-full px-4"
                                        onClick={() => {
                                            setFormFromApp(app);
                                            setPublishOpen(true);
                                        }}
                                    >
                                        Editar
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={detailAppId !== null} onOpenChange={(open) => !open && setDetailAppId(null)}>
                <DialogContent className="sm:max-w-2xl rounded-3xl border-0 p-0 overflow-hidden bg-[#F2F2F7] dark:bg-[#1C1C1E]">
                    {detailLoading || !detailApp ? (
                        <div className="p-6 text-sm text-[#8A8A8E] dark:text-[#8E8E93]">Cargando detalle de app...</div>
                    ) : (
                        <div className="max-h-[80vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex gap-4 items-start">
                                    <div className="relative h-24 w-24">
                                        <Image
                                            src={detailApp.iconUrl || 'https://picsum.photos/seed/detail-icon/220/220'}
                                            fill
                                            alt={detailApp.title}
                                            className="rounded-3xl object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-2xl font-bold truncate">{detailApp.title}</h2>
                                        <button
                                            type="button"
                                            className="text-[#0A84FF] text-sm"
                                            onClick={() => {
                                                setSelectedNickname(detailApp.ownerNickname);
                                                setDetailAppId(null);
                                            }}
                                        >
                                            @{detailApp.ownerNickname}
                                        </button>
                                        <div className="mt-3">
                                            <Button
                                                className="h-10 rounded-full px-6 bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white"
                                                onClick={handleInstallApp}
                                            >
                                                {getInstalledAppById(detailApp.id) ? 'Instalada' : 'Obtener'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <h4 className="font-semibold mb-2">Capturas</h4>
                                    <div className="flex gap-3 overflow-x-auto pb-1">
                                        {(detailApp.screenshotsUrls.length > 0
                                            ? detailApp.screenshotsUrls
                                            : ['https://picsum.photos/seed/screen-fallback-1/520/290']).map(
                                                (url, index) => (
                                                    <div key={`${url}-${index}`} className="relative w-64 h-36 shrink-0">
                                                        <Image
                                                            src={url}
                                                            fill
                                                            alt={`Screenshot ${index + 1}`}
                                                            className="rounded-2xl object-cover"
                                                        />
                                                    </div>
                                                ),
                                            )}
                                    </div>
                                </div>

                                <div className="mt-6 space-y-2">
                                    <h4 className="font-semibold">Descripción</h4>
                                    <p className="text-sm text-[#3A3A3C] dark:text-[#D1D1D6] whitespace-pre-wrap">
                                        {detailApp.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {detailApp.categories.map((category) => (
                                            <span
                                                key={category}
                                                className="inline-flex h-7 items-center rounded-full bg-[#E9E9EE] dark:bg-[#2C2C2E] px-3 text-xs"
                                            >
                                                {category}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
                <DialogContent className="sm:max-w-2xl rounded-3xl border-0 p-0 overflow-hidden bg-[#F2F2F7] dark:bg-[#1C1C1E]">
                    <DialogHeader className="px-6 pt-6 pb-2 text-left">
                        <DialogTitle className="text-2xl font-semibold">
                            {form.id ? 'Editar app' : 'Publicar nueva app'}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-[#8A8A8E] dark:text-[#8E8E93]">
                            Dashboard de publicación estilo iOS (Inset Grouped).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 pb-6 space-y-3 max-h-[70vh] overflow-y-auto">
                        <div className="rounded-2xl bg-white dark:bg-[#2C2C2E] p-3 space-y-2">
                            <Input
                                className={insetInput}
                                placeholder="Nombre de la app"
                                value={form.title}
                                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                            />
                            <textarea
                                className="w-full min-h-[110px] rounded-xl border-0 bg-[#EFEFF4] dark:bg-[#1C1C1E] p-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                                placeholder="Descripción"
                                value={form.description}
                                onChange={(event) =>
                                    setForm((current) => ({ ...current, description: event.target.value }))
                                }
                            />
                            <Input
                                className={insetInput}
                                placeholder="URL del icono"
                                value={form.iconUrl}
                                onChange={(event) => setForm((current) => ({ ...current, iconUrl: event.target.value }))}
                            />
                            <Input
                                className={insetInput}
                                placeholder="URL de la web app (externalUrl)"
                                value={form.externalUrl}
                                onChange={(event) =>
                                    setForm((current) => ({ ...current, externalUrl: event.target.value }))
                                }
                            />
                            <textarea
                                className="w-full min-h-[110px] rounded-xl border-0 bg-[#EFEFF4] dark:bg-[#1C1C1E] p-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                                placeholder="URLs de capturas (una por línea)"
                                value={form.screenshotsText}
                                onChange={(event) =>
                                    setForm((current) => ({ ...current, screenshotsText: event.target.value }))
                                }
                            />
                        </div>

                        <div className="rounded-2xl bg-white dark:bg-[#2C2C2E] p-3 space-y-2">
                            <div className="flex gap-2">
                                <Input
                                    className={insetInput}
                                    placeholder="Categoría (Title Case)"
                                    value={form.categoryInput}
                                    onChange={(event) =>
                                        setForm((current) => ({ ...current, categoryInput: event.target.value }))
                                    }
                                />
                                <Button className="rounded-xl h-12" onClick={addCategoryToForm}>
                                    Añadir
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {form.categories.map((category) => (
                                    <button
                                        key={category}
                                        type="button"
                                        className="inline-flex h-8 items-center rounded-full bg-[#E9E9EE] dark:bg-[#1C1C1E] px-3 text-xs"
                                        onClick={() =>
                                            setForm((current) => ({
                                                ...current,
                                                categories: current.categories.filter((item) => item !== category),
                                            }))
                                        }
                                    >
                                        {category} · ✕
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93]">
                                Máximo 5 categorías. Solo texto en Title Case y sin símbolos.
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white dark:bg-[#2C2C2E] p-2 grid grid-cols-2 gap-2">
                            <Button
                                variant={form.status === 'published' ? 'default' : 'ghost'}
                                className={`rounded-xl h-10 ${form.status === 'published' ? 'bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90' : ''}`}
                                onClick={() => setForm((current) => ({ ...current, status: 'published' }))}
                            >
                                Publicada
                            </Button>
                            <Button
                                variant={form.status === 'draft' ? 'default' : 'ghost'}
                                className={`rounded-xl h-10 ${form.status === 'draft' ? 'bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90' : ''}`}
                                onClick={() => setForm((current) => ({ ...current, status: 'draft' }))}
                            >
                                Borrador
                            </Button>
                        </div>

                        <Button className={`${primaryButton} w-full`} onClick={submitAppForm} disabled={publishLoading}>
                            {publishLoading ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Publicar app'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

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

                        <form
                            className="space-y-3"
                            onSubmit={(event) => {
                                event.preventDefault();
                                if (authMode === 'login') {
                                    void handleLogin();
                                    return;
                                }
                                void handleRegister();
                            }}
                        >
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

                            <Button
                                type="submit"
                                className={`${primaryButton} w-full`}
                                disabled={authLoading}
                            >
                                {authLoading ? 'Procesando...' : authMode === 'login' ? 'Entrar' : 'Crear cuenta'}
                            </Button>
                        </form>

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
                            Necesitas nickname único para usar AppStore.
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
