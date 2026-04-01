import React, { useState, useRef } from 'react';
import { UploadCloud, File, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FileUpload = ({ onFileSelect, onFileRemove, label, acceptedFileTypes, required, loading, disabled, previouslyUploadedUrl }) => {
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      onFileSelect(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    onFileRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasPreviouslyUploaded = previouslyUploadedUrl && typeof previouslyUploadedUrl === 'string' && previouslyUploadedUrl.length > 0;

  if (hasPreviouslyUploaded && !file) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
          <div className="flex items-center gap-2">
            <File className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">Document déjà fourni</span>
          </div>
          {!disabled && (
            <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-8 w-8">
              <span className="text-sm underline cursor-pointer text-gray-600">Changer</span>
            </Button>
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={acceptedFileTypes}
          className="hidden"
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium mb-1">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div
        className={`w-full p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
          file ? 'border-custom-green-300 bg-green-50' : 'border-gray-300 hover:border-custom-green-400'
        }`}
        onClick={() => !disabled && !loading && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={acceptedFileTypes}
          className="hidden"
          disabled={disabled || loading}
        />
        {loading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 className="w-8 h-8 animate-spin text-custom-green-500" />
            <span className="mt-2 text-sm font-medium text-gray-600">Téléversement...</span>
          </div>
        ) : file ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <File className="w-5 h-5 text-custom-green-600" />
              <span className="text-sm font-medium text-gray-700 truncate">{file.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-custom-green-600">Cliquez pour choisir un fichier</span>
            <span className="text-xs text-gray-500 mt-1">PNG, JPG, PDF (max 5MB)</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;