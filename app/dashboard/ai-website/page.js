'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, LoadingSpinner, EmptyState, Button, PromoBanner } from '@/components/ui';
import {
  getUserAiWebsiteProjects,
  deleteAiWebsiteProject,
  getUserAiWebsitePlan,
  getMonthlyUsage,
} from '@/lib/firebase/ai-website';
import { AI_WEBSITE_PACKAGES } from '@/data/constants';

function PlanBadge({ planId }) {
  const pkg = AI_WEBSITE_PACKAGES.find((p) => p.id === planId) || AI_WEBSITE_PACKAGES[0];
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
      {pkg.name}
    </span>
  );
}

export default function AiWebsiteDashboardPage() {
  const { user, userData } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(AI_WEBSITE_PACKAGES[0]);
  const [usage, setUsage] = useState(0);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getUserAiWebsiteProjects(user.uid),
      getUserAiWebsitePlan(userData),
      getMonthlyUsage(user.uid),
    ]).then(([projs, userPlan, monthUsage]) => {
      setProjects(projs);
      setPlan(userPlan);
      setUsage(monthUsage);
    }).finally(() => setLoading(false));
  }, [user, userData]);

  async function handleDelete(projectId) {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    setDeletingId(projectId);
    try {
      await deleteAiWebsiteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } finally {
      setDeletingId(null);
    }
  }

  const generationsLeft = plan.generationsPerMonth === -1
    ? 'Unlimited'
    : Math.max(0, plan.generationsPerMonth - usage);

  const pageLimit = plan.id === 'ai-website-free' ? 1 : (plan.pages === -1 ? Infinity : plan.pages);
  const canCreateProject = projects.length < pageLimit;

  if (loading) {
    return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div>
      <PromoBanner section="ai-website" />
      <PageHeader
        title="AI Website Builder"
        description="Build stunning websites with AI — describe your vision, we do the rest."
        action={
          canCreateProject ? (
            <Link href="/dashboard/ai-website/new">
              <Button>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Project
              </Button>
            </Link>
          ) : (
            <Link href="/ai-website-builder">
              <Button variant="secondary">Upgrade Plan</Button>
            </Link>
          )
        }
      />

      {/* Plan info bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card className="!p-4">
          <p className="text-xs text-neutral-500 mb-1">Current Plan</p>
          <PlanBadge planId={plan.id} />
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-neutral-500 mb-1">AI Generations Left</p>
          <p className="text-white font-semibold text-lg">{generationsLeft}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-neutral-500 mb-1">Projects</p>
          <p className="text-white font-semibold text-lg">
            {projects.length}/{plan.pages === -1 ? '∞' : plan.pages}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-neutral-500 mb-1">This Month</p>
          <p className="text-white font-semibold text-lg">{usage} generations</p>
        </Card>
      </div>

      {/* Upgrade banner for free plan */}
      {plan.id === 'ai-website-free' && (
        <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-white font-medium">You&apos;re on the Free plan</p>
            <p className="text-sm text-neutral-400 mt-0.5">Upgrade to unlock more pages, AI generations, and custom domains.</p>
          </div>
          <Link href="/ai-website-builder">
            <Button size="sm">View Plans</Button>
          </Link>
        </div>
      )}

      {/* Projects list */}
      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first AI-powered website in minutes."
          action={
            <Link href="/dashboard/ai-website/new">
              <Button>Create your first project</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="flex flex-col justify-between gap-4 !p-5">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-white font-semibold truncate">{project.name}</h3>
                  <PlanBadge planId={project.planId} />
                </div>
                {project.description && (
                  <p className="text-sm text-neutral-400 line-clamp-2">{project.description}</p>
                )}
                {project.prompt && (
                  <p className="text-xs text-neutral-600 mt-2 line-clamp-1 italic">&ldquo;{project.prompt}&rdquo;</p>
                )}
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-neutral-800">
                <Link href={`/dashboard/ai-website/builder/${project.id}`} className="flex-1">
                  <Button size="sm" className="w-full">
                    <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Open Builder
                  </Button>
                </Link>
                <button
                  onClick={() => handleDelete(project.id)}
                  disabled={deletingId === project.id}
                  className="p-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-900 transition-colors disabled:opacity-50"
                  title="Delete project"
                >
                  {deletingId === project.id ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
