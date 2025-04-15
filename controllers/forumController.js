const { pool } = require('../config/database');

// Get forum categories
exports.getCategories = async (req, res) => {
    try {
        // For now, return simulated data
        res.json([
            { category_id: 1, name: 'Refrigeradores', description: 'Discusiones sobre reparación y mantenimiento de refrigeradores' },
            { category_id: 2, name: 'Lavadoras', description: 'Preguntas y respuestas sobre lavadoras' },
            { category_id: 3, name: 'Aires Acondicionados', description: 'Todo sobre instalación y reparación de aires acondicionados' },
            { category_id: 4, name: 'General', description: 'Temas generales sobre electrodomésticos Whirlpool' }
        ]);
    } catch (error) {
        console.error('Error fetching forum categories:', error);
        res.status(500).json({ success: false, error: 'Error al cargar categorías del foro' });
    }
};

// Get forum questions
exports.getQuestions = async (req, res) => {
    try {
        const categoryId = req.query.category_id;
        
        // For now, return simulated data
        let questions = [
            { 
                id: 1, 
                title: 'Problema con el compresor del refrigerador', 
                content: 'Estoy teniendo problemas con el compresor de un refrigerador modelo XYZ...', 
                author: 'Juan Pérez', 
                date: '2023-06-01', 
                category_id: 1, 
                category_name: 'Refrigeradores',
                replies: 3,
                views: 45
            },
            { 
                id: 2, 
                title: 'Lavadora no centrifuga correctamente', 
                content: 'Tengo una lavadora que no está centrifugando bien...', 
                author: 'María López', 
                date: '2023-06-02', 
                category_id: 2, 
                category_name: 'Lavadoras',
                replies: 5,
                views: 67
            },
            { 
                id: 3, 
                title: 'Instalación de aire acondicionado split', 
                content: 'Necesito consejos para instalar un aire acondicionado split...', 
                author: 'Carlos Rodríguez', 
                date: '2023-06-03', 
                category_id: 3, 
                category_name: 'Aires Acondicionados',
                replies: 2,
                views: 38
            }
        ];
        
        // Filter by category if provided
        if (categoryId) {
            questions = questions.filter(q => q.category_id.toString() === categoryId);
        }
        
        res.json(questions);
    } catch (error) {
        console.error('Error fetching forum questions:', error);
        res.status(500).json({ success: false, error: 'Error al cargar preguntas del foro' });
    }
};

// Create a new forum question
exports.createQuestion = async (req, res) => {
    try {
        const { title, content, category_id } = req.body;
        const userId = req.session.user?.user_id;
        
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }
        
        if (!title || !content || !category_id) {
            return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
        }
        
        // In a real implementation, this would insert into the database
        // For now, return a success message
        res.json({
            success: true,
            message: 'Pregunta creada correctamente',
            question: {
                id: Math.floor(Math.random() * 1000), // Simulated ID
                title,
                content,
                category_id,
                author: req.session.user.username,
                date: new Date().toISOString().split('T')[0],
                replies: 0,
                views: 0
            }
        });
    } catch (error) {
        console.error('Error creating forum question:', error);
        res.status(500).json({ success: false, error: 'Error al crear la pregunta' });
    }
};