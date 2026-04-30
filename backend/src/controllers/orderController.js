import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import Order from "../models/Order.js";
import User from "../models/User.js";

function generateDeliveryKey() {
  return String(randomInt(100000, 1000000));
}

function addStatusHistory(order, status, changedByRole, message) {
  order.statusHistory.push({
    status,
    changedByRole,
    message,
    changedAt: new Date()
  });
}

function populateOrder(query) {
  return query
    .populate("customer", "name phone email")
    .populate("driver", "name phone email")
    .populate("driverRequests", "name phone email");
}

export async function createOrder(req, res, next) {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({ message: "Only customers can create orders." });
    }

    const { deliveryAddress, litres, notes } = req.body;

    if (!deliveryAddress || !litres) {
      return res.status(400).json({ message: "Delivery address and litres are required." });
    }

    if (Number(litres) < 1) {
      return res.status(400).json({ message: "Litres must be at least 1." });
    }

    const order = await Order.create({
      customer: req.user._id,
      deliveryAddress,
      litres: Number(litres),
      notes,
      statusHistory: [
        {
          status: "pending",
          changedByRole: "customer",
          message: "Order placed by customer."
        }
      ]
    });

    res.status(201).json({
      message: "Order created.",
      order
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyOrders(req, res, next) {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({ message: "Only customers can view their orders." });
    }

    const orders = await Order.find({ customer: req.user._id })
      .populate("driver", "name phone email")
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    next(error);
  }
}

export async function cancelMyOrder(req, res, next) {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({ message: "Only customers can cancel their own orders." });
    }

    const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (!["pending", "requested"].includes(order.status) || order.driver) {
      return res.status(400).json({ message: "Order can be cancelled only before driver assignment." });
    }

    order.status = "cancelled";
    addStatusHistory(order, "cancelled", "customer", "Order cancelled by customer.");
    await order.save();

    const populatedOrder = await Order.findById(order._id).populate("driver", "name phone email");

    res.json({
      message: "Order cancelled.",
      order: populatedOrder
    });
  } catch (error) {
    next(error);
  }
}

export async function confirmOrderDelivery(req, res, next) {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({ message: "Only customers can confirm delivery." });
    }

    const { deliveryKey } = req.body;
    if (!deliveryKey) {
      return res.status(400).json({ message: "Delivery key is required." });
    }

    const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (!["assigned", "out_for_delivery"].includes(order.status)) {
      return res.status(400).json({ message: "Only assigned or out-for-delivery orders can be completed." });
    }

    if (!order.deliveryKeyHash) {
      return res.status(400).json({ message: "Delivery key has not been generated yet." });
    }

    const isValidKey = await bcrypt.compare(deliveryKey, order.deliveryKeyHash);
    if (!isValidKey) {
      return res.status(401).json({ message: "Invalid delivery key." });
    }

    order.status = "completed";
    addStatusHistory(order, "completed", "customer", "Customer confirmed delivery with delivery key.");
    await order.save();

    const populatedOrder = await Order.findById(order._id).populate("driver", "name phone email");

    res.json({
      message: "Delivery confirmed. Order completed.",
      order: populatedOrder
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllOrders(_req, res, next) {
  try {
    const orders = await populateOrder(Order.find()).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    next(error);
  }
}

export async function getDriverVisibleOrders(req, res, next) {
  try {
    if (req.user.role !== "driver") {
      return res.status(403).json({ message: "Only drivers can view driver orders." });
    }

    const orders = await populateOrder(
      Order.find({
        $or: [
          { status: { $in: ["pending", "requested"] } },
          {
            driver: req.user._id,
            status: { $in: ["assigned", "out_for_delivery", "completed"] }
          }
        ]
      })
    ).sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    next(error);
  }
}

export async function requestOrderAsDriver(req, res, next) {
  try {
    if (req.user.role !== "driver") {
      return res.status(403).json({ message: "Only drivers can request orders." });
    }

    if (!req.user.isAvailable) {
      return res.status(403).json({ message: "Set yourself available before requesting an order." });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.status === "assigned" || order.status === "out_for_delivery") {
      return res.status(409).json({ message: "Order is already assigned." });
    }

    const activeDriverOrder = await Order.findOne({
      _id: { $ne: order._id },
      status: { $in: ["requested", "assigned", "out_for_delivery"] },
      $or: [{ driverRequests: req.user._id }, { driver: req.user._id }]
    });

    if (activeDriverOrder) {
      return res.status(409).json({
        message: "You already have an active order request. Please wait for admin approval or completion before requesting another order."
      });
    }

    const alreadyRequested = order.driverRequests.some(
      (driverId) => driverId.toString() === req.user._id.toString()
    );

    if (!alreadyRequested) {
      order.driverRequests.push(req.user._id);
    }

    order.status = "requested";
    addStatusHistory(order, "requested", "driver", `${req.user.name} requested this order.`);
    await order.save();

    const populatedOrder = await populateOrder(Order.findById(order._id));

    res.json({
      message: "Order request sent for admin approval.",
      order: populatedOrder
    });
  } catch (error) {
    next(error);
  }
}

export async function approveOrderDriverRequest(req, res, next) {
  try {
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({ message: "Driver is required." });
    }

    const driver = await User.findOne({ _id: driverId, role: "driver", isApproved: true });
    if (!driver) {
      return res.status(400).json({ message: "Approved driver not found." });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const hasRequested = order.driverRequests.some(
      (requestDriverId) => requestDriverId.toString() === driverId
    );

    if (!hasRequested) {
      return res.status(400).json({ message: "This driver has not requested the order." });
    }

    order.driver = driverId;
    order.status = "assigned";
    addStatusHistory(order, "assigned", "admin", `Admin approved ${driver.name} for this order.`);
    await order.save();

    const populatedOrder = await populateOrder(Order.findById(order._id));

    res.json({
      message: "Driver request approved. Order assigned.",
      order: populatedOrder
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDriverOrderStatus(req, res, next) {
  try {
    if (req.user.role !== "driver") {
      return res.status(403).json({ message: "Only drivers can update driver order status." });
    }

    const { status } = req.body;
    if (status !== "out_for_delivery") {
      return res.status(400).json({ message: "Driver can only mark an order as out for delivery." });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      driver: req.user._id,
      status: "assigned"
    });

    if (!order) {
      return res.status(404).json({ message: "Assigned order not found for this driver." });
    }

    order.status = status;
    addStatusHistory(order, status, "driver", "Driver marked order out for delivery.");
    await order.save();

    const populatedOrder = await populateOrder(Order.findById(order._id));

    res.json({
      message: "Order status updated.",
      order: populatedOrder
    });
  } catch (error) {
    next(error);
  }
}

export async function generateOrderDeliveryKey(req, res, next) {
  try {
    const order = await populateOrder(Order.findById(req.params.id));

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.status !== "assigned") {
      return res.status(400).json({ message: "Delivery key can be generated only after driver assignment." });
    }

    const deliveryKey = generateDeliveryKey();
    order.deliveryKeyHash = await bcrypt.hash(deliveryKey, 12);
    order.deliveryKeyForCustomer = deliveryKey;
    order.deliveryKeyGeneratedAt = new Date();
    addStatusHistory(order, order.status, "admin", "Admin generated delivery key.");
    await order.save();

    res.json({
      message: "Delivery key generated. Share this key with the customer.",
      deliveryKey,
      order
    });
  } catch (error) {
    next(error);
  }
}
