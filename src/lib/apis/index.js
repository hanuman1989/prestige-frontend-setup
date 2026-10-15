import adminAuthAPI from "./admin/adminAuth";
import adminUsersAPI from "./admin/adminUsers";
import adminCategoriesAPI from "./admin/categories";
import frontUsersAPI from "./admin/users";
import frontendAuthAPI from "./frontendAuth";
import contactInquiryAPI from "./contactInquiry";
import destinationAPI from "./admin/destinations";
import packageAPI from "./admin/packages";
import carRentalAPI from "./admin/carRental";

const APIs = {
  frontend: {
    auth: frontendAuthAPI,
    contactInquiry: contactInquiryAPI,
  },
  admin: {
    Adminusers: adminUsersAPI,
    categories: adminCategoriesAPI,
    users: frontUsersAPI,
    adminAuth: adminAuthAPI,
    destinations: destinationAPI,
    packages: packageAPI,
    carRental: carRentalAPI,
  },
};

export default APIs;
