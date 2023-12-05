require("dotenv-safe").config();
const jwt = require('jsonwebtoken');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

// Conexão com o banco de dados MySQL
const mysql = require('mysql');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'testeusuario',
  password: 'testesenha',
  database: 'n3_ss'
});

db.connect((err) => {
  if (err) {
    console.log('Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('Conexão bem-sucedida ao banco de dados');
  }
});

// Rota protegida por token
app.get('/endpoint-protegido', verifyJWT, (req, res) => {
  console.log("Retorno do endpoint protegido....");
  res.json({ message: "Este é um endpoint protegido", userId: req.userId });
});

// Middleware para verificar o token JWT
function verifyJWT(req, res, next) {
  const token = req.headers['x-access-token'];
  console.log('Token recebido:', token); //log para verificar o token recebido
  if (!token) return res.status(401).json({ auth: false, message: 'Não há token' });

  jwt.verify(token, process.env.SECRET, function (err, decoded) {
    if (err) {
      console.error('Erro na verificação do token:', err);
      return res.status(500).json({ auth: false, message: 'Erro com a Autenticação do Token' })
    }

    // se tudo estiver ok, salva no request para uso posterior
    req.userId = decoded.id;
    next();
  });
}



// Rota para obter todos os componentes
app.get('/componentes', verifyJWT, (req, res) => {
  db.query('SELECT * FROM componentes', (err, result) => {
    if (err) throw err;
    res.json(result);
  });
});

// Rota para obter componentes por categoria
app.get('/componentes/:categoria', verifyJWT, (req, res) => {
  const categoria = req.params.categoria;
  db.query('SELECT * FROM componentes WHERE categoria = ?', [categoria], (err, result) => {
    if (err) throw err;
    res.json(result);
  });
});

// Rota para obter componentes por equipamento
app.get('/equipamentos/:id/equipamento-componentes', verifyJWT, (req, res) => {
  const equipamentoId = req.params.id;
  db.query('SELECT * FROM componentes WHERE equipamentoId = ?', [equipamentoId], (err, result) => {
    if (err) throw err;
    res.json(result);
  });
});

// Rota para adicionar um componente
app.post('/componentes/add', verifyJWT, (req, res) => {
  const { codigo_componente, nome_componente, desc_componente, categoria, equipamentoId } = req.body;
  db.query(
    'INSERT INTO componentes (codigo_componente, nome_componente, desc_componente, categoria, equipamentoId) VALUES (?, ?, ?, ?, ?)',
    [codigo_componente, nome_componente, desc_componente, categoria, equipamentoId],
    (err, result) => {
      if (err) throw err;
      res.json({ message: 'Componente adicionado com sucesso!' });
    }
  );
});

// Update por ID
app.put('/componentes/update/:id', verifyJWT, (req, res) => {
  const componentId = req.params.id;
  const { codigo_componente, nome_componente, desc_componente, categoria, equipamentoId } = req.body;
  db.query(
    'UPDATE componentes SET codigo_componente=?, nome_componente=?, desc_componente=?, categoria=?, equipamentoId=? WHERE id_componente=?',
    [codigo_componente, nome_componente, desc_componente, categoria, equipamentoId, componentId],
    (err, result) => {
      if (err) throw err;
      res.json({ message: 'Componente atualizado com sucesso!' });
    }
  );
});

// Delete por ID
app.delete('/componentes/delete/:id', verifyJWT, (req, res) => {
  const componentId = req.params.id;
  db.query('DELETE FROM componentes WHERE id_componente=?', [componentId], (err, result) => {
    if (err) throw err;
    res.json({ message: 'Componente excluído com sucesso!' });
  });
});

// Rota para autenticação (login)
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Verificação fictícia de credenciais 
  if (username === 'vitor' && password === '123') {
    // Se as credenciais são válidas, gera um token JWT
    const id = 1;
    const token = jwt.sign({ id }, process.env.SECRET, {
      expiresIn: 1200 // expira em  5min
    });
    res.json({ auth: true, token: token });
  } else {
    // Credenciais inválidas
    res.status(401).json({ auth: false, message: 'Credenciais inválidas' });
  }
});


const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor em execução na porta ${PORT}...`);
});
