import { labs, lessons, tracks } from './curriculum';
import { paths } from './paths';

// Keep card destinations derived from the same IDs as the curriculum.
export const trackHref = (id: string) => `/tracks/${encodeURIComponent(id)}`;
export const pathHref = (id: string) => `/paths/${encodeURIComponent(id)}`;
export const lessonHref = (id: string) => `/learn/${encodeURIComponent(id)}`;
export const labHref = (id: string, track?: string) => `/labs/${encodeURIComponent(id)}${track ? `?track=${encodeURIComponent(track)}` : ''}`;

// One lab may support several tracks. Every mapped ID is validated in tests.
export const labTracks: Record<string, string[]> = {
  caesar: ['crypto', 'security'], firewall: ['network-security', 'network'], phishing: ['security', 'soc'],
  terminal: ['linux', 'tools'], 'ip-address': ['network'], subnet: ['network'],
  routing: ['network', 'network-security'], logs: ['soc'],
  'suspicious-login': ['soc', 'iam'], passwords: ['security', 'iam'],
  http: ['web', 'web-security'], packets: ['network-security', 'tools'],
  hashes: ['crypto', 'forensics'], incident: ['response', 'forensics'],
};

export function destinationExists(href: string) {
  const url = new URL(href, 'https://cyberlab.example');
  const [, kind, id] = url.pathname.split('/');
  const decoded = id && decodeURIComponent(id);
  if (kind === 'tracks') return !!decoded && tracks.some(t => t.id === decoded);
  if (kind === 'paths') return !!decoded && paths.some(p => p.id === decoded);
  if (kind === 'learn' && decoded) return lessons.some(l => l.id === decoded);
  if (kind === 'labs' && decoded) return labs.some(l => l.id === decoded);
  return false;
}
