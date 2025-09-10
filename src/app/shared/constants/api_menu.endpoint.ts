import { environment } from "../../environment/environment";

const menuBaseUrl = `${environment.baseUrl}/menu`;
const subMenuBaseUrl = `${environment.baseUrl}/sub-menus`;
const menuSequenceUrl = `${environment.baseUrl}/menu-sequence`;
const menuMappingUrl = `${environment.baseUrl}/menu-mapping`;

export const menuApi = {
  saveMenuUrl: `${menuBaseUrl}/saveMenu`,
  getAllMenusUrl: `${menuBaseUrl}/getAllMenus`,
  getMenuByCodeUrl: `${menuBaseUrl}/`,
  updateStatus:`${menuBaseUrl}/updateStatus`,
  getActiveMenusUrl: `${menuBaseUrl}/activeMenus`,
};

export const subMenuApi = {
  savesubMenuUrl: `${subMenuBaseUrl}`,
  getAllSubMenusUrl: `${subMenuBaseUrl}`,
  getSubMenuByCodeUrl: `${subMenuBaseUrl}/`,
  updateStatus:`${subMenuBaseUrl}/updateStatus`
};

export const menuSequenceApi = {
  getMenuSequenceUrl: `${menuSequenceUrl}`,
  saveMenuSequenceUrl: `${menuSequenceUrl}`
};

export const menuMappingeApi = {
  getSideMenuUrl: `${menuMappingUrl}`
};