
import { io, Socket } from 'socket.io-client';

const socket: Socket = io(process.env.NEXT_PUBLIC_GAME_SERVER as string, {
  transports: ['websocket', 'polling'],
});

export default socket;