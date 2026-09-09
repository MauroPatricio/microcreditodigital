import express from 'express';
import {
  createDeliveryOrder,
  getDeliveryOrderById,
  reorderDeliveryStops,
  updateStopStatus,
  updateDriverLocation,
  listDeliveryOrders
} from '../controllers/deliveryOrderController.js';

const router = express.Router();

// Routes for Multi-Stop Delivery System
router.post('/', createDeliveryOrder);
router.get('/', listDeliveryOrders);
router.get('/:id', getDeliveryOrderById);
router.put('/:id/stops/reorder', reorderDeliveryStops);
router.patch('/:id/stops/:stopId/status', updateStopStatus);
router.post('/:id/driver-location', updateDriverLocation);

export default router;
