import { ProcessedImage } from '../types';

export const processImageFile = (file: File): Promise<ProcessedImage> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      
      img.onload = () => {
        resolve({
          id: crypto.randomUUID(),
          file,
          dataUrl,
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight,
        });
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${file.name}`));
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`));
    };

    reader.readAsDataURL(file);
  });
};