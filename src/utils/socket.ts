
import { io, Socket } from 'socket.io-client';

const socket: Socket = io(process.env.NEXT_PUBLIC_GAME_SERVER as string, {
  autoConnect: false,
});

export default socket;