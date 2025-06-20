
import AppConfigModel from '../models/AppConfigModel.js';

let cachedConfig = null;

export async function getAppConfig() {
  if (!cachedConfig) {
    cachedConfig = await AppConfigModel.findOne().lean();
  }
  return cachedConfig;
}
