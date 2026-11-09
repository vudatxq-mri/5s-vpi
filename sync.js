// Vercel Serverless Function: Real-time Cross-device 5S Synchronization API
import fs from 'fs';
import path from 'path';

let inMemoryState = null;
let lastUpdated = Date.now();

// Đường dẫn file lưu trữ đệm (dùng /tmp trên môi trường serverless Vercel)
const TMP_PATH = '/tmp/vpi_5s_synced_state.json';
const LOCAL_PATH = path.join(process.cwd(), 'vpi_5s_synced_state.json');

function getPersistedState() {
  if (inMemoryState) return inMemoryState;
  
  // Thử đọc từ /tmp (Vercel)
  try {
    if (fs.existsSync(TMP_PATH)) {
      const content = fs.readFileSync(TMP_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && parsed.data) {
        inMemoryState = parsed.data;
        lastUpdated = parsed.timestamp || Date.now();
        return inMemoryState;
      }
    }
  } catch (e) {}

  // Thử đọc từ root project (nếu có)
  try {
    if (fs.existsSync(LOCAL_PATH)) {
      const content = fs.readFileSync(LOCAL_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && parsed.data) {
        inMemoryState = parsed.data;
        lastUpdated = parsed.timestamp || Date.now();
        return inMemoryState;
      }
    }
  } catch (e) {}

  return null;
}

function persistState(data) {
  inMemoryState = data;
  lastUpdated = Date.now();
  const payload = JSON.stringify({ data: inMemoryState, timestamp: lastUpdated });

  try {
    fs.writeFileSync(TMP_PATH, payload, 'utf-8');
  } catch (e) {}

  try {
    fs.writeFileSync(LOCAL_PATH, payload, 'utf-8');
  } catch (e) {}
}

export default async function handler(req, res) {
  // CORS Headers cho mọi client (Smartphone, PC, Tablet, Web browser)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const currentState = getPersistedState();
    return res.status(200).json({
      status: 'success',
      data: currentState,
      timestamp: lastUpdated,
      server: 'Vercel-Edge-Sync'
    });
  }

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (pe) {}
      }
      const data = body ? (body.data || body) : null;
      if (data) {
        persistState(data);
        return res.status(200).json({
          status: 'success',
          message: 'Đã đồng bộ dữ liệu toàn viện thành công',
          timestamp: lastUpdated
        });
      }
      return res.status(400).json({ error: 'Thiếu trường data trong payload' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
