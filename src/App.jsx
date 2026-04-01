import React, { useEffect, Suspense, lazy, memo } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ListingsProvider, useListings } from '@/contexts/ListingsContext';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNavBar from '@/components/layout/MobileNavBar';
import { Loader2 } from 'lucide-react';
import AuthModal from '@/components/auth/AuthModal';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import DynamicFavicon from '@/components/common/DynamicFavicon';
import { isMobile } from 'react-device-detect';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import { useVisitor } from '@/hooks/useVisitor';
import PwaInstallFlowManager from '@/components/common/PwaInstallFlowManager';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { PaymentProvider } from '@/contexts/PaymentContext';
import { CartProvider } from '@/hooks/useCart';
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from '@/components/common/ErrorBoundary';

const HomePage = lazy(() => import('@/pages/HomePage'));
const ListingsPage = lazy(() => import('@/pages/ListingsPage'));
const ListingDetailPage = lazy(() => import('@/pages/ListingDetailPage'));
const PostAdPage = lazy(() => import('@/pages/PostAdPage'));
const EditAdPage = lazy(() => import('@/pages/EditAdPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const MessagesPage = lazy(() => import('@/pages/MessagesPage'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const PricingPage = lazy(() => import('@/pages/PricingPage'));
const PaymentStatusPage = lazy(() => import('@/pages/PaymentStatusPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const MakeAdminPage = lazy(() => import('@/pages/MakeAdminPage'));
const VerificationPage = lazy(() => import('@/pages/VerificationPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('@/pages/TermsOfServicePage'));
const HelpCenterPage = lazy(() => import('@/pages/HelpCenterPage'));
const FreePlanPage = lazy(() => import('@/pages/FreePlanPage'));
const BoostPlanPage = lazy(() => import('@/pages/BoostPlanPage'));
const MobilePaymentPage = lazy(() => import('@/pages/MobilePaymentPage'));
const BoostListingPage = lazy(() => import('@/pages/BoostListingPage'));
const PaymentConfirmationPage = lazy(() => import('@/pages/PaymentConfirmationPage'));
const BoostPaymentConfirmationPage = lazy(() => import('@/pages/BoostPaymentConfirmationPage'));
const BoostReviewPage = lazy(() => import('@/pages/BoostReviewPage'));
const PromotionsPage = lazy(() => import('@/pages/PromotionsPage'));
const EmailConfirmationPage = lazy(() => import('@/pages/EmailConfirmationPage'));
const ConfirmationRequiredPage = lazy(() => import('@/pages/ConfirmationRequiredPage'));
const SmtpTestPage = lazy(() => import('@/pages/SmtpTestPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const SellerShopPage = lazy(() => import('@/pages/SellerShopPage'));
const PwaInstallPage = lazy(() => import('@/pages/PwaInstallPage'));
const TrackingPage = lazy(() => import('@/pages/TrackingPage'));
const DataDeletionPage = lazy(() => import('@/pages/DataDeletionPage'));
const ChangelogPage = lazy(() => import('@/pages/ChangelogPage'));
const AdminDiagnosticsPage = lazy(() => import('@/pages/AdminDiagnosticsPage'));
const AdminEmailDiagnosticsPage = lazy(() => import('@/pages/AdminEmailDiagnosticsPage'));
const AuditReportPage = lazy(() => import('@/pages/AuditReportPage'));
const StorePage = lazy(() => import('@/pages/StorePage'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'));

const FullPageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
    <Loader2 className="w-12 h-12 animate-spin text-custom-green-500" />
  </div>
);

const AdminProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageLoader />;
  }

  const isAdmin = user?.user_metadata?.is_admin === true || user?.role === 'admin' || user?.role === 'editor';
  
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const PostAdProtectedRoute = () => {
  const { user, isLoading: authLoading, openAuthModal } = useAuth();
  const { listings, loading: listingsLoading } = useListings();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      openAuthModal();
      navigate('/', { replace: true });
    }
  }, [authLoading, user, openAuthModal, navigate]);

  if (authLoading || listingsLoading) {
    return <FullPageLoader />;
  }

  if (!user) {
    return null;
  }

  if (!user?.full_name || !user?.phone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-4 text-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-xl font-bold mb-4">Profil Incomplet</h1>
          <p className="text-gray-600 mb-6">
            Veuillez compléter votre profil (nom complet et numéro de téléphone) avant de publier une annonce.
          </p>
          <Button onClick={() => navigate('/profile')} className="gradient-bg hover:opacity-90">
            Compléter le Profil
          </Button>
        </div>
      </div>
    );
  }

  const userActiveListingsCount = listings.filter(l => l.user_id === user.id && l.status === 'active').length;
  
  let maxListings;
  switch (user.plan) {
    case 'free':
      maxListings = 5;
      break;
    case 'boost':
      maxListings = 20;
      break;
    case 'pro':
      maxListings = 100;
      break;
    default:
      maxListings = 5;
  }

  if (userActiveListingsCount >= maxListings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-4 text-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-xl font-bold mb-4">Limite d'Annonces Atteinte</h1>
          <p className="text-gray-600 mb-6">
            Vous avez atteint le nombre maximal d'annonces actives pour votre plan ({maxListings}).
            Veuillez désactiver ou supprimer une annonce, ou mettre à niveau votre plan.
          </p>
          <Button onClick={() => navigate('/profile')} className="gradient-bg hover:opacity-90 mr-2">
            Gérer mes annonces
          </Button>
          <Button onClick={() => navigate('/pricing')} variant="outline">
            Voir les Plans
          </Button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
};

const AppLayout = memo(() => {
    const { isAuthModalOpen, openAuthModal, closeAuthModal } = useAuth();
    useVisitor();

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
            <Header onLoginClick={openAuthModal} />
            <main className={`flex-grow ${isMobile ? 'pb-24' : ''}`}>
                <ScrollToTop />
                <ErrorBoundary>
                    <Suspense fallback={<FullPageLoader />}>
                        <Outlet />
                    </Suspense>
                </ErrorBoundary>
            </main>
            <Footer />
            <MobileNavBar />
            <Toaster />
            <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
        </div>
    );
});

const AppContent = () => {
    return (
        <>
            <PwaInstallFlowManager />
            <DynamicFavicon />
            <GoogleAnalytics />
            <Routes>
                <Route element={<AppLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/listings" element={<ListingsPage />} />
                    <Route path="/listings/:id" element={<ListingDetailPage />} />
                    <Route path="/seller/:sellerId" element={<SellerShopPage />} />
                    <Route element={<PostAdProtectedRoute />}>
                        <Route path="/post-ad" element={<PostAdPage />} />
                    </Route>
                    <Route path="/edit-ad/:id" element={<EditAdPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/verification" element={<VerificationPage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="/messages/:conversationId" element={<MessagesPage />} />
                    <Route path="/suivi" element={<TrackingPage />} />
                    <Route path="/data-deletion" element={<DataDeletionPage />} />
                    <Route path="/changelog" element={<ChangelogPage />} />
                    <Route path="/audit-report" element={<AuditReportPage />} />
                    <Route element={<AdminProtectedRoute />}>
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/smtp-test" element={<SmtpTestPage />} />
                        <Route path="/admin/diagnostics" element={<AdminDiagnosticsPage />} />
                        <Route path="/admin/email-diagnostics" element={<AdminEmailDiagnosticsPage />} />
                    </Route>
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/payment/success" element={<PaymentStatusPage status="success" />} />
                    <Route path="/payment/cancel" element={<PaymentStatusPage status="cancel" />} />
                    <Route path="/payment/confirmation" element={<PaymentConfirmationPage />} />
                    <Route path="/boost-payment" element={<BoostPaymentConfirmationPage />} />
                    <Route path="/mobile-payment" element={<MobilePaymentPage />} />
                    <Route path="/boost/:listingId" element={<BoostListingPage />} />
                    <Route path="/make-admin" element={<MakeAdminPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/privacy" element={<PrivacyPolicyPage />} />
                    <Route path="/terms" element={<TermsOfServicePage />} />
                    <Route path="/help" element={<HelpCenterPage />} />
                    <Route path="/free-plan" element={<FreePlanPage />} />
                    <Route path="/boost-plan" element={<BoostPlanPage />} />
                    <Route path="/boost-review" element={<BoostReviewPage />} />
                    <Route path="/promotions" element={<PromotionsPage />} />
                    <Route path="/confirm-email" element={<EmailConfirmationPage />} />
                    <Route path="/confirmation-required" element={<ConfirmationRequiredPage />} />
                    <Route path="/installer-app" element={<PwaInstallPage />} />
                    <Route path="/store" element={<StorePage />} />
                    <Route path="/product/:id" element={<ProductDetailPage />} />
                </Route>
            </Routes>
        </>
    );
}

function App() {
  return (
    <HelmetProvider>
      <Router>
        <AuthProvider>
          <SiteSettingsProvider>
            <ListingsProvider>
              <NotificationsProvider>
                <PaymentProvider>
                  <CartProvider>
                    <AppContent />
                  </CartProvider>
                </PaymentProvider>
              </NotificationsProvider>
            </ListingsProvider>
          </SiteSettingsProvider>
        </AuthProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App;