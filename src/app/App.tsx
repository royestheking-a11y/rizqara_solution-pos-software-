import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './routes';
import { AuthProvider } from './context/AuthContext';
import { seedInitialData } from './lib/seedData';
import { syncWithMongoDB } from './lib/storage';

function AppWithAuth() {
  useEffect(() => {
    const init = async () => {
      await seedInitialData();
      await syncWithMongoDB();
    };
    init().catch(console.error);
  }, []);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            fontSize: '14px',
          },
          classNames: {
            success: 'border-green-200',
            error: 'border-red-200',
          },
        }}
        richColors
      />
    </AuthProvider>
  );
}

export default function App() {
  return <AppWithAuth />;
}