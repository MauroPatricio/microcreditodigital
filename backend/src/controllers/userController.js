import User from '../models/User.js';

// @desc    Obter todos os utilizadores da instituição
// @route   GET /api/users
// @access  Private (Admin/Owner)
export const getUsers = async (req, res) => {
    try {
        const query = req.user.role === 'super_admin' ? {} : { institution: req.institutionId };
        
        const users = await User.find(query).select('-password').sort({ createdAt: -1 });

        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error("GET USERS ERROR:", error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar utilizadores',
            error: error.message,
            stack: error.stack
        });
    }
};

// @desc    Obter um utilizador específico
// @route   GET /api/users/:id
// @access  Private (Admin/Owner)
export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilizador não encontrado' });
        }

        // Verificar permissão
        if (req.user.role !== 'super_admin' && user.institution.toString() !== req.institutionId.toString()) {
            return res.status(403).json({ success: false, message: 'Sem permissão para aceder a este utilizador' });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar utilizador',
            error: error.message
        });
    }
};

// @desc    Criar novo utilizador (Admin/Owner)
// @route   POST /api/users
// @access  Private (Admin/Owner)
export const createUser = async (req, res) => {
    try {
        const { name, email, phone, password, identityDocument, dateOfBirth, role, isActive } = req.body;

        // Validar role permitido
        const allowedRoles = ['agent', 'manager', 'admin', 'representative', 'supervisor', 'client'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ success: false, message: 'Perfil inválido' });
        }

        // Verificar se usuário já existe
        if (email) {
            const existingEmail = await User.findOne({ email });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Conta já existe'
                });
            }
        }

        const matchCriteria = [{ phone }, { identityDocument }];
        const existingUser = await User.findOne({ $or: matchCriteria });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Já existe um utilizador com este telefone ou BI'
            });
        }

        const user = await User.create({
            name,
            email,
            phone,
            password,
            identityDocument: identityDocument || ('ID-' + Date.now() + Math.floor(Math.random() * 1000)),
            nuit: 'N/A-' + Date.now() + Math.floor(Math.random() * 1000),
            dateOfBirth: dateOfBirth || new Date('1990-01-01'),
            role,
            isBlocked: isActive === false,
            isVerified: true,
            institution: req.institutionId,
            registeredBy: req.user._id
        });

        res.status(201).json({
            success: true,
            data: user.toJSON()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao criar utilizador',
            error: error.message
        });
    }
};

// @desc    Atualizar utilizador
// @route   PUT /api/users/:id
// @access  Private (Admin/Owner)
export const updateUser = async (req, res) => {
    try {
        let user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilizador não encontrado' });
        }

        if (req.user.role !== 'super_admin' && user.institution.toString() !== req.institutionId.toString()) {
            return res.status(403).json({ success: false, message: 'Sem permissão' });
        }

        const { name, email, phone, role, isBlocked, password } = req.body;

        if (email && email !== user.email) {
            const existingEmail = await User.findOne({ email });
            if (existingEmail) {
                return res.status(400).json({ success: false, message: 'Conta já existe' });
            }
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.isBlocked = isBlocked !== undefined ? isBlocked : user.isBlocked;

        if (role && ['agent', 'manager', 'admin', 'representative', 'supervisor', 'client'].includes(role)) {
            user.role = role;
        }

        if (password) {
            user.password = password; // pre-save hook fará o hash
        }

        await user.save();

        res.json({
            success: true,
            data: user.toJSON()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar utilizador',
            error: error.message
        });
    }
};

// @desc    Eliminar utilizador
// @route   DELETE /api/users/:id
// @access  Private (Admin/Owner)
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilizador não encontrado' });
        }

        if (req.user.role !== 'super_admin' && user.institution.toString() !== req.institutionId.toString()) {
            return res.status(403).json({ success: false, message: 'Sem permissão' });
        }

        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Não pode eliminar o seu próprio utilizador' });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Utilizador eliminado'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao eliminar utilizador',
            error: error.message
        });
    }
};
