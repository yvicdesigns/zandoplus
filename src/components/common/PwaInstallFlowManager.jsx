import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isMobile } from 'react-device-detect';

const PwaInstallFlowManager = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hasVisitedThisSession = sessionStorage.getItem('hasVisitedPwaPage');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isMobile && !hasVisitedThisSession && !isStandalone && location.pathname !== '/installer-app') {
      sessionStorage.setItem('hasVisitedPwaPage', 'true');
      navigate('/installer-app', { replace: true });
    }
  }, [location, navigate]);

  return null;
};

export default PwaInstallFlowManager;