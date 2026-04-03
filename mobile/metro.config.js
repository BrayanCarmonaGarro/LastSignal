const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@': './src',      // @ → mobile/src/ (para imports actuales)
  '@api': '../api',  // @api/ → api/ (para acceder a API)
};

module.exports = config;

