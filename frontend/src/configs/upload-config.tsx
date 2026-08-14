const imageFormats = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif', '.bmp', '.tiff', '.tif']
const audioFormats = ['.mpeg'] // mp3

export const imageAccept = imageFormats.map((str) => `image/${str.substring(1)}`).join(', ')
export const audioAccept = audioFormats.map((str) => `audio/${str.substring(1)}`).join(', ')
