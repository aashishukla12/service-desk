import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ContactsManager from '@/app/components/ContactsManager';

export const metadata = {
  title: 'Contacts — ServiceDesk',
};

export default async function ContactsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/sign-in');

  const orgId = session.user.orgId;
  const isAdminOrAgent = session.user.role === 'ADMIN' || session.user.role === 'AGENT';

  const [contacts, accounts] = await Promise.all([
    prisma.contact.findMany({
      where: { orgId },
      orderBy: { name: 'asc' },
      include: {
        account: { select: { id: true, name: true } },
      },
    }),
    prisma.account.findMany({
      where: { orgId },
      orderBy: { name: 'asc' },
    }),
  ]);

  // Serialize dates
  const serializedContacts = contacts.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  const serializedAccounts = accounts.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '12px 12px 48px' }}>
      <ContactsManager
        initialContacts={serializedContacts}
        accounts={serializedAccounts}
        hasWriteAccess={isAdminOrAgent}
      />
    </div>
  );
}
