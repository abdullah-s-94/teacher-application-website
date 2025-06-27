import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertApplicationSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_multer,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Submit application
  app.post("/api/applications", upload.single('cv'), async (req, res) => {
    try {
      const applicationData = {
        fullName: req.body.fullName,
        phone: req.body.phone,
        email: req.body.email,
        city: req.body.city,
        position: req.body.position,
        qualification: req.body.qualification,
        specialization: req.body.specialization,
        experience: req.body.experience,
        gradeType: req.body.gradeType,
        grade: req.body.grade,
        cvFilename: req.file?.filename,
        cvOriginalName: req.file?.originalname,
      };

      // Validate the data
      const validatedData = insertApplicationSchema.parse(applicationData);
      
      const application = await storage.createApplication(validatedData);
      res.json(application);
    } catch (error) {
      console.error('Error creating application:', error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "فشل في إرسال الطلب" 
      });
    }
  });

  // Get all applications
  app.get("/api/applications", async (req, res) => {
    try {
      const { position, qualification, experienceRange, search } = req.query;
      
      const applications = await storage.getApplicationsByFilter({
        position: position as string,
        qualification: qualification as string, 
        experienceRange: experienceRange as string,
        search: search as string,
      });
      
      res.json(applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ message: "فشل في جلب البيانات" });
    }
  });

  // Download CV file
  app.get("/api/applications/:id/cv", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const application = await storage.getApplicationById(id);
      
      if (!application || !application.cvFilename) {
        return res.status(404).json({ message: "الملف غير موجود" });
      }

      const filePath = path.join(uploadsDir, application.cvFilename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "الملف غير موجود" });
      }

      res.download(filePath, application.cvOriginalName || application.cvFilename);
    } catch (error) {
      console.error('Error downloading CV:', error);
      res.status(500).json({ message: "فشل في تحميل الملف" });
    }
  });

  // Get application stats
  app.get("/api/applications/stats", async (req, res) => {
    try {
      const applications = await storage.getAllApplications();
      
      const stats = {
        total: applications.length,
        teachers: applications.filter(app => app.position === 'teacher').length,
        admin: applications.filter(app => app.position === 'admin').length,
        management: applications.filter(app => ['vice_principal', 'principal'].includes(app.position)).length,
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: "فشل في جلب الإحصائيات" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
