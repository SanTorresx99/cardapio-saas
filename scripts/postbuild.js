const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'out');
const TEMPLATES = path.join(OUT, '_templates');

fs.mkdirSync(TEMPLATES, { recursive: true });

// Copy [id].html to a safe path that won't match /:tenant/pedido/:id redirect rules
const src = path.join(OUT, '[tenant]', 'pedido', '[id].html');
const dest = path.join(TEMPLATES, 'order.html');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log('postbuild: copied order template to out/_templates/order.html');
} else {
  console.warn('postbuild: [id].html not found, skipping');
}
