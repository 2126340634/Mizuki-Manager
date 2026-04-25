const imageFormats = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif', '.bmp', '.tiff', '.tif']
export const imageAccept = imageFormats.map((str) => `image/${str.substring(1)}`).join(', ')
