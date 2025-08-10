import { getConnection, sql } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface User {
  id: number;
  matricula: string;
  email?: string;
  nombre?: string;
  apellido?: string;
  carrera?: string;
  semestre?: number;
  tipo_usuario: string;
}

export interface LoginCredentials {
  matricula: string;
  password: string;
}

export class UserService {
  
  // Autenticación de usuario
  static async login(credentials: LoginCredentials) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('matricula', sql.VarChar, credentials.matricula)
        .query(`
          SELECT id, matricula, email, nombre, apellido, carrera, semestre, tipo_usuario, password
          FROM usuarios 
          WHERE matricula = @matricula
        `);

      if (result.recordset.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      const user = result.recordset[0];
      
      // Verificar contraseña (si tienes bcrypt habilitado)
      // const isValidPassword = await bcrypt.compare(credentials.password, user.password);
      // Por ahora comparación simple para desarrollo:
      const isValidPassword = credentials.password === user.password;
      
      if (!isValidPassword) {
        throw new Error('Contraseña incorrecta');
      }

      // Generar JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          matricula: user.matricula,
          tipo_usuario: user.tipo_usuario 
        },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      );

      // Remover password del objeto de respuesta
      const { password, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        token
      };

    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  // Obtener perfil de usuario
  static async getUserProfile(userId: number): Promise<User> {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT id, matricula, email, nombre, apellido, carrera, semestre, tipo_usuario
          FROM usuarios 
          WHERE id = @userId
        `);

      if (result.recordset.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      return result.recordset[0];
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      throw error;
    }
  }

  // Obtener calificaciones del usuario
  static async getUserGrades(userId: number) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT 
            m.codigo,
            m.nombre as materia,
            m.creditos,
            c.parcial1,
            c.parcial2,
            c.parcial3,
            c.final
          FROM calificaciones c
          INNER JOIN materias m ON c.materia_id = m.id
          WHERE c.usuario_id = @userId
        `);

      return result.recordset;
    } catch (error) {
      console.error('Error obteniendo calificaciones:', error);
      throw error;
    }
  }

  // Crear nuevo usuario (registro)
  static async createUser(userData: Partial<User> & { password: string }) {
    try {
      const pool = await getConnection();
      
      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const result = await pool.request()
        .input('matricula', sql.VarChar, userData.matricula)
        .input('email', sql.VarChar, userData.email)
        .input('password', sql.VarChar, hashedPassword)
        .input('nombre', sql.VarChar, userData.nombre)
        .input('apellido', sql.VarChar, userData.apellido)
        .input('carrera', sql.VarChar, userData.carrera)
        .input('semestre', sql.Int, userData.semestre)
        .input('tipo_usuario', sql.VarChar, userData.tipo_usuario || 'estudiante')
        .query(`
          INSERT INTO usuarios (matricula, email, password, nombre, apellido, carrera, semestre, tipo_usuario)
          OUTPUT INSERTED.id, INSERTED.matricula, INSERTED.email, INSERTED.nombre, INSERTED.apellido, INSERTED.carrera, INSERTED.semestre, INSERTED.tipo_usuario
          VALUES (@matricula, @email, @password, @nombre, @apellido, @carrera, @semestre, @tipo_usuario)
        `);

      return result.recordset[0];
    } catch (error) {
      console.error('Error creando usuario:', error);
      throw error;
    }
  }
}
