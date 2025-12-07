import sqlite3
import os
import sys
import json
import time
import argparse

def extract_thumbnail(clip_file_path, output_dir):
    try:
        if not os.path.exists(clip_file_path):
            return {"status": "error", "message": "Input file not found"}

        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        # Generate output filename based on input filename and timestamp
        base_name = os.path.splitext(os.path.basename(clip_file_path))[0]
        timestamp = int(time.time())
        output_filename = f"{base_name}_{timestamp}.png"
        output_path = os.path.join(output_dir, output_filename)

        with open(clip_file_path, 'rb') as f:
            file_data = f.read()

        sqlite_header = b'SQLite format 3'
        offset = file_data.find(sqlite_header)

        if offset == -1:
            return {"status": "error", "message": "SQLite header not found"}

        # Use in-memory database or temp file. Temp file is safer for sqlite3 lib.
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix='.db') as temp_db:
            temp_db.write(file_data[offset:])
            temp_db_path = temp_db.name

        image_data = None
        try:
            conn = sqlite3.connect(temp_db_path)
            cursor = conn.cursor()

            target_tables = ["CanvasPreview", "Thumbnail", "PreviewImage"]
            
            for table in target_tables:
                try:
                    cursor.execute(f"SELECT * FROM {table} LIMIT 1")
                    row = cursor.fetchone()
                    if row:
                        for item in row:
                            if isinstance(item, bytes) and len(item) > 100:
                                image_data = item
                                break
                    if image_data:
                        break
                except sqlite3.OperationalError:
                    continue
            
            conn.close()
        except Exception as e:
             return {"status": "error", "message": str(e)}
        finally:
            if os.path.exists(temp_db_path):
                try:
                    os.remove(temp_db_path)
                except:
                    pass

        if image_data:
            try:
                from PIL import Image
                import io
                
                image = Image.open(io.BytesIO(image_data))
                # Resize to max 400x400 --> REMOVED to keep original embedded size
                # image.thumbnail((400, 400)) 
                image.save(output_path, "PNG")
            except ImportError:
                # Fallback if Pillow is not installed
                with open(output_path, 'wb') as f:
                    f.write(image_data)
            except Exception as e:
                 # Fallback on resize error
                print(f"Resize failed: {e}", file=sys.stderr)
                with open(output_path, 'wb') as f:
                    f.write(image_data)
                    
            return {
                "status": "success",
                "original_file": clip_file_path,
                "thumbnail_path": output_path,
                "timestamp": timestamp
            }
        else:
            return {"status": "error", "message": "No thumbnail data found in DB"}

    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Extract thumbnail from .clip file')
    parser.add_argument('input', help='Input .clip file path')
    parser.add_argument('output_dir', help='Output directory for thumbnail')
    
    args = parser.parse_args()
    
    result = extract_thumbnail(args.input, args.output_dir)
    print(json.dumps(result))
