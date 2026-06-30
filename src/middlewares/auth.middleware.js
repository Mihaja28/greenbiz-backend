const jwt = require('jsonwebtoken');

// vérifier si l'utilisateur est connecté (Vérification du Token JWT)
const protect = async (req, res, next) => {
  let token;

  // vérifie le token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // On extrait le token du texte "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // décode le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_cle_secrete_par_defaut');

     
      req.user = decoded;

      return next(); //  Autorisé ! On passe au contrôleur suivant
    } catch (error) {
      return res.status(401).json({ message: "Session expirée ou non autorisée. Veuillez vous reconnecter." });
    }
  }

  // Si aucun token n'a été trouvé
  if (!token) {
    return res.status(401).json({ message: "Accès refusé. Aucun token d'authentification fourni." });
  }
};

// restreindre l'accès selon les rôles (ex: réservé à l'admin)
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // req.user a été créé juste avant par le middleware 'protect'
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: "Action interdite. Vous n'avez pas les permissions nécessaires pour faire cela." 
      });
    }
    next(); //  Le rôle correspond, on passe à la suite
  };
};

module.exports = {
  protect,
  restrictTo
};