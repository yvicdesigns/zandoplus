import React from 'react';
import { Button } from '@/components/ui/button';
import GoogleIcon from '@/components/auth/GoogleIcon';

const SocialLoginButtons = ({ onSocialLogin, loading }) => (
  <div className="space-y-4">
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-white px-2 text-gray-500">Ou continuer avec</span>
      </div>
    </div>
    <div>
      <Button variant="outline" type="button" onClick={() => onSocialLogin('google')} disabled={loading} className="w-full">
        <GoogleIcon className="mr-2 h-5 w-5" />
        Google
      </Button>
    </div>
  </div>
);

export default SocialLoginButtons;