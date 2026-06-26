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

export type CvContent = {
  headline: string;
  subheadline: string;
  location: string;
  summary: string;
  sections: {
    experience: string;
    education: string;
    skills: string;
    projects: string;
    projectsClient: string;
    projectsOther: string;
    languages: string;
    certifications: string;
    openPortfolio: string;
    contact: string;
    allProjects: string;
    print: string;
  };
  experience: CvExperience[];
  education: CvEducation[];
  skillGroups: CvSkillGroup[];
  languages: { name: string; level: string }[];
  certifications: CvCertification[];
};

export const CV_CONTENT: Record<CvLocale, CvContent> = {
  es: {
    headline: 'Daniel Cabrera',
    subheadline: 'Desarrollador Full-Stack',
    location: 'Barcelona, España',
    summary:
      'Desarrollador Full-Stack con formación en DAM e Ingeniería Informática (UOC), base sólida en soporte técnico empresarial y especialización en aplicaciones web modernas, automatización y ciberseguridad. Experiencia construyendo productos en producción con Next.js, TypeScript, Firebase y Supabase, desde plataformas de alto tráfico hasta bots y SaaS. Perfil orientado a resolver problemas reales con código mantenible, arquitecturas serverless y mentalidad security-first.',
    sections: {
      experience: 'Experiencia profesional',
      education: 'Formación',
      skills: 'Habilidades técnicas',
      projects: 'Proyectos destacados',
      projectsClient: 'En producción (clientes)',
      projectsOther: 'Personales y producto',
      languages: 'Idiomas',
      certifications: 'Certificaciones',
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
        highlights: [
          'Soporte técnico remoto y presencial, atención al usuario y gestión de incidencias.',
          'Mantenimiento de equipos, servidores Windows Server y redes.',
          'Automatización y mejoras operativas con scripts en Python.',
        ],
      },
      {
        company: 'Familia Torres S.A.',
        role: 'Técnico informático y soporte',
        period: 'Ene 2019 — Sep 2022',
        location: 'Vilafranca del Penedès',
        highlights: [
          'Soporte de infraestructura corporativa, servidores y estaciones de trabajo.',
          'Gestión de usuarios, tickets e incidencias en entorno empresarial.',
          'Desarrollo de soluciones para eficiencia operativa y migraciones hacia entornos cloud.',
        ],
      },
      {
        company: 'Ofigrafic S.L.',
        role: 'Técnico informático y soporte',
        period: 'Nov 2021 — Ene 2022',
        location: 'Vilafranca del Penedès',
        highlights: [
          'Mantenimiento de sistemas, revisión de seguridad y temperatura en servidores.',
          'Asistencia técnica y administración de usuarios en Windows Server.',
        ],
      },
    ],
    education: [
      {
        degree: 'Grado en Ingeniería Informática',
        institution: 'Universitat Oberta de Catalunya (UOC)',
        period: 'Sep 2025 — Actualidad',
        location: 'Online',
        details: 'En curso. Proyectos de programación, hackatones y desarrollo web.',
      },
      {
        degree: 'Grado Superior en Desarrollo de Aplicaciones Multiplataforma (DAM)',
        institution: "Institut Eugeni d'Ors",
        period: 'Sep 2020 — Jun 2025',
        location: 'Vilafranca del Penedès',
        details: 'Proyecto final: VinyaEstat (sector vitivinícola). Java, Android, SQL/NoSQL e interfaces de usuario.',
      },
      {
        degree: 'Grado Medio en Sistemas Microinformáticos y Redes (SMR)',
        institution: "Institut Eugeni d'Ors",
        period: 'Sep 2018 — Jun 2020',
        location: 'Vilafranca del Penedès',
      },
    ],
    skillGroups: [
      {
        label: 'Frontend',
        items: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Astro'],
      },
      {
        label: 'Backend & APIs',
        items: ['Node.js', 'Python', 'Django', 'Java', 'REST', 'Serverless'],
      },
      {
        label: 'Bases de datos',
        items: ['SQL', 'MySQL', 'MongoDB', 'Firestore', 'Supabase', 'Elasticsearch'],
      },
      {
        label: 'Cloud & DevOps',
        items: ['Vercel', 'Firebase', 'AWS', 'Google Cloud', 'Docker', 'GitHub Actions', 'Cloudflare'],
      },
      {
        label: 'Sistemas & seguridad',
        items: ['Windows Server', 'Linux', 'Redes', 'Ciberseguridad', 'Criptografía'],
      },
      {
        label: 'Otros',
        items: ['Git', 'Scrum', 'Rust', 'Luau', 'Automatización', 'eCommerce'],
      },
    ],
    languages: [
      { name: 'Español', level: 'Nativo' },
      { name: 'Catalán', level: 'Nativo' },
      { name: 'Inglés', level: 'B1 (intermedio)' },
    ],
    certifications: [
      {
        name: 'Curso de Respuesta a Incidentes de Ciberseguridad',
        issuer: 'Inkor Formación',
        period: 'Mar — Jun 2022',
      },
      {
        name: 'PCAP: Programming Essentials in Python',
        issuer: 'OpenEDG Python Institute',
        period: 'Oct — Dic 2023',
      },
    ],
  },
  en: {
    headline: 'Daniel Cabrera',
    subheadline: 'Full-Stack Developer',
    location: 'Barcelona, Spain',
    summary:
      'Full-Stack developer with a DAM background and ongoing Computer Engineering degree (UOC), grounded in enterprise IT support and focused on modern web applications, automation, and cybersecurity. Experience shipping production products with Next.js, TypeScript, Firebase, and Supabase—from high-traffic platforms to bots and SaaS. Problem-solver mindset with maintainable code, serverless architectures, and security-first thinking.',
    sections: {
      experience: 'Professional experience',
      education: 'Education',
      skills: 'Technical skills',
      projects: 'Featured projects',
      projectsClient: 'In production (clients)',
      projectsOther: 'Personal & product',
      languages: 'Languages',
      certifications: 'Certifications',
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
        highlights: [
          'Remote and on-site technical support, user assistance, and incident management.',
          'Maintenance of workstations, Windows Server, and networking.',
          'Operational automation and improvements using Python scripts.',
        ],
      },
      {
        company: 'Familia Torres S.A.',
        role: 'IT technician & support',
        period: 'Jan 2019 — Sep 2022',
        location: 'Vilafranca del Penedès',
        highlights: [
          'Corporate infrastructure support, servers, and end-user systems.',
          'User management, ticketing, and incident handling in enterprise environments.',
          'Efficiency solutions and migrations toward cloud-based systems.',
        ],
      },
      {
        company: 'Ofigrafic S.L.',
        role: 'IT technician & support',
        period: 'Nov 2021 — Jan 2022',
        location: 'Vilafranca del Penedès',
        highlights: [
          'Systems maintenance, server security and temperature monitoring.',
          'Technical assistance and Windows Server user administration.',
        ],
      },
    ],
    education: [
      {
        degree: 'Bachelor in Computer Engineering',
        institution: 'Universitat Oberta de Catalunya (UOC)',
        period: 'Sep 2025 — Present',
        location: 'Online',
        details: 'In progress. Programming projects, hackathons, and web development.',
      },
      {
        degree: 'Higher Technician in Multi-platform Application Development (DAM)',
        institution: "Institut Eugeni d'Ors",
        period: 'Sep 2020 — Jun 2025',
        location: 'Vilafranca del Penedès',
        details: 'Final project: VinyaEstat (wine industry). Java, Android, SQL/NoSQL, and UI design.',
      },
      {
        degree: 'Technician in Microcomputer Systems & Networks (SMR)',
        institution: "Institut Eugeni d'Ors",
        period: 'Sep 2018 — Jun 2020',
        location: 'Vilafranca del Penedès',
      },
    ],
    skillGroups: [
      {
        label: 'Frontend',
        items: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Astro'],
      },
      {
        label: 'Backend & APIs',
        items: ['Node.js', 'Python', 'Django', 'Java', 'REST', 'Serverless'],
      },
      {
        label: 'Databases',
        items: ['SQL', 'MySQL', 'MongoDB', 'Firestore', 'Supabase', 'Elasticsearch'],
      },
      {
        label: 'Cloud & DevOps',
        items: ['Vercel', 'Firebase', 'AWS', 'Google Cloud', 'Docker', 'GitHub Actions', 'Cloudflare'],
      },
      {
        label: 'Systems & security',
        items: ['Windows Server', 'Linux', 'Networking', 'Cybersecurity', 'Cryptography'],
      },
      {
        label: 'Other',
        items: ['Git', 'Scrum', 'Rust', 'Luau', 'Automation', 'eCommerce'],
      },
    ],
    languages: [
      { name: 'Spanish', level: 'Native' },
      { name: 'Catalan', level: 'Native' },
      { name: 'English', level: 'B1 (intermediate)' },
    ],
    certifications: [
      {
        name: 'Cybersecurity Incident Response Course',
        issuer: 'Inkor Formación',
        period: 'Mar — Jun 2022',
      },
      {
        name: 'PCAP: Programming Essentials in Python',
        issuer: 'OpenEDG Python Institute',
        period: 'Oct — Dec 2023',
      },
    ],
  },
};
