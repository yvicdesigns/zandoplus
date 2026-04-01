import React, { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Crop, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

function getCroppedImg(image, crop, scale, rotate) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  
  const pixelRatio = window.devicePixelRatio || 1;

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high';

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  const rotateRads = (rotate * Math.PI) / 180;
  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;
  
  ctx.save();
  
  ctx.translate(-cropX, -cropY);
  ctx.translate(centerX, centerY);
  ctx.rotate(rotateRads);
  ctx.scale(scale, scale);
  ctx.translate(-centerX, -centerY);
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight
  );

  ctx.restore();
  
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      blob.name = 'banner.jpeg';
      resolve(blob);
    }, 'image/jpeg', 0.95);
  });
}

const BannerEditorDialog = ({ isOpen, onOpenChange, imageSrc, onSave, onLoadingChange }) => {
  const imgRef = useRef(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);

  const aspect = 16 / 5;

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspect,
        width,
        height,
      ),
      width,
      height,
    );
    setCrop(crop);
    imgRef.current = e.currentTarget;
  }

  async function handleSaveCrop() {
    if (completedCrop?.width && completedCrop?.height && imgRef.current) {
        onLoadingChange(true);
        try {
            const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop, scale, rotate);
            await onSave(croppedImageBlob);
        } catch (e) {
            console.error(e);
        } finally {
            onLoadingChange(false);
            onOpenChange(false);
        }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            onOpenChange(false);
        }
    }}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Ajuster la bannière</DialogTitle>
        </DialogHeader>
        <div className="mt-4 flex flex-col items-center gap-4">
          <div className="w-full h-[400px] bg-muted flex items-center justify-center overflow-hidden">
            {imageSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                className="max-h-[400px]"
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imageSrc}
                  style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            )}
          </div>
          <div className="w-full max-w-md space-y-4 p-4 rounded-lg bg-secondary/50">
             <div className="flex items-center gap-2">
                <ZoomIn className="w-5 h-5" />
                <Slider
                    defaultValue={[1]}
                    value={[scale]}
                    min={0.5}
                    max={3}
                    step={0.01}
                    onValueChange={(value) => setScale(value[0])}
                />
                <ZoomOut className="w-5 h-5" />
            </div>
             <div className="flex items-center gap-2">
                <RotateCw className="w-5 h-5" />
                <Slider
                    defaultValue={[0]}
                    value={[rotate]}
                    min={-180}
                    max={180}
                    step={1}
                    onValueChange={(value) => setRotate(value[0])}
                />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSaveCrop} className="gradient-bg hover:opacity-90">
            <Crop className="w-4 h-4 mr-2" />
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BannerEditorDialog;