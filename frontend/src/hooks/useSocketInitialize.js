import {io} from 'socket.io-client';
import { useEffect } from 'react';

export const useSocketInitialize = () =>{

    const socket = io(import.meta.env.VITE_SOCKET_URL);
    useEffect(()=>{
        socket.on('connect', ()=>{
            console.log('Connected to socket');
        });
        socket.on('disconnect', ()=>{
            console.log('Disconnected from socket');
        });
        return ()=>{
            socket.disconnect();
        };
    }, []);

    return socket;
};

export default useSocketInitialize;