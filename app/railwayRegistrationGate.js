// Added by the Railway template: public sign-up stays closed unless the deployer opts in.
// The admin account is created on first boot from ADMIN_USERNAME / ADMIN_PASSWORD.
const railwayRegistrationGate = (req, res, next) => {
  if (String(process.env.ALLOW_REGISTRATION || '').trim().toLowerCase() === 'true') {
    return next();
  }
  return res.status(403).json({
    message: 'Registration is closed on this server. Ask the administrator to enable it (ALLOW_REGISTRATION=true).'
  });
};

export default railwayRegistrationGate;
