const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./database');
const { authenticateToken, isAdmin, isReceptionOrAdmin, JWT_SECRET } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

// Logger simples para depuração
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ==========================================
// ROTAS DE AUTENTICAÇÃO
// ==========================================

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

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
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
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
      
      res.json({ message: 'Usuário atualizado com sucesso.' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao processar a atualização.' });
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
    
    res.json({ message: 'Usuário excluído com sucesso.' });
  });
});

// ==========================================
// ROTAS DE RECEPÇÃO E PACIENTES
// ==========================================

// Listar todos os pacientes
app.get('/api/patients', authenticateToken, isReceptionOrAdmin, (req, res) => {
  db.all('SELECT * FROM patients ORDER BY name', [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar pacientes.' });
    res.json(rows);
  });
});

// Criar novo paciente
app.post('/api/patients', authenticateToken, isReceptionOrAdmin, (req, res) => {
  const { 
    name, social_name, dob, rg, cpf, phone, whatsapp, email, gender,
    cep, address, address_number, address_complement, city, state,
    emergency_name, emergency_phone, allergies, blood_type,
    service_type, plan_name, card_number, card_validity, lgpd_consent
  } = req.body;

  if (!name || !dob || !rg || !cpf || !gender) {
    return res.status(400).json({ message: 'Nome, data de nascimento, RG, CPF e gênero são obrigatórios.' });
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
    res.json({ message: 'Paciente atualizado com sucesso.' });
  }
  );
});

// Excluir paciente (também libera leito associado devido ao ON DELETE SET NULL)
app.delete('/api/patients/:id', authenticateToken, isReceptionOrAdmin, (req, res) => {
  db.run('DELETE FROM patients WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ message: 'Erro ao excluir paciente.' });
    if (this.changes === 0) return res.status(404).json({ message: 'Paciente não encontrado.' });
    res.json({ message: 'Paciente excluído com sucesso.' });
  });
});

// ==========================================
// ROTAS DE LEITOS
// ==========================================

// Listar todos os leitos com informações do paciente (se houver)
app.get('/api/beds', authenticateToken, isReceptionOrAdmin, (req, res) => {
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
            res.json({ message: 'Paciente associado ao leito com sucesso.' });
          }
        );
      });
    });
  });
});

// Liberar um leito
app.put('/api/beds/:id/release', authenticateToken, isReceptionOrAdmin, (req, res) => {
  db.run(
    'UPDATE beds SET is_occupied = 0, patient_id = NULL WHERE id = ?',
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ message: 'Erro ao liberar leito.' });
      if (this.changes === 0) return res.status(404).json({ message: 'Leito não encontrado.' });
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
    observations: 'SELECT * FROM observations WHERE patient_id = ? ORDER BY created_at DESC'
  };

  db.all(queries.medications, [patientId], (err, medications) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar medicamentos.' });
    console.log('Medicações encontradas:', medications);

    db.all(queries.observations, [patientId], (err, observations) => {
      if (err) return res.status(500).json({ message: 'Erro ao buscar observações.' });
      console.log('Observações encontradas:', observations);

      res.json({ medications, observations });
    });
  });
});

// Adicionar medicamento
app.post('/api/medications', authenticateToken, (req, res) => {
  const { patient_id, name, dosage, frequency, frequency_hours } = req.body;
  if (!patient_id || !name) return res.status(400).json({ message: 'Paciente e nome do medicamento são obrigatórios.' });

  const now = new Date().toLocaleString('sv-SE'); // Formato YYYY-MM-DD HH:mm:ss

  db.run(
    'INSERT INTO medications (patient_id, name, dosage, frequency, frequency_hours, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [patient_id, name, dosage, frequency, frequency_hours || null, now],
    function (err) {
      if (err) return res.status(500).json({ message: 'Erro ao adicionar medicamento.' });
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
    const now = new Date().toLocaleString('sv-SE');
    db.run(
      'UPDATE medications SET is_timer_running = 1, timer_started_at = ? WHERE id = ?',
      [now, id],
      function (err) {
        if (err) return res.status(500).json({ message: 'Erro ao iniciar cronômetro.' });
        res.json({ message: 'Cronômetro iniciado.', timer_started_at: now, is_timer_running: 1 });
      }
    );
  } else if (action === 'stop') {
    db.run(
      'UPDATE medications SET is_timer_running = 0, timer_started_at = NULL WHERE id = ?',
      [id],
      function (err) {
        if (err) return res.status(500).json({ message: 'Erro ao parar cronômetro.' });
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
    res.json({ message: 'Medicamento removido.' });
  });
});

// Adicionar observação
app.post('/api/observations', authenticateToken, (req, res) => {
  const { patient_id, content } = req.body;
  if (!patient_id || !content) return res.status(400).json({ message: 'Paciente e conteúdo são obrigatórios.' });

  const now = new Date().toLocaleString('sv-SE'); // Formato YYYY-MM-DD HH:mm:ss

  db.run(
    'INSERT INTO observations (patient_id, content, created_at) VALUES (?, ?, ?)',
    [patient_id, content, now],
    function (err) {
      if (err) return res.status(500).json({ message: 'Erro ao adicionar observação.' });
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
    res.json({ message: 'Observação removida.' });
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
