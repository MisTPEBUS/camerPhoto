const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 允許解析 JSON
app.use(express.json({ limit: '10mb' }));

// 提供靜態檔案
app.use(express.static(path.join(__dirname, 'public')));

// 確保 uploads 資料夾存在
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

// 接收照片與參數並儲存
app.post('/api/upload-photo', (req, res) => {
    try {
        const { employeeId, action, imageData } = req.body;

        if (!employeeId || !action || !imageData) {
            return res.status(400).json({ success: false, error: '缺少必要參數！' });
        }

        // 日期時間格式
        const timestamp = new Date()
            .toISOString()
            .replace(/[-:]/g, '')
            .replace('T', '_')
            .slice(0, 15); // yyyyMMdd_HHmmss

        // 檔名格式
        const fileName = `${timestamp}_${employeeId}_${action}_37-0.jpg`;
        const filePath = path.join(UPLOAD_DIR, fileName);

        // 儲存檔案
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(filePath, buffer);

        console.log('照片已儲存：', filePath);
        res.json({ success: true, filePath });
    } catch (err) {
        console.error('照片儲存失敗：', err);
        res.status(500).json({ success: false, error: '照片儲存失敗！' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
