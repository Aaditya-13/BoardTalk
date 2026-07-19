import { io, Socket } from 'socket.io-client';

const SOCKET_URL = '/';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket', 'polling'], // Use websocket for better realtime
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
