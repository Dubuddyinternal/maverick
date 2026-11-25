import DashboardShell from '@/components/DashboardShell';

/* The Maverick team's read-only view of one creator's dashboard.
   Opened from tools.dubuddy.in → Maverick Admin → Creators → Dashboard. */
export const metadata = { title: 'Creator dashboard · Maverick team', robots: { index: false, follow: false } };

export default async function ViewLayout({ children, params }) {
  const { cid } = await params;
  return <DashboardShell viewAs={cid}>{children}</DashboardShell>;
}
