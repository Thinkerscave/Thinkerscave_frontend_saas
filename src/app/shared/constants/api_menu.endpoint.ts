import { environment } from "../../environment/environment";

const menuBaseUrl = `${environment.baseUrl}/menu`;

export const menuApi = {
  saveMenuUrl: `${menuBaseUrl}/saveMenu`,
  getMenusUrl: `${menuBaseUrl}/getAllMenus`,
  getMenuByCodeUrl: `${menuBaseUrl}/`,
  updateStatus:`${menuBaseUrl}/toggle`
};