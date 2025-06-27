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
    // Keep original extension
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, uniqueSuffix + ext);
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
  
  // Submit application - support multiple files
  app.post("/api/applications", upload.fields([
    { name: 'cv', maxCount: 1 },
    { name: 'educationCert', maxCount: 1 },
    { name: 'workExperience', maxCount: 3 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      const applicationData = {
        fullName: req.body.fullName,
        phone: req.body.phone,
        nationalId: req.body.nationalId,
        city: req.body.city,
        birthDate: req.body.birthDate,
        position: req.body.position,
        qualification: req.body.qualification,
        specialization: req.body.specialization,
        experience: req.body.experience,
        gradeType: req.body.gradeType,
        grade: req.body.grade,
        hasProfessionalLicense: req.body.hasProfessionalLicense,
        cvFilename: files.cv?.[0]?.filename,
        cvOriginalName: files.cv?.[0]?.originalname,
        educationCertFilename: files.educationCert?.[0]?.filename,
        educationCertOriginalName: files.educationCert?.[0]?.originalname,
        workExperienceFilenames: files.workExperience?.map(f => f.filename).join(','),
        workExperienceOriginalNames: files.workExperience?.map(f => f.originalname).join(','),
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
      const { position, qualification, experienceRange, search, specialization, hasProfessionalLicense } = req.query;
      
      const applications = await storage.getApplicationsByFilter({
        position: position as string,
        qualification: qualification as string, 
        experienceRange: experienceRange as string,
        search: search as string,
        specialization: specialization as string,
        hasProfessionalLicense: hasProfessionalLicense as string,
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
        console.log(`CV file not found: ${filePath} for application ID: ${id}`);
        return res.status(404).json({ message: "الملف غير موجود في النظام" });
      }

      // Improve file naming for Arabic files
      let downloadName = application.cvOriginalName || application.cvFilename;
      
      // If original name is corrupted or contains strange characters, use a safe default
      if (downloadName && /[^\x20-\x7E\u0600-\u06FF\u0750-\u077F]/.test(downloadName) && !downloadName.includes('.pdf')) {
        downloadName = `سيرة_ذاتية_${application.fullName || id}.pdf`;
      } else if (!downloadName.endsWith('.pdf')) {
        downloadName = downloadName + '.pdf';
      }

      // Set proper headers for Arabic filenames
      res.setHeader('Content-Type', 'application/pdf');
      
      // Check if this is a download request or preview request
      const isDownload = req.query.download === 'true';
      
      if (isDownload) {
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`);
      } else {
        // For preview, use inline disposition
        res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(downloadName)}`);
      }
      
      // Send the file
      res.sendFile(filePath);
    } catch (error) {
      console.error('Error downloading CV:', error);
      res.status(500).json({ message: "فشل في تحميل الملف" });
    }
  });

  // Download education certificate file
  app.get("/api/applications/:id/education-cert", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const application = await storage.getApplicationById(id);
      
      if (!application || !application.educationCertFilename) {
        return res.status(404).json({ message: "الملف غير موجود" });
      }

      const filePath = path.join(uploadsDir, application.educationCertFilename);
      
      if (!fs.existsSync(filePath)) {
        console.log(`Education cert file not found: ${filePath} for application ID: ${id}`);
        return res.status(404).json({ message: "الملف غير موجود في النظام" });
      }

      let downloadName = application.educationCertOriginalName || application.educationCertFilename;
      
      if (downloadName && /[^\x20-\x7E\u0600-\u06FF\u0750-\u077F]/.test(downloadName) && !downloadName.includes('.pdf')) {
        downloadName = `شهادة_تعليمية_${application.fullName || id}.pdf`;
      } else if (!downloadName.endsWith('.pdf')) {
        downloadName = downloadName + '.pdf';
      }

      res.setHeader('Content-Type', 'application/pdf');
      
      // Check if this is a download request or preview request
      const isDownload = req.query.download === 'true';
      
      if (isDownload) {
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`);
      } else {
        // For preview, use inline disposition
        res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(downloadName)}`);
      }
      
      res.sendFile(filePath);
    } catch (error) {
      console.error('Error downloading education certificate:', error);
      res.status(500).json({ message: "فشل في تحميل الملف" });
    }
  });

  // Download work experience files
  app.get("/api/applications/:id/work-experience/:fileIndex", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const fileIndex = parseInt(req.params.fileIndex);
      const application = await storage.getApplicationById(id);
      
      if (!application || !application.workExperienceFilenames) {
        return res.status(404).json({ message: "الملف غير موجود" });
      }

      const filenames = application.workExperienceFilenames.split(',');
      const originalNames = application.workExperienceOriginalNames?.split(',') || [];
      
      if (fileIndex >= filenames.length || fileIndex < 0) {
        return res.status(404).json({ message: "رقم الملف غير صحيح" });
      }

      const filename = filenames[fileIndex].trim();
      const filePath = path.join(uploadsDir, filename);
      
      if (!fs.existsSync(filePath)) {
        console.log(`Work experience file not found: ${filePath} for application ID: ${id}`);
        return res.status(404).json({ message: "الملف غير موجود في النظام" });
      }

      let downloadName = originalNames[fileIndex]?.trim() || filename;
      
      if (downloadName && /[^\x20-\x7E\u0600-\u06FF\u0750-\u077F]/.test(downloadName) && !downloadName.includes('.pdf')) {
        downloadName = `خبرة_عملية_${fileIndex + 1}_${application.fullName || id}.pdf`;
      } else if (!downloadName.endsWith('.pdf')) {
        downloadName = downloadName + '.pdf';
      }

      res.setHeader('Content-Type', 'application/pdf');
      
      // Check if this is a download request or preview request
      const isDownload = req.query.download === 'true';
      
      if (isDownload) {
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`);
      } else {
        // For preview, use inline disposition
        res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(downloadName)}`);
      }
      
      res.sendFile(filePath);
    } catch (error) {
      console.error('Error downloading work experience file:', error);
      res.status(500).json({ message: "فشل في تحميل الملف" });
    }
  });

  // Get application stats
  app.get("/api/applications/stats", async (req, res) => {
    try {
      const applications = await storage.getAllApplications();
      const specializationStats = await storage.getSpecializationStats();
      
      const stats = {
        total: applications.length,
        teachers: applications.filter(app => app.position === 'teacher').length,
        admin: applications.filter(app => app.position === 'admin').length,
        management: applications.filter(app => ['vice_principal', 'principal'].includes(app.position)).length,
        specializations: specializationStats,
        status: {
          under_review: applications.filter(app => app.status === 'under_review').length,
          accepted: applications.filter(app => app.status === 'accepted').length,
          rejected: applications.filter(app => app.status === 'rejected').length,
        }
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: "فشل في جلب الإحصائيات" });
    }
  });

  // Update application status
  app.patch("/api/applications/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!['under_review', 'accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "حالة غير صحيحة" });
      }

      await storage.updateApplicationStatus(id, status);
      res.json({ message: "تم تحديث الحالة بنجاح" });
    } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json({ message: "فشل في تحديث الحالة" });
    }
  });

  // Delete single application
  app.delete("/api/applications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteApplication(id);
      res.json({ message: "تم حذف الطلب بنجاح" });
    } catch (error) {
      console.error('Error deleting application:', error);
      res.status(500).json({ message: "فشل في حذف الطلب" });
    }
  });

  // Delete all applications
  app.delete("/api/applications", async (req, res) => {
    try {
      await storage.deleteAllApplications();
      res.json({ message: "تم حذف جميع الطلبات بنجاح" });
    } catch (error) {
      console.error('Error deleting all applications:', error);
      res.status(500).json({ message: "فشل في حذف الطلبات" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
