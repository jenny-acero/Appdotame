// models/Usuario.js

const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contraseña: { type: String, required: true },
  token: { type: String, required: false },
  role: {
    type: String,
    enum: ['adoptante', 'organizacion','admin'],
    default: 'adoptante'
  }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;


