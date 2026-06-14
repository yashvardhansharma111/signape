import dotenv from "dotenv";

dotenv.config();

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI ?? process.env.MONGODB_URL;

  if (!uri?.trim()) {
    throw new Error(
      "MONGODB_URI is required. Add your MongoDB connection URL to signape/backend/.env"
    );
  }

  return uri.trim();
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret) {
    throw new Error(
      "JWT_SECRET is required. Add a secret string to signape/backend/.env"
    );
  }

  return secret;
}

export const env = {
  port: Number(process.env.PORT ?? 5000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  mongodbUri: getMongoUri(),
  jwtSecret: getJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
};
