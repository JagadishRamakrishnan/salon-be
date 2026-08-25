import { Router } from "express";
import { register, login, me } from "../controllers/authController.js";
import { protect, authorize } from "../middleware/auth.js";
import {
    listSalons,
    getSalon,
    dashboard,
} from "../controllers/salonController.js";
import {
    availability,
    createAppointment,
    myAppointments,
    cancelAppointment,
    adminListAppointments,
    getAppointment,
    adminCreateAppointment,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
} from "../controllers/appointmentController.js";
import { stats } from "../controllers/adminController.js";
import {
    listStaff,
    getStaff,
    createStaff,
    updateStaff,
    deleteStaff,
} from "../controllers/staffController.js";
import {
    listServices,
    getService,
    createService,
    updateService,
    deleteService,
} from "../controllers/serviceController.js";
import {
    listCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} from "../controllers/categoryController.js";
import {
    adminListSalons,
    createSalon,
    updateSalon,
    deleteSalon,
} from "../controllers/salonManagementController.js";
import {
    listCustomers,
    getCustomer,
    updateCustomer,
    deleteCustomer,
} from "../controllers/userController.js";

const router = Router();

/* Auth */
router.post("/auth/register", register);
router.post("/auth/login", login);
router.get("/auth/me", protect, me);

/* Public / customer-facing salon browsing */
router.get("/salons", listSalons);
router.get("/salons/:id", getSalon);
router.get("/dashboard/manager", protect, authorize("manager"), dashboard);
router.get("/dashboard/admin", protect, authorize("admin"), stats);

/* Customer booking */
router.get("/availability", availability);
router.get("/appointments", protect, myAppointments);
router.post("/appointments", protect, authorize("customer"), createAppointment);
router.patch(
    "/appointments/:id/cancel",
    protect,
    authorize("customer"),
    cancelAppointment,
);

/* Admin / manager - Appointment management */
router.get(
    "/admin/appointments",
    protect,
    authorize("admin", "manager"),
    adminListAppointments,
);
router.get(
    "/admin/appointments/:id",
    protect,
    authorize("admin", "manager"),
    getAppointment,
);
router.post(
    "/admin/appointments",
    protect,
    authorize("admin", "manager"),
    adminCreateAppointment,
);
router.put(
    "/admin/appointments/:id",
    protect,
    authorize("admin", "manager"),
    updateAppointment,
);
router.patch(
    "/admin/appointments/:id/status",
    protect,
    authorize("admin", "manager"),
    updateAppointmentStatus,
);
router.delete(
    "/admin/appointments/:id",
    protect,
    authorize("admin", "manager"),
    deleteAppointment,
);

/* Admin / manager - Staff management */
router.get("/admin/staff", protect, authorize("admin", "manager"), listStaff);
router.get("/admin/staff/:id", protect, authorize("admin", "manager"), getStaff);
router.post("/admin/staff", protect, authorize("admin", "manager"), createStaff);
router.put("/admin/staff/:id", protect, authorize("admin", "manager"), updateStaff);
router.delete(
    "/admin/staff/:id",
    protect,
    authorize("admin", "manager"),
    deleteStaff,
);

/* Admin / manager - Service management */
router.get(
    "/admin/services",
    protect,
    authorize("admin", "manager"),
    listServices,
);
router.get(
    "/admin/services/:id",
    protect,
    authorize("admin", "manager"),
    getService,
);
router.post(
    "/admin/services",
    protect,
    authorize("admin", "manager"),
    createService,
);
router.put(
    "/admin/services/:id",
    protect,
    authorize("admin", "manager"),
    updateService,
);
router.delete(
    "/admin/services/:id",
    protect,
    authorize("admin", "manager"),
    deleteService,
);

/* Admin - Category management */
router.get(
    "/admin/categories",
    protect,
    authorize("admin", "manager"),
    listCategories,
);
router.post("/admin/categories", protect, authorize("admin"), createCategory);
router.put("/admin/categories/:id", protect, authorize("admin"), updateCategory);
router.delete(
    "/admin/categories/:id",
    protect,
    authorize("admin"),
    deleteCategory,
);

/* Admin - Salon management */
router.get("/admin/salons", protect, authorize("admin"), adminListSalons);
router.post("/admin/salons", protect, authorize("admin"), createSalon);
router.put("/admin/salons/:id", protect, authorize("admin"), updateSalon);
router.delete("/admin/salons/:id", protect, authorize("admin"), deleteSalon);

/* Admin - Customer management */
router.get("/admin/customers", protect, authorize("admin"), listCustomers);
router.get("/admin/customers/:id", protect, authorize("admin"), getCustomer);
router.put("/admin/customers/:id", protect, authorize("admin"), updateCustomer);
router.delete(
    "/admin/customers/:id",
    protect,
    authorize("admin"),
    deleteCustomer,
);

export default router;
