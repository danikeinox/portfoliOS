export interface YouTubeVideoMock {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  views: string;
  published: string;
}

export const mockVideos: YouTubeVideoMock[] = [
  { id: 'rEassf2_Sms', title: "Next.js 15 - React Compiler, New Features, and More!", channel: 'Vercel', thumbnail: 'https://i.ytimg.com/vi/rEassf2_Sms/hqdefault.jpg', views: '1M views', published: '2 weeks ago' },
  { id: 'L_LUpnjgPso', title: "The Real World of Next.js", channel: 'Theo - t3.gg', thumbnail: 'https://i.ytimg.com/vi/L_LUpnjgPso/hqdefault.jpg', views: '235K views', published: '3 months ago' },
  { id: '3tmd-ClpJxA', title: "LEARN REACT JS in 5 MINUTES (2024)", channel: 'Web Dev Simplified', thumbnail: 'https://i.ytimg.com/vi/3tmd-ClpJxA/hqdefault.jpg', views: '50K views', published: '4 months ago' },
  { id: 'T-i6tq3I-cE', title: "I built a REALTIME chat app in 7 minutes", channel: 'Fireship', thumbnail: 'https://i.ytimg.com/vi/T-i6tq3I-cE/hqdefault.jpg', views: '540K views', published: '5 days ago' },
  { id: 'dQw4w9WgXcQ', title: "Rick Astley - Never Gonna Give You Up", channel: 'Rick Astley', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', views: '1.5B views', published: '14 years ago' },
  { id: 'Yf-p-2y4-pI', title: "The new Firebase is kinda wild...", channel: 'Fireship', thumbnail: 'https://i.ytimg.com/vi/Yf-p-2y4-pI/hqdefault.jpg', views: '201k views', published: '3 weeks ago' },
];