import { useState, useEffect, useCallback, useRef } from "react";
import { useInView } from "react-intersection-observer";
import "./GalleryPage.css";

interface GalleryPageProps {
  folder: string;
  onBack: () => void;
  getImageCache?: (folderName: string) => { images: string[], lastAccessed: number } | null;
  updateImageCache?: (folderName: string, images: string[]) => void;
}

// Mobile touch detection
const isTouchDevice = () => {
  return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
};

// Optimized lazy loaded image component
const LazyImage = ({ src, alt, onClick }: { src: string; alt: string; onClick: () => void }) => {
  const [loaded, setLoaded] = useState(false);
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '100px 0px',
    initialInView: false,
  });
  
  const handleLoad = () => {
    setLoaded(true);
  };

  return (
    <div 
      ref={ref} 
      className="gallery-item" 
      onClick={onClick}
    >
      {inView ? (
        <img 
          src={src} 
          alt={alt} 
          loading="lazy" 
          style={{ opacity: loaded ? 1 : 0 }}
          onLoad={handleLoad}
        />
      ) : (
        <div className="image-placeholder"></div>
      )}
      {inView && !loaded && <div className="image-placeholder"></div>}
    </div>
  );
};

function GalleryPage({ folder, onBack, getImageCache, updateImageCache }: GalleryPageProps) {
  const [images, setImages] = useState<string[]>([]);
  const [displayedImages, setDisplayedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const isMounted = useRef(true);
  
  const imagesPerPage = 12; 

  // Mobile-specific states
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  
  // Check if we're on a mobile device
  useEffect(() => {
    setIsMobileDevice(isTouchDevice());
    
    // Fix for mobile browsers' viewport height issues
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // iOS Safari specific workaround for 100vh issue
    if (isTouchDevice()) {
      window.addEventListener('orientationchange', () => {
        setTimeout(handleResize, 50);
      });
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (isTouchDevice()) {
        window.removeEventListener('orientationchange', () => {
          setTimeout(handleResize, 50);
        });
      }
    };
  }, []);

  // Touch swipe handlers for mobile navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const xDiff = touchStartX - touchEndX;
    const yDiff = touchStartY - touchEndY;
    
    // Only register as horizontal swipe if horizontal movement > vertical movement
    if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 50) {
      if (xDiff > 0 && page < totalPages) {
        // Swipe left, go to next page
        handleNextPage();
      } else if (xDiff < 0 && page > 1) {
        // Swipe right, go to previous page
        handlePrevPage();
      }
    }
  };

  // Improved image zooming for mobile
  const handleImageViewerTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault(); // Prevent default zoom behavior
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setWindowSize({ width, height: height - 40 });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    isMounted.current = true;
    
    // When returning to this component, scroll to the top
    window.scrollTo(0, 0);
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const loadImages = async () => {
      const cachedData = getImageCache?.(folder);
      
      if (cachedData && cachedData.images.length > 0) {
        if (isMounted.current) {
          setImages(cachedData.images);
          setLoading(false);
          setImageLoading(false);
        }
        return;
      }

      try {
        if (isMounted.current) {
          setLoading(true);
          setImageLoading(true);
        }
        
        const imageModules = await import.meta.glob('/src/images/**/*.{jpg,jpeg,png,gif,JPG,JPEG,PNG,GIF}', { eager: true });
        
        setTimeout(() => {
          if (!isMounted.current) return;
          
          const folderImages = Object.entries(imageModules)
            .filter(([path]) => path.includes(`/src/images/${folder}/`))
            .map(([, module]) => (module as any).default);
          
          updateImageCache?.(folder, folderImages);
          
          setImages(folderImages);
          setLoading(false);
          
          setTimeout(() => {
            if (isMounted.current) {
              setImageLoading(false);
            }
          }, 800);
        }, 0);
      } catch (error) {
        console.error("Failed to load images:", error);
        if (isMounted.current) {
          setLoading(false);
          setImageLoading(false);
        }
      }
    };

    loadImages();
    setPage(1);
  }, [folder, getImageCache, updateImageCache]);

  useEffect(() => {
    const start = (page - 1) * imagesPerPage;
    const end = start + imagesPerPage;
    setDisplayedImages(images.slice(start, end));
  }, [images, page, imagesPerPage]);

  const handleImageClick = useCallback((imageSrc: string) => {
    setSelectedImage(imageSrc);
  }, []);

  const handleCloseViewer = () => {
    setSelectedImage(null);
  };

  const handleDownload = (imageSrc: string) => {
    const link = document.createElement('a');
    link.href = imageSrc;
    const filename = imageSrc.split('/').pop() || 'download.jpg';
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNextPage = () => {
    if (page * imagesPerPage < images.length) {
      setPage(page + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
      window.scrollTo(0, 0);
    }
  };

  const totalPages = Math.ceil(images.length / imagesPerPage);

  return (
    <div 
      className="windows-container" 
      style={{ minHeight: viewportHeight + 'px' }}
    >
      <div className={`windows-window gallery-window ${imageLoading ? 'loading-cursor' : ''}`}>
        <div className="title-bar">
          <div className="title-bar-text">{folder} - Image Gallery</div>
          <div className="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
          </div>
        </div>
        <div className="window-toolbar">
          <button className="windows-button" onClick={onBack}>Back to Folders</button>
        </div>
        <div 
          className={`window-body ${imageLoading ? 'loading-cursor' : ''}`} 
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {loading ? (
            <div className="loading-indicator">Loading images...</div>
          ) : images.length === 0 ? (
            <div className="empty-gallery">No images found in this folder.</div>
          ) : windowSize.width > 0 ? (
            <>
              <div className={`gallery-grid-container ${imageLoading ? 'loading-cursor' : ''}`}>
                {displayedImages.map((image, index) => (
                  <LazyImage
                    key={index}
                    src={image}
                    alt={`Image ${(page - 1) * imagesPerPage + index + 1}`}
                    onClick={() => handleImageClick(image)}
                  />
                ))}
              </div>
              
              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="pagination-controls">
                  <button 
                    className="windows-button" 
                    onClick={handlePrevPage}
                    disabled={page === 1 || imageLoading}
                  >
                    Previous
                  </button>
                  <span className="page-indicator">
                    Page {page} of {totalPages}
                  </span>
                  <button 
                    className="windows-button" 
                    onClick={handleNextPage}
                    disabled={page === totalPages || imageLoading}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : null}
        </div>
        <div className="status-bar">
          <div className="status-bar-text">
            {images.length} image(s) - Showing {Math.min(page * imagesPerPage, images.length)} of {images.length}
            {imageLoading && " - Loading images..."}
            {isMobileDevice && " - Swipe to navigate"}
          </div>
        </div>
      </div>

      {selectedImage && (
        <div className="modal-overlay" onClick={handleCloseViewer}>
          <div 
            className="windows-window image-viewer" 
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleImageViewerTouchStart}
          >
            <div className="title-bar">
              <div className="title-bar-text">Image Viewer</div>
              <div className="title-bar-controls">
                <button aria-label="Close" onClick={handleCloseViewer}></button>
              </div>
            </div>
            <div className="window-body viewer-body">
              <img 
                src={selectedImage} 
                alt="Selected" 
                className="selected-image" 
                onClick={isMobileDevice ? undefined : handleCloseViewer} 
              />
              <div className="viewer-controls">
                <button 
                  className="windows-button download-button" 
                  onClick={() => handleDownload(selectedImage)}
                >
                  Download
                </button>
                {isMobileDevice && (
                  <button 
                    className="windows-button close-button" 
                    onClick={handleCloseViewer}
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GalleryPage;