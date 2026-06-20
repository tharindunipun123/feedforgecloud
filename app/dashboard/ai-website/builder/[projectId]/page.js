'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner, Button } from '@/components/ui';
import {
  getAiWebsiteProject,
  updateAiWebsiteProject,
  getUserAiWebsitePlan,
  getMonthlyUsage,
} from '@/lib/firebase/ai-website';
import { AI_WEBSITE_PACKAGES } from '@/data/constants';

const STYLE_PRESETS = [
  { id: 'modern', label: 'Modern', desc: 'Clean, minimal, dark' },
  { id: 'corporate', label: 'Corporate', desc: 'Professional, blue tones' },
  { id: 'creative', label: 'Creative', desc: 'Bold, colorful, dynamic' },
  { id: 'elegant', label: 'Elegant', desc: 'Luxury, serif, refined' },
  { id: 'tech', label: 'Tech / SaaS', desc: 'Futuristic, gradient' },
  { id: 'warm', label: 'Warm', desc: 'Friendly, orange/yellow' },
];

const DEVICE_SIZES = {
  desktop: { width: '100%', label: 'Desktop', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  tablet: { width: '768px', label: 'Tablet', icon: 'M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  mobile: { width: '375px', label: 'Mobile', icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
};

export default function AiWebsiteBuilderPage() {
  const { projectId } = useParams();
  const { user, userData } = useAuth();
  const router = useRouter();

  const [project, setProject] = useState(null);
  const [plan, setPlan] = useState(AI_WEBSITE_PACKAGES[0]);
  const [usage, setUsage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('modern');
  const [pageTitle, setPageTitle] = useState('');
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [device, setDevice] = useState('desktop');
  const [activeTab, setActiveTab] = useState('prompt');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const iframeRef = useRef(null);

  useEffect(() => {
    if (!user || !projectId) return;
    Promise.all([
      getAiWebsiteProject(projectId),
      getUserAiWebsitePlan(userData),
      getMonthlyUsage(user.uid),
    ]).then(([proj, userPlan, monthUsage]) => {
      if (!proj || proj.userId !== user.uid) {
        router.replace('/dashboard/ai-website');
        return;
      }
      setProject(proj);
      setPlan(userPlan);
      setUsage(monthUsage);
      setPrompt(proj.prompt || '');
      setStyle(proj.style || 'modern');
      setPageTitle(proj.name || '');
      setGeneratedHtml(proj.generatedHtml || '');
    }).finally(() => setLoading(false));
  }, [user, userData, projectId, router]);

  const updateIframe = useCallback((html) => {
    if (iframeRef.current && html) {
      const iframe = iframeRef.current;
      iframe.srcdoc = html;
    }
  }, []);

  useEffect(() => {
    updateIframe(generatedHtml);
  }, [generatedHtml, updateIframe]);

  const generationsLeft = plan.generationsPerMonth === -1
    ? Infinity
    : plan.generationsPerMonth - usage;

  async function handleGenerate() {
    if (!prompt.trim()) { setError('Please describe your website first.'); return; }
    if (generationsLeft <= 0 && plan.generationsPerMonth !== -1) {
      setError(`Generation limit reached (${plan.generationsPerMonth}/month). Upgrade to continue.`);
      return;
    }
    setError('');
    setSuccessMsg('');
    setGenerating(true);

    try {
      const res = await fetch('/api/ai-website/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style,
          projectId,
          userId: user.uid,
          planId: plan.id,
          pageTitle: pageTitle || project?.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setGeneratedHtml(data.html);
      setUsage(data.generationsUsed);
      setSuccessMsg('Website generated! You can continue editing the prompt and regenerate.');
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateAiWebsiteProject(projectId, {
        prompt,
        style,
        generatedHtml,
        name: pageTitle || project?.name,
      });
      setSuccessMsg('Project saved!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleExport() {
    if (!generatedHtml) { setError('Generate a website first before exporting.'); return; }
    const blob = new Blob([generatedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(pageTitle || project?.name || 'website').replace(/\s+/g, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCopyHtml() {
    if (!generatedHtml) return;
    navigator.clipboard.writeText(generatedHtml);
    setSuccessMsg('HTML copied to clipboard!');
    setTimeout(() => setSuccessMsg(''), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const usagePercent = plan.generationsPerMonth === -1
    ? 0
    : Math.min(100, (usage / plan.generationsPerMonth) * 100);

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden -m-4 lg:-m-8">
      {/* Top toolbar */}
      <header className="flex items-center justify-between gap-3 px-4 h-14 border-b border-neutral-800 bg-neutral-950 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard/ai-website"
            className="text-neutral-400 hover:text-white p-1 rounded transition-colors shrink-0"
            title="Back to projects"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="w-px h-5 bg-neutral-800 shrink-0" />
          <span className="text-white font-medium text-sm truncate">{project?.name || 'Builder'}</span>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs bg-neutral-800 text-neutral-400 border border-neutral-700 shrink-0">
            {plan.name}
          </span>
        </div>

        {/* Device switcher */}
        <div className="hidden md:flex items-center gap-1 bg-neutral-900 rounded-lg p-1 border border-neutral-800">
          {Object.entries(DEVICE_SIZES).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setDevice(key)}
              title={val.label}
              className={`p-1.5 rounded transition-colors ${device === key ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-white'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={val.icon} />
              </svg>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {generatedHtml && (
            <>
              <button
                onClick={handleCopyHtml}
                title="Copy HTML"
                className="hidden sm:flex p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={handleExport}
                title="Export HTML"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-300 border border-neutral-700 rounded-lg hover:border-white hover:text-white transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
            </>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Left panel */}
        <aside className="w-80 shrink-0 border-r border-neutral-800 bg-neutral-950 flex flex-col overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-neutral-800">
            {[['prompt', 'Prompt'], ['style', 'Style'], ['code', 'HTML']].map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-white border-b-2 border-white'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'prompt' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Page Title</label>
                  <input
                    className="w-full px-3 py-2 bg-black border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
                    placeholder="My Website"
                    value={pageTitle}
                    onChange={(e) => setPageTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Describe your website
                  </label>
                  <textarea
                    className="w-full px-3 py-2.5 bg-black border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors resize-none"
                    rows={8}
                    placeholder="e.g. A modern portfolio for a freelance graphic designer. Include a hero with a bold headline, services grid, portfolio showcase, testimonials, and contact form. Use a dark theme with purple accents."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  <p className="text-xs text-neutral-600 mt-1">Be specific for better results. Include sections, colors, tone.</p>
                </div>

                {/* Prompt suggestions */}
                <div>
                  <p className="text-xs text-neutral-500 mb-2">Quick prompts:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Landing page for a SaaS startup',
                      'Photography portfolio',
                      'Restaurant website',
                      'Freelancer portfolio',
                      'Tech blog homepage',
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => setPrompt(s)}
                        className="text-xs px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'style' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-2">Design Style</label>
                  <div className="space-y-2">
                    {STYLE_PRESETS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStyle(s.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-all ${
                          style === s.id
                            ? 'border-white bg-neutral-800 text-white'
                            : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600 hover:text-white'
                        }`}
                      >
                        <span className="font-medium">{s.label}</span>
                        <span className="text-xs text-neutral-500">{s.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'code' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-neutral-400">Generated HTML</label>
                  {generatedHtml && (
                    <button
                      onClick={handleCopyHtml}
                      className="text-xs text-neutral-500 hover:text-white transition-colors"
                    >
                      Copy
                    </button>
                  )}
                </div>
                {generatedHtml ? (
                  <pre className="text-xs text-neutral-400 bg-black border border-neutral-800 rounded-lg p-3 overflow-x-auto max-h-[60vh] whitespace-pre-wrap break-all">
                    {generatedHtml.slice(0, 3000)}{generatedHtml.length > 3000 ? '\n\n... (truncated)' : ''}
                  </pre>
                ) : (
                  <p className="text-xs text-neutral-600 italic">Generate a website to see HTML here.</p>
                )}
                {generatedHtml && (
                  <button
                    onClick={handleExport}
                    className="mt-3 w-full py-2 text-xs text-neutral-400 border border-neutral-800 rounded-lg hover:border-neutral-600 hover:text-white transition-colors"
                  >
                    Download .html file
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Usage + Generate button */}
          <div className="p-4 border-t border-neutral-800 space-y-3">
            {/* Usage bar */}
            {plan.generationsPerMonth !== -1 && (
              <div>
                <div className="flex justify-between text-xs text-neutral-500 mb-1">
                  <span>Generations this month</span>
                  <span>{usage} / {plan.generationsPerMonth}</span>
                </div>
                <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 60 ? 'bg-yellow-500' : 'bg-white'}`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-400 bg-red-900/20 border border-red-900/30 rounded-lg px-3 py-2">{error}</p>
            )}
            {successMsg && (
              <p className="text-xs text-green-400 bg-green-900/20 border border-green-900/30 rounded-lg px-3 py-2">{successMsg}</p>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating || (generationsLeft <= 0 && plan.generationsPerMonth !== -1)}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white text-black hover:bg-neutral-200 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {generatedHtml ? 'Regenerate' : 'Generate Website'}
                </>
              )}
            </button>

            {generationsLeft <= 0 && plan.generationsPerMonth !== -1 && (
              <Link href="/ai-website-builder" className="block text-center text-xs text-neutral-400 hover:text-white transition-colors">
                Upgrade for more generations →
              </Link>
            )}
          </div>
        </aside>

        {/* Preview area */}
        <main className="flex-1 bg-neutral-900 flex flex-col min-w-0 overflow-hidden">
          {/* Preview toolbar */}
          <div className="flex items-center justify-between px-4 h-10 border-b border-neutral-800 bg-neutral-950 shrink-0">
            <span className="text-xs text-neutral-500">Preview</span>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-neutral-600 hidden sm:block">
                {device === 'desktop' ? 'Full Width' : DEVICE_SIZES[device].width}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-auto flex items-start justify-center p-4">
            {generatedHtml ? (
              <div
                style={{ width: DEVICE_SIZES[device].width, transition: 'width 0.3s ease' }}
                className="h-full rounded-xl overflow-hidden border border-neutral-800 shadow-2xl"
              >
                <iframe
                  ref={iframeRef}
                  title="Website Preview"
                  className="w-full h-full bg-white"
                  sandbox="allow-scripts allow-same-origin"
                  style={{ minHeight: '600px' }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto py-24">
                <div className="w-20 h-20 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Your website will appear here</h3>
                <p className="text-neutral-500 text-sm mb-6">
                  Describe your website in the Prompt tab, then click <strong className="text-neutral-300">Generate Website</strong>.
                </p>
                <button
                  onClick={handleGenerate}
                  disabled={generating || !prompt.trim()}
                  className="px-6 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? 'Generating…' : 'Generate Website'}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
