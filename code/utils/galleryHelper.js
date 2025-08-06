const fs = require('fs');
const path = require('path');

// Safe function to generate apartment gallery images with existence check
function generateApartmentVrtGallery() {
  try {
    const galleryPath = path.join(__dirname, '../../public/galleries/apartments/apartman-vrt');
    
    if (!fs.existsSync(galleryPath)) {
      console.warn(`Gallery directory not found: ${galleryPath}`);
      return [];
    }
    
    const files = fs.readdirSync(galleryPath);
    const imageFiles = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .sort((a, b) => {
        const aMatch = a.match(/(\d+)/);
        const bMatch = b.match(/(\d+)/);
        
        if (aMatch && bMatch) {
          return parseInt(aMatch[1]) - parseInt(bMatch[1]);
        }
        
        return a.localeCompare(b);
      });
    
    const images = imageFiles.map((file, index) => {
      const filePath = `/galleries/apartments/apartman-vrt/${file}`;
      return {
        fullsize: filePath,
        thumbnail: filePath,
        alt: `Apartman s vrtom - Slika ${index + 1}`
      };
    });
    
    console.log(`Generated ${images.length} images for apartman-vrt gallery`);
    return images;
  } catch (error) {
    console.error('Error loading apartman-vrt gallery:', error);
    return [];
  }
}

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

module.exports = { generateGalleryImages, generateApartmentVrtGallery };
