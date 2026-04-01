import React from 'react';
import { isMobile } from 'react-device-detect';
import { Navigate } from 'react-router-dom';

const MobileDesktopRouter = ({ mobileComponent, desktopComponent, redirectTo = "/" }) => {
  if (isMobile) {
    return mobileComponent;
  }

  if (desktopComponent) {
    return desktopComponent;
  }

  return <Navigate to={redirectTo} replace />;
};

export default MobileDesktopRouter;