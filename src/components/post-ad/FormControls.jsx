import React from 'react';
import { Button } from '@/components/ui/button';

const FormControls = ({ currentStep, prevStep, nextStep, loading, submitButtonText = "Publier l'Annonce", loadingText = "Publication..." }) => {
  return (
    <div className="flex justify-between mt-8 pt-6 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={prevStep}
        disabled={currentStep === 1 || loading}
      >
        Précédent
      </Button>

      {currentStep < 4 ? (
        <Button
          type="button"
          onClick={nextStep}
          className="gradient-bg hover:opacity-90 text-white"
          disabled={loading}
        >
          Suivant
        </Button>
      ) : (
        <Button
          type="submit"
          disabled={loading}
          className="gradient-bg hover:opacity-90 text-white"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              {loadingText}
            </div>
          ) : submitButtonText}
        </Button>
      )}
    </div>
  );
};

export default FormControls;