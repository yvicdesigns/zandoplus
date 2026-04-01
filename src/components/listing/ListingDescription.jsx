import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ListingDescription = ({ listing }) => (
  <Card className="border-0 shadow-lg">
    <CardHeader>
      <CardTitle>Description</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
        {listing.description || 'Aucune description fournie.'}
      </p>
    </CardContent>
  </Card>
);

export default ListingDescription;