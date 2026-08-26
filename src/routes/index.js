import { Router } from "express";
import { register, login, me } from "../controllers/authController.js";
import { protect, optionalProtect, authorize, salonScoped } from "../middleware/auth.js";
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
    getSalonHours, updateSalonHours, getStaffHours, updateStaffHours,
    listStaffLeaves, addStaffLeave, updateStaffLeave, deleteStaffLeave,
} from "../controllers/scheduleController.js";
import { listReviews, createReview, moderateReview, deleteReview } from "../controllers/reviewController.js";
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
import {
    listManagers,
    getManager,
    createManager,
    updateManager,
    updateManagerStatus,
    deleteManager,
} from "../controllers/managerController.js";

const router = Router();

/* Auth */
router.post("/auth/register", register);
router.post("/auth/login", login);
router.get("/auth/me", protect, me);

/* Public / customer-facing salon browsing */
router.get("/salons", listSalons);
router.get("/services", listServices);
router.get("/salons/:id", optionalProtect, getSalon);
router.get("/dashboard/manager", protect, authorize("manager", "owner"), dashboard);
router.get("/dashboard/owner", protect, authorize("owner"), dashboard);
router.get("/dashboard/admin", protect, authorize("admin"), stats);

/* Customer booking */
router.get("/availability", optionalProtect, availability);
router.get("/appointments", protect, myAppointments);
router.post("/appointments", protect, authorize("customer"), createAppointment);
router.patch(
    "/appointments/:id/cancel",
    protect,
    authorize("customer"),
    cancelAppointment,
);
router.post("/reviews", protect, authorize("customer"), createReview);
router.get("/reviews", protect, authorize("admin", "manager", "owner"), listReviews);
router.patch("/reviews/:id/status", protect, authorize("admin"), moderateReview);
router.delete("/reviews/:id", protect, authorize("admin"), deleteReview);

/* Admin / manager - Appointment management */
router.get(
    "/admin/appointments",
    protect,
    authorize("admin", "manager", "owner"),
    adminListAppointments,
);
router.get(
    "/admin/appointments/:id",
    protect,
    authorize("admin", "manager", "owner"),
    getAppointment,
);
router.post(
    "/admin/appointments",
    protect,
    authorize("admin", "manager", "owner"),
    adminCreateAppointment,
);
router.put(
    "/admin/appointments/:id",
    protect,
    authorize("admin", "manager", "owner"),
    updateAppointment,
);
router.patch(
    "/admin/appointments/:id/status",
    protect,
    authorize("admin", "manager", "owner"),
    updateAppointmentStatus,
);
router.delete(
    "/admin/appointments/:id",
    protect,
    authorize("admin", "manager", "owner"),
    deleteAppointment,
);

/* Admin / manager - Staff management */
router.get("/admin/staff", protect, authorize("admin", "manager", "owner"), listStaff);
router.get("/admin/staff/:id", protect, authorize("admin", "manager", "owner"), getStaff);
router.post("/admin/staff", protect, authorize("admin", "manager", "owner"), createStaff);
router.put("/admin/staff/:id", protect, authorize("admin", "manager", "owner"), updateStaff);
router.delete(
    "/admin/staff/:id",
    protect,
    authorize("admin", "manager", "owner"),
    deleteStaff,
);

/* Admin / manager - Service management */
router.get(
    "/admin/services",
    protect,
    authorize("admin", "manager", "owner"),
    listServices,
);
router.get(
    "/admin/services/:id",
    protect,
    authorize("admin", "manager", "owner"),
    getService,
);
router.post(
    "/admin/services",
    protect,
    authorize("admin", "manager", "owner"),
    createService,
);
router.put(
    "/admin/services/:id",
    protect,
    authorize("admin", "manager", "owner"),
    updateService,
);
router.delete(
    "/admin/services/:id",
    protect,
    authorize("admin", "manager", "owner"),
    deleteService,
);

/* Admin - Category management */
router.get(
    "/admin/categories",
    protect,
    authorize("admin", "manager", "owner"),
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
router.put("/admin/salons/:id", protect, authorize("admin", "manager", "owner"), updateSalon);
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

/* Admin - Manager management */
router.get("/managers", protect, authorize("admin"), listManagers);
router.get("/managers/:id", protect, authorize("admin"), getManager);
router.post("/managers", protect, authorize("admin"), createManager);
router.put("/managers/:id", protect, authorize("admin"), updateManager);
router.patch("/managers/:id/status", protect, authorize("admin"), updateManagerStatus);
router.delete("/managers/:id", protect, authorize("admin"), deleteManager);
router.get("/owners", protect, authorize("admin"), listManagers);
router.get("/owners/:id", protect, authorize("admin"), getManager);
router.post("/owners", protect, authorize("admin"), createManager);
router.put("/owners/:id", protect, authorize("admin"), updateManager);
router.patch("/owners/:id/status", protect, authorize("admin"), updateManagerStatus);
router.delete("/owners/:id", protect, authorize("admin"), deleteManager);

/* Salon and staff schedules */
router.get("/admin/salons/:id/working-hours", protect, authorize("admin", "manager", "owner"), getSalonHours);
router.put("/admin/salons/:id/working-hours", protect, authorize("admin", "manager", "owner"), updateSalonHours);
router.get("/admin/staff/:id/working-hours", protect, authorize("admin", "manager", "owner"), getStaffHours);
router.put("/admin/staff/:id/working-hours", protect, authorize("admin", "manager", "owner"), updateStaffHours);
router.get("/admin/staff/:id/leaves", protect, authorize("admin", "manager", "owner"), listStaffLeaves);
router.post("/admin/staff/:id/leaves", protect, authorize("admin", "manager", "owner"), addStaffLeave);
router.put("/admin/staff/:id/leaves/:leaveId", protect, authorize("admin", "manager", "owner"), updateStaffLeave);
router.delete("/admin/staff/:id/leaves/:leaveId", protect, authorize("admin", "manager", "owner"), deleteStaffLeave);

export default router;
