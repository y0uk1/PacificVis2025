import csv
import requests
from bs4 import BeautifulSoup

# ベースURL
base_url = "https://www.kobe-niku.jp/contents/exported/index.php"

# csv出力データの初期化
csv_data = []
page = 1

for year in range(2012, 2026):
    while(True):
        print(year, page)
        # 年度とページを指定
        params = {
            "y": str(year),
            "page": str(page)
        }
        # リクエストを送信
        response = requests.get(base_url, params=params)

        # レスポンスを解析
        soup = BeautifulSoup(response.text, "html.parser")

        # 表データを取得（例: <table>タグ内のデータ）
        table = soup.find("table")  # 必要に応じて正確なタグやクラスを指定
        rows = table.find_all("tr")

        if len(rows) == 2:
            page = 1
            break

        # 表データを表示
        for row in rows:
            cols = row.find_all("td")
            data = [col.text.strip() for col in cols]
            if data:
                if "kg" in data[3]:
                    data[3] = data[3].split("kg")[0]
                if "\r\n" in data[3]:
                    data[3] = data[3].split('\r\n')[0]
                indices = [0, 2, 3]
                new_data = [data[i] for i in indices]
                csv_data.append(new_data)
        
        page += 1

header = ["date", "exported_to", "weight_kg"]
with open('amount_of_exported_kobe_beef.csv', 'w') as f:
    writer = csv.writer(f)
    writer.writerow(header)
    writer.writerows(csv_data)