const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors()); // Permet les requêtes depuis d'autres domaines
app.use(express.json()); // Parse le JSON du corps des requêtes

// Configuration du transporteur SMTP
// Le mot de passe est lu depuis les variables d'environnement
const transporter = nodemailer.createTransport({
  host: 'mail.cruzinformatics.ch',
  port: 465,
  secure: true, // true pour le port 465, false pour les autres ports
  auth: {
    user: 'contact@cruzinformatics.ch',
    pass: process.env.SMTP_PASS // Mot de passe depuis variable d'environnement
  }
});

// Endpoint pour recevoir les données du formulaire
app.post('/send', async (req, res) => {
  try {
    const { nom, email, message } = req.body;

    // Validation des données reçues
    if (!nom || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tous les champs sont requis : nom, email, message' 
      });
    }

    // Configuration de l'email à envoyer
    const mailOptions = {
      from: `"Formulaire Contact" <contact@cruzinformatics.ch>`, // Expéditeur
      to: 'contact@cruzinformatics.ch', // Destinataire (toi)
      replyTo: email, // Répondre à l'utilisateur
      subject: `Nouveau message de ${nom}`, // Sujet de l'email
      text: `
        📧 Nouveau message depuis le formulaire de contact
        
        👤 Nom: ${nom}
        📨 Email: ${email}
        
        💬 Message:
        ${message}
        
        ---
        Cet email a été envoyé automatiquement.
      `, // Version texte
      html: `
        <h2>📧 Nouveau message depuis le formulaire de contact</h2>
        
        <p><strong>👤 Nom:</strong> ${nom}</p>
        <p><strong>📨 Email:</strong> ${email}</p>
        
        <p><strong>💬 Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        
        <hr>
        <small>Cet email a été envoyé automatiquement.</small>
      ` // Version HTML
    };

    // Envoi de l'email
    await transporter.sendMail(mailOptions);

    // Réponse de succès
    res.status(200).json({ 
      success: true, 
      message: 'Votre message a été envoyé avec succès !' 
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi :', error);
    
    // Réponse d'erreur
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'envoi du message. Veuillez réessayer.' 
    });
  }
});

// Route de test pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Serveur de formulaire de contact opérationnel' 
  });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`📧 Service email configuré pour contact@cruzinformatics.ch`);
});