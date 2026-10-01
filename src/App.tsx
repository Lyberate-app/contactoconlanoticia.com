import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { SettingsProvider } from './context/SettingsContext';
import { GlobalNoticeHost } from './components/common/GlobalNoticeHost';

export const App: React.FC = () => {
  return (
    <SettingsProvider>
      <GlobalNoticeHost />
      <RouterProvider router={router} />
    </SettingsProvider>
  );
};

export default App;
