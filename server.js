const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== ��������� SUPABASE (���� �����) =====
const SUPABASE_URL = 'https://tlskuayflsgfmisigitx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_w69hucmH7KbE3h8f8ajKcw_D_PTbbfh';  // ? ������ ���� ����

// =============================================

app.use(cors());
app.use(express.json());

// ===== �������� ��� ������ =====
app.get('/api/graves', async (req, res) => {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/graves?select=*`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== ��������� ������ =====
app.post('/api/graves', async (req, res) => {
    try {
        // 🔥 ДОБАВЛЯЕМ rotation
        const { x, y, name, text, texture, rotation } = req.body;

        const response = await fetch(`${SUPABASE_URL}/rest/v1/graves`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({ 
                x, 
                y, 
                name, 
                text, 
                texture, 
                rotation: rotation || 0   // если не пришло – ставим 0
            })
        });

        const data = await response.json();
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`?? ������ ������� �� ����� ${PORT}`);
    console.log(`?? http://localhost:${PORT}`);
});
