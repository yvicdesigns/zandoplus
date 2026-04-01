import React from 'react';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';

const AuthFormInput = ({ icon: Icon, showPasswordToggle, showPassword, onTogglePassword, ...props }) => (
  <div className="relative">
    {Icon && <Icon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />}
    <Input
      className="pl-11 py-3 text-base rounded-lg border-gray-300 focus:border-custom-green-500 focus:ring-custom-green-500"
      {...props}
    />
    {showPasswordToggle && (
      <button
        type="button"
        onClick={onTogglePassword}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
        aria-label={showPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
      >
        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    )}
  </div>
);

export default AuthFormInput;