import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { INITIAL_MEMBERS, INITIAL_TRIBUTES } from './src/data/initialData';

dotenv.config();

// Initialize Gemini Client server-side with proper User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to decode and verify if a Supabase key has service_role privileges
function isServiceRoleKey(key: string | undefined): boolean {
  if (!key) return false;
  try {
    const parts = key.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    return payload.role === 'service_role';
  } catch (e) {
    return false;
  }
}

// Supabase Connection Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://swyjvqesrepxhbipejui.supabase.co';
const DEFAULT_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3eWp2cWVzcmVweGhiaXBlanVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjU1MzQ4MCwiZXhwIjoyMDk4MTI5NDgwfQ.2sZCP2esTjR5KapDFBhxAwNfcme1Iaw-6ebUs2SWPL4';

let SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_ROLE_KEY;

// If the env variable is configured but is not actually a service_role key (e.g. it is misconfigured as anon),
// and we are connecting to our default Supabase instance, we fallback to the correct hardcoded service_role key.
if (!isServiceRoleKey(SUPABASE_SERVICE_ROLE_KEY) && SUPABASE_URL.includes('swyjvqesrepxhbipejui')) {
  console.log('Detected misconfigured/non-service-role SUPABASE_SERVICE_ROLE_KEY for the default project. Falling back to default service_role key.');
  SUPABASE_SERVICE_ROLE_KEY = DEFAULT_SERVICE_ROLE_KEY;
}

// Create service-role Supabase client to bypass RLS policies and handle admin actions securely
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// SQL Definition for database initialization instructions
const INITIALIZATION_SQL = `-- COPY AND RUN THIS SQL SCRIPT IN THE SUPABASE SQL EDITOR TO SETUP YOUR DATABASE:

-- Create members table
CREATE TABLE IF NOT EXISTS public.members (
    id text PRIMARY KEY,
    name text NOT NULL,
    gender text NOT NULL,
    generation integer NOT NULL,
    "birthYear" text,
    "deathYear" text,
    "isDeceased" boolean DEFAULT false,
    "spouseId" text,
    "parentId" text,
    "childrenIds" jsonb DEFAULT '[]'::jsonb,
    title text,
    "birthPlace" text,
    "restingPlace" text,
    bio text,
    "createdAt" timestamptz DEFAULT now()
);

-- Create tributes table
CREATE TABLE IF NOT EXISTS public.tributes (
    id text PRIMARY KEY,
    "memberId" text,
    "authorName" text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamptz DEFAULT now()
);

-- Create lit_candles table
CREATE TABLE IF NOT EXISTS public.lit_candles (
    "memberId" text PRIMARY KEY,
    "isLit" boolean DEFAULT true,
    "createdAt" timestamptz DEFAULT now()
);

-- Create admin_creds table
CREATE TABLE IF NOT EXISTS public.admin_creds (
    username text PRIMARY KEY,
    password text NOT NULL,
    "createdAt" timestamptz DEFAULT now()
);

-- Seed initial admin credentials if empty
INSERT INTO public.admin_creds (username, password)
VALUES ('admin', '123')
ON CONFLICT (username) DO NOTHING;`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Normalization Helpers to standardise camelCase field mapping
  const normalizeMemberFromDb = (row: any): any => {
    if (!row) return row;
    let kids: string[] = [];
    try {
      const cids = row.childrenIds !== undefined ? row.childrenIds : row.childrenids;
      if (Array.isArray(cids)) {
        kids = cids;
      } else if (typeof cids === 'string') {
        kids = JSON.parse(cids);
      }
    } catch (e) {
      kids = [];
    }

    let familyBranch = '';
    let bio = String(row.bio !== undefined ? row.bio : '');
    if (bio.startsWith('[Bầu đoàn: ')) {
      const match = bio.match(/^\[Bầu đoàn: ([^\]]+)\]\s*(.*)/s);
      if (match) {
        familyBranch = match[1];
        bio = match[2];
      }
    }

    return {
      id: String(row.id || ''),
      name: String(row.name || ''),
      gender: row.gender === 'female' ? 'female' : 'male',
      generation: Number(row.generation || 1),
      birthYear: String(row.birthYear !== undefined ? row.birthYear : (row.birthyear !== undefined ? row.birthyear : '')),
      deathYear: String(row.deathYear !== undefined ? row.deathYear : (row.deathyear !== undefined ? row.deathyear : '')),
      isDeceased: row.isDeceased !== undefined ? !!row.isDeceased : (row.isdeceased !== undefined ? !!row.isdeceased : false),
      spouseId: String(row.spouseId !== undefined ? row.spouseId : (row.spouseid !== undefined ? row.spouseid : '')),
      parentId: String(row.parentId !== undefined ? row.parentId : (row.parentid !== undefined ? row.parentid : '')),
      childrenIds: kids,
      title: String(row.title !== undefined ? row.title : ''),
      birthPlace: String(row.birthPlace !== undefined ? row.birthPlace : (row.birthplace !== undefined ? row.birthplace : '')),
      restingPlace: String(row.restingPlace !== undefined ? row.restingPlace : (row.restingplace !== undefined ? row.restingplace : '')),
      bio: bio,
      familyBranch: familyBranch,
    };
  };

  const prepareMemberForDb = (member: any): any => {
    if (!member) return member;

    const rawBio = String(member.bio || '');
    const serializedBio = member.familyBranch 
      ? `[Bầu đoàn: ${member.familyBranch}] ${rawBio}`
      : rawBio;

    return {
      id: String(member.id || ''),
      name: String(member.name || ''),
      gender: member.gender === 'female' ? 'female' : 'male',
      generation: Number(member.generation || 1),
      birthYear: String(member.birthYear || ''),
      deathYear: String(member.deathYear || ''),
      isDeceased: !!member.isDeceased,
      spouseId: String(member.spouseId || ''),
      parentId: String(member.parentId || ''),
      childrenIds: Array.isArray(member.childrenIds) ? member.childrenIds : [],
      title: String(member.title || ''),
      birthPlace: String(member.birthPlace || ''),
      restingPlace: String(member.restingPlace || ''),
      bio: serializedBio
    };
  };

  const normalizeTributeFromDb = (row: any): any => {
    if (!row) return row;
    return {
      id: String(row.id || ''),
      memberId: String(row.memberId !== undefined ? row.memberId : (row.memberid !== undefined ? row.memberid : '')),
      authorName: String(row.authorName !== undefined ? row.authorName : (row.authorname !== undefined ? row.authorname : '')),
      content: String(row.content || ''),
      createdAt: String(row.createdAt !== undefined ? row.createdAt : (row.createdat !== undefined ? row.createdat : '')),
    };
  };

  const prepareTributeForDb = (tribute: any): any => {
    if (!tribute) return tribute;
    return {
      id: String(tribute.id || ''),
      memberId: String(tribute.memberId || ''),
      authorName: String(tribute.authorName || ''),
      content: String(tribute.content || ''),
      createdAt: String(tribute.createdAt || new Date().toISOString())
    };
  };

  const normalizeCandleFromDb = (row: any): any => {
    if (!row) return row;
    return {
      memberId: String(row.memberId !== undefined ? row.memberId : (row.memberid !== undefined ? row.memberid : '')),
      isLit: row.isLit !== undefined ? !!row.isLit : (row.islit !== undefined ? !!row.islit : false),
    };
  };

  // Helper to check for database connection / table existence errors
  const handleDbError = (error: any, res: any) => {
    try {
      console.log('Database query error detailed:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    } catch (e) {
      console.log('Database query error (fallback string):', String(error));
    }

    const errorMsg = error?.message || '';
    const errorCode = error?.code || '';

    if (
      errorCode === '42P01' || 
      errorCode === 'PGRST205' || 
      errorMsg.includes('relation') || 
      errorMsg.includes('does not exist') || 
      errorMsg.includes('schema cache') ||
      errorMsg.includes('Could not find the table')
    ) {
      return res.status(200).json({
        error: 'database_not_initialized',
        message: 'Cơ sở dữ liệu Supabase chưa được khởi tạo bảng.',
        sql: INITIALIZATION_SQL,
      });
    }
    return res.status(500).json({ 
      error: 'Có lỗi xảy ra khi kết nối cơ sở dữ liệu Supabase',
      details: errorMsg,
      code: errorCode
    });
  };

  // API Route: AI-powered biography generation using Gemini 3.5 Flash
  app.post('/api/generate-bio', async (req, res) => {
    try {
      const { member } = req.body;
      if (!member) {
        return res.status(400).json({ error: 'Dữ liệu thành viên không hợp lệ' });
      }

      const genderTerm = member.gender === 'male' ? 'Nam' : 'Nữ';
      const statusTerm = member.isDeceased ? 'Đã khuất (Đã tạ thế)' : 'Còn sống';
      const generationTerm = `Thế hệ thứ ${member.generation} (Đời F${member.generation})`;

      const prompt = `Hãy soạn thảo một đoạn tiểu sử gia phả trang trọng, súc tích (khoảng 80-120 từ), giàu cảm xúc bằng tiếng Việt truyền thống cho thành viên dòng họ Nghiêm Gia với các thông tin sau:
- Họ và tên: ${member.name}
- Giới tính: ${genderTerm}
- Thế hệ: ${generationTerm}
- Danh xưng / Vai vế: ${member.title || 'Thành viên'}
- Năm sinh: ${member.birthYear || 'Chưa rõ'}
- Năm mất: ${member.isDeceased ? member.deathYear || 'Chưa rõ' : 'Nay'}
- Trạng thái: ${statusTerm}
- Quê quán / Nơi sinh: ${member.birthPlace || 'Hà Nội'}
- Nơi an nghỉ (nếu đã khuất): ${member.restingPlace || 'Nghĩa trang dòng họ'}
- Đóng góp / Sự nghiệp sơ lược hiện tại: ${member.currentBio || 'Chưa cập nhật'}

Yêu cầu văn phong: Uy nghiêm, thanh lịch, mang màu sắc văn hóa gia đình cổ truyền Việt Nam, ca ngợi phẩm đức hiền hậu chu toàn (nếu là nữ) hoặc công lao cống hiến, trí tuệ tài hoa dựng xây quê hương (nếu là nam). Thấm đượm lòng hiếu thảo, tạo nguồn cảm hứng rèn luyện đạo nghĩa cho con cháu đời sau. Trả về TRỰC TIẾP đoạn văn, không thêm bất cứ lời dẫn hay định dạng markdown nào khác.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Bạn là một nhà sử học cổ truyền, thủ thư gia phả đại tài của các dòng tộc Việt Nam, có tài viết văn chương chữ Nho trang nghiêm, nho nhã, tôn quý và xúc động.',
          temperature: 0.7,
        },
      });

      const biography = response.text ? response.text.trim() : '';
      res.json({ biography });
    } catch (error) {
      console.log('Error generating AI biography:', error);
      res.status(500).json({ error: 'Có lỗi xảy ra khi gọi Gemini AI để soạn thảo tiểu sử' });
    }
  });

  // --- MEMBERS ENDPOINTS ---

  // GET /api/members
  app.get('/api/members', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('generation', { ascending: true });

      if (error) {
        return handleDbError(error, res);
      }

      // Automatically seed if the table is completely empty
      if (!data || data.length === 0) {
        console.log('Seeding initial family tree members into Supabase...');
        const preparedMembers = INITIAL_MEMBERS.map(prepareMemberForDb);
        const { data: seeded, error: seedError } = await supabase
          .from('members')
          .insert(preparedMembers)
          .select();

        if (seedError) {
          console.log('Failed to seed members:', seedError);
          return res.status(500).json({ error: 'Lỗi tự động gieo dữ liệu thành viên vào Supabase' });
        }

        // Also seed initial tributes
        const preparedTributes = INITIAL_TRIBUTES.map(prepareTributeForDb);
        await supabase.from('tributes').insert(preparedTributes);

        return res.json(seeded.map(normalizeMemberFromDb));
      }

      res.json(data.map(normalizeMemberFromDb));
    } catch (error) {
      handleDbError(error, res);
    }
  });

  // POST /api/members (Add member)
  app.post('/api/members', async (req, res) => {
    try {
      const member = req.body;
      const dbPayload = prepareMemberForDb(member);
      const { data, error } = await supabase
        .from('members')
        .insert([dbPayload])
        .select();

      if (error) return handleDbError(error, res);
      res.status(201).json(data ? normalizeMemberFromDb(data[0]) : member);
    } catch (error) {
      handleDbError(error, res);
    }
  });

  // PUT /api/members/:id (Update member)
  app.put('/api/members/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const member = req.body;
      const dbPayload = prepareMemberForDb(member);
      const { data, error } = await supabase
        .from('members')
        .update(dbPayload)
        .eq('id', id)
        .select();

      if (error) return handleDbError(error, res);
      res.json(data ? normalizeMemberFromDb(data[0]) : member);
    } catch (error) {
      handleDbError(error, res);
    }
  });

  // DELETE /api/members/:id (Delete member)
  app.delete('/api/members/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);

      if (error) return handleDbError(error, res);
      res.json({ success: true });
    } catch (error) {
      handleDbError(error, res);
    }
  });

  // POST /api/members/bulk (Bulk sync/import replacing all existing)
  app.post('/api/members/bulk', async (req, res) => {
    try {
      const { members: newMembers } = req.body;
      if (!Array.isArray(newMembers)) {
        return res.status(400).json({ error: 'Dữ liệu thành viên không hợp lệ' });
      }

      const preparedMembers = newMembers.map(prepareMemberForDb);

      // Clean existing members
      const { error: deleteError } = await supabase.from('members').delete().neq('id', 'dummy-id-never-matches');
      if (deleteError) return handleDbError(deleteError, res);

      // Insert new ones
      const { data, error: insertError } = await supabase
        .from('members')
        .insert(preparedMembers)
        .select();

      if (insertError) return handleDbError(insertError, res);
      res.json({ success: true, count: data?.length || 0 });
    } catch (error) {
      handleDbError(error, res);
    }
  });

  // --- TRIBUTES ENDPOINTS ---

  // GET /api/tributes
  app.get('/api/tributes', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('tributes')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) return handleDbError(error, res);
      res.json((data || []).map(normalizeTributeFromDb));
    } catch (error) {
      handleDbError(error, res);
    }
  });

  // POST /api/tributes
  app.post('/api/tributes', async (req, res) => {
    try {
      const tribute = req.body;
      const dbPayload = prepareTributeForDb(tribute);
      const { data, error } = await supabase
        .from('tributes')
        .insert([dbPayload])
        .select();

      if (error) return handleDbError(error, res);
      res.status(201).json(data ? normalizeTributeFromDb(data[0]) : tribute);
    } catch (error) {
      handleDbError(error, res);
    }
  });

  // --- LIT CANDLES ENDPOINTS ---

  // GET /api/lit-candles
  app.get('/api/lit-candles', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('lit_candles')
        .select('*');

      if (error) return handleDbError(error, res);

      // Map to object { [memberId]: boolean }
      const record: Record<string, boolean> = {};
      if (data) {
        data.forEach((row: any) => {
          const norm = normalizeCandleFromDb(row);
          if (norm.memberId) {
            record[norm.memberId] = norm.isLit;
          }
        });
      }
      res.json(record);
    } catch (error) {
      handleDbError(error, res);
    }
  });

  // POST /api/lit-candles (Toggle lit candle)
  app.post('/api/lit-candles', async (req, res) => {
    try {
      const { memberId, isLit } = req.body;
      if (!memberId) {
        return res.status(400).json({ error: 'Mã thành viên không hợp lệ' });
      }

      const { data, error } = await supabase
        .from('lit_candles')
        .upsert({ memberId, isLit })
        .select();

      if (error) return handleDbError(error, res);
      res.json({ success: true, data: data ? data.map(normalizeCandleFromDb) : [] });
    } catch (error) {
      handleDbError(error, res);
    }
  });

  // --- ADMIN CREDENTIALS ENDPOINTS ---

  // GET /api/admin-creds
  app.get('/api/admin-creds', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('admin_creds')
        .select('username, password')
        .limit(1);

      if (error) return handleDbError(error, res);

      if (!data || data.length === 0) {
        return res.json({ username: 'admin', password: '123' });
      }
      res.json(data[0]);
    } catch (error) {
      handleDbError(error, res);
    }
  });

  // POST /api/admin-creds (Update credentials)
  app.post('/api/admin-creds', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Tài khoản hoặc mật khẩu không thể bỏ trống' });
      }

      // Since we only want one admin record, we can either update if exists or clear other records.
      // Upserting with username as primary key:
      const { error } = await supabase
        .from('admin_creds')
        .upsert({ username, password });

      if (error) return handleDbError(error, res);
      res.json({ success: true });
    } catch (error) {
      handleDbError(error, res);
    }
  });

  // API Route: Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
  });

  // API Route: Debug database connection and error details
  app.get('/api/debug-db', async (req, res) => {
    try {
      const { data, error } = await supabase.from('members').select('*').limit(1);
      res.json({
        success: !error,
        error,
        data,
        env: {
          SUPABASE_URL: process.env.SUPABASE_URL ? 'set' : 'not_set',
          SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'not_set',
          SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'set' : 'not_set',
          fallback_url: SUPABASE_URL,
          fallback_key_preview: SUPABASE_SERVICE_ROLE_KEY ? SUPABASE_SERVICE_ROLE_KEY.substring(0, 15) + '...' : 'none'
        }
      });
    } catch (err: any) {
      res.json({
        success: false,
        catch_error: err?.message || String(err),
        stack: err?.stack
      });
    }
  });

  // Vite middleware for development / Static assets serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
export {};
