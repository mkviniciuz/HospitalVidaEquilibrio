const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, isAdmin, isReceptionOrAdmin, isMedicoOrAdmin, JWT_SECRET } = require('./middleware/auth');

const app = express();

// Garantir que a pasta de uploads exista
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|svg|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Apenas imagens (jpeg, jpg, png, svg, webp) são permitidas.'));
  }
});

// Configurações de Segurança
app.use(helmet()); // Adiciona headers de segurança (HSTS, CSP, etc)
app.use(cors({
  origin: 'http://localhost:5173', // Ajuste para a URL do seu frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Limitador de requisições para a rota de login (Prevenção de Brute Force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // limite de 10 tentativas por IP
  message: { message: 'Muitas tentativas de login. Tente novamente em 15 minutos.' }
});

// Logger simples para depuração
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Helper para registrar logs no banco de dados
const logAction = (user, action, details = null) => {
  if (!user) return;
  
  let detailsStr = details;
  if (details && typeof details === 'object') {
    // Evitar logar senhas se o objeto for de usuário
    const safeDetails = { ...details };
    if (safeDetails.password) safeDetails.password = '********';
    detailsStr = JSON.stringify(safeDetails);
  }

  db.run(
    'INSERT INTO system_logs (user_id, user_name, user_role, action, details) VALUES (?, ?, ?, ?, ?)',
    [user.id, user.name, user.role, action, detailsStr],
    (err) => {
      if (err) console.error('Erro ao registrar log:', err.message);
    }
  );
};

// Validadores de Input
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validateCPF = (cpf) => {
  return /^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf);
};

// ==========================================
// LOGS DO SISTEMA
// ==========================================

// Listar logs (apenas administrador)
app.get('/api/logs', authenticateToken, isAdmin, (req, res) => {
  db.all('SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 500', [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar logs.' });
    res.json(rows);
  });
});

// ==========================================
// CONFIGURAÇÕES DO APLICATIVO
// ==========================================

// Buscar configurações
app.get('/api/app-settings', (req, res) => {
  db.get('SELECT * FROM app_settings ORDER BY id DESC LIMIT 1', [], (err, row) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar configurações.' });
    res.json(row || { app_name: 'Vida Equilíbrio' });
  });
});

// Atualizar configurações (apenas administrador)
app.put('/api/app-settings', authenticateToken, isAdmin, upload.single('logo'), (req, res) => {
  const { app_name, app_primary_color } = req.body;
  const app_logo = req.file ? `/uploads/${req.file.filename}` : null;

  db.get('SELECT id FROM app_settings ORDER BY id DESC LIMIT 1', [], (err, row) => {
    if (err) return res.status(500).json({ message: 'Erro interno.' });
    
    if (row) {
      const query = app_logo 
        ? 'UPDATE app_settings SET app_name = ?, app_logo = ?, app_primary_color = ? WHERE id = ?'
        : 'UPDATE app_settings SET app_name = ?, app_primary_color = ? WHERE id = ?';
      
      const params = app_logo 
        ? [app_name, app_logo, app_primary_color, row.id]
        : [app_name, app_primary_color, row.id];

      db.run(query, params, function(err) {
        if (err) return res.status(500).json({ message: 'Erro ao atualizar.' });
        logAction(req.user, 'Atualizou configurações do sistema', { app_name, app_logo });
        res.json({ message: 'Configurações atualizadas!', app_logo });
      });
    } else {
      db.run(
        'INSERT INTO app_settings (app_name, app_logo, app_primary_color) VALUES (?, ?, ?)',
        [app_name, app_logo, app_primary_color],
        function(err) {
          if (err) return res.status(500).json({ message: 'Erro ao criar.' });
          logAction(req.user, 'Criou configurações do sistema', { app_name, app_logo });
          res.json({ message: 'Configurações criadas!', app_logo });
        }
      );
    }
  });
});

// ==========================================
// ROTAS DE AUTENTICAÇÃO
// ==========================================

// Login
app.post('/api/auth/login', loginLimiter, (req, res) => {
  let { email, password } = req.body;
  
  // Sanitização básica
  email = email?.trim()?.toLowerCase();

  if (!email || !password) {
    return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ message: 'Erro interno no servidor.' });
    if (!user) return res.status(401).json({ message: 'Credenciais inválidas.' });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ message: 'Credenciais inválidas.' });

    // Gera o token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Registrar Log
    logAction(user, 'Login realizado', `IP: ${req.ip}`);

    res.json({
      message: 'Login bem-sucedido',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  });
});

// ==========================================
// ROTAS DE GESTÃO DE USUÁRIOS (Apenas Admin)
// ==========================================

// Listar todos os usuários
app.get('/api/users', authenticateToken, isAdmin, (req, res) => {
  db.all('SELECT id, name, email, role FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar usuários.' });
    res.json(rows);
  });
});

// Obter usuário por ID
app.get('/api/users/:id', authenticateToken, isAdmin, (req, res) => {
  db.get('SELECT id, name, email, role FROM users WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar usuário.' });
    if (!row) return res.status(404).json({ message: 'Usuário não encontrado.' });
    res.json(row);
  });
});

// Criar novo usuário
app.post('/api/users', authenticateToken, isAdmin, async (req, res) => {
  let { name, email, password, role } = req.body;
  
  // Sanitização e Validação
  name = name?.trim();
  email = email?.trim()?.toLowerCase();
  
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'E-mail em formato inválido.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ message: 'E-mail já cadastrado.' });
          }
          return res.status(500).json({ message: 'Erro ao criar usuário.' });
        }
        // Registrar Log
    logAction(req.user, 'Novo usuário cadastrado', req.body);
    res.status(201).json({ id: this.lastID, name, email, role });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Erro ao processar a senha.' });
  }
});

// Atualizar usuário
app.put('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
  const { name, email, role, password } = req.body;
  const userId = req.params.id;

  if (!name || !email || !role) {
    return res.status(400).json({ message: 'Nome, email e cargo são obrigatórios.' });
  }

  try {
    let query, params;
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = 'UPDATE users SET name = ?, email = ?, role = ?, password = ? WHERE id = ?';
      params = [name, email, role, hashedPassword, userId];
    } else {
      query = 'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?';
      params = [name, email, role, userId];
    }

    db.run(query, params, function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ message: 'E-mail já em uso por outro usuário.' });
        }
        return res.status(500).json({ message: 'Erro ao atualizar usuário.' });
      }
      if (this.changes === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });
      
      // Registrar Log
    logAction(req.user, 'Dados de usuário atualizados', { id: userId, ...req.body });
    res.json({ message: 'Usuário atualizado com sucesso.' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao processar a atualização.' });
  }
});

// Alterar a própria senha
app.put('/api/users/me/password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias.' });
  }

  try {
    // Buscar o usuário para validar a senha atual
    db.get('SELECT password FROM users WHERE id = ?', [userId], async (err, user) => {
      if (err) return res.status(500).json({ message: 'Erro ao buscar usuário.' });
      if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

      // Validar senha atual
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Senha atual incorreta.' });
      }

      // Atualizar com nova senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId], function(err) {
        if (err) return res.status(500).json({ message: 'Erro ao salvar a nova senha.' });
        res.json({ message: 'Senha alterada com sucesso.' });
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao processar a alteração de senha.' });
  }
});

// Excluir usuário
app.delete('/api/users/:id', authenticateToken, isAdmin, (req, res) => {
  const userId = req.params.id;
  
  // Impede que o admin exclua a si mesmo (id 1 assumindo que é o admin padrão, mas ideal seria checar pelo token)
  if (parseInt(userId) === req.user.id) {
    return res.status(400).json({ message: 'Você não pode excluir a sua própria conta.' });
  }

  db.run('DELETE FROM users WHERE id = ?', [userId], function (err) {
    if (err) return res.status(500).json({ message: 'Erro ao excluir usuário.' });
    if (this.changes === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });
    
    // Registrar Log
    logAction(req.user, 'Usuário removido', `ID: ${req.params.id}`);
    res.json({ message: 'Usuário excluído com sucesso.' });
  });
});

// ==========================================
// ROTAS DE RECEPÇÃO E PACIENTES
// ==========================================

// Listar todos os pacientes
app.get('/api/patients', authenticateToken, (req, res, next) => {
  const allowed = ['administrador', 'recepcao', 'enfermeira', 'medico'];
  if (allowed.includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado.' });
  }
}, (req, res) => {
  db.all('SELECT * FROM patients ORDER BY name', [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar pacientes.' });
    res.json(rows);
  });
});

// Criar novo paciente
app.post('/api/patients', authenticateToken, isReceptionOrAdmin, (req, res) => {
  let { 
    name, social_name, dob, rg, cpf, phone, whatsapp, email, gender,
    cep, address, address_number, address_complement, city, state,
    emergency_name, emergency_phone, allergies, blood_type,
    service_type, plan_name, card_number, card_validity, lgpd_consent
  } = req.body;

  // Sanitização
  name = name?.trim();
  cpf = cpf?.replace(/\D/g, ''); // Apenas números para o banco
  email = email?.trim()?.toLowerCase();

  if (!name || !dob || !rg || !cpf || !gender) {
    return res.status(400).json({ message: 'Nome, data de nascimento, RG, CPF e gênero são obrigatórios.' });
  }

  if (email && !validateEmail(email)) {
    return res.status(400).json({ message: 'E-mail do paciente em formato inválido.' });
  }

  if (!validateCPF(cpf)) {
    return res.status(400).json({ message: 'CPF em formato inválido.' });
  }

  const entryDate = new Date().toLocaleString('sv-SE');

  const query = `
    INSERT INTO patients (
      name, social_name, dob, rg, cpf, phone, whatsapp, email, gender,
      cep, address, address_number, address_complement, city, state,
      emergency_name, emergency_phone, allergies, blood_type,
      service_type, plan_name, card_number, card_validity, lgpd_consent, entry_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    name, social_name, dob, rg, cpf, phone, whatsapp, email, gender,
    cep, address, address_number, address_complement, city, state,
    emergency_name, emergency_phone, allergies, blood_type,
    service_type, plan_name, card_number, card_validity, lgpd_consent ? 1 : 0,
    entryDate
  ];

  db.run(query, params, function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ message: 'CPF já cadastrado.' });
      }
      return res.status(500).json({ message: 'Erro ao criar paciente.' });
    }
    // Registrar Log
    logAction(req.user, 'Paciente cadastrado', req.body);
    res.status(201).json({ id: this.lastID, name, cpf });
  });
});

// Atualizar paciente
app.put('/api/patients/:id', authenticateToken, isReceptionOrAdmin, (req, res) => {
  const { 
    name, social_name, dob, rg, cpf, phone, whatsapp, email, gender,
    cep, address, address_number, address_complement, city, state,
    emergency_name, emergency_phone, allergies, blood_type,
    service_type, plan_name, card_number, card_validity, lgpd_consent
  } = req.body;
  
  if (!name || !dob || !rg || !cpf || !gender) {
    return res.status(400).json({ message: 'Nome, data de nascimento, RG, CPF e gênero são obrigatórios.' });
  }

  const query = `
    UPDATE patients SET 
      name = ?, social_name = ?, dob = ?, rg = ?, cpf = ?, phone = ?, whatsapp = ?, email = ?, gender = ?,
      cep = ?, address = ?, address_number = ?, address_complement = ?, city = ?, state = ?,
      emergency_name = ?, emergency_phone = ?, allergies = ?, blood_type = ?,
      service_type = ?, plan_name = ?, card_number = ?, card_validity = ?, lgpd_consent = ?
    WHERE id = ?
  `;

  const params = [
    name, social_name, dob, rg, cpf, phone, whatsapp, email, gender,
    cep, address, address_number, address_complement, city, state,
    emergency_name, emergency_phone, allergies, blood_type,
    service_type, plan_name, card_number, card_validity, lgpd_consent ? 1 : 0,
    req.params.id
  ];

  db.run(query, params, function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ message: 'CPF já em uso.' });
      }
      return res.status(500).json({ message: 'Erro ao atualizar paciente.' });
    }
    if (this.changes === 0) return res.status(404).json({ message: 'Paciente não encontrado.' });
    // Registrar Log
    logAction(req.user, 'Paciente atualizado', { id: req.params.id, ...req.body });
    res.json({ message: 'Paciente atualizado com sucesso.' });
  }
  );
});

// Excluir paciente (também libera leito associado devido ao ON DELETE SET NULL)
app.delete('/api/patients/:id', authenticateToken, isReceptionOrAdmin, (req, res) => {
  db.run('DELETE FROM patients WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ message: 'Erro ao excluir paciente.' });
    if (this.changes === 0) return res.status(404).json({ message: 'Paciente não encontrado.' });
    // Registrar Log
    logAction(req.user, 'Paciente excluído', `ID: ${req.params.id}`);
    res.json({ message: 'Paciente excluído com sucesso.' });
  });
});

// ==========================================
// ROTAS DE LEITOS
// ==========================================

// Listar todos os leitos com informações do paciente (se houver)
// Liberado também para 'medico'
app.get('/api/beds', authenticateToken, (req, res, next) => {
  const allowed = ['administrador', 'recepcao', 'enfermeira', 'medico'];
  if (allowed.includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado.' });
  }
}, (req, res) => {
  const query = `
    SELECT beds.*, patients.name as patient_name 
    FROM beds 
    LEFT JOIN patients ON beds.patient_id = patients.id
    ORDER BY beds.id
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar leitos.' });
    res.json(rows);
  });
});

// Associar paciente a um leito
app.put('/api/beds/:id/assign', authenticateToken, isReceptionOrAdmin, (req, res) => {
  const { patient_id } = req.body;
  if (!patient_id) return res.status(400).json({ message: 'O ID do paciente é obrigatório.' });

  // 1. Verificar gênero do paciente
  db.get('SELECT gender FROM patients WHERE id = ?', [patient_id], (err, patient) => {
    if (err || !patient) return res.status(404).json({ message: 'Paciente não encontrado.' });

    // 2. Verificar se o paciente já está em outro leito
    db.get('SELECT id FROM beds WHERE patient_id = ?', [patient_id], (err, row) => {
      if (err) return res.status(500).json({ message: 'Erro na validação do paciente.' });
      if (row) return res.status(400).json({ message: 'Este paciente já está ocupando um leito.' });

      // 3. Verificar o tipo do leito
      db.get('SELECT type, is_occupied FROM beds WHERE id = ?', [req.params.id], (err, bed) => {
        if (err || !bed) return res.status(404).json({ message: 'Leito não encontrado.' });
        if (bed.is_occupied) return res.status(400).json({ message: 'Leito já ocupado.' });

        // 4. VALIDAR GÊNERO
        if (bed.type !== patient.gender) {
          return res.status(400).json({ 
            message: `Incompatibilidade de gênero: Este leito é da ala ${bed.type.toUpperCase()} e o paciente é do gênero ${patient.gender.toUpperCase()}.` 
          });
        }

        // 5. Atualizar o leito
        db.run(
          'UPDATE beds SET is_occupied = 1, patient_id = ? WHERE id = ?',
          [patient_id, req.params.id],
          function (err) {
            if (err) return res.status(500).json({ message: 'Erro ao associar paciente ao leito.' });
            // Registrar Log
            logAction(req.user, 'Paciente vinculado ao leito', `Leito: ${req.params.id} (Paciente ID: ${patient_id})`);
            res.json({ message: 'Paciente associado ao leito com sucesso.' });
          }
        );
      });
    });
  });
});

// Liberar um leito (apenas médicos e administradores)
app.put('/api/beds/:id/release', authenticateToken, isMedicoOrAdmin, (req, res) => {
  db.run(
    'UPDATE beds SET is_occupied = 0, patient_id = NULL WHERE id = ?',
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ message: 'Erro ao liberar leito.' });
      if (this.changes === 0) return res.status(404).json({ message: 'Leito não encontrado.' });
      // Registrar Log
      logAction(req.user, 'Leito liberado (Alta)', `Leito: ${req.params.id}`);
      res.json({ message: 'Leito liberado com sucesso.' });
    }
  );
});

// ==========================================
// ROTAS DE ENFERMAGEM (PRONTUÁRIO)
// ==========================================

// Buscar prontuário completo de um paciente
app.get('/api/patients/:id/clinical-record', authenticateToken, (req, res) => {
  const patientId = req.params.id;

  const queries = {
    medications: 'SELECT * FROM medications WHERE patient_id = ? ORDER BY created_at DESC',
    observations: 'SELECT * FROM observations WHERE patient_id = ? ORDER BY created_at DESC',
    reports: 'SELECT * FROM medical_reports WHERE patient_id = ? ORDER BY created_at DESC'
  };

  db.all(queries.medications, [patientId], (err, medications) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar medicamentos.' });
    console.log('Medicações encontradas:', medications);

    db.all(queries.observations, [patientId], (err, observations) => {
      if (err) return res.status(500).json({ message: 'Erro ao buscar observações.' });
      console.log('Observações encontradas:', observations);

      db.all(queries.reports, [patientId], (err, reports) => {
        if (err) return res.status(500).json({ message: 'Erro ao buscar evoluções médicas.' });
        console.log('Evoluções encontradas:', reports);

        res.json({ medications, observations, reports });
      });
    });
  });
});

// Adicionar medicamento
app.post('/api/medications', authenticateToken, isMedicoOrAdmin, (req, res) => {
  const { patient_id, name, dosage, frequency, frequency_hours } = req.body;
  if (!patient_id || !name) return res.status(400).json({ message: 'Paciente e nome do medicamento são obrigatórios.' });

  const now = new Date().toISOString(); // UTC Format

  db.run(
    'INSERT INTO medications (patient_id, name, dosage, frequency, frequency_hours, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [patient_id, name, dosage, frequency, frequency_hours || null, now],
    function (err) {
      if (err) return res.status(500).json({ message: 'Erro ao adicionar medicamento.' });
      logAction(req.user, 'Medicamento adicionado', req.body);
      res.json({ id: this.lastID, message: 'Medicamento adicionado com sucesso.', created_at: now });
    }
  );
});

// ==========================================
// ROTAS DE CRONÔMETRO DE MEDICAÇÃO
// ==========================================

// Buscar cronômetros ativos
app.get('/api/medications/timers', authenticateToken, (req, res) => {
  const query = `
    SELECT m.*, p.name as patient_name, b.room, b.number as bed_number
    FROM medications m
    JOIN patients p ON m.patient_id = p.id
    LEFT JOIN beds b ON p.id = b.patient_id
    WHERE m.is_timer_running = 1
  `;
  db.all(query, [], (err, timers) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar cronômetros ativos.' });
    res.json(timers);
  });
});

// Alternar timer
app.put('/api/medications/:id/timer', authenticateToken, (req, res) => {
  const { action } = req.body; // 'start' ou 'stop'
  const id = req.params.id;

  if (action === 'start') {
    const now = new Date().toISOString();
    db.run(
      'UPDATE medications SET is_timer_running = 1, timer_started_at = ? WHERE id = ?',
      [now, id],
      function (err) {
        if (err) return res.status(500).json({ message: 'Erro ao iniciar cronômetro.' });
        logAction(req.user, 'Cronômetro de medicação iniciado', `ID Medicamento: ${id}`);
        res.json({ message: 'Cronômetro iniciado.', timer_started_at: now, is_timer_running: 1 });
      }
    );
  } else if (action === 'stop') {
    db.run(
      'UPDATE medications SET is_timer_running = 0, timer_started_at = NULL WHERE id = ?',
      [id],
      function (err) {
        if (err) return res.status(500).json({ message: 'Erro ao parar cronômetro.' });
        logAction(req.user, 'Medicação administrada / Cronômetro parado', `ID Medicamento: ${id}`);
        res.json({ message: 'Cronômetro parado.', is_timer_running: 0 });
      }
    );
  } else {
    res.status(400).json({ message: 'Ação inválida.' });
  }
});

// Remover medicamento
app.delete('/api/medications/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  console.log(`RECEBIDA REQUISIÇÃO PARA DELETAR MEDICAMENTO ID: ${id}`);
  db.run('DELETE FROM medications WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('ERRO AO DELETAR NO BANCO:', err);
      return res.status(500).json({ message: 'Erro ao remover medicamento.' });
    }
    console.log(`MEDICAMENTO ID ${id} DELETADO. LINHAS AFETADAS: ${this.changes}`);
    logAction(req.user, 'Medicamento removido', `ID: ${id}`);
    res.json({ message: 'Medicamento removido.' });
  });
});

// Adicionar observação
app.post('/api/observations', authenticateToken, (req, res) => {
  const { patient_id, content } = req.body;
  if (!patient_id || !content) return res.status(400).json({ message: 'Paciente e conteúdo são obrigatórios.' });

  const now = new Date().toISOString(); // Formato YYYY-MM-DD HH:mm:ss

  db.run(
    'INSERT INTO observations (patient_id, content, created_at) VALUES (?, ?, ?)',
    [patient_id, content, now],
    function (err) {
      if (err) return res.status(500).json({ message: 'Erro ao adicionar observação.' });
      logAction(req.user, 'Observação adicionada', req.body);
      res.json({ id: this.lastID, message: 'Observação adicionada com sucesso.', created_at: now });
    }
  );
});

// Remover observação
app.delete('/api/observations/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  console.log(`RECEBIDA REQUISIÇÃO PARA DELETAR OBSERVAÇÃO ID: ${id}`);
  db.run('DELETE FROM observations WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('ERRO AO DELETAR NO BANCO:', err);
      return res.status(500).json({ message: 'Erro ao remover observação.' });
    }
    console.log(`OBSERVAÇÃO ID ${id} DELETADA. LINHAS AFETADAS: ${this.changes}`);
    logAction(req.user, 'Observação removida', `ID: ${id}`);
    res.json({ message: 'Observação removida.' });
  });
});

// ==========================================
// ROTAS DE EVOLUÇÃO MÉDICA
// ==========================================

// Adicionar relatório médico (Evolução)
app.post('/api/medical-reports', authenticateToken, isMedicoOrAdmin, (req, res) => {
  const { patient_id, description, status } = req.body;
  if (!patient_id || !description || !status) {
    return res.status(400).json({ message: 'Paciente, descrição e status são obrigatórios.' });
  }

  const now = new Date().toISOString(); // Formato UTC para padronizar

  db.run(
    'INSERT INTO medical_reports (patient_id, description, status, created_at) VALUES (?, ?, ?, ?)',
    [patient_id, description, status, now],
    function (err) {
      if (err) return res.status(500).json({ message: 'Erro ao adicionar evolução médica.' });
      logAction(req.user, 'Evolução médica adicionada', req.body);
      res.json({ id: this.lastID, message: 'Evolução adicionada com sucesso.', created_at: now });
    }
  );
});

// Remover relatório médico
app.delete('/api/medical-reports/:id', authenticateToken, isMedicoOrAdmin, (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM medical_reports WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ message: 'Erro ao remover evolução médica.' });
    if (this.changes === 0) return res.status(404).json({ message: 'Evolução não encontrada.' });
    logAction(req.user, 'Evolução médica removida', `ID: ${id}`);
    res.json({ message: 'Evolução removida com sucesso.' });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Catch-all para rotas não encontradas (Debug)
app.use((req, res) => {
  console.log(`404 - Rota não encontrada: ${req.method} ${req.url}`);
  res.status(404).json({ message: `Rota ${req.method} ${req.url} não encontrada.` });
});
