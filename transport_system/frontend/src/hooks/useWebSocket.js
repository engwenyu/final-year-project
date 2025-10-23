import { useEffect, useRef, useState } from 'react';

export const useWebSocket = (url, onMessage) => {
  const ws = useRef(null);
  const [connected] = useState(false);

  useEffect(() => {
    // 📴 Temporarily disable WebSockets (no connection)
    console.log("WebSocket disabled in development.");

    return () => {
      if (ws.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        ws.current.close();
      }
    };
  }, [url, onMessage]);

  const sendMessage = (message) => {
    console.warn("WebSocket sendMessage called, but WebSocket is disabled.", message);
  };

  return { connected, sendMessage };
};
