import React from 'react';
import { CheckCircle2, Clock, AlertCircle, ShieldCheck } from 'lucide-react';

const statusConfig = {
  completed: {
    icon: <CheckCircle2 className="w-6 h-6 text-custom-green-500" />,
    color: 'bg-green-50 border-green-200 text-green-800',
    titleClass: 'text-green-800',
  },
  pending: {
    icon: <Clock className="w-6 h-6 text-amber-500" />,
    color: 'bg-amber-50 border-amber-200 text-amber-800',
    titleClass: 'text-amber-800',
  },
  action_required: {
    icon: <AlertCircle className="w-6 h-6 text-gray-500" />,
    color: 'bg-gray-50 border-gray-200',
    titleClass: 'text-gray-800',
  },
  rejected: {
    icon: <AlertCircle className="w-6 h-6 text-destructive" />,
    color: 'bg-red-50 border-red-200 text-red-800',
    titleClass: 'text-red-800',
  },
};

const VerificationStep = ({ title, description, status, children, rejectionReason }) => {
  const config = statusConfig[status] || statusConfig.action_required;

  return (
    <div className={`p-6 rounded-lg border-2 transition-all ${config.color}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 pt-1">{config.icon}</div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${config.titleClass}`}>{title}</h3>
          <p className="text-sm mt-1">{description}</p>
          {status === 'rejected' && rejectionReason && (
            <div className="mt-2 text-sm font-semibold text-destructive">
              Raison du rejet : {rejectionReason}
            </div>
          )}
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </div>
  );
};

export default VerificationStep;