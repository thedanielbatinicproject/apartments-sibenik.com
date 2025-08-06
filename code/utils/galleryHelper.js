const fs = require('fs');
const path = require('path');

// Helper function to dynamically load gallery images from directory
function generateApartmentGalleryImages(apartmentType) {
  try {
    const galleryPath = path.join(__dirname, '../../public/galleries/apartments', apartmentType);
    
    // Check if directory exists
    if (!fs.existsSync(galleryPath)) {
      console.warn(`Gallery directory not found: ${galleryPath}`);
      return [];
    }
    
    // Read all files from directory
    const files = fs.readdirSync(galleryPath);
    
    // Filter for image files and sort them numerically
    const imageFiles = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .sort((a, b) => {
        // Extract numbers from filenames for proper numerical sorting
        const aMatch = a.match(/(\d+)/);
        const bMatch = b.match(/(\d+)/);
        
        if (aMatch && bMatch) {
          return parseInt(aMatch[1]) - parseInt(bMatch[1]);
        }
        
        // Fallback to alphabetical sorting if no numbers found
        return a.localeCompare(b);
      });
    
    // Generate image objects
    const images = imageFiles.map((file, index) => {
      const filePath = `/galleries/apartments/${apartmentType}/${file}`;
      
      // Generate more descriptive alt text based on apartment type
      let altText;
      switch(apartmentType) {
        case 'apartman-vrt':
          altText = `Apartman s vrtom - Slika ${index + 1}`;
          break;
        case 'studio-apartman':
          altText = `Studio apartman - Slika ${index + 1}`;
          break;
        case 'soba':
          altText = `Soba - Slika ${index + 1}`;
          break;
        default:
          altText = `${apartmentType} - Slika ${index + 1}`;
      }
      
      return {
        fullsize: filePath,
        thumbnail: filePath, // Using same image for thumbnail for now
        alt: altText
      };
    });
    
    return images;
  } catch (error) {
    console.error(`Error loading gallery images for ${apartmentType}:`, error);
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

module.exports = { generateGalleryImages, generateApartmentGalleryImages };
