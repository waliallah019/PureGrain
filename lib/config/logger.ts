// my-leather-platform/lib/config/logger.ts
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          (info) =>
            `${info.timestamp} ${info.level}: ${info.message} ${
              info.stack ? `- ${info.stack}` : ""
            }`
        )
      ),
    }),
    // For Next.js, writing to local files like this might not work reliably
    // in serverless environments. Consider cloud-based logging solutions
    // (e.g., CloudWatch, LogDNA, etc.) for production.
    // Kept for dev env for consistency with previous setup.
    // new winston.transports.File({
    //   filename: "logs/error.log",
    //   level: "error",
    //   format: winston.format.json(),
    // }),
    // new winston.transports.File({
    //   filename: "logs/combined.log",
    //   format: winston.format.json(),
    // }),
  ],
  exitOnError: false,
});

export default logger;