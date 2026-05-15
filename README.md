# 股市樂活五線譜產生器

這是一個可部署的 Python + 原生前端網頁工具，可輸入台股代號，抓取 Yahoo Finance 日收盤價，並產生樂活五線譜。

## 本機啟動

雙擊 `start-lohas-staff.bat`，或執行：

```powershell
python server.py
```

預設網址：

```text
http://127.0.0.1:8769/index.html
```

## Render 部署

1. 把這個資料夾推到 GitHub repo。
2. 到 Render 建立 `New` -> `Blueprint`，選這個 repo。
3. Render 會讀取 `render.yaml`，建立 Python Web Service。
4. 部署完成後，Render 會提供一個 `https://...onrender.com` 網址。

如果用手動建立 Web Service，請填：

```text
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: python server.py
```

專案已包含 `.python-version`，讓 Render 使用 Python 3.13.5。

## 資料來源

自動抓取使用 Yahoo Finance chart API，例如 `2330.TW`。若來源暫時限制或無資料，頁面仍保留 CSV 貼上/上傳功能。
