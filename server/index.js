const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const db = new DatabaseSync(path.join(__dirname, 'computer.db'));

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use('/uploads', express.static(uploadDir));

function initDb() {
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      address TEXT
    );
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      specs TEXT,
      location TEXT,
      deliveryMode TEXT,
      deliveryPrice REAL,
      hidden INTEGER DEFAULT 0,
      ownerId INTEGER,
      rating REAL,
      createdAt TEXT
    );
    CREATE TABLE IF NOT EXISTS product_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productId INTEGER,
      path TEXT
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      status TEXT,
      total REAL,
      createdAt TEXT
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId INTEGER,
      productId INTEGER,
      quantity INTEGER,
      price REAL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      senderId INTEGER,
      recipientId INTEGER,
      productId INTEGER,
      text TEXT,
      createdAt TEXT
    );
  `);

  const row = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (row.count === 0) {
    const seedUsers = [
      { name: 'Администратор', email: 'admin@computer.store', password: 'admin', role: 'admin', address: 'Москва, Цветной бульвар' },
      { name: 'Менеджер', email: 'manager@computer.store', password: 'manager', role: 'manager', address: 'Санкт-Петербург, Невский проспект' },
      { name: 'Антон', email: 'user@computer.store', password: 'user', role: 'user', address: 'Екатеринбург, Малышева 20' }
    ];
    const stmt = db.prepare('INSERT INTO users (name, email, password, role, address) VALUES (?, ?, ?, ?, ?)');
    for (const u of seedUsers) stmt.run(u.name, u.email, u.password, u.role, u.address);
  }

  const catRow = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (catRow.count === 0) {
    const cats = [
      'Ноутбуки',
      'ПК',
      'Процессоры',
      'Видеокарты',
      'Материнские платы',
      'Оперативная память',
      'SSD и HDD',
      'Системы охлаждения',
      'Мониторы',
      'Периферия'
    ];
    const stmt = db.prepare('INSERT INTO categories (name) VALUES (?)');
    for (const c of cats) stmt.run(c);
  }

  const productRow = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (productRow.count === 0) {
    const insertProduct = db.prepare(
      'INSERT INTO products (name, category, price, stock, description, specs, location, deliveryMode, deliveryPrice, hidden, ownerId, rating, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const insertPhoto = db.prepare('INSERT INTO product_photos (productId, path) VALUES (?, ?)');

    const seedProducts = [
      {
        name: 'Ноутбук Aurora Pro 15',
        category: 'Ноутбуки',
        price: 119900,
        stock: 8,
        description: 'Профессиональный ноутбук для разработчиков и дизайнеров с дисплеем 2.8K и автономностью до 12 часов.',
        specs: 'Intel Core i7 14-го поколения;32 ГБ RAM;1 ТБ NVMe;RTX 4070 8 ГБ',
        location: 'Москва, Цветной бульвар',
        deliveryMode: 'any',
        deliveryPrice: 1500,
        hidden: 0,
        ownerId: 3,
        rating: 4.8,
        photos: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80']
      },
      {
        name: 'Игровой ПК Hyperion X',
        category: 'ПК',
        price: 179900,
        stock: 5,
        description: 'Мощная станция для 4K-гейминга и VR с поддержкой трассировки лучей.',
        specs: 'AMD Ryzen 9 7900X;64 ГБ RAM;2 ТБ NVMe;GeForce RTX 4080 16 ГБ',
        location: 'Санкт-Петербург, Васильевский остров',
        deliveryMode: 'delivery',
        deliveryPrice: 2500,
        hidden: 0,
        ownerId: 2,
        rating: 4.9,
        photos: ['https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80']
      }
    ];

    for (const product of seedProducts) {
      const createdAt = new Date().toISOString();
      const res = insertProduct.run(
        product.name,
        product.category,
        product.price,
        product.stock,
        product.description,
        product.specs,
        product.location,
        product.deliveryMode,
        product.deliveryPrice,
        product.hidden,
        product.ownerId,
        product.rating,
        createdAt
      );
      for (const p of product.photos) insertPhoto.run(res.lastInsertRowid, p);
    }
  }
}

function toToken(user) {
  return `token-${user.id}-${Buffer.from(user.email).toString('hex')}`;
}

function userFromRequest(req) {
  const header = req.headers.authorization;
  if (!header) return null;
  const token = header.replace('Bearer ', '');
  const match = token.match(/^token-(\d+)-/);
  if (!match) return null;
  const id = Number(match[1]);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return user || null;
}

function productWithPhotos(raw) {
  const photos = db.prepare('SELECT path FROM product_photos WHERE productId = ?').all(raw.id).map((p) => p.path);
  return { ...raw, photos };
}

function savePhotos(productId, photos) {
  if (!photos || !Array.isArray(photos)) return [];
  const saved = [];
  for (const photo of photos) {
    if (typeof photo !== 'string') continue;
    if (photo.startsWith('data:image')) {
      const base64 = photo.split(',')[1];
      const buffer = Buffer.from(base64, 'base64');
      const fileName = `photo_${productId}_${Date.now()}_${Math.random().toString(16).slice(2)}.png`;
      const dest = path.join(uploadDir, fileName);
      fs.writeFileSync(dest, buffer);
      const rel = `/uploads/${fileName}`;
      db.prepare('INSERT INTO product_photos (productId, path) VALUES (?, ?)').run(productId, rel);
      saved.push(rel);
    } else {
      db.prepare('INSERT INTO product_photos (productId, path) VALUES (?, ?)').run(productId, photo);
      saved.push(photo);
    }
  }
  return saved;
}

initDb();

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, address } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Заполните все поля' });
  const exists = db.prepare('SELECT 1 FROM users WHERE lower(email) = lower(?)').get(email);
  if (exists) return res.status(400).json({ message: 'Пользователь уже есть' });
  const result = db.prepare('INSERT INTO users (name, email, password, role, address) VALUES (?, ?, ?, ?, ?)').run(name, email, password, 'user', address ?? '');
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.json({ user, token: toToken(user) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE lower(email) = lower(?) AND password = ?').get(email, password);
  if (!user) return res.status(401).json({ message: 'Неверный логин или пароль' });
  res.json({ user, token: toToken(user) });
});

app.get('/api/auth/me', (req, res) => {
  const user = userFromRequest(req);
  if (!user) return res.status(401).end();
  res.json(user);
});

app.put('/api/auth/profile', (req, res) => {
  const user = userFromRequest(req);
  if (!user) return res.status(401).end();
  const { name, address } = req.body;
  db.prepare('UPDATE users SET name = ?, address = ? WHERE id = ?').run(name ?? user.name, address ?? '', user.id);
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  res.json(updated);
});

app.get('/api/categories', (req, res) => {
  const list = db.prepare('SELECT name FROM categories ORDER BY name').all().map((c) => c.name);
  res.json(list);
});

app.get('/api/products', (req, res) => {
  const viewer = userFromRequest(req);
  const { term = '', category } = req.query;
  const queryParts = ['1=1'];
  const params = [];
  if (term) {
    queryParts.push('(lower(name) LIKE ? OR lower(description) LIKE ?)');
    params.push(`%${term.toString().toLowerCase()}%`, `%${term.toString().toLowerCase()}%`);
  }
  if (category) {
    queryParts.push('category = ?');
    params.push(category.toString());
  }
  if (!viewer || (viewer.role !== 'admin' && viewer.role !== 'manager')) {
    queryParts.push('(hidden = 0 OR ownerId = ?)');
    params.push(viewer?.id ?? -1);
  }
  const rows = db.prepare(`SELECT * FROM products WHERE ${queryParts.join(' AND ')} ORDER BY createdAt DESC`).all(...params);
  res.json(rows.map(productWithPhotos));
});

app.get('/api/products/:id', (req, res) => {
  const viewer = userFromRequest(req);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).end();
  if (product.hidden && viewer && product.ownerId !== viewer.id && viewer.role !== 'admin' && viewer.role !== 'manager') {
    return res.status(403).end();
  }
  res.json(productWithPhotos(product));
});

app.post('/api/products', (req, res) => {
  const user = userFromRequest(req);
  if (!user) return res.status(401).end();
  const body = req.body;
  const createdAt = new Date().toISOString();
  const result = db
    .prepare(
      'INSERT INTO products (name, category, price, stock, description, specs, location, deliveryMode, deliveryPrice, hidden, ownerId, rating, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      body.name,
      body.category,
      Number(body.price) || 0,
      Number(body.stock) || 0,
      body.description ?? '',
      body.specs ?? '',
      body.location ?? '',
      body.deliveryMode ?? 'pickup',
      body.deliveryPrice ? Number(body.deliveryPrice) : null,
      Number(body.hidden ?? 0),
      user.id,
      4.7,
      createdAt
    );
  const productId = result.lastInsertRowid;
  savePhotos(productId, body.photos);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  res.json(productWithPhotos(product));
});

app.put('/api/products/:id', (req, res) => {
  const user = userFromRequest(req);
  if (!user) return res.status(401).end();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).end();
  if (user.role !== 'admin' && user.role !== 'manager' && product.ownerId !== user.id) return res.status(403).end();
  const body = req.body;
  db
    .prepare(
      'UPDATE products SET name=?, category=?, price=?, stock=?, description=?, specs=?, location=?, deliveryMode=?, deliveryPrice=?, hidden=? WHERE id = ?'
    )
    .run(
      body.name ?? product.name,
      body.category ?? product.category,
      body.price ? Number(body.price) : product.price,
      body.stock ? Number(body.stock) : product.stock,
      body.description ?? product.description,
      body.specs ?? product.specs,
      body.location ?? product.location,
      body.deliveryMode ?? product.deliveryMode,
      body.deliveryPrice ? Number(body.deliveryPrice) : product.deliveryPrice,
      body.hidden !== undefined ? Number(body.hidden) : product.hidden,
      product.id
    );
  savePhotos(product.id, body.photos);
  const productRow = db.prepare('SELECT * FROM products WHERE id = ?').get(product.id);
  res.json(productWithPhotos(productRow));
});

app.post('/api/products/:id/visibility', (req, res) => {
  const user = userFromRequest(req);
  if (!user) return res.status(401).end();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).end();
  if (user.role !== 'admin' && user.role !== 'manager' && product.ownerId !== user.id) return res.status(403).end();
  db.prepare('UPDATE products SET hidden = ? WHERE id = ?').run(Number(!!req.body.hidden), product.id);
  res.json(productWithPhotos(db.prepare('SELECT * FROM products WHERE id = ?').get(product.id)));
});

app.post('/api/orders', (req, res) => {
  const user = userFromRequest(req);
  if (!user) return res.status(401).end();
  const items = req.body.items || [];
  if (!items.length) return res.status(400).json({ message: 'Корзина пустая' });
  let total = 0;
  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId);
    if (!product) continue;
    total += (item.quantity || 1) * product.price;
  }
  const createdAt = new Date().toISOString();
  const orderRes = db.prepare('INSERT INTO orders (userId, status, total, createdAt) VALUES (?, ?, ?, ?)').run(user.id, 'created', total, createdAt);
  const insertItem = db.prepare('INSERT INTO order_items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)');
  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId);
    if (!product) continue;
    insertItem.run(orderRes.lastInsertRowid, item.productId, item.quantity || 1, product.price);
  }
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderRes.lastInsertRowid);
  res.json({ ...order, items });
});

app.get('/api/orders', (req, res) => {
  const user = userFromRequest(req);
  if (!user) return res.status(401).end();
  let rows;
  if (user.role === 'admin' || user.role === 'manager') {
    rows = db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all();
  } else {
    rows = db.prepare('SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC').all(user.id);
  }
  const itemsStmt = db.prepare('SELECT * FROM order_items WHERE orderId = ?');
  const result = rows.map((o) => ({ ...o, items: itemsStmt.all(o.id) }));
  res.json(result);
});

app.patch('/api/orders/:id/status', (req, res) => {
  const user = userFromRequest(req);
  if (!user) return res.status(401).end();
  if (user.role !== 'admin' && user.role !== 'manager') return res.status(403).end();
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(req.body.status, req.params.id);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  const items = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(order.id);
  res.json({ ...order, items });
});

app.post('/api/messages', (req, res) => {
  const user = userFromRequest(req);
  if (!user) return res.status(401).end();
  const { recipientId, productId, text } = req.body;
  const createdAt = new Date().toISOString();
  db.prepare('INSERT INTO messages (senderId, recipientId, productId, text, createdAt) VALUES (?, ?, ?, ?, ?)').run(user.id, recipientId, productId, text, createdAt);
  res.json({ senderId: user.id, recipientId, productId, text, createdAt });
});

app.get('/api/messages', (req, res) => {
  const user = userFromRequest(req);
  if (!user) return res.status(401).end();
  const messages = db
    .prepare('SELECT * FROM messages WHERE senderId = ? OR recipientId = ? ORDER BY createdAt DESC')
    .all(user.id, user.id);
  res.json(messages);
});

app.get('/api/users', (req, res) => {
  const user = userFromRequest(req);
  if (!user || user.role !== 'admin') return res.status(403).end();
  const users = db.prepare('SELECT * FROM users').all();
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const user = userFromRequest(req);
  if (!user || user.role !== 'admin') return res.status(403).end();
  const { name, email, password, role, address } = req.body;
  const result = db
    .prepare('INSERT INTO users (name, email, password, role, address) VALUES (?, ?, ?, ?, ?)')
    .run(name, email, password, role ?? 'user', address ?? '');
  const added = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.json(added);
});

app.patch('/api/users/:id/role', (req, res) => {
  const user = userFromRequest(req);
  if (!user || user.role !== 'admin') return res.status(403).end();
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(req.body.role, req.params.id);
  res.json(db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API запущено на ${PORT}`));
