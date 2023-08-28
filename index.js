const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '1234',
  port: 5432,
});

app.use(bodyParser.json());

app.use(cors({
    origin: "http://localhost:3001" // Substitua pelo seu domínio
  }));

// Rota de login
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }
  
    const client = await pool.connect();
  
    try {
      const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }
  
      const user = result.rows[0];
  
      if (password === user.password_hash) { // Comparação direta para fins de depuração
        console.log("Password matched!"); // Temporarily log the password match
        res.json({ message: 'Login successful.' });
      } else {
        res.status(401).json({ error: 'Invalid password.' });
      }
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Internal server error.' });
    } finally {
      client.release();
    }
  });
  
  
  
// Rota para criar um novo endpoint
app.post('/create-endpoint', async (req, res) => {
  const { path, method, response } = req.body;

  if (!path || !method || !response) {
    return res.status(400).json({ error: 'Path, method, and response are required.' });
  }

  const client = await pool.connect();

  try {
    // Substitua 'user_id' pelo ID do usuário autenticado
    const user_id = 1; // Exemplo: usuário com ID 1

    const userExists = await client.query('SELECT id FROM users WHERE id = $1', [user_id]);

    if (userExists.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await client.query(
      'INSERT INTO endpoints (user_id, path, method, response) VALUES ($1, $2, $3, $4)',
      [user_id, path, method, response]
    );

    res.status(201).json({ message: 'Endpoint created successfully.' });
  } catch (error) {
    console.error('Error creating endpoint:', error);
    res.status(500).json({ error: 'Internal server error.' });
  } finally {
    client.release();
  }
});

app.delete('/delete-endpoint/:id', async (req, res) => {
    const endpointId = req.params.id;
  
    const client = await pool.connect();
  
    try {
      // Verificar se o endpoint com o ID fornecido existe
      const endpointExists = await client.query('SELECT * FROM endpoints WHERE id = $1', [endpointId]);
      if (endpointExists.rows.length === 0) {
        return res.status(404).json({ error: 'Endpoint not found.' });
      }
  
      // Excluir o endpoint
      await client.query('DELETE FROM endpoints WHERE id = $1', [endpointId]);
  
      res.status(200).json({ message: 'Endpoint deleted successfully.' });
    } catch (error) {
      console.error('Error deleting endpoint:', error);
      res.status(500).json({ error: 'Internal server error.' });
    } finally {
      client.release();
    }
  });

app.put('/edit-endpoint/:id', async (req, res) => {
    const endpointId = req.params.id;
    const { path, method, response } = req.body;
  
    if (!path || !method || !response) {
      return res.status(400).json({ error: 'Path, method, and response are required.' });
    }
  
    const client = await pool.connect();
  
    try {
      // Verificar se o endpoint com o ID fornecido existe
      const endpointExists = await client.query('SELECT * FROM endpoints WHERE id = $1', [endpointId]);
      if (endpointExists.rows.length === 0) {
        return res.status(404).json({ error: 'Endpoint not found.' });
      }
  
      // Atualizar o endpoint
      await client.query(
        'UPDATE endpoints SET path = $1, method = $2, response = $3 WHERE id = $4',
        [path, method, response, endpointId]
      );
  
      res.status(200).json({ message: 'Endpoint updated successfully.' });
    } catch (error) {
      console.error('Error updating endpoint:', error);
      res.status(500).json({ error: 'Internal server error.' });
    } finally {
      client.release();
    }
  });
  

app.get('/endpoints', async (req, res) => {
    const client = await pool.connect();
  
    try {
      const result = await client.query('SELECT * FROM endpoints');
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching endpoints:', error);
      res.status(500).json({ error: 'Internal server error.' });
    } finally {
      client.release();
    }
  });



// Rota para lidar com solicitações de endpoints
app.use(async (req, res) => {
  const { method, path } = req;
  const client = await pool.connect();

  try {
    const result = await client.query(
      'SELECT response FROM endpoints WHERE path = $1 AND method = $2',
      [path, method]
    );

    if (result.rows.length > 0) {
      res.json(result.rows[0].response);
    } else {
      res.status(404).json({ error: 'Endpoint not found.' });
    }
  } catch (error) {
    console.error('Error fetching endpoint:', error);
    res.status(500).json({ error: 'Internal server error.' });
  } finally {
    client.release();
  }
});



app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
