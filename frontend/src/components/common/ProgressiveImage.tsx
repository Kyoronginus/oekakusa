import React, { useState, useEffect } from "react";

interface ProgressiveImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  lowResSrc?: string;
  highResSrc: string;
}

const ProgressiveImage = ({
  lowResSrc,
  highResSrc,
  className,
  alt,
  ...props
}: ProgressiveImageProps) => {
  const [src, setSrc] = useState(lowResSrc || highResSrc);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // If no low-res, just start with high-res but still can track loading
    if (!lowResSrc) {
      setSrc(highResSrc);
    }

    const img = new Image();
    img.src = highResSrc;
    img.onload = () => {
      setSrc(highResSrc);
      setIsLoaded(true);
    };
  }, [lowResSrc, highResSrc]);

  return (
    <img
      {...props}
      src={src}
      alt={alt}
      className={`${className} transition-all duration-500 ${
        isLoaded ? "blur-0" : lowResSrc ? "blur-sm" : ""
      }`}
    />
  );
};

export default ProgressiveImage;
