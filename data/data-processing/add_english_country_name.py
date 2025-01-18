import time
import pandas as pd
from googletrans import Translator


input_data = 'amount_value_of_exported_beef3.csv'
output_data = 'amount_value_of_exported_beef3_new.csv'

# CSVデータを読み込む
df = pd.read_csv(input_data)

# 翻訳ツールの初期化
translator = Translator()

# country列を翻訳する関数
def country_translate(text, retries=3, delay=2):
    for attempt in range(retries):
        try:
            return translator.translate(text, src='ja', dest='en').text
        except Exception as e:
            print(f"Error translating '{text}': {e}")
            if attempt < retries - 1:
                time.sleep(delay)  # リトライ間隔
            else:
                return text  # 翻訳失敗時は元の値を返す

# country列を翻訳
df['country_english'] = df['country'].apply(country_translate)

# 結果を表示
df.to_csv(output_data, index=False, encoding='utf-8-sig')
