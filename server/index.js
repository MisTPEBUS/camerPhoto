const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') }); // 載入 .env 檔案

const app = express();
const PORT = process.env.PORT || 3000;

// 允許解析 JSON 資料
app.use(express.json({ limit: '10mb' }));

// 提供靜態檔案
app.use(express.static(path.join(__dirname, 'public')));
console.log('process.env.UPLOAD_FOLDER', process.env.UPLOAD_FOLDER);
// 確保必要資料夾存在
const UPLOAD_DIR = process.env.UPLOAD_FOLDER || path.join(__dirname, 'uploads');
const LOG_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);

// LOG 檔案位置
const LOG_FILE = path.join(LOG_DIR, 'log.txt');

// 接收前端傳來的拍照資料
app.post('/api/upload-photo', (req, res) => {
    try {
        const { imageData, employeeId, btn } = req.body;

        // 檢查必要參數
        if (!employeeId || !btn || !imageData) {
            return res.status(400).json({ success: false, error: '缺少必要參數' });
        }

        // 取得當前時間 (UTC+8)
        const timestamp = new Date(Date.now() + 8 * 60 * 60 * 1000)
            .toISOString()
            .replace(/[-:]/g, '')
            .replace('T', '_')
            .slice(0, 15); // yyyyMMdd_HHmmss

        // 照片檔案名稱
        const fileName = `${timestamp}_${employeeId}_${btn}_37-0.jpg`;
        const filePath = path.join(UPLOAD_DIR, fileName);

        // 移除 Base64 的檔頭，寫入檔案
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

        // 記錄 LOG
        const logEntry = `員工: ${employeeId}, 時間: ${timestamp} [${btn}]\n`;
        fs.appendFileSync(LOG_FILE, logEntry);

        console.log('圖片已儲存:', filePath);
        console.log('操作記錄:', logEntry.trim());

        return res.json({ success: true, filePath });
    } catch (err) {
        console.error('錯誤:', err);
        return res.status(500).json({ success: false, error: '儲存圖片或記錄失敗' });
    }
});

// 提供 LOG 檔案內容
app.get('/api/get-log', (req, res) => {
    try {
        if (!fs.existsSync(LOG_FILE)) {
            return res.json({ success: true, log: '' });
        }

        const logContent = fs.readFileSync(LOG_FILE, 'utf8');
        return res.json({ success: true, log: logContent });
    } catch (err) {
        console.error('無法讀取 LOG:', err);
        return res.status(500).json({ success: false, error: '無法讀取 LOG' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
