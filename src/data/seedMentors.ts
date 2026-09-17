import { Mentor, CategoryInfo } from '../types';

export const CATEGORIES: CategoryInfo[] = [
  { id: 'kolchay', label: 'Kolchay', subLabel: 'Kol les mentors', iconName: 'Sparkles' },
  { id: 'bac_info', label: 'Bac Info & Lycée', subLabel: 'Algo, TIC, Orient', iconName: 'GraduationCap' },
  { id: 'fac_prep', label: 'Fac, Prep & INSAT', subLabel: '1ère & 2ème Année', iconName: 'BookOpen' },
  { id: 'web_mobile', label: 'Web & Mobile Dev', subLabel: 'React, Flutter, Node', iconName: 'Code' },
  { id: 'devops_cloud', label: 'DevOps & Cloud', subLabel: 'Docker, Linux, $0 host', iconName: 'Server' },
  { id: 'data_ai', label: 'Data & AI', subLabel: 'Python, Machine Learning', iconName: 'Brain' },
];

export const INITIAL_MENTORS: Mentor[] = [
  {
    id: 'mentor-flagship-founder',
    name: 'Amine M. (Founder Flagship)',
    status: 'Ex-Bac Info Major -> INSAT GL -> Software Engineer',
    whatsappNumber: '21698765432',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Embed ID
    youtubeVideoId: 'f02mOEt11OQ', // Clean CS / Feynman tutorial video id
    bio: 'Founder @ Mentorini 🇹🇳. 3malt Bac Info w ba3d INSAT GL. Hena bech n3awen ay telmidh 7ayer bin Prep, INSAT, ISI wala Fac. Resource Drive mte3 les résumés d Algorithmique w orientation mrak7in lena: https://drive.google.com/drive/folders/1example-mentorini-bac w GitHub starter repos fi https://github.com/mentorini-tn/starter-kit',
    category: 'bac_info',
    tags: ['Bac Info', 'Orientation', 'INSAT', 'Algo Pascal/Python'],
    isFlagship: true,
    feynmanTopic: 'Kifeh tfid rou7ek fi Bac Info w tekhtar l-Fac b strategic clarity',
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'mentor-sarra-frontend',
    name: 'Sarra B.',
    status: 'Licence CS (ISI) -> Junior Frontend Dev @ SaaS Startup',
    whatsappNumber: '21622345678',
    youtubeUrl: 'https://www.youtube.com/watch?v=1PnVor36_40',
    youtubeVideoId: '1PnVor36_40',
    bio: 'Dkhalet l-IT men Bac Eco (reconversion). T3alemt HTML/CSS/React wa7di f dar. N3awnek ta3mel awel portfolio w tposti fi LinkedIn. Roadmaps w cheatsheets fi Notion mte3i: https://notion.so/sarra-dev-guide-free',
    category: 'web_mobile',
    tags: ['React', 'CSS', 'Portfolio', 'Reconversion'],
    isFlagship: false,
    feynmanTopic: 'Flexbox vs CSS Grid bel Tounsi fi 3 d9aye9',
    createdAt: '2025-01-02T00:00:00.000Z',
  },
  {
    id: 'mentor-youssef-gl',
    name: 'Youssef K.',
    status: '3ème Année Génie Logiciel @ INSAT',
    whatsappNumber: '21655123987',
    youtubeUrl: 'https://www.youtube.com/watch?v=RGOj5yH7evk',
    youtubeVideoId: 'RGOj5yH7evk',
    bio: 'N3awen jme3et 1ère w 2ème année fi C, Java, OOP w Data Structures. Pas de stress lel les examens. Drive mte3 les séries w corrections mte3na: https://drive.google.com/drive/folders/insat-gl-resources-public',
    category: 'fac_prep',
    tags: ['C/C++', 'Java OOP', 'Data Structures', 'INSAT/ISI'],
    isFlagship: false,
    feynmanTopic: 'Chnowa l-far9 bin Git w GitHub w kifeh ma tfasakhch khedmet s7abek',
    createdAt: '2025-01-03T00:00:00.000Z',
  },
  {
    id: 'mentor-khlil-devops',
    name: 'Khlil T.',
    status: 'DevOps & Cloud Engineer @ Tunis Technopark',
    whatsappNumber: '21694567123',
    youtubeUrl: 'https://www.youtube.com/watch?v=pg19Z8LLK4w',
    youtubeVideoId: 'pg19Z8LLK4w',
    bio: 'Linux, Docker, CI/CD w $0 hosting. Ken theb t-deployi awel web app mte3ek blech flous (Vercel, Render, Supabase), contactini w ab3athli sou2elek! Cheat-sheet repo: https://github.com/khlil-cloud/devops-zero-cost',
    category: 'devops_cloud',
    tags: ['Docker', 'Linux', '$0 Deploy', 'CI/CD'],
    isFlagship: false,
    feynmanTopic: 'Docker fi 5 d9aye9: 3lech Container 5ir b barcha men Virtual Machine',
    createdAt: '2025-01-04T00:00:00.000Z',
  },
];
