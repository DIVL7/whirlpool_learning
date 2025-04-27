const { pool } = require('../config/database');

// Login controller
async function login(req, res) {
    try {
        const { username, password, remember } = req.body;
        
        // Validate input
        if (!username || !password) {
            return res.json({ success: false, message: 'Por favor, completa todos los campos.' });
        }
        
        // Try to get a connection to verify database is accessible
        try {
            const connection = await pool.getConnection();
            connection.release();
        } catch (dbError) {
            console.error('Database connection error in login function:', dbError);
            return res.json({ 
                success: false, 
                message: 'Error de conexión a la base de datos. Por favor, inténtalo más tarde.',
                error: dbError.message
            });
        }
        
        // Query user from database
        try {
            const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
            
            if (rows.length === 0) {
                return res.json({ success: false, message: 'Usuario o contraseña incorrectos.' });
            }
            
            const user = rows[0];
            
            // Verify password (in a real app, you should use bcrypt)
            if (password === user.password) {
                // Update last login time
                await pool.execute('UPDATE users SET last_login = NOW() WHERE user_id = ?', [user.user_id]);
                
                // Set session data
                req.session.user = {
                    user_id: user.user_id,
                    username: user.username,
                    role: user.role,
                    full_name: `${user.first_name} ${user.last_name}`
                };
                
                // Set remember me cookie if requested
                if (remember) {
                    req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
                }
                
                // Determine redirect based on role
                const redirect = user.role === 'admin' ? '/admin/dashboard.html' : '/technician/dashboard.html';
                
                return res.json({ success: true, redirect });
            } else {
                return res.json({ success: false, message: 'Usuario o contraseña incorrectos.' });
            }
        } catch (queryError) {
            console.error('Database query error details:', {
                message: queryError.message,
                code: queryError.code,
                errno: queryError.errno,
                sqlState: queryError.sqlState,
                sqlMessage: queryError.sqlMessage
            });
            return res.json({ 
                success: false, 
                message: 'Error al verificar las credenciales. Por favor, inténtalo más tarde.',
                error: queryError.message
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        return res.json({ success: false, message: 'Error en el servidor. Por favor, inténtalo más tarde.' });
    }
}

// Check session
function checkSession(req, res) {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
}

// Logout
function logout(req, res) {
    req.session.destroy();
    res.json({ success: true });
}

module.exports = {
    login,
    checkSession,
    logout
};