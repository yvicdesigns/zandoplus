import React from 'react';
import { Filter, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

const categories = [
    { value: 'all', label: 'Toutes Catégories' },
    { value: 'electronics', label: 'Électronique' },
    { value: 'vehicles', label: 'Véhicules' },
    { value: 'real-estate', label: 'Immobilier' },
    { value: 'fashion', label: 'Mode' },
    { value: 'jobs', label: 'Emplois' },
    { value: 'services', label: 'Services' },
    { value: 'agro-alimentaire', label: 'Agroalimentaire' },
    { value: 'traditional-medicine', label: 'Médecine traditionnelle' }
];

const conditions = [
    { value: 'all', label: 'Tout État' },
    { value: 'new', label: 'Neuf' },
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Bon' },
    { value: 'fair', label: 'Passable' }
];

const sortOptions = [
    { value: 'newest', label: 'Plus Récentes' },
    { value: 'popularity', label: 'Popularité' },
    { value: 'price-low', label: 'Prix : Croissant' },
    { value: 'price-high', label: 'Prix : Décroissant' },
    { value: 'oldest', label: 'Plus Anciennes' },
];

const ListingsFilters = ({
  searchQuery,
  setSearchQuery,
  handleSearch,
  filters,
  setFilters,
  sortBy,
  setSortBy,
  showFilters,
  setShowFilters,
}) => {
  // Helper to safely handle "all" value which maps to empty string in logic
  const handleCategoryChange = (val) => {
    setFilters(prev => ({ ...prev, category: val === 'all' ? '' : val }));
  };

  const handleConditionChange = (val) => {
    setFilters(prev => ({ ...prev, condition: val === 'all' ? '' : val }));
  };

  const activeFiltersCount = [
      filters.category,
      filters.location,
      filters.condition,
      (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000)
  ].filter(Boolean).length;

  const clearFilters = () => {
      setFilters({
          category: '',
          location: '',
          condition: '',
          priceRange: [0, 10000000],
          search: ''
      });
      setSearchQuery('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-fit sticky top-24">
      {/* Mobile Header with Close Button */}
      <div className="flex items-center justify-between mb-6 lg:hidden">
        <h2 className="text-xl font-bold text-gray-900">Filtres</h2>
        <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-custom-green-600" />
          <h2 className="text-lg font-bold text-gray-900">Filtres</h2>
        </div>
        {activeFiltersCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="text-xs text-red-500 hover:text-red-600 h-auto p-0 hover:bg-transparent"
          >
            Effacer
          </Button>
        )}
      </div>

      {/* Search Section */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="space-y-3">
          <div className="relative">
            <Input
              type="text"
              placeholder="Mots-clés..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>
          <Button type="submit" className="w-full gradient-bg hover:opacity-90 shadow-md">
            Rechercher
          </Button>
        </div>
      </form>

      <div className="space-y-6">
        {/* Sort Option */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Trier par</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full bg-gray-50 border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="h-px bg-gray-100" />

        {/* Category */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Catégorie</Label>
          <Select
            value={filters.category || 'all'}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-full bg-gray-50 border-gray-200">
              <SelectValue placeholder="Toutes les catégories" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {categories.map(category => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Localisation</Label>
          <Input
            type="text"
            placeholder="Ville, Quartier..."
            value={filters.location}
            onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
            className="bg-gray-50 border-gray-200"
          />
        </div>

        {/* Condition */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">État du produit</Label>
          <Select
            value={filters.condition || 'all'}
            onValueChange={handleConditionChange}
          >
            <SelectTrigger className="w-full bg-gray-50 border-gray-200">
              <SelectValue placeholder="Peu importe" />
            </SelectTrigger>
            <SelectContent>
              {conditions.map(condition => (
                <SelectItem key={condition.value} value={condition.value}>
                  {condition.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="h-px bg-gray-100" />

        {/* Price Range */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Budget</Label>
          </div>
          <div className="pt-2 px-1">
            <Slider
              value={filters.priceRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value }))}
              max={10000000}
              step={10000}
              className="w-full mb-4"
            />
            <div className="flex items-center justify-between gap-2">
              <div className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs font-medium text-gray-700 whitespace-nowrap">
                {(filters.priceRange[0] || 0).toLocaleString()} F
              </div>
              <span className="text-gray-400">-</span>
              <div className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs font-medium text-gray-700 whitespace-nowrap">
                {(filters.priceRange[1] || 10000000).toLocaleString()} F
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingsFilters;