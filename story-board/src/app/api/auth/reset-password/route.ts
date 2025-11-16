import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { message: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return NextResponse.json(
        { message: 'Password must contain uppercase, lowercase, and number' },
        { status: 400 }
      );
    }

    // In a real app, you would:
    // 1. Validate the reset token
    // 2. Check if token is not expired
    // 3. Hash the new password
    // 4. Update user's password in database
    // 5. Invalidate the reset token

    // For now, we'll simulate the API call to your backend
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, password }),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      throw new Error(data.message || 'Failed to reset password');
    }

    return NextResponse.json({
      message: 'Password reset successfully',
      success: true,
    });

  } catch (error: any) {
    console.error('Reset password error:', error);
    
    // Handle specific error cases
    if (error.message.includes('expired')) {
      return NextResponse.json(
        { message: 'Reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }
    
    if (error.message.includes('invalid')) {
      return NextResponse.json(
        { message: 'Invalid reset link. Please request a new one.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}