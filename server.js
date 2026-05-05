const express    = require('express');
const nodemailer = require('nodemailer');
const cors       = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares ───────────────────────────────────────────
app.use(cors());         // Autorise ton site GitHub Pages à appeler ce serveur
app.use(express.json()); // Parse le JSON du body

// ── Config SMTP ───────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   'mail.cruzinformatics.ch',
  port:   465,
  secure: true,
  auth: {
    user: 'contact@cruzinformatics.ch',
    pass: process.env.SMTP_PASS   // Variable d'env dans Render — jamais en dur
  }
});

// ── Vérif connexion SMTP au démarrage ─────────────────────
transporter.verify((err) => {
  if (err) console.error('SMTP error:', err.message);
  else     console.log('SMTP ready');
});

// ── Route GET / — health check pour Render ────────────────
app.get('/', (_, res) => res.json({ status: 'ok' }));

// ── Route POST /contact ───────────────────────────────────
app.post('/contact', async (req, res) => {
  const { name, email, service, message } = req.body;

  // Validation
  if (!name || !email || !service) {
    return res.status(400).json({ error: 'Champs manquants.' });
  }

  try {
    await transporter.sendMail({
      from:    '"CruzInformatics" <contact@cruzinformatics.ch>',
      to:      'contact@cruzinformatics.ch',
      replyTo: email,
      subject: `Demande — ${service}`,
      text: `Nom : ${name}\nEmail : ${email}\nService : ${service}\n\nMessage :\n${message || '(aucun)'}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:580px;padding:24px;background:#f4f4f8;border-radius:8px;">
          <h2 style="color:#7c3aed;margin:0 0 4px">Nouvelle demande</h2>
          <p style="color:#888;font-size:13px;margin:0 0 20px">cruzinformatics.ch</p>
          <table style="font-size:15px;width:100%;border-collapse:collapse">
            <tr><td style="color:#888;padding:6px 0;width:110px">Nom</td>      <td style="font-weight:600">${name}</td></tr>
            <tr><td style="color:#888;padding:6px 0">Email</td>    <td><a href="mailto:${email}" style="color:#2563eb">${email}</a></td></tr>
            <tr><td style="color:#888;padding:6px 0">Service</td>  <td style="color:#7c3aed;font-weight:600">${service}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #ddd;margin:16px 0">
          <p style="color:#888;font-size:13px;margin:0 0 8px">Message</p>
          <p style="background:#fff;padding:14px;border-left:3px solid #7c3aed;border-radius:4px;margin:0">
            ${message ? message.replace(/\n/g, '<br>') : '<em style="color:#aaa">Aucun message</em>'}
          </p>
        </div>`
    });

    console.log(`Mail envoyé — ${name} <${email}>`);
    res.json({ success: true });

  } catch (err) {
    console.error('Erreur mail:', err.message);
    res.status(500).json({ error: 'Échec envoi email.' });
  }
});

// ── Démarrage ─────────────────────────────────────────────
app.listen(PORT, () => console.log(`Serveur sur port ${PORT}`));
