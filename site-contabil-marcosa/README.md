# Site — Marcos Alexsandro | Escritório Contábil

Site estático (HTML + CSS + JS puro, sem build). Basta subir a pasta inteira para qualquer hospedagem
(Hostinger, Netlify, Vercel, GitHub Pages, cPanel).

## Antes de publicar — checklist obrigatório

| O quê | Onde |
|---|---|
| Número do WhatsApp | `js/main.js` → constante `WHATSAPP` (formato `5581999998888`) |
| Domínio (`SEUDOMINIO.com.br`) | `index.html` (canonical, og:, JSON-LD), `robots.txt`, `sitemap.xml` |
| Endereço, telefone, e-mail, horário | `index.html` → seção `#contato`, rodapé e JSON-LD |
| CRC e CNPJ | `index.html` → rodapé |
| Foto do Marcos | salvar como `img/marcos.jpg` (retrato, ~800×1000) |
| Logo oficial | substituir `img/logo-mark.svg` (a atual é uma recriação provisória) |
| Imagem de compartilhamento | `img/og-image.jpg` (1200×630) |
| Números (300+ empresas etc.) | `index.html` → seção `.stats` — **confirmar com o cliente** |
| Depoimentos | `index.html` → seção `#depoimentos` — usar reais ou apagar a seção |

## Cores
Todas em variáveis no topo de `css/style.css` (`--yellow`, `--ink`, `--gray`...).

## Para aparecer no Google (o site sozinho não basta)
1. Criar/otimizar o **Perfil da Empresa no Google** (Google Meu Negócio) com o mesmo endereço e telefone do site — é isso que coloca o escritório no mapa de "contador perto de mim".
2. Cadastrar o domínio no **Google Search Console** e enviar o `sitemap.xml`.
3. Pedir avaliações no Google aos clientes atuais.
