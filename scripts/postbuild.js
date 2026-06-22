const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'out');

// Copia os HTMLs do burguer-do-joao para arquivos _shell*.html na raiz do out/
// Esses arquivos não têm trailing slash então não casam com /:tenant/ (sem loop)
const shells = [
  ['burguer-do-joao/index.html',              '_shell.html'],
  ['burguer-do-joao/carrinho/index.html',     '_shell-carrinho.html'],
  ['burguer-do-joao/pedido/index.html',       '_shell-pedido.html'],
  ['burguer-do-joao/pedido/sucesso/index.html','_shell-sucesso.html'],
];

for (const [src, dest] of shells) {
  const srcPath = path.join(OUT, src);
  const destPath = path.join(OUT, dest);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`postbuild: ${src} → ${dest}`);
  } else {
    console.warn(`postbuild: ${src} não encontrado`);
  }
}
