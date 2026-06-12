/**
 * CropEditor.tsx
 *
 * Full-screen perspective crop and rotation editor powered by Cropper.js.
 * Opened when the teacher taps a page thumbnail and chooses "Edit".
 */
import React, { useEffect, useRef, useState } from 'react';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { IonButton } from '@ionic/react';

interface Props {
  imageUri:  string;
  onSave:    (croppedBase64: string) => void;
  onCancel:  () => void;
}

const CropEditor: React.FC<Props> = ({ imageUri, onSave, onCancel }) => {
  const imgRef   = useRef<HTMLImageElement>(null);
  const cropRef  = useRef<Cropper | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!imgRef.current) return;
    cropRef.current = new Cropper(imgRef.current, {
      viewMode: 2,
      dragMode: 'move',
      autoCropArea: 0.9,
      restore: false,
      ready: () => setReady(true),
    });
    return () => { cropRef.current?.destroy(); cropRef.current = null; };
  }, [imageUri]);

  const handleSave = () => {
    if (!cropRef.current) return;
    const canvas = cropRef.current.getCroppedCanvas({ width: 1600, imageSmoothingQuality: 'high' });
    const b64    = canvas.toDataURL('image/jpeg', 0.88).split(',')[1];
    onSave(b64);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 600,
      display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <img ref={imgRef} src={imageUri} alt="crop target"
          style={{ maxWidth: '100%', maxHeight: '100%' }} />
      </div>
      <div style={{ padding: '16px 20px', display: 'flex', gap: 12,
        background: 'rgba(15,27,53,0.95)', borderTop: '1px solid rgba(0,191,166,0.15)' }}>
        <IonButton fill="outline" color="medium" expand="block" onClick={onCancel} style={{ flex: 1 }}>
          Cancel
        </IonButton>
        <IonButton expand="block" disabled={!ready} onClick={handleSave} style={{ flex: 1 }}>
          Apply Crop
        </IonButton>
      </div>
    </div>
  );
};

export default CropEditor;
