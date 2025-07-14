// Handle gallery display
function displayGallery(req, res) {
  res.render("modules/gallery", {
    isStandalone: true,
    images: [
      {
        thumbnail: "/images/gallery/studio/studio-slike-1-thumb.jpg",
        fullsize: "/images/gallery/studio/studio-slike-1.jpg",
        alt: "Image 1",
      },
      {
        thumbnail: "/images/gallery/studio/studio-slike-2-thumb.jpg",
        fullsize: "/images/gallery/studio/studio-slike-2.jpg",
        alt: "Image 2",
      },
      {
        thumbnail: "/images/gallery/studio/studio-slike-3-thumb.jpg",
        fullsize: "/images/gallery/studio/studio-slike-3.jpg",
        alt: "Image 3",
      },
      {
        thumbnail: "/images/gallery/studio/studio-slike-4-thumb.jpg",
        fullsize: "/images/gallery/studio/studio-slike-4.jpg",
        alt: "Image 4",
      },
      {
        thumbnail: "/images/gallery/studio/studio-slike-5-thumb.jpg",
        fullsize: "/images/gallery/studio/studio-slike-5.jpg",
        alt: "Image 5",
      },
      {
        thumbnail: "/images/gallery/studio/studio-slike-6-thumb.jpg",
        fullsize: "/images/gallery/studio/studio-slike-6.jpg",
        alt: "Image 6",
      },
      {
        thumbnail: "/images/gallery/studio/studio-slike-7-thumb.jpg",
        fullsize: "/images/gallery/studio/studio-slike-7.jpg",
        alt: "Image 7",
      },
      {
        thumbnail: "/images/gallery/studio/studio-slike-8-thumb.jpg",
        fullsize: "/images/gallery/studio/studio-slike-8.jpg",
        alt: "Image 8",
      },
      {
        thumbnail: "/images/gallery/studio/studio-slike-9-thumb.jpg",
        fullsize: "/images/gallery/studio/studio-slike-9.jpg",
        alt: "Image 9",
      },
    ],
  });
}

module.exports = {
  displayGallery
};
