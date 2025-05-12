// src/lib/imageUtils.ts
export const resizeImageAndGetDataUrl = (file: File, targetMaxDimension: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const aspectRatio = width / height;

        if (width > height) {
          if (width > targetMaxDimension) {
            width = targetMaxDimension;
            height = Math.round(width / aspectRatio);
          }
        } else {
          if (height > targetMaxDimension) {
            height = targetMaxDimension;
            width = Math.round(height * aspectRatio);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Failed to get canvas context'));
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Get data URL from canvas. file.type will give the original MIME type.
        // Use a quality setting for JPEGs, e.g., 0.9. For other types like PNG, it's ignored.
        const dataUrl = canvas.toDataURL(file.type, file.type.startsWith('image/jpeg') ? 0.9 : undefined);
        resolve(dataUrl);
      };
      img.onerror = (errorEvent) => {
        // errorEvent is an Event, not an Error object directly.
        // For more specific error, one might need to inspect errorEvent properties or types.
        console.error("Image loading error in resizeImageAndGetDataUrl:", errorEvent);
        reject(new Error('Image loading failed during resizing process.'));
      };
      
      if (event.target?.result && typeof event.target.result === 'string') {
        img.src = event.target.result;
      } else {
        reject(new Error('Failed to read file as a data URL for image source.'));
      }
    };
    reader.onerror = (error) => {
      // FileReader.error is a DOMException
      console.error("FileReader error in resizeImageAndGetDataUrl:", reader.error);
      reject(reader.error || new Error('Error reading file before resizing.'));
    };
    // Read the original file to load it into an Image object first.
    // This data URL is for the img.src, not the final output.
    reader.readAsDataURL(file); 
  });
};
