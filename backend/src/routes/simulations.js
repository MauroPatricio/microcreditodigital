import express from 'express';
import { protect } from '../middleware/auth.js';
import simulationService from '../services/simulationService.js';
import contractService from '../services/contractService.js';
import whatsappService from '../services/whatsappService.js';
import Simulation from '../models/Simulation.js';
import asyncHandler from 'express-async-handler';

const router = express.Router();

/**
 * @desc    Calcula e salva uma simulação
 * @route   POST /api/simulations
 * @access  Private
 */
router.post('/', protect, asyncHandler(async (req, res) => {
    const { amount, term, rate, period, start, clientName, identityDocument, phone, riskProfile } = req.body;

    const simulationData = simulationService.calculateSimulation(amount, term, rate, period, start);

    const saved = await simulationService.saveSimulation({
        clientName,
        identityDocument,
        phone,
        amount,
        term,
        interestRate: rate,
        periodicity: period,
        startDate: start,
        summary: simulationData.summary,
        schedule: simulationData.schedule,
        riskProfile: riskProfile
    }, req.user);

    res.status(201).json({
        success: true,
        data: saved
    });
}));

/**
 * @desc    Gera PDF de uma simulação salva
 * @route   GET /api/simulations/:id/pdf
 * @access  Private
 */
router.get('/:id/pdf', protect, asyncHandler(async (req, res) => {
    const simulation = await simulationService.getSimulationById(req.params.id);

    if (!simulation) {
        res.status(404);
        throw new Error('Simulação não encontrada');
    }

    const pdfBuffer = await contractService.generateSimulationPDF(simulation, req.user);

    res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Simulacao_${simulation.simulationNumber}.pdf`,
        'Content-Length': pdfBuffer.length
    });

    res.send(pdfBuffer);
}));

/**
 * @desc    Envia PDF de simulação via WhatsApp
 * @route   POST /api/simulations/:id/send
 * @access  Private
 */
router.post('/:id/send', protect, asyncHandler(async (req, res) => {
    const simulation = await simulationService.getSimulationById(req.params.id);

    if (!simulation) {
        res.status(404);
        throw new Error('Simulação não encontrada');
    }

    if (!simulation.phone) {
        res.status(400);
        throw new Error('Telefone do cliente não registrado nesta simulação');
    }

    const pdfBuffer = await contractService.generateSimulationPDF(simulation, req.user);

    const caption = `Olá ${simulation.clientName},\n\nAqui está a sua simulação de crédito institucional (${simulation.simulationNumber}).\n\nValor: ${simulation.amount.toLocaleString()} MT\nPrazo: ${simulation.term} ${simulation.periodicity}\nPrestação: ${simulation.summary.paymentAmount.toLocaleString()} MT`;

    await whatsappService.sendFile(
        simulation.phone,
        pdfBuffer,
        `Simulacao_${simulation.simulationNumber}.pdf`,
        caption
    );

    res.json({
        success: true,
        message: 'Simulação enviada com sucesso via WhatsApp'
    });
}));

/**
 * @desc    Busca histórico de simulações de uma instituição
 * @route   GET /api/simulations
 * @access  Private
 */
router.get('/', protect, asyncHandler(async (req, res) => {
    const { clientId } = req.query;
    const query = { institution: req.user.institution._id };

    if (clientId) {
        query.client = clientId;
    }

    const simulations = await Simulation.find(query)
        .sort({ createdAt: -1 })
        .limit(50);

    res.json({
        success: true,
        data: simulations
    });
}));

export default router;
