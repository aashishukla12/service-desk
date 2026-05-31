import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DepartmentsManager from '@/app/components/DepartmentsManager';

export const metadata = {
  title: 'Departments — ServiceDesk',
};

export default async function DepartmentsSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/sign-in');

  const orgId = session.user.orgId;

  const departments = await prisma.department.findMany({
    where: { orgId },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          users: true,
          tickets: true,
        },
      },
    },
  });

  // Serialize dates and send to client component
  const serializedDepartments = departments.map((dept) => ({
    ...dept,
    createdAt: dept.createdAt.toISOString(),
  }));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '12px 12px 48px' }}>
      <DepartmentsManager initialDepartments={serializedDepartments} />
    </div>
  );
}
