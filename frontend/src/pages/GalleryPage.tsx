import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { useConfig } from "../context/ConfigContext";
import { fetchImages, getImageUrl } from "../services/api";
import "./GalleryPage.css";

interface GalleryPageProps {
  folder: string;
  onBack: () => void;
}

const isTouchDevice = () => {
  return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
};

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

function GalleryPage({ folder, onBack }: GalleryPageProps) {
  const { serverUrl, password } = useConfig();
  const [images, setImages] = useState<string[]>([]);
  const [displayedImages, setDisplayedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalImages, setTotalImages] = useState(0);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const isMounted = useRef(true);
  const imagesPerPage = 20;  

  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  
  useEffect(() => {
    setIsMobileDevice(isTouchDevice());
    
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
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

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const xDiff = touchStartX - touchEndX;
    const yDiff = touchStartY - touchEndY;
    
    if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 50) {
      if (xDiff > 0 && page < totalPages) {
        handleNextPage();
      } else if (xDiff < 0 && page > 1) {
        handlePrevPage();
      }
    }
  };

  const handleImageViewerTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault(); 
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
    
    window.scrollTo(0, 0);
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const loadImages = async () => {
      if (!serverUrl || !password || !folder) {
        return;
      }

      try {
        if (isMounted.current) {
          setLoading(true);
          setError(null);
        }
        
        const response = await fetchImages(
          { serverUrl, password },
          folder,
          page,
          imagesPerPage
        );
        
        const imageUrls = response.images.map(imageName => 
          getImageUrl({ serverUrl, password }, folder, imageName)
        );
        
        if (isMounted.current) {
          setImages(imageUrls);
          setDisplayedImages(imageUrls);
          setTotalPages(response.pagination.totalPages);
          setTotalImages(response.pagination.totalImages);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load images:", err);
        if (isMounted.current) {
          setError("Failed to load images. Please check your connection.");
          setLoading(false);
        }
      }
    };

    loadImages();
  }, [folder, page, serverUrl, password]);

  const handleImageClick = useCallback((imageSrc: string) => {
    setSelectedImage(imageSrc);
  }, []);

  const handleCloseViewer = () => {
    setSelectedImage(null);
  };

  const handleDownload = async (imageSrc: string) => {
    const imageName = imageSrc.split('/').pop()?.split('?')[0] || 'image.jpg';
    
    try {
      setLoading(true);
      
      const response = await fetch(imageSrc, {
        credentials: 'include',
        headers: {
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = imageName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (err) {
      console.error('Download error:', err);
      setError(`Failed to download image. ${err instanceof Error ? err.message : 'Unknown error'}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
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

  return (
    <div 
      className="windows-container" 
      style={{ minHeight: viewportHeight + 'px' }}
    >
      <div className={`windows-window gallery-window ${loading ? 'loading-cursor' : ''}`}>
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
          className={`window-body ${loading ? 'loading-cursor' : ''}`} 
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {loading ? (
            <div className="loading-indicator">Loading images...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : images.length === 0 ? (
            <div className="empty-gallery">No images found in this folder.</div>
          ) : windowSize.width > 0 ? (
            <>
              <div className={`gallery-grid-container ${loading ? 'loading-cursor' : ''}`}>
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
                    disabled={page === 1 || loading}
                  >
                    Previous
                  </button>
                  <span className="page-indicator">
                    Page {page} of {totalPages}
                  </span>
                  <button 
                    className="windows-button" 
                    onClick={handleNextPage}
                    disabled={page === totalPages || loading}
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
            {loading ? "Loading images..." : 
             error ? "Error loading images" : 
             `${totalImages} image(s) - Showing ${Math.min(page * imagesPerPage, totalImages)} of ${totalImages}`}
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