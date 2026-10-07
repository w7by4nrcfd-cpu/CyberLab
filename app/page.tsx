import Dashboard from './dashboard';
import { publicLessons } from '@/lib/curriculum';
export default function Home() { return <Dashboard lessons={publicLessons()}/>; }
