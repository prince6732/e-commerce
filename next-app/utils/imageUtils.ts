const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zelton.co.in';

export const getImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;

  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  if (imagePath.startsWith('/storage/')) {
    return `${API_URL}${imagePath}`;
  }

  if (imagePath.startsWith('storage/')) {
    return `${API_URL}/${imagePath}`;
  }

  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${API_URL}/storage/${cleanPath}`;
};

export const getPublicImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;

  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;

  return `${API_URL}/${cleanPath}`;
};

export default {
  getImageUrl,
  getPublicImageUrl
};