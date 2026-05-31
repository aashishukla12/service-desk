import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import KBManager from '@/app/components/KBManager';

export const metadata = {
  title: 'Knowledge Base — ServiceDesk',
};

export const dynamic = 'force-dynamic';

export default async function KBPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/sign-in');

  const orgId = session.user.orgId;

  const categories = await prisma.kBCategory.findMany({
    where: { orgId },
    orderBy: { orderIndex: 'asc' },
    include: {
      articles: {
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { name: true } } },
      },
    },
  });

  return <KBManager categories={JSON.parse(JSON.stringify(categories))} />;
}
