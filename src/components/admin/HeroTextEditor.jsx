import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, Trash2, Plus, Palette } from 'lucide-react';
import AdvancedColorPicker from './ColorPicker';

const HeroTextEditor = ({ textContent, onTextContentChange, textAlign, onTextAlignChange }) => {
  const handleAddLine = () => {
    onTextContentChange([
      ...textContent,
      {
        spans: [{ text: 'Nouveau texte', color: '#FFFFFF', size: '1.25rem', weight: 'normal', style: 'normal' }]
      }
    ]);
  };

  const handleRemoveLine = (lineIndex) => {
    const newContent = textContent.filter((_, i) => i !== lineIndex);
    onTextContentChange(newContent);
  };

  const handleLineChange = (lineIndex, newSpans) => {
    const newContent = [...textContent];
    newContent[lineIndex] = { ...newContent[lineIndex], spans: newSpans };
    onTextContentChange(newContent);
  };
  
  const handleSpanChange = (lineIndex, spanIndex, field, value) => {
    const newSpans = [...textContent[lineIndex].spans];
    newSpans[spanIndex] = { ...newSpans[spanIndex], [field]: value };
    handleLineChange(lineIndex, newSpans);
  };

  const handleStyleToggle = (lineIndex, spanIndex, newStyles) => {
    const newSpans = [...textContent[lineIndex].spans];
    const span = newSpans[spanIndex];

    const isBold = newStyles.includes('bold');
    const isItalic = newStyles.includes('italic');

    newSpans[spanIndex] = {
      ...span,
      weight: isBold ? 'bold' : 'normal',
      style: isItalic ? 'italic' : 'normal'
    };

    handleLineChange(lineIndex, newSpans);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="font-semibold">Éditeur de Texte Avancé</Label>
        <div className="flex items-center gap-2">
            <Label>Alignement</Label>
            <ToggleGroup type="single" value={textAlign} onValueChange={onTextAlignChange} variant="outline">
                <ToggleGroupItem value="left" aria-label="Align left"><AlignLeft className="h-4 w-4" /></ToggleGroupItem>
                <ToggleGroupItem value="center" aria-label="Align center"><AlignCenter className="h-4 w-4" /></ToggleGroupItem>
                <ToggleGroupItem value="right" aria-label="Align right"><AlignRight className="h-4 w-4" /></ToggleGroupItem>
            </ToggleGroup>
        </div>
      </div>

      {textContent.map((line, lineIndex) => (
        <div key={lineIndex} className="space-y-2 border p-3 rounded-md bg-gray-50/50">
           <div className="flex justify-between items-center">
             <Label className="text-sm font-medium">Ligne {lineIndex + 1}</Label>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveLine(lineIndex)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
          {line.spans.map((span, spanIndex) => (
            <div key={spanIndex} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-12 sm:col-span-6">
                <Label htmlFor={`text-${lineIndex}-${spanIndex}`} className="text-xs">Texte</Label>
                <Input
                  id={`text-${lineIndex}-${spanIndex}`}
                  value={span.text}
                  onChange={(e) => handleSpanChange(lineIndex, spanIndex, 'text', e.target.value)}
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                 <Label htmlFor={`size-${lineIndex}-${spanIndex}`} className="text-xs">Taille</Label>
                <Select
                  value={span.size}
                  onValueChange={(value) => handleSpanChange(lineIndex, spanIndex, 'size', value)}
                >
                  <SelectTrigger><SelectValue placeholder="Taille" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1rem">Normal (16px)</SelectItem>
                    <SelectItem value="1.125rem">LG (18px)</SelectItem>
                    <SelectItem value="1.25rem">XL (20px)</SelectItem>
                    <SelectItem value="1.5rem">2XL (24px)</SelectItem>
                    <SelectItem value="1.875rem">3XL (30px)</SelectItem>
                    <SelectItem value="2.25rem">4XL (36px)</SelectItem>
                    <SelectItem value="3rem">5XL (48px)</SelectItem>
                    <SelectItem value="3.75rem">6XL (60px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-8 sm:col-span-4 flex items-center gap-1 pt-4">
                 <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0" style={{ backgroundColor: span.color }}>
                      <Palette className="h-4 w-4" style={{ color: 'white', mixBlendMode: 'difference' }}/>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <AdvancedColorPicker
                      color={span.color}
                      onChange={(color) => handleSpanChange(lineIndex, spanIndex, 'color', color)}
                    />
                  </PopoverContent>
                </Popover>
                <Input
                    value={span.color}
                    onChange={(e) => handleSpanChange(lineIndex, spanIndex, 'color', e.target.value)}
                    className="h-10"
                />
                <ToggleGroup 
                  type="multiple"
                  variant="outline"
                  value={
                    [
                      span.weight === 'bold' ? 'bold' : undefined,
                      span.style === 'italic' ? 'italic' : undefined
                    ].filter(Boolean)
                  }
                  onValueChange={(value) => handleStyleToggle(lineIndex, spanIndex, value)}
                  className="h-10"
                >
                    <ToggleGroupItem value="bold" aria-label="Bold"><Bold className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="italic" aria-label="Italic"><Italic className="h-4 w-4" /></ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          ))}
        </div>
      ))}
      <Button type="button" variant="outline" onClick={handleAddLine} className="w-full">
        <Plus className="mr-2 h-4 w-4" /> Ajouter une ligne
      </Button>
    </div>
  );
};

export default HeroTextEditor;