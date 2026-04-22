require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── In-memory cart (keyed by session id passed from client) ─────────────────
const carts = {};

// ─── Sample product catalogue ─────────────────────────────────────────────────
const products = [
  {
    id: 1,
    name: 'Wireless Noise-Cancelling Headphones',
    price: 149.99,
    description: 'Premium over-ear headphones with 30-hour battery life and active noise cancellation.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    category: 'Electronics',
  },
  {
    id: 2,
    name: 'Minimalist Leather Watch',
    price: 89.99,
    description: 'Slim Japanese-movement watch with genuine leather strap and sapphire crystal glass.',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
    category: 'Accessories',
  },
  {
    id: 3,
    name: 'Organic Cotton Tote Bag',
    price: 24.99,
    description: 'Durable, eco-friendly tote made from 100% GOTS-certified organic cotton.',
    image: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=400&q=80',
    category: 'Bags',
  },
  {
    id: 4,
    name: 'Ceramic Pour-Over Coffee Set',
    price: 54.99,
    description: 'Hand-thrown ceramic dripper and carafe set for the perfect morning brew.',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80',
    category: 'Kitchen',
  },
  {
    id: 5,
    name: 'Merino Wool Crew Sweater',
    price: 119.99,
    description: 'Ultra-soft 100% merino wool sweater, naturally temperature-regulating and odour-resistant.',
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&q=80',
    category: 'Clothing',
  },
  {
    id: 6,
    name: 'Portable Bluetooth Speaker',
    price: 69.99,
    description: 'Waterproof IPX7 speaker with 360° sound and 12-hour playtime — perfect for outdoors.',
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80',
    category: 'Electronics',
  },
  {
    id: 7,
    name: 'Bamboo Desk Organiser',
    price: 34.99,
    description: 'Sustainably sourced bamboo organiser with six compartments to keep your workspace tidy.',
    image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&q=80',
    category: 'Office',
  },
  {
    id: 8,
    name: 'Scented Soy Candle Set',
    price: 39.99,
    description: 'Set of three hand-poured soy candles in amber, cedar, and vanilla — 40 hours each.',
    image: 'https://images.unsplash.com/photo-1602607144535-11be3fe48d5e?w=400&q=80',
    category: 'Home',
  },
];

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// GET /api/cart?sessionId=<id>
app.get('/api/cart', (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });
  res.json(carts[sessionId] || []);
});

// POST /api/cart  { sessionId, productId, quantity }
app.post('/api/cart', (req, res) => {
  const { sessionId, productId, quantity = 1 } = req.body;

  if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

  const product = products.find((p) => p.id === Number(productId));
  if (!product) return res.status(404).json({ error: 'Product not found' });

  if (!carts[sessionId]) carts[sessionId] = [];

  const cart = carts[sessionId];
  const existing = cart.find((item) => item.productId === product.id);

  if (existing) {
    existing.quantity += Number(quantity);
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: Number(quantity),
    });
  }

  res.json(cart);
});

// DELETE /api/cart  { sessionId, productId }
app.delete('/api/cart', (req, res) => {
  const { sessionId, productId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

  if (carts[sessionId]) {
    carts[sessionId] = carts[sessionId].filter(
      (item) => item.productId !== Number(productId)
    );
  }

  res.json(carts[sessionId] || []);
});

// Catch-all → serve index.html (SPA fallback)
app.get('/*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Error handler ────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
