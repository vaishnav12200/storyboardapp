import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/lib/store';
import { loadUserFromStorage, logoutUser } from '@/lib/store/authSlice';

export const useAuth = (requireAuth: boolean = false) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, token } = useAppSelector((state) => state.auth);

  // useEffect(() => {
  //   // Try to load user from storage on mount
  //   if (!isAuthenticated && !isLoading) {
  //     dispatch(loadUserFromStorage());
  //   }
  // }, [dispatch, isAuthenticated, isLoading]);

  useEffect(() => {
    // Redirect logic
    if (requireAuth && !isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [requireAuth, isAuthenticated, isLoading, router]);

  const logout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect even if logout API fails
      router.push('/login');
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    token,
    logout,
  };
};

export const useRequireAuth = () => {
  return useAuth(true);
};