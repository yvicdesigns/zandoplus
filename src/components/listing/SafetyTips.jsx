import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Flag } from 'lucide-react';
import ReportListingDialog from '@/components/listing/ReportListingDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const SafetyTips = ({ listingId, listingTitle }) => {
  const [isReportDialogOpen, setReportDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleReportClick = () => {
    if (!user) {
      toast({ title: "Connexion requise", description: "Veuillez vous connecter pour signaler une annonce.", variant: "destructive" });
      return;
    }
    setReportDialogOpen(true);
  };

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Shield className="w-5 h-5 mr-2 text-blue-500" />Conseils de Sécurité</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
            <li>Rencontrez-vous dans un lieu public et bien éclairé.</li>
            <li>Inspectez l'article avant de payer.</li>
            <li>Ne payez jamais à l'avance.</li>
            <li>Faites confiance à votre instinct.</li>
          </ul>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={handleReportClick}
          >
            <Flag className="w-4 h-4 mr-2" />Signaler l'Annonce
          </Button>
        </CardContent>
      </Card>
      <ReportListingDialog 
        open={isReportDialogOpen}
        onOpenChange={setReportDialogOpen}
        listingId={listingId}
        listingTitle={listingTitle}
      />
    </>
  );
};

export default SafetyTips;