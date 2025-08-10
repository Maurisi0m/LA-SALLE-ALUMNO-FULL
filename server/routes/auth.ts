import { RequestHandler } from "express";
import { UserService } from "../services/userService";

// Ruta de login
export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { matricula, password } = req.body;

    if (!matricula || !password) {
      return res.status(400).json({ 
        error: 'Matrícula y contraseña son requeridos' 
      });
    }

    const result = await UserService.login({ matricula, password });

    res.json({
      success: true,
      message: 'Login exitoso',
      data: result
    });

  } catch (error: any) {
    console.error('Error en login:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Error en autenticación'
    });
  }
};

// Ruta de perfil (requiere autenticación)
export const handleProfile: RequestHandler = async (req, res) => {
  try {
    // Aquí deberías verificar el JWT token
    const userId = req.body.userId; // Esto vendría del token JWT

    const user = await UserService.getUserProfile(userId);

    res.json({
      success: true,
      data: user
    });

  } catch (error: any) {
    console.error('Error obteniendo perfil:', error);
    res.status(404).json({
      success: false,
      error: error.message || 'Usuario no encontrado'
    });
  }
};

// Ruta de calificaciones
export const handleGrades: RequestHandler = async (req, res) => {
  try {
    const userId = req.body.userId; // Del token JWT

    const grades = await UserService.getUserGrades(userId);

    res.json({
      success: true,
      data: grades
    });

  } catch (error: any) {
    console.error('Error obteniendo calificaciones:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error obteniendo calificaciones'
    });
  }
};

// Ruta de registro
export const handleRegister: RequestHandler = async (req, res) => {
  try {
    const userData = req.body;

    const newUser = await UserService.createUser(userData);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: newUser
    });

  } catch (error: any) {
    console.error('Error en registro:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Error creando usuario'
    });
  }
};
