const { pool } = require('../config/database');

// Get technician statistics
exports.getStats = async (req, res) => {
    try {
        // Get user ID from session
        const userId = req.session.user?.user_id;
        
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }
        
        // In a production environment, this would query the database
        // For now, return simulated data
        res.json({
            success: true,
            coursesAssigned: 5,
            coursesCompleted: 2,
            certifications: 1,
            coursesTrend: '15%',
            completedTrend: '10%',
            certificationTrend: '5%',
            notifications: 3
        });
    } catch (error) {
        console.error('Error fetching technician stats:', error);
        res.status(500).json({ success: false, error: 'Error al cargar estadísticas' });
    }
};

// Get progress chart data
exports.getProgressChart = async (req, res) => {
    try {
        // Get user ID from session
        const userId = req.session.user?.user_id;
        
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }
        
        // For now, return simulated data
        res.json({
            success: true,
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [
                {
                    label: 'Lecciones Completadas',
                    data: [2, 3, 1, 4, 2, 0, 1],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Tiempo de Estudio (horas)',
                    data: [1.5, 2, 0.5, 3, 1, 0, 0.5],
                    borderColor: '#16a34a',
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    tension: 0.4
                }
            ]
        });
    } catch (error) {
        console.error('Error fetching progress chart data:', error);
        res.status(500).json({ success: false, error: 'Error al cargar datos del gráfico' });
    }
};

// Get recent activity
exports.getRecentActivity = async (req, res) => {
    try {
        // Get user ID from session
        const userId = req.session.user?.user_id;
        
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }
        
        // For now, return simulated data
        res.json({
            success: true,
            activities: [
                { description: 'Completaste la lección "Introducción a los refrigeradores"', timeAgo: 'Hace 2 horas' },
                { description: 'Obtuviste una calificación de 85% en el quiz "Componentes básicos"', timeAgo: 'Hace 1 día' },
                { description: 'Comenzaste el curso "Mantenimiento de Lavadoras"', timeAgo: 'Hace 2 días' },
                { description: 'El instructor respondió a tu pregunta en el foro', timeAgo: 'Hace 3 días' }
            ]
        });
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({ success: false, error: 'Error al cargar actividad reciente' });
    }
};

// Get upcoming courses
exports.getUpcomingCourses = async (req, res) => {
    try {
        // Get user ID from session
        const userId = req.session.user?.user_id;
        
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }
        
        // For now, return simulated data
        res.json({
            success: true,
            courses: [
                {
                    id: 1,
                    title: 'Mantenimiento de Refrigeradores',
                    description: 'Aprende a diagnosticar y reparar problemas comunes en refrigeradores.',
                    image: '../images/courses/refrigerator.jpg',
                    progress: 0,
                    startDate: '2023-06-15'
                },
                {
                    id: 2,
                    title: 'Reparación de Lavadoras',
                    description: 'Técnicas avanzadas para la reparación de lavadoras modernas.',
                    image: '../images/courses/washing-machine.jpg',
                    progress: 0,
                    startDate: '2023-06-20'
                },
                {
                    id: 3,
                    title: 'Instalación de Aires Acondicionados',
                    description: 'Guía completa para la instalación correcta de sistemas de aire acondicionado.',
                    image: '../images/courses/air-conditioner.jpg',
                    progress: 0,
                    startDate: '2023-06-25'
                }
            ]
        });
    } catch (error) {
        console.error('Error fetching upcoming courses:', error);
        res.status(500).json({ success: false, error: 'Error al cargar próximos cursos' });
    }
};

// Get technician courses
exports.getCourses = async (req, res) => {
    try {
        // Get user ID from session
        const userId = req.session.user?.user_id;
        
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }
        
        // For now, return simulated data
        res.json({
            success: true,
            courses: [
                {
                    id: 1,
                    title: 'Mantenimiento de Refrigeradores',
                    description: 'Aprende a diagnosticar y reparar problemas comunes en refrigeradores.',
                    image: '../images/courses/refrigerator.jpg',
                    progress: 75,
                    status: 'in-progress',
                    startDate: '2023-05-15',
                    endDate: '2023-07-15',
                    modules: 8,
                    completedModules: 6
                },
                {
                    id: 2,
                    title: 'Reparación de Lavadoras',
                    description: 'Técnicas avanzadas para la reparación de lavadoras modernas.',
                    image: '../images/courses/washing-machine.jpg',
                    progress: 100,
                    status: 'completed',
                    startDate: '2023-03-10',
                    endDate: '2023-05-10',
                    modules: 6,
                    completedModules: 6
                },
                {
                    id: 3,
                    title: 'Instalación de Aires Acondicionados',
                    description: 'Guía completa para la instalación correcta de sistemas de aire acondicionado.',
                    image: '../images/courses/air-conditioner.jpg',
                    progress: 0,
                    status: 'not-started',
                    startDate: '2023-06-25',
                    endDate: '2023-08-25',
                    modules: 10,
                    completedModules: 0
                }
            ]
        });
    } catch (error) {
        console.error('Error fetching technician courses:', error);
        res.status(500).json({ success: false, error: 'Error al cargar cursos' });
    }
};

// Get notifications
exports.getNotifications = async (req, res) => {
    try {
        // Get user ID from session
        const userId = req.session.user?.user_id;
        
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }
        
        // For now, return simulated data
        res.json({
            success: true,
            unreadCount: 3,
            notifications: [
                { id: 1, title: 'Nuevo curso asignado', message: 'Se te ha asignado el curso "Mantenimiento de Refrigeradores"', time: 'Hace 1 hora', read: false },
                { id: 2, title: 'Recordatorio', message: 'Tienes una evaluación pendiente para mañana', time: 'Hace 3 horas', read: false },
                { id: 3, title: 'Mensaje del instructor', message: 'El instructor ha respondido a tu pregunta en el foro', time: 'Hace 1 día', read: false },
                { id: 4, title: 'Certificación completada', message: 'Has obtenido la certificación en "Reparación básica"', time: 'Hace 1 semana', read: true }
            ]
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, error: 'Error al cargar notificaciones' });
    }
};

// Utility function - Format time ago for display
exports.formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
        return `Hace ${diffInSeconds} segundos`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `Hace ${diffInMinutes} minutos`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `Hace ${diffInHours} horas`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return `Hace ${diffInDays} días`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `Hace ${diffInMonths} meses`;
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return `Hace ${diffInYears} años`;
};