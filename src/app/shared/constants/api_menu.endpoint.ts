import { environment } from "../../../environments/environment";

const menuBaseUrl = `${environment.baseUrl}/menu`;
const subMenuBaseUrl = `${environment.baseUrl}/sub-menus`;
const menuSequenceUrl = `${environment.baseUrl}/menu-sequence`;
const menuMappingUrl = `${environment.baseUrl}/menu-mapping`;
const roleBaseUrl = `${environment.baseUrl}/roles`;

export const menuApi = {
  saveMenuUrl: `${menuBaseUrl}/saveMenu`,
  getAllMenusUrl: `${menuBaseUrl}/getAllMenus`,
  getMenuByCodeUrl: `${menuBaseUrl}/`,
  updateStatus: `${menuBaseUrl}/updateStatus`,
  deleteMenuUrl: `${menuBaseUrl}`,
  getActiveMenusUrl: `${menuBaseUrl}/activeMenus`,
};

export const subMenuApi = {
  savesubMenuUrl: `${subMenuBaseUrl}`,
  getAllSubMenusUrl: `${subMenuBaseUrl}`,
  getSubMenuByCodeUrl: `${subMenuBaseUrl}/`,
  updateStatus: `${subMenuBaseUrl}/updateStatus`,
  deleteSubMenuUrl: `${subMenuBaseUrl}`,
  getPrivilegesUrl: `${subMenuBaseUrl}/getPrivileges`,
};

export const menuSequenceApi = {
  getMenuSequenceUrl: `${menuSequenceUrl}`,
  saveMenuSequenceUrl: `${menuSequenceUrl}`
};

export const menuMappingeApi = {
  getSideMenuUrl: `${menuMappingUrl}`,
  getMenuTreeUrl: `${menuMappingUrl}/getActiveMenuTree`,
  getRoleMenuPrivilegesUrl: `${menuMappingUrl}/role`,
  assignRoleMenuPrivilegeUrl: `${menuMappingUrl}/assign`
};

export const roleApi = {
  // Save or update role (if roleId exists → update, else save)
  saveOrUpdateRoleUrl: `${roleBaseUrl}`,

  // Get all roles
  getAllRolesUrl: `${roleBaseUrl}`,

  // Get role by code (append /{roleCode})
  getRoleByCodeUrl: `${roleBaseUrl}/`,

  // Update role status (PATCH request with query params: roleId/roleCode + status)
  updateStatusUrl: `${roleBaseUrl}/updateStatus`,

  // Get all active roles (for dropdowns, etc.)
  getActiveRolesUrl: `${roleBaseUrl}/active`
};