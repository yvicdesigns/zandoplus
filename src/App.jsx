import React, { useEffect, useState, Suspense, lazy, memo } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

const SplashAnimationOverlay = lazy(() => import('@/components/common/SplashAnimationOverlay'));
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ListingsProvider, useListings } from '@/contexts/ListingsContext';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNavBar from '@/components/layout/MobileNavBar';
import { Loader2 } from 'lucide-react';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import DynamicFavicon from '@/components/common/DynamicFavicon';
import { isMobile } from 'react-device-detect';
import { useVisitor } from '@/hooks/useVisitor';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { PaymentProvider } from '@/contexts/PaymentContext';
import { CartProvider } from '@/hooks/useCart';
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { supabase } from '@/lib/customSupabaseClient';
import { MessagesDrawerProvider } from '@/contexts/MessagesDrawerContext';
import MessagesDrawer from '@/components/messages/MessagesDrawer';

const GoogleAnalytics  = lazy(() => import('@/components/analytics/GoogleAnalytics'));
const MetaPixel        = lazy(() => import('@/components/analytics/MetaPixel'));
const TikTokPixel      = lazy(() => import('@/components/analytics/TikTokPixel'));
const PwaInstallModal  = lazy(() => import('@/components/common/PwaInstallModal'));
const BugReportButton  = lazy(() => import('@/components/beta/BugReportButton'));
const ChatWidget       = lazy(() => import('@/components/ai/ChatWidget'));
const AuthModal        = lazy(() => import('@/components/auth/AuthModal'));

const HomePage = lazy(() => import('@/pages/HomePage'));
const ListingsPage = lazy(() => import('@/pages/ListingsPage'));
const ListingDetailPage = lazy(() => import('@/pages/ListingDetailPage'));
const PostAdPage = lazy(() => import('@/pages/PostAdPage'));
const EditAdPage = lazy(() => import('@/pages/EditAdPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const MessagesPage = lazy(() => import('@/pages/MessagesPage'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const MakeAdminPage = lazy(() => import('@/pages/MakeAdminPage'));
const VerificationPage = lazy(() => import('@/pages/VerificationPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('@/pages/TermsOfServicePage'));
const HelpCenterPage = lazy(() => import('@/pages/HelpCenterPage'));
const BoostListingPage = lazy(() => import('@/pages/BoostListingPage'));
const BoostPaymentConfirmationPage = lazy(() => import('@/pages/BoostPaymentConfirmationPage'));
const EscrowPaymentPage = lazy(() => import('@/pages/EscrowPaymentPage'));
const CashOnDeliveryPage = lazy(() => import('@/pages/CashOnDeliveryPage'));
const TransactionsPage = lazy(() => import('@/pages/TransactionsPage'));
const WalletPage = lazy(() => import('@/pages/WalletPage'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const CartCheckoutPage = lazy(() => import('@/pages/CartCheckoutPage'));
const PromotionsPage = lazy(() => import('@/pages/PromotionsPage'));
const EmailConfirmationPage = lazy(() => import('@/pages/EmailConfirmationPage'));
const ConfirmationRequiredPage = lazy(() => import('@/pages/ConfirmationRequiredPage'));
const SmtpTestPage = lazy(() => import('@/pages/SmtpTestPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const SellerShopPage = lazy(() => import('@/pages/SellerShopPage'));
const SellerDashboardPage = lazy(() => import('@/pages/SellerDashboardPage'));
const PwaInstallPage = lazy(() => import('@/pages/PwaInstallPage'));
const TrackingPage = lazy(() => import('@/pages/TrackingPage'));
const DataDeletionPage = lazy(() => import('@/pages/DataDeletionPage'));
const ChangelogPage = lazy(() => import('@/pages/ChangelogPage'));
const AdminDiagnosticsPage = lazy(() => import('@/pages/AdminDiagnosticsPage'));
const AdminEmailDiagnosticsPage = lazy(() => import('@/pages/AdminEmailDiagnosticsPage'));
const AuditReportPage = lazy(() => import('@/pages/AuditReportPage'));
const StorePage = lazy(() => import('@/pages/StorePage'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'));
const TestersLandingPage = lazy(() => import('@/pages/TestersLandingPage'));
const TesterDashboardPage = lazy(() => import('@/pages/TesterDashboardPage'));
const ShopBoostPage = lazy(() => import('@/pages/ShopBoostPage'));
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage'));
const BoutiquesOfficiellesPage = lazy(() => import('@/pages/BoutiquesOfficiellesPage'));
const UnsubscribePage = lazy(() => import('@/pages/UnsubscribePage'));
const BecomeSellerPage = lazy(() => import('@/pages/BecomeSellerPage'));

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

  const isAdmin = user?.user_metadata?.is_admin === true || ['admin', 'editor', 'monetisation', 'gestion'].includes(user?.role);
  
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const ProtectedRoute = () => {
  const { user, isLoading, openAuthModal } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      openAuthModal();
      navigate('/', { replace: true });
    }
  }, [isLoading, user, openAuthModal, navigate]);

  if (isLoading) return <FullPageLoader />;
  if (!user) return null;
  return <Outlet />;
};

const TesterProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  const [isTester, setIsTester] = useState(null);

  useEffect(() => {
    if (!user) { setIsTester(false); return; }
    supabase
      .from('testers')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()
      .then(({ data }) => setIsTester(!!data));
  }, [user]);

  if (isLoading || isTester === null) return <FullPageLoader />;
  if (!user || !isTester) return <Navigate to="/" replace />;
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

  // Publication gratuite et illimitée — aucune restriction de plan
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
    const { pathname } = useLocation();
    useVisitor();

    useEffect(() => {
      SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {});
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-page-bg">
            <Header onLoginClick={openAuthModal} />
            <main className={`flex-grow ${isMobile ? 'pb-24' : ''}`}>
                <ScrollToTop />
                <ErrorBoundary key={pathname}>
                    <Suspense fallback={<FullPageLoader />}>
                        <Outlet />
                    </Suspense>
                </ErrorBoundary>
            </main>
            <Footer />
            <MobileNavBar />
            <Suspense fallback={null}><BugReportButton /></Suspense>
            <Suspense fallback={null}><ChatWidget /></Suspense>
            <MessagesDrawer />
            <Toaster />
            <Suspense fallback={null}>
              <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
            </Suspense>
        </div>
    );
});

const AppContent = () => {
    usePushNotifications();
    return (
        <>
            <Suspense fallback={null}><PwaInstallModal /></Suspense>
            <DynamicFavicon />
            <Suspense fallback={null}><GoogleAnalytics /></Suspense>
            <Suspense fallback={null}><MetaPixel /></Suspense>
            <Suspense fallback={null}><TikTokPixel /></Suspense>
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
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/verification" element={<VerificationPage />} />
                    <Route path="/become-seller" element={<BecomeSellerPage />} />
                    <Route path="/suivi" element={<TrackingPage />} />
                    <Route path="/data-deletion" element={<DataDeletionPage />} />
                    <Route path="/changelog" element={<ChangelogPage />} />
                    <Route path="/audit-report" element={<AuditReportPage />} />
                    <Route element={<AdminProtectedRoute />}>
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/smtp-test" element={<SmtpTestPage />} />
                        <Route path="/admin/diagnostics" element={<AdminDiagnosticsPage />} />
                        <Route path="/admin/email-diagnostics" element={<AdminEmailDiagnosticsPage />} />
                        <Route path="/make-admin" element={<MakeAdminPage />} />
                    </Route>
                    <Route path="/boost/:listingId" element={<BoostListingPage />} />
                    <Route path="/boost-payment" element={<BoostPaymentConfirmationPage />} />
                    <Route element={<ProtectedRoute />}>
                      <Route path="/escrow/:listingId" element={<EscrowPaymentPage />} />
                      <Route path="/cod/:listingId" element={<CashOnDeliveryPage />} />
                      <Route path="/transactions" element={<TransactionsPage />} />
                      <Route path="/wallet" element={<WalletPage />} />
                      <Route path="/messages" element={<MessagesPage />} />
                      <Route path="/messages/:conversationId" element={<MessagesPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/espace-vendeur" element={<SellerDashboardPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/cart/checkout" element={<CartCheckoutPage />} />
                    </Route>
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/privacy" element={<PrivacyPolicyPage />} />
                    <Route path="/terms" element={<TermsOfServicePage />} />
                    <Route path="/help" element={<HelpCenterPage />} />
                    <Route path="/promotions" element={<PromotionsPage />} />
                    <Route path="/confirm-email" element={<EmailConfirmationPage />} />
                    <Route path="/confirmation-required" element={<ConfirmationRequiredPage />} />
                    <Route path="/installer-app" element={<PwaInstallPage />} />
                    <Route path="/auth/callback" element={<AuthCallbackPage />} />
                    <Route path="/store" element={<StorePage />} />
                    <Route path="/product/:id" element={<ProductDetailPage />} />
                    <Route path="/testeurs" element={<TestersLandingPage />} />
                    <Route path="/boost-shop" element={<ShopBoostPage />} />
                    <Route path="/boutiques-officielles" element={<BoutiquesOfficiellesPage />} />
                    <Route path="/unsubscribe" element={<UnsubscribePage />} />
                    <Route element={<TesterProtectedRoute />}>
                        <Route path="/dashboard/tester" element={<TesterDashboardPage />} />
                    </Route>
                </Route>
            </Routes>
        </>
    );
}

function App() {
  // Sur web, pas de splash — AppContent s'affiche immédiatement.
  // Sur iOS natif uniquement, on attend la fin de l'animation Lottie.
  const [splashDone, setSplashDone] = useState(Capacitor.getPlatform() !== 'ios');

  return (
    <HelmetProvider>
      <Router>
        <AuthProvider>
          <SiteSettingsProvider>
            <ListingsProvider>
              <NotificationsProvider>
                <PaymentProvider>
                  <CartProvider>
                    <MessagesDrawerProvider>
                      <Suspense fallback={null}>
                        <SplashAnimationOverlay onComplete={() => setSplashDone(true)} />
                      </Suspense>
                      {splashDone && <AppContent />}
                    </MessagesDrawerProvider>
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