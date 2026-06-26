export const CV_EMAIL = 'daniel@danielcabrera.es';

export const CV_LINKS = {
  portfolio: 'https://danielcabrera.es',
  github: 'https://github.com/danikeinox',
  linkedin: 'https://www.linkedin.com/in/dcabreraa/',
} as const;

export type CvLocale = 'es' | 'en';

export type CvExperience = {
  company: string;
  role: string;
  period: string;
  location: string;
  highlights: string[];
  category?: 'it' | 'logistics';
};

export type CvEducation = {
  degree: string;
  institution: string;
  period: string;
  location: string;
  details?: string;
};

export type CvSkillGroup = {
  label: string;
  items: string[];
};

export type CvCertification = {
  name: string;
  issuer: string;
  period: string;
};

export type CvProject = {
  title: string;
  description: string;
  url?: string;
};

export type CvContent = {
  headline: string;
  subheadline: string;
  location: string;
  summary: string;
  sections: {
    experience: string;
    experienceParallel: string;
    experienceIt: string;
    education: string;
    skills: string;
    projects: string;
    languages: string;
    certifications: string;
    other: string;
    openPortfolio: string;
    contact: string;
    allProjects: string;
    print: string;
  };
  experience: CvExperience[];
  education: CvEducation[];
  skillGroups: CvSkillGroup[];
  projects: CvProject[];
  languages: { name: string; level: string }[];
  certifications: CvCertification[];
  other: string[];
};

export const CV_CONTENT: Record<CvLocale, CvContent> = {
  es: {
    headline: 'Daniel Cabrera',
    subheadline: 'Desarrollador Full-Stack',
    location: 'Vilafranca del Penedès, Barcelona',
    summary:
      'Desarrollador Full-Stack en formación avanzada (DAM + Grado en Ingeniería Informática en curso), con experiencia real en producción: apps web con Next.js y Firebase, automatización con Python, y un navegador de escritorio construido desde cero en Rust. Background sólido en soporte técnico y sistemas (Windows Server, redes), poco habitual en perfiles junior. Compagino la búsqueda activa de mi primer puesto como desarrollador con mi actividad laboral actual.',
    sections: {
      experience: 'Experiencia',
      experienceParallel: 'Actividad en paralelo',
      experienceIt: 'Tecnología y soporte',
      education: 'Educación',
      skills: 'Habilidades técnicas',
      projects: 'Proyectos destacados',
      languages: 'Idiomas',
      certifications: 'Certificaciones',
      other: 'Otros',
      openPortfolio: 'Ver portfolio interactivo',
      contact: 'Contacto',
      allProjects: 'Todos los proyectos',
      print: 'Imprimir / Guardar PDF',
    },
    experience: [
      {
        company: 'Informàtica i mes S.L.',
        role: 'Técnico informático y soporte',
        period: 'Jul 2024 — Oct 2024',
        location: 'Vilafranca del Penedès',
        category: 'it',
        highlights: [
          'Atención telefónica y presencial a clientes; resolución de incidencias técnicas.',
          'Mantenimiento y revisión de servidores; gestión de usuarios en Windows Server.',
          'Desarrollo de soluciones automatizadas en Python para mejorar la eficiencia operativa, incluyendo migraciones de CRM a tecnologías cloud.',
          'Instalación, configuración y administración de redes; gestión de tickets e incidencias.',
        ],
      },
      {
        company: 'Familia Torres S.A. / Ofigrafic S.L.',
        role: 'Técnico informático y soporte',
        period: '2019 — 2022 (intermitente)',
        location: 'Vilafranca del Penedès',
        category: 'it',
        highlights: [
          'Soporte técnico y mantenimiento de sistemas informáticos en distintas etapas entre 2019 y 2022.',
          'Gestión y monitorización de servidores (temperatura, seguridad, disponibilidad).',
          'Asistencia técnica remota y presencial; administración de usuarios y tickets de incidencias.',
        ],
      },
      {
        company: 'Amphora Logistics',
        role: 'Operario de logística',
        period: 'May 2026 — Actualidad',
        location: 'Santa Margarida i els Monjos',
        category: 'logistics',
        highlights: [
          'Actividad compaginada con la búsqueda activa de mi primer puesto como desarrollador.',
        ],
      },
    ],
    education: [
      {
        degree: 'Grado en Ingeniería Informática (en curso)',
        institution: 'Universitat Oberta de Catalunya (UOC)',
        period: 'Sep 2025 — Actualidad',
        location: 'Online',
      },
      {
        degree: 'DAM — Desarrollo de Aplicaciones Multiplataforma',
        institution: "Institut Eugeni d'Ors",
        period: '2020 — 2025',
        location: 'Vilafranca del Penedès',
        details:
          'Desarrollo de aplicaciones multiplataforma con Java y Android; gestión de bases de datos SQL/NoSQL. Proyecto final del sector vitivinícola: VinyaEstat.',
      },
      {
        degree: 'Grado Medio en Sistemas Microinformáticos y Redes',
        institution: "Institut Eugeni d'Ors",
        period: '2018 — 2020',
        location: 'Vilafranca del Penedès',
      },
    ],
    skillGroups: [
      {
        label: 'Frontend',
        items: ['React', 'Next.js', 'Astro', 'TypeScript', 'Tailwind CSS'],
      },
      {
        label: 'Backend',
        items: ['Node.js', 'Python (Django)', 'Java', 'PHP'],
      },
      {
        label: 'Bases de datos',
        items: ['SQL', 'MongoDB', 'Firestore', 'Supabase'],
      },
      {
        label: 'Cloud / DevOps',
        items: ['Vercel', 'Firebase', 'AWS', 'Google Cloud', 'GitHub Actions'],
      },
      {
        label: 'Sistemas y redes',
        items: ['Windows Server', 'Linux', 'Docker', 'Administración de redes', 'Ciberseguridad'],
      },
      {
        label: 'Otros',
        items: ['Git', 'Metodologías Scrum/Agile'],
      },
    ],
    projects: [
      {
        title: 'Tonet Browser',
        description:
          'Navegador de escritorio en Rust construido desde cero (sin Chromium/WebKit). MVP activo.',
        url: 'https://usetonet.com',
      },
      {
        title: 'Resuma',
        description: 'Startup en fase alpha: análisis de CV con IA y búsqueda inteligente de ofertas.',
        url: 'https://resuma.app',
      },
      {
        title: 'Perfectos Desconocidos 2',
        description:
          'Plataforma en producción para un reality show, con votación en vivo (Next.js, Supabase).',
        url: 'https://perfectosdesconoci2.com',
      },
      {
        title: 'portfoliOS',
        description: 'Portfolio interactivo que simula un sistema operativo móvil (Next.js, Firebase).',
        url: 'https://danielcabrera.es',
      },
      {
        title: 'Carliyoelbot',
        description: 'Bot de TikTok 24/7 que filtra y publica vídeos automáticamente.',
        url: 'https://carliyoelbot.com',
      },
    ],
    languages: [
      { name: 'Castellano', level: 'Nativo' },
      { name: 'Catalán', level: 'Nativo' },
      { name: 'Inglés', level: 'B1' },
    ],
    certifications: [
      {
        name: 'PCAP: Programming Essentials in Python',
        issuer: 'OpenEDG Python Institute',
        period: '2023',
      },
      {
        name: 'Curso de Respuesta a Incidentes de Ciberseguridad',
        issuer: 'Inkor Formación',
        period: '2022',
      },
    ],
    other: ['Permiso de conducción B'],
  },
  en: {
    headline: 'Daniel Cabrera',
    subheadline: 'Full-Stack Developer',
    location: 'Vilafranca del Penedès, Barcelona',
    summary:
      'Full-Stack developer in advanced training (DAM + Computer Engineering degree in progress), with real production experience: web apps with Next.js and Firebase, Python automation, and a desktop browser built from scratch in Rust. Strong background in technical support and systems (Windows Server, networking)—uncommon for junior profiles. I combine an active search for my first developer role with my current job.',
    sections: {
      experience: 'Experience',
      experienceParallel: 'Parallel activity',
      experienceIt: 'Technology & support',
      education: 'Education',
      skills: 'Technical skills',
      projects: 'Featured projects',
      languages: 'Languages',
      certifications: 'Certifications',
      other: 'Other',
      openPortfolio: 'Open interactive portfolio',
      contact: 'Contact',
      allProjects: 'All projects',
      print: 'Print / Save PDF',
    },
    experience: [
      {
        company: 'Informàtica i mes S.L.',
        role: 'IT technician & support',
        period: 'Jul 2024 — Oct 2024',
        location: 'Vilafranca del Penedès',
        category: 'it',
        highlights: [
          'Phone and on-site customer support; technical incident resolution.',
          'Server maintenance and review; Windows Server user management.',
          'Automated Python solutions for operational efficiency, including CRM migrations to cloud technologies.',
          'Network installation, configuration, and administration; ticket and incident management.',
        ],
      },
      {
        company: 'Familia Torres S.A. / Ofigrafic S.L.',
        role: 'IT technician & support',
        period: '2019 — 2022 (intermittent)',
        location: 'Vilafranca del Penedès',
        category: 'it',
        highlights: [
          'Technical support and IT systems maintenance across several stints between 2019 and 2022.',
          'Server management and monitoring (temperature, security, availability).',
          'Remote and on-site technical assistance; user administration and incident tickets.',
        ],
      },
      {
        company: 'Amphora Logistics',
        role: 'Warehouse logistics operator',
        period: 'May 2026 — Present',
        location: 'Santa Margarida i els Monjos',
        category: 'logistics',
        highlights: [
          'Work alongside an active search for my first developer role.',
        ],
      },
    ],
    education: [
      {
        degree: 'Bachelor in Computer Engineering (in progress)',
        institution: 'Universitat Oberta de Catalunya (UOC)',
        period: 'Sep 2025 — Present',
        location: 'Online',
      },
      {
        degree: 'DAM — Multi-platform Application Development',
        institution: "Institut Eugeni d'Ors",
        period: '2020 — 2025',
        location: 'Vilafranca del Penedès',
        details:
          'Multi-platform apps with Java and Android; SQL/NoSQL database management. Final project in the wine sector: VinyaEstat.',
      },
      {
        degree: 'Technician in Microcomputer Systems & Networks',
        institution: "Institut Eugeni d'Ors",
        period: '2018 — 2020',
        location: 'Vilafranca del Penedès',
      },
    ],
    skillGroups: [
      {
        label: 'Frontend',
        items: ['React', 'Next.js', 'Astro', 'TypeScript', 'Tailwind CSS'],
      },
      {
        label: 'Backend',
        items: ['Node.js', 'Python (Django)', 'Java', 'PHP'],
      },
      {
        label: 'Databases',
        items: ['SQL', 'MongoDB', 'Firestore', 'Supabase'],
      },
      {
        label: 'Cloud / DevOps',
        items: ['Vercel', 'Firebase', 'AWS', 'Google Cloud', 'GitHub Actions'],
      },
      {
        label: 'Systems & networking',
        items: ['Windows Server', 'Linux', 'Docker', 'Network administration', 'Cybersecurity'],
      },
      {
        label: 'Other',
        items: ['Git', 'Scrum/Agile methodologies'],
      },
    ],
    projects: [
      {
        title: 'Tonet Browser',
        description: 'Desktop browser built from scratch in Rust (no Chromium/WebKit). Active MVP.',
        url: 'https://usetonet.com',
      },
      {
        title: 'Resuma',
        description: 'Alpha-stage startup: AI CV analysis and smart job search.',
        url: 'https://resuma.app',
      },
      {
        title: 'Perfectos Desconocidos 2',
        description: 'Production platform for a reality show with live voting (Next.js, Supabase).',
        url: 'https://perfectosdesconoci2.com',
      },
      {
        title: 'portfoliOS',
        description: 'Interactive portfolio that simulates a mobile operating system (Next.js, Firebase).',
        url: 'https://danielcabrera.es',
      },
      {
        title: 'Carliyoelbot',
        description: '24/7 TikTok bot that filters and publishes videos automatically.',
        url: 'https://carliyoelbot.com',
      },
    ],
    languages: [
      { name: 'Spanish', level: 'Native' },
      { name: 'Catalan', level: 'Native' },
      { name: 'English', level: 'B1' },
    ],
    certifications: [
      {
        name: 'PCAP: Programming Essentials in Python',
        issuer: 'OpenEDG Python Institute',
        period: '2023',
      },
      {
        name: 'Cybersecurity Incident Response Course',
        issuer: 'Inkor Formación',
        period: '2022',
      },
    ],
    other: ['Category B driving license'],
  },
};
