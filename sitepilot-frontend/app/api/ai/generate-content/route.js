import { NextResponse } from 'next/server';
import { generateComponentContent } from '@/lib/ai/gemini';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request) {
  try {
    // Auth check
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { componentType, fieldName, context, businessType } = body;

    if (!componentType || !fieldName) {
      return NextResponse.json(
        { error: 'Component type and field name are required' },
        { status: 400 }
      );
    }

    // Generate content with Gemini
    const result = await generateComponentContent({
      componentType,
      context: context || `Generate ${fieldName} for ${componentType}`,
      businessType: businessType || 'business'
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Extract the specific field value
    const fieldValue = result.content[fieldName] || result.content.content || result.content.text;

    return NextResponse.json({
      success: true,
      content: fieldValue,
      fullContent: result.content
    });

  } catch (error) {
    console.error('AI content generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content', details: error.message },
      { status: 500 }
    );
  }
}
