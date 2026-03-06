'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
import { Separator } from '@/components/ui/separator';
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
type AppStoreTab = 'home' | 'search' | 'profile';

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
    'rounded-3xl border border-neutral-200/60 dark:border-[#38383A]/80 bg-white/85 dark:bg-[#1C1C1E]/85 backdrop-blur-sm';

const nativeAppIds = new Set([
    'safari',
    'spotify',
    'notes',
    'settings',
    'calendar',
    'weather',
    'photos',
    'camera',
]);
const profileStorageKey = 'appstore.profile.v1';

function readCachedProfile(): UserProfile | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const raw = localStorage.getItem(profileStorageKey);
        if (!raw) {
            return null;
        }

        return JSON.parse(raw) as UserProfile;
    } catch {
        return null;
    }
}

function writeCachedProfile(profile: UserProfile | null) {
    if (typeof window === 'undefined') {
        return;
    }

    if (!profile) {
        localStorage.removeItem(profileStorageKey);
        return;
    }

    localStorage.setItem(profileStorageKey, JSON.stringify(profile));
}

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
    const { locale, t } = useI18n();
    const router = useRouter();
    const { toast } = useToast();
    const auth = useAuth();
    const { data: firebaseUser } = useUser();
    const { addApp } = useHomeScreen();

    const [tab, setTab] = useState<AppStoreTab>('home');
    const [searchQuery, setSearchQuery] = useState('');
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

    const [ownProfile, setOwnProfile] = useState<UserProfile | null>(() => readCachedProfile());
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
    const [nativeSeedLoading, setNativeSeedLoading] = useState(false);
    const [form, setForm] = useState<AppFormState>(emptyAppForm());

    const nicknameCheckInFlightRef = useRef(false);
    const lastNicknameCheckAtRef = useRef(0);
    const installInFlightRef = useRef(false);
    const lastInstallAtRef = useRef(0);
    const profileCompletionPromptedRef = useRef(false);

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

    const allPublishedApps = useMemo(() => {
        const dedupe = new Map<string, AppStoreApp>();
        [...recentApps, ...popularApps, ...categoryApps].forEach((app) => dedupe.set(app.id, app));
        return [...dedupe.values()];
    }, [recentApps, popularApps, categoryApps]);

    const searchResults = useMemo(() => {
        const query = searchQuery.trim().toLocaleLowerCase('es-ES');
        if (!query) {
            return [] as AppStoreApp[];
        }

        return allPublishedApps.filter((app) =>
            app.title.toLocaleLowerCase('es-ES').includes(query),
        );
    }, [allPublishedApps, searchQuery]);

    const recommendedApps = useMemo(() => {
        const source = popularApps.length > 0 ? popularApps : recentApps;
        return source.slice(0, 8);
    }, [popularApps, recentApps]);

    const relatedApps = useMemo(() => {
        if (!detailApp) {
            return [] as AppStoreApp[];
        }

        return allPublishedApps
            .filter((app) => app.id !== detailApp.id)
            .filter(
                (app) =>
                    app.ownerId === detailApp.ownerId ||
                    app.category === detailApp.category ||
                    (app.categories ?? []).some((category) => (detailApp.categories ?? []).includes(category)),
            )
            .slice(0, 8);
    }, [allPublishedApps, detailApp]);

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
            setNeedsProfileCompletion(false);
            profileCompletionPromptedRef.current = false;
            writeCachedProfile(null);
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
                    writeCachedProfile(null);

                    if (!profileCompletionPromptedRef.current) {
                        setNeedsProfileCompletion(true);
                        profileCompletionPromptedRef.current = true;
                    }

                    return;
                }

                setOwnProfile(null);
                writeCachedProfile(null);
                return;
            }

            setOwnProfile(json.data);
            writeCachedProfile(json.data);
            setNeedsProfileCompletion(false);
            profileCompletionPromptedRef.current = false;
            if (!selectedNickname) {
                setSelectedNickname(json.data.nickname);
            }
        } catch {
            setOwnProfile(null);
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
        writeCachedProfile(json.data);
        setSelectedNickname(json.data.nickname);
        setNeedsProfileCompletion(false);
        profileCompletionPromptedRef.current = false;
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

        if (selectedNickname === ownProfile.nickname || publicProfile?.isOwner) {
            toast({ title: t('appstore.socialTitle'), description: t('appstore.cannotFollowSelf') });
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

    function isNativeApp(appId: string): boolean {
        return nativeAppIds.has(appId);
    }

    function openNativeApp(appId: string) {
        setDetailAppId(null);
        router.push(`/app/${appId}`);
    }

    function actionLabelForApp(app: AppStoreApp): string {
        if (isNativeApp(app.id)) {
            return t('appstore.open');
        }

        return getInstalledAppById(app.id) ? t('appstore.installed') : t('appstore.get');
    }

    async function handleSeedNativeApps() {
        if (!firebaseUser) {
            setAuthOpen(true);
            return;
        }

        setNativeSeedLoading(true);

        try {
            const headers = await authHeaders();
            const response = await fetch('/api/appstore/admin/seed-native', {
                method: 'POST',
                headers,
            });

            const json = (await response.json()) as AppStoreApiResponse<{ seeded: number }>;

            if (!json.success) {
                toast({
                    title: t('appstore.seedNativeErrorTitle'),
                    description: json.error.message,
                    variant: 'destructive',
                });
                return;
            }

            toast({
                title: t('appstore.seedNativeSuccessTitle'),
                description: t('appstore.seedNativeSuccessDescription', { count: json.data.seeded }),
            });

            await Promise.all([
                fetchAppsBySort('recent', setRecentApps),
                fetchAppsBySort('downloads', setPopularApps),
                fetchCategories(categoriesSearch),
            ]);

            if (selectedCategory) {
                await fetchAppsByCategory(selectedCategory);
            }
        } catch {
            toast({
                title: t('appstore.seedNativeErrorTitle'),
                description: t('appstore.seedNativeErrorDescription'),
                variant: 'destructive',
            });
        } finally {
            setNativeSeedLoading(false);
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
        if (!firebaseUser || ownProfile) {
            return;
        }

        const cached = readCachedProfile();
        if (!cached) {
            return;
        }

        setOwnProfile(cached);
        setSelectedNickname(cached.nickname);
    }, [firebaseUser, ownProfile]);

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
            ? t('appstore.relation.friends')
            : relation === 'following'
                ? t('appstore.relation.following')
                : relation === 'self'
                    ? t('appstore.relation.self')
                    : t('appstore.relation.follow');
    const reverseActionLabel =
        relation === 'friends' ? t('appstore.relation.unfriend') : t('appstore.relation.unfollow');
    const featuredApp = recentApps[0] ?? popularApps[0] ?? null;

    function renderCarouselSection(title: string, apps: AppStoreApp[]) {
        return (
            <div>
                <h3 className="text-2xl font-bold tracking-tight px-1 mb-3">{title}</h3>
                <div className="bg-white/85 dark:bg-[#1C1C1E]/85 backdrop-blur-sm rounded-3xl overflow-hidden border border-neutral-200/60 dark:border-[#38383A]/80">
                    {apps.map((app, index) => (
                        <div key={app.id} className="ml-4 py-4 pr-4">
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => setDetailAppId(app.id)}
                                    aria-label={t('appstore.openDetails', { title: app.title })}
                                    className="relative w-20 h-20 rounded-2xl overflow-hidden bg-neutral-200 shrink-0"
                                >
                                    <Image
                                        src={app.iconUrl || 'https://picsum.photos/seed/appicon-fallback/120/120'}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 33vw"
                                        alt={t('appstore.iconAlt', { title: app.title })}
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
                                        className="bg-[#EFEFF4] dark:bg-[#2C2C2E] text-[#0A84FF] rounded-full px-5 py-1 text-sm font-bold"
                                        onClick={() => {
                                            if (isNativeApp(app.id)) {
                                                openNativeApp(app.id);
                                                return;
                                            }

                                            setDetailAppId(app.id);
                                        }}
                                    >
                                        {actionLabelForApp(app)}
                                    </Button>
                                    <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93] mt-1">
                                        {t('appstore.inAppPurchases')}
                                    </p>
                                </div>
                            </div>
                            {index < apps.length - 1 && (
                                <Separator className="mt-4 bg-neutral-200/60 dark:bg-[#38383A]/80" />
                            )}
                        </div>
                    ))}
                    {apps.length === 0 && (
                        <div className="ml-4 py-5 pr-4 text-sm text-[#8A8A8E] dark:text-[#8E8E93]">{t('appstore.noResults')}</div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col bg-[#F2F2F7] dark:bg-black text-black dark:text-white">
            <ScrollArea className="flex-1 min-h-0">
                <div className="max-w-xl mx-auto p-4 pb-6 space-y-4">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93] font-semibold uppercase">
                            {dateString}
                        </p>
                        <h1 className="text-5xl font-bold tracking-tight leading-none">{t('appstore.today')}</h1>
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
                        aria-label={t('appstore.openProfile')}
                        className="h-10 w-10 relative"
                    >
                        <Image
                            src={ownProfile?.avatarUrl || 'https://s6.imgcdn.dev/Yrcy4v.png'}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            alt={t('appstore.profileAvatarAlt')}
                            className="rounded-full object-cover"
                        />
                    </button>
                </div>

                {!firebaseUser && (
                    <div className={`${cardBase} p-5`}>
                        <p className="text-[15px] text-[#3A3A3C] dark:text-[#D1D1D6] mb-3">
                            {t('appstore.signInPrompt')}
                        </p>
                        <Button className={`${primaryButton} w-full`} onClick={() => setAuthOpen(true)}>
                            {t('appstore.signInCta')}
                        </Button>
                    </div>
                )}

                {tab === 'home' && (
                    <>
                        {featuredApp && (
                            <button
                                type="button"
                                onClick={() => setDetailAppId(featuredApp.id)}
                                className="relative rounded-3xl overflow-hidden mb-8 border border-neutral-200/60 dark:border-[#38383A]/80 bg-white/85 dark:bg-[#1C1C1E]/85 backdrop-blur-sm text-left"
                            >
                                <Image
                                    src={featuredApp.screenshotsUrls[0] || 'https://picsum.photos/seed/appstore-main/800/500'}
                                    alt={t('appstore.featuredImageAlt', { title: featuredApp.title })}
                                    width={800}
                                    height={500}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-0 left-0 p-4 text-white bg-gradient-to-t from-black/50 to-transparent w-full">
                                    <p className="text-xs font-semibold uppercase tracking-tight">{t('appstore.featuredApp')}</p>
                                    <h2 className="text-2xl font-bold tracking-tight">{featuredApp.title}</h2>
                                    <p className="text-sm">{t('appstore.featuredBy', { nickname: featuredApp.ownerNickname })}</p>
                                </div>
                            </button>
                        )}

                        {renderCarouselSection(t('appstore.recentlyAdded'), recentApps)}
                        {renderCarouselSection(t('appstore.mostDownloaded'), popularApps)}

                        <div className={`${cardBase} p-4`}>
                            <h3 className="text-lg font-semibold tracking-tight mb-3">{t('appstore.featuredCategories')}</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {featuredCategories.map((item) => (
                                    <button
                                        key={item.category}
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery(item.category);
                                            setTab('search');
                                        }}
                                        className={`${cardBase} p-3 text-left`}
                                    >
                                        <p className="font-semibold text-sm tracking-tight">{item.category}</p>
                                        <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93]">{t('appstore.appsCount', { count: item.count })}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {tab === 'search' && (
                    <div className={`${cardBase} p-4 space-y-4`}>
                        <Input
                            className={insetInput}
                            placeholder={t('appstore.searchApps')}
                            aria-label={t('appstore.searchApps')}
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                        />

                        <div>
                            <h3 className="text-lg font-semibold tracking-tight mb-3">
                                {searchQuery.trim() ? t('appstore.searchResults') : t('appstore.recommendedApps')}
                            </h3>

                            <div className="space-y-2">
                                {(searchQuery.trim() ? searchResults : recommendedApps).map((app) => (
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
                                                sizes="(max-width: 768px) 100vw, 33vw"
                                                alt={t('appstore.iconAlt', { title: app.title })}
                                                className="rounded-xl object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate">{app.title}</p>
                                            <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93] truncate">
                                                @{app.ownerNickname}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            className="bg-[#EFEFF4] dark:bg-[#3A3A3C] text-[#0A84FF] rounded-full font-bold px-5 py-1 text-sm"
                                            onClick={(event) => {
                                                event.stopPropagation();

                                                if (isNativeApp(app.id)) {
                                                    openNativeApp(app.id);
                                                    return;
                                                }

                                                setDetailAppId(app.id);
                                            }}
                                        >
                                            {actionLabelForApp(app)}
                                        </button>
                                    </button>
                                ))}

                                {searchQuery.trim() && searchResults.length === 0 && (
                                    <p className="text-sm text-[#8A8A8E] dark:text-[#8E8E93]">{t('appstore.noSearchResults')}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'profile' && (
                    <>
                        {publicProfile ? (
                            <div className={`${cardBase} p-5`}>
                                <div className="flex items-center gap-3">
                                    <div className="relative h-16 w-16">
                                        <Image
                                            src={publicProfile.avatarUrl || 'https://s6.imgcdn.dev/Yrcy4v.png'}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                            alt={publicProfile.nickname}
                                            className="rounded-2xl object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-lg font-semibold tracking-tight">{publicProfile.displayName}</p>
                                        <p className="text-sm text-[#8A8A8E] dark:text-[#8E8E93]">@{publicProfile.nickname}</p>
                                        {publicProfile.bio && (
                                            <p className="text-sm mt-1 text-[#3A3A3C] dark:text-[#D1D1D6]">{publicProfile.bio}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl bg-[#EFEFF4] dark:bg-[#2C2C2E] p-3 text-center">
                                        <p className="text-2xl font-semibold">{publicProfile.followersCount}</p>
                                        <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93] uppercase">{t('appstore.followers')}</p>
                                    </div>
                                    <div className="rounded-2xl bg-[#EFEFF4] dark:bg-[#2C2C2E] p-3 text-center">
                                        <p className="text-2xl font-semibold">{publicProfile.followingCount}</p>
                                        <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93] uppercase">{t('appstore.following')}</p>
                                    </div>
                                </div>

                                {publicProfile.isOwner ? (
                                    <div className="mt-4 space-y-2">
                                        <Button className={`${primaryButton} w-full`} onClick={() => setEditProfileOpen(true)}>
                                            {t('appstore.editProfile')}
                                        </Button>
                                        <Button
                                            className="w-full h-11 rounded-full bg-[#34C759] hover:bg-[#34C759]/90 text-white font-semibold"
                                            onClick={() => {
                                                setForm(emptyAppForm());
                                                setPublishOpen(true);
                                            }}
                                        >
                                            {t('appstore.publishNewApp')}
                                        </Button>
                                        <Button
                                            className="w-full h-11 rounded-full bg-[#5856D6] hover:bg-[#5856D6]/90 text-white font-semibold"
                                            onClick={handleSeedNativeApps}
                                            disabled={nativeSeedLoading}
                                        >
                                            {nativeSeedLoading ? t('appstore.seedingNativeApps') : t('appstore.seedNativeApps')}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="mt-4 space-y-2">
                                        <Button
                                            className={`${primaryButton} w-full ${relation !== 'not_following' ? 'bg-[#34C759] hover:bg-[#34C759]/90' : ''}`}
                                            onClick={relation === 'not_following' ? handleFollow : undefined}
                                            disabled={socialLoading || relation !== 'not_following' || publicProfile.isOwner}
                                        >
                                            {socialLoading ? t('appstore.updating') : relationLabel}
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
                        ) : (
                            <div className={`${cardBase} p-5`}>
                                <p className="text-[15px] text-[#3A3A3C] dark:text-[#D1D1D6] mb-3">
                                    {t('appstore.profileTabGuest')}
                                </p>
                                {!firebaseUser ? (
                                    <Button className={`${primaryButton} w-full`} onClick={() => setAuthOpen(true)}>
                                        {t('appstore.signInCta')}
                                    </Button>
                                ) : (
                                    <Button className={`${primaryButton} w-full`} onClick={() => setNeedsProfileCompletion(true)}>
                                        {t('appstore.completeProfileTitle')}
                                    </Button>
                                )}
                            </div>
                        )}

                        {publicProfile?.isOwner && ownerApps.length > 0 && (
                            <div className={`${cardBase} p-4`}>
                                <h3 className="text-lg font-semibold tracking-tight mb-3">{t('appstore.yourPublishedApps')}</h3>
                                <div className="space-y-2">
                                    {ownerApps.map((app) => (
                                        <div key={app.id} className="rounded-2xl bg-[#EFEFF4] dark:bg-[#2C2C2E] p-3 flex items-center gap-3">
                                            <div className="relative h-12 w-12">
                                                <Image src={app.iconUrl || 'https://picsum.photos/seed/ownerapp/120/120'} fill sizes="(max-width: 768px) 100vw, 33vw" alt={app.title} className="rounded-xl object-cover" />
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
                                                {t('appstore.edit')}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                </div>
            </ScrollArea>

            <div className="w-full px-4 pb-4 pt-2 bg-gradient-to-t from-[#F2F2F7] dark:from-black to-transparent">
                <div className="mx-auto max-w-xl rounded-3xl border border-neutral-200/70 dark:border-[#38383A]/90 bg-white/85 dark:bg-[#1C1C1E]/85 backdrop-blur-md px-2 py-2 flex items-center justify-between">
                    <button
                        type="button"
                        className={`h-11 flex-1 rounded-2xl text-sm font-semibold transition ${tab === 'home' ? 'bg-[#E5F1FF] dark:bg-[#10233C] text-[#0A84FF]' : 'text-[#8A8A8E] dark:text-[#8E8E93]'}`}
                        onClick={() => setTab('home')}
                        aria-label={t('appstore.tabHome')}
                    >
                        {t('appstore.tabHome')}
                    </button>
                    <button
                        type="button"
                        className={`h-11 flex-1 rounded-2xl text-sm font-semibold transition ${tab === 'search' ? 'bg-[#E5F1FF] dark:bg-[#10233C] text-[#0A84FF]' : 'text-[#8A8A8E] dark:text-[#8E8E93]'}`}
                        onClick={() => setTab('search')}
                        aria-label={t('appstore.tabSearch')}
                    >
                        {t('appstore.tabSearch')}
                    </button>
                    <button
                        type="button"
                        className={`h-11 flex-1 rounded-2xl text-sm font-semibold transition ${tab === 'profile' ? 'bg-[#E5F1FF] dark:bg-[#10233C] text-[#0A84FF]' : 'text-[#8A8A8E] dark:text-[#8E8E93]'}`}
                        onClick={() => setTab('profile')}
                        aria-label={t('appstore.tabProfile')}
                    >
                        {t('appstore.tabProfile')}
                    </button>
                </div>
            </div>

            <Dialog open={detailAppId !== null} onOpenChange={(open) => !open && setDetailAppId(null)}>
                <DialogContent className="sm:max-w-2xl rounded-3xl border-0 p-0 overflow-hidden bg-[#F2F2F7] dark:bg-[#1C1C1E]">
                    {detailLoading || !detailApp ? (
                        <div className="p-6 text-sm text-[#8A8A8E] dark:text-[#8E8E93]">{t('appstore.loadingAppDetail')}</div>
                    ) : (
                        <div className="max-h-[80vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex gap-4 items-start">
                                    <div className="relative h-28 w-28">
                                        <Image
                                            src={detailApp.iconUrl || 'https://picsum.photos/seed/detail-icon/220/220'}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                            alt={detailApp.title}
                                            className="rounded-[22%] object-cover"
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
                                                setTab('profile');
                                            }}
                                        >
                                            @{detailApp.ownerNickname}
                                        </button>
                                        <div className="mt-3">
                                            <Button
                                                className="bg-[#EFEFF4] dark:bg-[#2C2C2E] text-[#0A84FF] rounded-full px-5 py-1 text-sm font-bold"
                                                onClick={() => {
                                                    if (isNativeApp(detailApp.id)) {
                                                        openNativeApp(detailApp.id);
                                                        return;
                                                    }

                                                    void handleInstallApp();
                                                }}
                                            >
                                                {actionLabelForApp(detailApp)}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <h4 className="font-semibold tracking-tight mb-2">{t('appstore.screenshots')}</h4>
                                    <div className="flex gap-3 overflow-x-auto pb-1">
                                        {(detailApp.screenshotsUrls.length > 0
                                            ? detailApp.screenshotsUrls
                                            : ['https://picsum.photos/seed/screen-fallback-1/520/290']).map(
                                                (url, index) => (
                                                    <div key={`${url}-${index}`} className="relative w-64 aspect-video shrink-0">
                                                        <Image
                                                            src={url}
                                                            fill
                                                            sizes="(max-width: 768px) 100vw, 33vw"
                                                            alt={t('appstore.screenshotAlt', { index: index + 1 })}
                                                            className="rounded-[22px] object-cover"
                                                        />
                                                    </div>
                                                ),
                                            )}
                                    </div>
                                </div>

                                {relatedApps.length > 0 && (
                                    <div className="mt-6">
                                        <h4 className="font-semibold tracking-tight mb-3">{t('appstore.relatedApps')}</h4>
                                        <div className="space-y-2">
                                            {relatedApps.map((app) => (
                                                <button
                                                    key={app.id}
                                                    type="button"
                                                    onClick={() => setDetailAppId(app.id)}
                                                    className="w-full rounded-2xl bg-[#EFEFF4] dark:bg-[#2C2C2E] p-3 flex items-center gap-3 text-left"
                                                >
                                                    <div className="relative h-11 w-11">
                                                        <Image
                                                            src={app.iconUrl || 'https://picsum.photos/seed/related-app/120/120'}
                                                            fill
                                                            sizes="(max-width: 768px) 100vw, 33vw"
                                                            alt={t('appstore.iconAlt', { title: app.title })}
                                                            className="rounded-xl object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm truncate">{app.title}</p>
                                                        <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93] truncate">
                                                            @{app.ownerNickname}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="bg-[#EFEFF4] dark:bg-[#3A3A3C] text-[#0A84FF] rounded-full font-bold px-5 py-1 text-sm"
                                                        onClick={(event) => {
                                                            event.stopPropagation();

                                                            if (isNativeApp(app.id)) {
                                                                openNativeApp(app.id);
                                                                return;
                                                            }

                                                            setDetailAppId(app.id);
                                                        }}
                                                    >
                                                        {actionLabelForApp(app)}
                                                    </button>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6 space-y-2">
                                    <h4 className="font-semibold tracking-tight">{t('appstore.description')}</h4>
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
                            {form.id ? t('appstore.editApp') : t('appstore.publishNewApp')}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-[#8A8A8E] dark:text-[#8E8E93]">
                            {t('appstore.publishSubtitle')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 pb-6 space-y-3 max-h-[70vh] overflow-y-auto">
                        <div className="rounded-2xl bg-white dark:bg-[#2C2C2E] p-3 space-y-2">
                            <Input
                                className={insetInput}
                                placeholder={t('appstore.appName')}
                                aria-label="Nombre de la app"
                                value={form.title}
                                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                            />
                            <textarea
                                className="w-full min-h-[110px] rounded-xl border-0 bg-[#EFEFF4] dark:bg-[#1C1C1E] p-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                                placeholder={t('appstore.description')}
                                aria-label="Descripción de la app"
                                value={form.description}
                                onChange={(event) =>
                                    setForm((current) => ({ ...current, description: event.target.value }))
                                }
                            />
                            <Input
                                className={insetInput}
                                placeholder={t('appstore.iconUrl')}
                                aria-label="URL del icono"
                                value={form.iconUrl}
                                onChange={(event) => setForm((current) => ({ ...current, iconUrl: event.target.value }))}
                            />
                            <Input
                                className={insetInput}
                                placeholder={t('appstore.externalUrl')}
                                aria-label="URL externa de la app"
                                value={form.externalUrl}
                                onChange={(event) =>
                                    setForm((current) => ({ ...current, externalUrl: event.target.value }))
                                }
                            />
                            <textarea
                                className="w-full min-h-[110px] rounded-xl border-0 bg-[#EFEFF4] dark:bg-[#1C1C1E] p-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                                placeholder={t('appstore.screenshotsUrls')}
                                aria-label="URLs de capturas"
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
                                    placeholder={t('appstore.categoryTitleCase')}
                                    aria-label="Categoría"
                                    value={form.categoryInput}
                                    onChange={(event) =>
                                        setForm((current) => ({ ...current, categoryInput: event.target.value }))
                                    }
                                />
                                <Button className="rounded-xl h-12" onClick={addCategoryToForm}>
                                    {t('appstore.add')}
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
                                {t('appstore.maxCategoriesHint')}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white dark:bg-[#2C2C2E] p-2 grid grid-cols-2 gap-2">
                            <Button
                                variant={form.status === 'published' ? 'default' : 'ghost'}
                                className={`rounded-xl h-10 ${form.status === 'published' ? 'bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90' : ''}`}
                                onClick={() => setForm((current) => ({ ...current, status: 'published' }))}
                            >
                                {t('appstore.published')}
                            </Button>
                            <Button
                                variant={form.status === 'draft' ? 'default' : 'ghost'}
                                className={`rounded-xl h-10 ${form.status === 'draft' ? 'bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90' : ''}`}
                                onClick={() => setForm((current) => ({ ...current, status: 'draft' }))}
                            >
                                {t('appstore.draft')}
                            </Button>
                        </div>

                        <Button className={`${primaryButton} w-full`} onClick={submitAppForm} disabled={publishLoading}>
                            {publishLoading ? t('appstore.saving') : form.id ? t('appstore.saveChanges') : t('appstore.publishApp')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={authOpen} onOpenChange={setAuthOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl border-0 p-0 overflow-hidden bg-[#F2F2F7] dark:bg-[#1C1C1E]">
                    <DialogHeader className="px-6 pt-6 pb-2 text-left">
                        <DialogTitle className="text-2xl font-semibold">
                            {authMode === 'login' ? t('appstore.loginTitle') : t('appstore.registerTitle')}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-[#8A8A8E] dark:text-[#8E8E93]">
                            {authMode === 'login'
                                ? t('appstore.loginDescription')
                                : t('appstore.registerDescription')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 pb-6 space-y-3">
                        <div className="rounded-2xl bg-white dark:bg-[#2C2C2E] p-2 grid grid-cols-2 gap-2">
                            <Button
                                variant={authMode === 'login' ? 'default' : 'ghost'}
                                className={`rounded-xl h-10 ${authMode === 'login' ? 'bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90' : ''}`}
                                onClick={() => setAuthMode('login')}
                            >
                                {t('appstore.login')}
                            </Button>
                            <Button
                                variant={authMode === 'register' ? 'default' : 'ghost'}
                                className={`rounded-xl h-10 ${authMode === 'register' ? 'bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90' : ''}`}
                                onClick={() => setAuthMode('register')}
                            >
                                {t('appstore.register')}
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
                                <Input className={insetInput} placeholder={t('appstore.email')} aria-label={t('appstore.email')} value={email} onChange={(event) => setEmail(event.target.value)} />
                                <Input
                                    type="password"
                                    className={insetInput}
                                    placeholder={t('appstore.password')}
                                    aria-label={t('appstore.password')}
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                />
                                {authMode === 'register' && (
                                    <>
                                        <Input
                                            className={insetInput}
                                            placeholder={t('appstore.nickname')}
                                            aria-label={t('appstore.nickname')}
                                            value={nickname}
                                            onChange={(event) => setNickname(event.target.value)}
                                        />
                                        <Input
                                            className={insetInput}
                                            placeholder={t('appstore.displayName')}
                                            aria-label={t('appstore.displayName')}
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
                                {authLoading ? t('appstore.processing') : authMode === 'login' ? t('appstore.enter') : t('appstore.createAccount')}
                            </Button>
                        </form>

                        <Button
                            variant="secondary"
                            className="w-full h-12 rounded-full text-[15px] font-semibold"
                            onClick={handleGoogleLogin}
                            disabled={authLoading}
                        >
                            {t('appstore.continueGoogle')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={needsProfileCompletion} onOpenChange={setNeedsProfileCompletion}>
                <DialogContent className="sm:max-w-md rounded-3xl border-0 p-0 overflow-hidden bg-[#F2F2F7] dark:bg-[#1C1C1E]">
                    <DialogHeader className="px-6 pt-6 pb-2 text-left">
                        <DialogTitle className="text-2xl font-semibold">{t('appstore.completeProfileTitle')}</DialogTitle>
                        <DialogDescription className="text-sm text-[#8A8A8E] dark:text-[#8E8E93]">
                            {t('appstore.completeProfileDescription')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 pb-6 space-y-3">
                        <div className="rounded-2xl bg-white dark:bg-[#2C2C2E] p-3 space-y-2">
                            <Input className={insetInput} placeholder={t('appstore.nickname')} aria-label={t('appstore.nickname')} value={nickname} onChange={(event) => setNickname(event.target.value)} />
                            <Input
                                className={insetInput}
                                placeholder={t('appstore.displayName')}
                                aria-label={t('appstore.displayName')}
                                value={displayName}
                                onChange={(event) => setDisplayName(event.target.value)}
                            />
                            <Input className={insetInput} placeholder={t('appstore.bioOptional')} aria-label={t('appstore.bioOptional')} value={bio} onChange={(event) => setBio(event.target.value)} />
                            <Input
                                className={insetInput}
                                placeholder={t('appstore.avatarUrlOptional')}
                                aria-label={t('appstore.avatarUrlOptional')}
                                value={avatarUrl}
                                onChange={(event) => setAvatarUrl(event.target.value)}
                            />
                        </div>

                        <Button className={`${primaryButton} w-full`} onClick={upsertProfile}>
                            {t('appstore.saveProfile')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl border-0 p-0 overflow-hidden bg-[#F2F2F7] dark:bg-[#1C1C1E]">
                    <DialogHeader className="px-6 pt-6 pb-2 text-left">
                        <DialogTitle className="text-2xl font-semibold">{t('appstore.editProfileTitle')}</DialogTitle>
                        <DialogDescription className="text-sm text-[#8A8A8E] dark:text-[#8E8E93]">
                            {t('appstore.editProfileDescription')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 pb-6 space-y-3">
                        <div className="rounded-2xl bg-white dark:bg-[#2C2C2E] p-3 space-y-2">
                            <Input className={insetInput} placeholder={t('appstore.nickname')} aria-label={t('appstore.nickname')} value={nickname} onChange={(event) => setNickname(event.target.value)} />
                            <Input
                                className={insetInput}
                                placeholder={t('appstore.displayName')}
                                aria-label={t('appstore.displayName')}
                                value={displayName}
                                onChange={(event) => setDisplayName(event.target.value)}
                            />
                            <Input className={insetInput} placeholder={t('appstore.bio')} aria-label={t('appstore.bio')} value={bio} onChange={(event) => setBio(event.target.value)} />
                            <Input
                                className={insetInput}
                                placeholder={t('appstore.avatarUrl')}
                                aria-label={t('appstore.avatarUrl')}
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
                            {t('appstore.saveChanges')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AppStore;
