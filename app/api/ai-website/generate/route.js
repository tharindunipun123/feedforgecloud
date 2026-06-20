import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAdminDb } from '@/lib/firebase/admin';
import { AI_WEBSITE_PACKAGES } from '@/data/constants';

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured on the server.');
  }
  return new OpenAI({ apiKey });
}

function getPlanLimits(planId) {
  const pkg = AI_WEBSITE_PACKAGES.find((p) => p.id === planId);
  return {
    generationsPerMonth: pkg?.generationsPerMonth ?? 5,
    pages: pkg?.pages ?? 1,
  };
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function POST(request) {
  try {
    const { prompt, style, projectId, userId, planId, pageTitle } = await request.json();

    if (!prompt || !userId || !projectId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getAdminDb();
    const limits = getPlanLimits(planId || 'ai-website-free');
    const monthKey = getCurrentMonthKey();

    // Check generation quota
    const usageRef = db.collection('aiWebsiteUsage').doc(`${userId}_${monthKey}`);
    const usageSnap = await usageRef.get();
    const currentCount = usageSnap.exists ? (usageSnap.data().count || 0) : 0;

    if (limits.generationsPerMonth !== -1 && currentCount >= limits.generationsPerMonth) {
      return NextResponse.json(
        { error: `Monthly generation limit reached (${limits.generationsPerMonth} generations). Upgrade your plan for more.` },
        { status: 429 }
      );
    }

    const systemPrompt = `You are an expert web designer and developer. Generate a complete, beautiful, standalone HTML page with embedded CSS and minimal JavaScript. 
The output MUST be a single complete HTML document starting with <!DOCTYPE html>.
Requirements:
- Modern, professional design matching the requested style
- Fully responsive (mobile-first)
- Dark or light theme based on style preference
- Beautiful typography using Google Fonts (via CDN link in <head>)
- Smooth animations where appropriate
- No external JavaScript libraries (pure CSS/vanilla JS only)
- Include a complete navigation header, hero section, and relevant content sections
- Footer with copyright notice
- All CSS must be embedded in a <style> tag inside <head>
- Use modern CSS features (gradients, flexbox, grid, animations)
- Make it look like a real, production-quality website
Output ONLY the raw HTML document. No explanation, no markdown code blocks, no backticks.`;

    const userMessage = `Create a complete website page with the following details:
Business/Page description: ${prompt}
Page title: ${pageTitle || 'My Website'}
Design style: ${style || 'modern and professional'}

Generate a stunning, complete HTML page that would impress a client.`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    });

    const generatedHtml = completion.choices[0]?.message?.content?.trim();

    if (!generatedHtml) {
      return NextResponse.json({ error: 'Failed to generate website content' }, { status: 500 });
    }

    // Increment usage counter (merge so it creates if doesn't exist)
    await usageRef.set(
      { count: currentCount + 1, userId, monthKey, updatedAt: new Date().toISOString() },
      { merge: true }
    );

    // Update the project with generated HTML
    const projectRef = db.collection('aiWebsiteProjects').doc(projectId);
    await projectRef.update({
      generatedHtml,
      prompt,
      style: style || 'modern',
      updatedAt: new Date().toISOString(),
      generationsUsed: (currentCount + 1),
    });

    return NextResponse.json({
      html: generatedHtml,
      generationsUsed: currentCount + 1,
      generationsLimit: limits.generationsPerMonth,
    });
  } catch (err) {
    console.error('AI Website generation error:', err);
    return NextResponse.json(
      { error: err.message || 'Generation failed. Please try again.' },
      { status: 500 }
    );
  }
}
