import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet-async';

const ChangelogPage = () => {
  const [changelogs, setChangelogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChangelogs = async () => {
      try {
        const { data, error } = await supabase
          .from('changelogs')
          .select('*')
          .eq('is_published', true)
          .order('release_date', { ascending: false });

        if (error) throw error;
        setChangelogs(data || []);
      } catch (error) {
        console.error('Error fetching changelogs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChangelogs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Helmet>
        <title>Nouveautés & Mises à jour | Zando+ Congo</title>
        <meta name="description" content="Découvrez les dernières fonctionnalités, corrections et améliorations de Zando+ Congo." />
      </Helmet>
      
      <div className="container mx-auto px-4 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent hover:text-green-600">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
        </Link>
        
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Nouveautés & Mises à jour</h1>
          <p className="text-lg text-gray-600">
            Suivez l'évolution de la plateforme Zando+ et découvrez nos dernières améliorations.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : changelogs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
            <p className="text-gray-500">Aucune mise à jour publiée pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-8 relative before:absolute before:left-8 md:before:left-1/2 before:top-0 before:bottom-0 before:w-0.5 before:bg-gray-200">
            {changelogs.map((log, index) => (
              <div key={log.id} className="relative flex flex-col md:flex-row gap-8 items-start group">
                {/* Timeline Dot */}
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-green-500 border-4 border-white shadow-sm mt-6 z-10" />

                {/* Date Side */}
                <div className={`md:w-1/2 pl-20 md:pl-0 md:text-right md:pr-12 mt-5 ${index % 2 === 0 ? 'md:order-1' : 'md:order-2 md:text-left md:pl-12 md:pr-0'}`}>
                   <span className="text-sm font-medium text-gray-500 bg-white px-2 py-1 rounded-full border shadow-sm">
                    {format(new Date(log.release_date), 'dd MMMM yyyy', { locale: fr })}
                   </span>
                </div>

                {/* Card Side */}
                <div className={`w-full md:w-1/2 pl-16 md:pl-0 ${index % 2 === 0 ? 'md:order-2 md:pl-12' : 'md:order-1 md:pr-12'}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <Badge className="mb-2 bg-green-100 text-green-800 hover:bg-green-200 border-none">
                            {log.version}
                          </Badge>
                          <CardTitle className="text-xl text-gray-900">{log.title}</CardTitle>
                        </div>
                      </div>
                      {log.description && (
                        <CardDescription className="text-base mt-2">
                          {log.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {log.changes?.map((change, idx) => (
                          <li key={idx} className="flex gap-3 text-sm text-gray-700">
                            <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs">
                              {change.type === 'feat' && '✨'}
                              {change.type === 'fix' && '🐛'}
                              {change.type === 'style' && '🎨'}
                              {change.type === 'perf' && '⚡'}
                              {change.type === 'security' && '🔒'}
                            </span>
                            <span className="pt-0.5">{change.text}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangelogPage;