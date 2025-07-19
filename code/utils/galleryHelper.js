// Helper function to generate gallery images array
function generateGalleryImages(type) {
  let prefix, fullsizePrefix, thumbPrefix, count;
  
  switch(type) {
    case 'apartment':
      fullsizePrefix = '/images/gallery/apartment/veliki-slike-';
      thumbPrefix = '/images/gallery/apartment/veliki-slike-thumb-';
      count = 26; // Based on the files we saw
      break;
    case 'studio':
      fullsizePrefix = '/images/gallery/studio/studio-slike-';
      thumbPrefix = '/images/gallery/studio/studio-slike-';
      count = 9; // Based on the files we saw
      break;
    case 'room':
      fullsizePrefix = '/images/gallery/room/soba-slike-';
      thumbPrefix = '/images/gallery/room/soba-slike-thumb-';
      count = 7; // Based on the files we saw
      break;
    case 'sibenik':
      fullsizePrefix = '/images/gallery/sibenik/sibenik-slike-';
      thumbPrefix = '/images/gallery/sibenik/sibenik-slike-thumb-';
      count = 7; // Based on the files we saw
      break;
    default:
      return [];
  }
  
  // Generate the image array
  const images = [];
  for (let i = 1; i <= count; i++) {
    const num = i < 10 ? `0${i}` : `${i}`;
    const fullsizePath = (type === 'studio') 
      ? `${fullsizePrefix}${i}.jpg`
      : `${fullsizePrefix}${num}.jpg`;
    const thumbPath = (type === 'studio')
      ? `${thumbPrefix}${i}-thumb.jpg`
      : `${thumbPrefix}${num}.jpg`;
    
    let altText;
    switch(type) {
      case 'apartment':
        altText = `Apartman s vrtom - Slika ${i}`;
        break;
      case 'studio':
        altText = `Studio apartman - Slika ${i}`;
        break;
      case 'room':
        altText = `Soba - Slika ${i}`;
        break;
      case 'sibenik':
        altText = `Šibenik - Slika ${i}`;
        break;
    }
    
    images.push({
      fullsize: fullsizePath,
      thumbnail: thumbPath,
      alt: altText
    });
  }
  
  return images;
}

module.exports = { generateGalleryImages };
