import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isMobile } from 'react-device-detect';

const PwaInstallFlowManager = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedPwaPage');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isMobile && !hasVisited && !isStandalone && location.pathname !== '/installer-app') {
      navigate('/installer-app', { replace: true });
    }
  }, [location, navigate]);

  return null;
};

export default PwaInstallFlowManager;