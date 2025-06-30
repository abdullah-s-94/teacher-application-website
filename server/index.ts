import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });
  next();
});

// Database initialization function
async function initializeDatabase() {
  try {
    log("🔄 Initializing database tables...");
    const { db } = await import("./db");
    
    // Create applications table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        phone VARCHAR(20),
        national_id VARCHAR(20),
        city VARCHAR(100),
        position VARCHAR(50),
        qualification VARCHAR(50),
        specialization VARCHAR(100),
        experience VARCHAR(20),
        grade_type VARCHAR(20),
        grade VARCHAR(10),
        cv_filename VARCHAR(255),
        cv_original_name VARCHAR(255),
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        birth_date DATE,
        status VARCHAR(50) DEFAULT 'under_review',
        has_professional_license VARCHAR(10),
        education_cert_filename VARCHAR(255),
        education_cert_original_name VARCHAR(255),
        work_experience_filenames TEXT,
        work_experience_original_names TEXT,
        cv_cloudinary_id VARCHAR(255),
        cv_cloudinary_url TEXT,
        education_cert_cloudinary_id VARCHAR(255),
        education_cert_cloudinary_url TEXT,
        work_experience_cloudinary_ids TEXT,
        work_experience_cloudinary_urls TEXT,
        gender VARCHAR(10),
        custom_specialization VARCHAR(255)
      )
    `);
    
    // Create users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create default admin user
    await db.execute(`
      INSERT INTO users (username, password, role, email) 
      VALUES ('admin', 'admin123', 'super_admin', 'admin@school.com') 
      ON CONFLICT (username) DO NOTHING
    `);
    
    log("✅ Database tables created successfully!");
    log("🔑 Default admin login: username=admin, password=admin123");
    
  } catch (error) {
    log(`❌ Database initialization error: ${error}`, "error");
    throw error;
  }
}

(async () => {
  try {
    // Test database connection first
    log("Testing database connection...");
    const { db } = await import("./db");
    await db.execute("SELECT 1");
    log("Database connection successful");
    
    // Initialize database tables
    await initializeDatabase();
    
    const server = await registerRoutes(app);
    
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      log(`Error: ${message}`, "error");
      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    log(`Failed to start server: ${error}`, "error");
    console.error("Server startup error:", error);
    process.exit(1);
  }
})();
