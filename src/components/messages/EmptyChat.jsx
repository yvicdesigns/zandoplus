import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

const EmptyChat = () => {
  return (
    <Card className="border-0 shadow-lg h-full">
      <CardContent className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <MessageSquare className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Sélectionnez une conversation</h3>
          <p className="text-gray-600">
            Choisissez une conversation dans la liste pour commencer à discuter.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyChat;