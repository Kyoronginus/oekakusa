import sys
import json
import argparse
from PIL import Image
import os
import time

def create_gif(image_paths, output_path, duration=500):
    try:
        images = []
        for path in image_paths:
            if os.path.exists(path):
                try:
                    img = Image.open(path)
                    # Resize to reasonable size if needed, e.g., max 800px width
                    # img.thumbnail((800, 800)) 
                    images.append(img)
                except Exception as e:
                    print(f"Warning: Could not open {path}: {e}")

        if not images:
            return {"status": "error", "message": "No valid images found"}

        # Save as GIF
        images[0].save(
            output_path,
            save_all=True,
            append_images=images[1:],
            duration=duration,
            loop=0
        )

        return {"status": "success", "output_path": output_path}

    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Create GIF from images')
    parser.add_argument('output_path', help='Output GIF path')
    # We will pass image paths as a JSON string argument because there might be many
    parser.add_argument('image_paths_json', help='JSON string of image paths array')
    
    args = parser.parse_args()
    
    try:
        image_paths = json.loads(args.image_paths_json)
        result = create_gif(image_paths, args.output_path)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))
