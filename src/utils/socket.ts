import { io, Socket } from 'socket.io-client';

const socket: Socket = io(process.env.NEXT_PUBLIC_GAME_SERVER, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

export default socket;