import crypto from "crypto";

export function generateDeviceToken() {
  return crypto.randomBytes(24).toString("hex");
}
