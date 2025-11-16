import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // In a real app, you would:
    // 1. Validate email exists in database
    // 2. Generate a secure reset token
    // 3. Store token with expiration (usually 1 hour)
    // 4. Send email with reset link

    // For now, we'll simulate the API call to your backend
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      throw new Error(data.message || 'Failed to send reset email');
    }

    return NextResponse.json({
      message: 'Password reset link sent successfully',
      success: true,
    });

  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}