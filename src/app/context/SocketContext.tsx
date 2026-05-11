import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { syncWithMongoDB } from '../lib/storage';
import { toast } from 'sonner';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { shop, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !shop?.id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(API_BASE, {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
      newSocket.emit('join-shop', shop.id);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('data-updated', async ({ key, type, id }) => {
      console.log(`Real-time update: ${key} ${type} ${id}`);
      await syncWithMongoDB(key);
      
      if (type === 'create' && key === 'sales') {
        toast.info('New sale recorded by another staff member');
      } else if (key === 'products') {
        toast.info('Inventory updated by another device');
      }
    });

    newSocket.on('system-update', async (settings) => {
      console.log('System settings updated globally');
      await syncWithMongoDB('system_settings');
      
      if (settings.maintenanceMode) {
        toast.error('System is entering maintenance mode...', { duration: 5000 });
      } else {
        toast.success('Maintenance complete. System is back online!');
      }
      
      // Force a small delay then refresh to trigger guards
      setTimeout(() => window.location.reload(), 2000);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, shop?.id]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
