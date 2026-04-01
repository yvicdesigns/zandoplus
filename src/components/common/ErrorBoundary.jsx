import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { logError } from '@/lib/errorLogger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorId: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = Math.random().toString(36).substr(2, 9);
    this.setState({ errorId });
    
    logError(error, {
      componentStack: errorInfo.componentStack,
      errorId
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, errorId: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center bg-red-50/50 rounded-lg border border-red-100 m-4">
          <div className="bg-red-100 p-4 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Oups ! Quelque chose s'est mal passé.
          </h2>
          <p className="text-gray-600 mb-6 max-w-md">
            Nous avons été notifiés de cette erreur et nous travaillons à la résoudre.
            {this.state.errorId && <span className="block mt-2 text-xs font-mono text-gray-400">Error ID: {this.state.errorId}</span>}
          </p>
          <div className="flex gap-4">
            <Button 
              onClick={() => window.location.href = '/'} 
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              Retour à l'accueil
            </Button>
            <Button 
              onClick={this.handleReset}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;