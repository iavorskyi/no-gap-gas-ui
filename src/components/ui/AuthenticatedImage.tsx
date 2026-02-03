import React, { useState, useEffect } from 'react';
import { Loader2, ImageOff } from 'lucide-react';
import api from '../../lib/api';

interface AuthenticatedImageProps {
  src: string;
  alt?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  onClick?: (e: React.MouseEvent) => void;
}

export const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({
  src,
  alt = '',
  className = '',
  onLoad,
  onError,
  onClick,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    const fetchImage = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await api.get(src, {
          responseType: 'blob',
        });

        if (!isMounted) return;

        objectUrl = URL.createObjectURL(response.data);
        setBlobUrl(objectUrl);
        setIsLoading(false);
        onLoad?.();
      } catch {
        if (!isMounted) return;

        setHasError(true);
        setIsLoading(false);
        onError?.();
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src, onLoad, onError]);

  // Clean up blob URL when component unmounts or src changes
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <ImageOff className="w-6 h-6 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={blobUrl || ''}
      alt={alt}
      className={className}
      onClick={onClick}
    />
  );
};
