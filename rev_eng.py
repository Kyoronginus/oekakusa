import sqlite3
import os
import struct
import tempfile

class ClipFileInspector:
    def __init__(self, file_path):
        self.file_path = file_path
        self.file_size = os.path.getsize(file_path)
        self.sqlite_offset = -1
        self.db_path = None

    def analyze(self):
        print(f"=== 解析開始: {os.path.basename(self.file_path)} ({self.file_size} bytes) ===")
        
        with open(self.file_path, 'rb') as f:
            data = f.read()

        # 1. ヘッダーチェック (CSFCHUNK)
        header = data[:8]
        if header == b'CSFCHUNK':
            print("✔ ヘッダー確認: Valid CELSYS Format (CSFCHUNK)")
        else:
            print(f"⚠ 警告: 未知のヘッダー形式です ({header})")

        # 2. SQLiteブロックの探索
        sqlite_sig = b'SQLite format 3'
        self.sqlite_offset = data.find(sqlite_sig)

        if self.sqlite_offset != -1:
            print(f"✔ SQLite DB検出: オフセット {self.sqlite_offset} (0x{self.sqlite_offset:X}) から開始")
            self._extract_and_analyze_db(data[self.sqlite_offset:])
        else:
            print("❌ エラー: SQLiteデータベースが見つかりませんでした。")

    def _extract_and_analyze_db(self, db_binary):
        # 一時ファイルにDBを書き出す
        with tempfile.NamedTemporaryFile(delete=False, suffix='.db') as tmp:
            tmp.write(db_binary)
            self.db_path = tmp.name

        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            print("\n--- [内部データベース解析結果] ---")

            # A. テーブル一覧の取得
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            print(f"検出されたテーブル数: {len(tables)}")
            
            for i, (table_name,) in enumerate(tables):
                print(f" {i+1}. {table_name}")

            # B. キャンバス情報の特定 (Canvasテーブル)
            # Clip Studioのバージョンによってテーブル構成が違うため、主要な情報を探す
            print("\n--- [キャンバス設定の抽出] ---")
            self._dump_table_info(cursor, "Canvas")
            
            # C. プレビュー画像の有無確認
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='CanvasPreview';")
            if cursor.fetchone():
                print("\n✔ 'CanvasPreview' テーブルが存在します（サムネイル抽出可能）")
            
            conn.close()

        except Exception as e:
            print(f"DB解析中にエラーが発生: {e}")
        finally:
            # 掃除
            if self.db_path and os.path.exists(self.db_path):
                try:
                    os.remove(self.db_path)
                except:
                    pass

    def _dump_table_info(self, cursor, table_name):
        try:
            # テーブルが存在するか確認
            cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}';")
            if not cursor.fetchone():
                print(f"⚠ {table_name} テーブルが見つかりません。")
                return

            # カラム名を取得
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = [col[1] for col in cursor.fetchall()]

            # データを1行だけ取得
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 1")
            row = cursor.fetchone()

            if row:
                print(f"▼ テーブル '{table_name}' の主要データ:")
                # 特定の重要なカラムだけピックアップして表示
                target_keys = ['CanvasWidth', 'CanvasHeight', 'CanvasResolution', 'CanvasBasicUnit']
                
                for col, val in zip(columns, row):
                    # 全データ表示だと多すぎるので、重要そうなものか、数値データのみ表示
                    if col in target_keys or "Name" in col:
                        print(f"  - {col}: {val}")
                    elif isinstance(val, (int, float)) and val > 0:
                         # 0以外の数値パラメータも表示してみる
                         print(f"  - {col}: {val}")
            else:
                print(f"テーブル '{table_name}' は空です。")

        except Exception as e:
            print(f"テーブル読み込みエラー: {e}")

# --- 実行部分 ---
# ここに対象のファイルパスを入れてください
target_file = "Illustration2bu.clip" 

if os.path.exists(target_file):
    inspector = ClipFileInspector(target_file)
    inspector.analyze()
else:
    print("ファイルが見つかりません。パスを確認してください。")