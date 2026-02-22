import { createContext } from 'react';

const SocketContext = createContext(
    {
        socket: null,
        isConnected: false,
        dispatchSocketAction: () => {},
    }
);
export { SocketContext };