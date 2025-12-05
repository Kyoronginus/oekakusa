import sqlite3
import os

def extract_thumbnail_from_clip_robust(clip_file_path, output_png_path):
    temp_db_path = "temp_extracted.db"
    
    try:
        # 1. バイナリモードでファイルを読み込む
        with open(clip_file_path, 'rb') as f:
            file_data = f.read()

        # 2. "SQLite format 3" というヘッダー（署名）の開始位置を探す
        sqlite_header = b'SQLite format 3'
        offset = file_data.find(sqlite_header)

        if offset == -1:
            print("エラー: ファイル内にSQLiteデータベースが見つかりませんでした。")
            print("可能性: 古い形式(.lip)か、完全に暗号化された新しい形式の可能性があります。")
            return

        print(f"SQLiteデータ開始位置を検出: {offset} バイト目")

        # 3. SQLite部分だけを切り出して一時ファイルに保存
        # (メモリ上のBytesIOを使う方法もありますが、sqlite3標準ライブラリとの相性のためファイル保存が確実です)
        with open(temp_db_path, 'wb') as temp_db:
            temp_db.write(file_data[offset:])

        # 4. 切り出したDBに接続
        conn = sqlite3.connect(temp_db_path)
        cursor = conn.cursor()

        # テーブル一覧を確認（デバッグ用）
        # cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        # print("テーブル一覧:", cursor.fetchall())

        # 5. プレビュー画像を探す
        # バージョンによってテーブル名が違う可能性があるため、いくつか試行します
        target_tables = ["CanvasPreview", "Thumbnail", "PreviewImage"]
        image_data = None

        for table in target_tables:
            try:
                # ImageData カラムなどを取得しようとしてみる
                cursor.execute(f"SELECT * FROM {table} LIMIT 1")
                row = cursor.fetchone()
                if row:
                    # 行の中のバイナリっぽいデータを探す（列名が特定できない場合の強引な策）
                    for item in row:
                        if isinstance(item, bytes) and len(item) > 100:
                            image_data = item
                            print(f"テーブル '{table}' から画像データを発見しました。")
                            break
                if image_data:
                    break
            except sqlite3.OperationalError:
                continue # テーブルがない場合は次へ

        conn.close()

        # 6. 画像書き出し
        if image_data:
            with open(output_png_path, 'wb') as f:
                f.write(image_data)
            print(f"成功: {output_png_path} に書き出しました。")
        else:
            print("エラー: DB構造は読み込めましたが、プレビュー画像データが見つかりませんでした。")

    except Exception as e:
        print(f"予期せぬエラー: {e}")
    
    finally:
        # 一時ファイルの削除
        if os.path.exists(temp_db_path):
            try:
                os.remove(temp_db_path)
            except:
                pass

# 実行
# ファイル名はご自身のものに変更してください
extract_thumbnail_from_clip_robust("Illustration2bu.clip", "output.png")