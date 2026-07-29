import React, { createContext, useContext, useState } from 'react';

const MessagesDrawerContext = createContext({});

export const MessagesDrawerProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [initialConvId, setInitialConvId] = useState(null);

  const openMessages = (convId = null) => {
    setInitialConvId(convId);
    setIsOpen(true);
  };

  const closeMessages = () => {
    setIsOpen(false);
    setInitialConvId(null);
  };

  return (
    <MessagesDrawerContext.Provider value={{ isOpen, openMessages, closeMessages, initialConvId }}>
      {children}
    </MessagesDrawerContext.Provider>
  );
};

export const useMessagesDrawer = () => useContext(MessagesDrawerContext);
