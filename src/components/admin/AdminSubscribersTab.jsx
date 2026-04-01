import React, { memo, useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const AdminSubscribersTab = memo(() => {
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchSubscribers = async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_all_subscribers');
        if (error) {
            toast({
                title: 'Erreur',
                description: "Impossible de récupérer la liste des abonnés.",
                variant: 'destructive',
            });
            console.error(error);
        } else {
            setSubscribers(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchSubscribers();
    }, []);

    const downloadCSV = () => {
        const headers = ['Email', 'Date d\'inscription'];
        const rows = subscribers.map(sub => [
            sub.email,
            new Date(sub.created_at).toLocaleString('fr-FR')
        ]);

        let csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "zandoplus_subscribers.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Abonnés à la Newsletter ({subscribers.length})</CardTitle>
                <Button onClick={downloadCSV} disabled={subscribers.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Exporter en CSV
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>
                ) : subscribers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Date d'inscription</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subscribers.map((subscriber) => (
                                    <TableRow key={subscriber.id}>
                                        <TableCell className="font-medium">{subscriber.email}</TableCell>
                                        <TableCell>{new Date(subscriber.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-8">Aucun abonné pour le moment.</p>
                )}
            </CardContent>
        </Card>
    );
});

export default AdminSubscribersTab;