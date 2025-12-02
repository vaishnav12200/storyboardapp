import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import authSlice from './authSlice';
import projectsSlice from './projectsSlice';
import storyboardSlice from './storyboardSlice';
import scheduleSlice from './scheduleSlice';
import scriptSlice from './scriptSlice';
import locationSlice from './locationSlice';
import shotlistSlice from './shotlistSlice';
import budgetSlice from './budgetSlice';
import uiSlice from './uiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    projects: projectsSlice,
    storyboard: storyboardSlice,
    schedule: scheduleSlice,
    script: scriptSlice,
    locations: locationSlice,
    shotlist: shotlistSlice,
    budget: budgetSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;