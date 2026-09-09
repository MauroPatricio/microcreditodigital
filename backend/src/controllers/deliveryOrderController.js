import DeliveryOrder from '../models/DeliveryOrder.js';
import DeliveryStop from '../models/DeliveryStop.js';

// Create a new DeliveryOrder (supports 1 to N stops)
export const createDeliveryOrder = async (req, res) => {
  try {
    const {
      customerId,
      sellerId,
      driverId,
      institutionId,
      origin,
      stops,
      totalDistance = 0,
      estimatedDuration = 0,
      totalPrice = 0
    } = req.body;

    if (!origin || !origin.latitude || !origin.longitude || !origin.address) {
      return res.status(400).json({ success: false, message: 'Dados da origem são obrigatórios.' });
    }

    if (!stops || !Array.isArray(stops) || stops.length === 0) {
      return res.status(400).json({ success: false, message: 'Adicione pelo menos 1 paragem/destino.' });
    }

    // Generate unique order number
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `NQ-2026-${randomSuffix}`;

    // Calculate total packages
    const totalPackages = stops.reduce((acc, curr) => acc + (Number(curr.packageQuantity) || 1), 0);

    const deliveryOrder = new DeliveryOrder({
      orderNumber,
      customer: customerId || req.user?._id,
      seller: sellerId || null,
      driver: driverId || null,
      institution: institutionId || req.user?.institution || null,
      origin,
      status: 'PENDING',
      totalDistance: Number(totalDistance) || 0,
      estimatedDuration: Number(estimatedDuration) || 0,
      totalPrice: Number(totalPrice) || 0,
      totalPackages
    });

    await deliveryOrder.save();

    // Create DeliveryStops sequentially
    const createdStops = [];
    for (let index = 0; index < stops.length; index++) {
      const stopData = stops[index];
      const stop = new DeliveryStop({
        deliveryOrder: deliveryOrder._id,
        sequence: index + 1,
        latitude: Number(stopData.latitude),
        longitude: Number(stopData.longitude),
        address: stopData.address,
        placeName: stopData.placeName || '',
        recipientName: stopData.recipientName || 'Destinatário',
        recipientPhone: stopData.recipientPhone || '',
        packageQuantity: Number(stopData.packageQuantity) || 1,
        description: stopData.description || '',
        notes: stopData.notes || '',
        status: 'PENDING'
      });
      await stop.save();
      createdStops.push(stop);
    }

    return res.status(201).json({
      success: true,
      message: 'Entrega multi-paragens criada com sucesso.',
      data: {
        ...deliveryOrder.toObject(),
        stops: createdStops
      }
    });
  } catch (error) {
    console.error('Erro ao criar entrega multi-paragens:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single DeliveryOrder by ID with nested stops
export const getDeliveryOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const deliveryOrder = await DeliveryOrder.findById(id)
      .populate('customer', 'name email phone')
      .populate('seller', 'name email phone storeName')
      .populate('driver', 'name phone vehicle');

    if (!deliveryOrder) {
      return res.status(404).json({ success: false, message: 'Pedido de entrega não encontrado.' });
    }

    const stops = await DeliveryStop.find({ deliveryOrder: deliveryOrder._id }).sort({ sequence: 1 });

    return res.status(200).json({
      success: true,
      data: {
        ...deliveryOrder.toObject(),
        stops
      }
    });
  } catch (error) {
    console.error('Erro ao buscar entrega:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Reorder Stops for an order
export const reorderDeliveryStops = async (req, res) => {
  try {
    const { id } = req.params;
    const { newOrder } = req.body; // Array of { stopId, sequence }

    if (!newOrder || !Array.isArray(newOrder)) {
      return res.status(400).json({ success: false, message: 'Nova sequência inválida.' });
    }

    const deliveryOrder = await DeliveryOrder.findById(id);
    if (!deliveryOrder) {
      return res.status(404).json({ success: false, message: 'Pedido de entrega não encontrado.' });
    }

    if (deliveryOrder.status === 'DELIVERED' || deliveryOrder.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Não é possível reordenar um pedido já finalizado.' });
    }

    for (const item of newOrder) {
      await DeliveryStop.findByIdAndUpdate(item.stopId, { sequence: item.sequence });
    }

    const updatedStops = await DeliveryStop.find({ deliveryOrder: id }).sort({ sequence: 1 });

    return res.status(200).json({
      success: true,
      message: 'Sequência das paragens atualizada com sucesso.',
      data: {
        ...deliveryOrder.toObject(),
        stops: updatedStops
      }
    });
  } catch (error) {
    console.error('Erro ao reordenar paragens:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update status of a specific Stop
export const updateStopStatus = async (req, res) => {
  try {
    const { id, stopId } = req.params;
    const { status, proof, failureReason } = req.body;

    const stop = await DeliveryStop.findOne({ _id: stopId, deliveryOrder: id });
    if (!stop) {
      return res.status(404).json({ success: false, message: 'Paragem não encontrada.' });
    }

    stop.status = status || stop.status;
    if (proof) {
      stop.proof = { ...stop.proof, ...proof };
    }
    if (failureReason) {
      stop.failureReason = failureReason;
    }
    if (status === 'DELIVERED') {
      stop.deliveredAt = new Date();
    }
    await stop.save();

    // Recalculate global DeliveryOrder status based on all stops
    const allStops = await DeliveryStop.find({ deliveryOrder: id });
    const totalStops = allStops.length;
    const deliveredCount = allStops.filter(s => s.status === 'DELIVERED').length;
    const failedCount = allStops.filter(s => s.status === 'FAILED').length;
    const inProgressCount = allStops.filter(s => s.status === 'ARRIVED' || s.status === 'IN_PROGRESS').length;

    let newOrderStatus = 'IN_PROGRESS';

    if (deliveredCount === totalStops) {
      newOrderStatus = 'DELIVERED';
    } else if (failedCount > 0 && (deliveredCount + failedCount === totalStops)) {
      newOrderStatus = 'PARTIALLY_DELIVERED';
    } else if (deliveredCount > 0) {
      newOrderStatus = 'IN_PROGRESS';
    }

    const updatedOrder = await DeliveryOrder.findByIdAndUpdate(
      id,
      { status: newOrderStatus },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: `Status da paragem atualizado para ${status}`,
      data: {
        orderStatus: updatedOrder.status,
        stop
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar status da paragem:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Driver GPS Location for live tracking
export const updateDriverLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    const deliveryOrder = await DeliveryOrder.findByIdAndUpdate(
      id,
      {
        driverLocation: {
          latitude: Number(latitude),
          longitude: Number(longitude),
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      data: deliveryOrder.driverLocation
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// List Delivery Orders
export const listDeliveryOrders = async (req, res) => {
  try {
    const { customerId, driverId, sellerId, status } = req.query;
    const filter = {};

    if (customerId) filter.customer = customerId;
    if (driverId) filter.driver = driverId;
    if (sellerId) filter.seller = sellerId;
    if (status) filter.status = status;

    const orders = await DeliveryOrder.find(filter)
      .sort({ createdAt: -1 })
      .populate('customer', 'name phone')
      .populate('driver', 'name phone');

    return res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
