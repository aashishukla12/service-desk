import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Eye, ThumbsUp, User, BookOpen } from 'lucide-react';
import styles from './ArticleDetail.module.css';

export const metadata = {
  title: 'Knowledge Base Article — ServiceDesk',
};

export default async function KBArticleDetailPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/sign-in');

  const { id } = await params;
  const orgId = session.user.orgId;

  const article = await prisma.kBArticle.findUnique({
    where: { id, orgId },
    include: {
      category: { select: { name: true } },
      author: { select: { name: true } },
    },
  });

  if (!article) {
    redirect('/kb');
  }

  // Increment views
  await prisma.kBArticle.update({
    where: { id },
    data: { views: { increment: 1 } },
  }).catch(() => {});

  const formattedDate = new Date(article.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className={styles.container}>
      {/* Back button */}
      <div className={styles.backNav}>
        <Link href="/kb" className={styles.backLink}>
          <ArrowLeft size={16} />
          Back to Knowledge Base
        </Link>
      </div>

      <div className={styles.articleCard}>
        {/* Article Header */}
        <div className={styles.articleHeader}>
          {article.category && (
            <span className={styles.categoryBadge}>{article.category.name}</span>
          )}
          <h1 className={styles.title}>{article.title}</h1>

          <div className={styles.meta}>
            <div className={styles.metaItem}>
              <User size={14} />
              <span>{article.author.name}</span>
            </div>
            <div className={styles.metaItem}>
              <Calendar size={14} />
              <span>{formattedDate}</span>
            </div>
            <div className={styles.metaItem}>
              <Eye size={14} />
              <span>{article.views + 1} views</span>
            </div>
            {article.helpfulVotes > 0 && (
              <div className={styles.metaItem}>
                <ThumbsUp size={13} />
                <span>{article.helpfulVotes} found helpful</span>
              </div>
            )}
          </div>
        </div>

        {/* Article Body */}
        <div 
          className={styles.articleBody}
          dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
        />
      </div>
    </div>
  );
}
