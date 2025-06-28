import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertApplicationSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadToCloudinary, deleteFromCloudinary } from "./cloudinary";

// Configure multer for file uploads (using memory storage for Cloudinary)
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({ 
  storage: multer.memoryStorage(), // Use memory storage for Cloudinary upload
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
      const files = (req.files as { [fieldname: string]: Express.Multer.File[] }) || {};
      
      // Upload files to Cloudinary
      let cvCloudinaryId = '';
      let cvCloudinaryUrl = '';
      let educationCertCloudinaryId = '';
      let educationCertCloudinaryUrl = '';
      let workExperienceCloudinaryIds = '';
      let workExperienceCloudinaryUrls = '';
      
      // Upload CV file
      if (files.cv?.[0]) {
        const cvResult = await uploadToCloudinary(files.cv[0].buffer, files.cv[0].originalname, 'cv');
        cvCloudinaryId = cvResult.public_id;
        cvCloudinaryUrl = cvResult.secure_url;
      }
      
      // Upload education certificate
      if (files.educationCert?.[0]) {
        const certResult = await uploadToCloudinary(files.educationCert[0].buffer, files.educationCert[0].originalname, 'education_certificates');
        educationCertCloudinaryId = certResult.public_id;
        educationCertCloudinaryUrl = certResult.secure_url;
      }
      
      // Upload work experience files
      if (files.workExperience && files.workExperience.length > 0) {
        const workExpResults = await Promise.all(
          files.workExperience.map(file => 
            uploadToCloudinary(file.buffer, file.originalname, 'work_experience')
          )
        );
        workExperienceCloudinaryIds = workExpResults.map(r => r.public_id).join(',');
        workExperienceCloudinaryUrls = workExpResults.map(r => r.secure_url).join(',');
      }
      
      const applicationData = {
        fullName: req.body.fullName,
        phone: req.body.phone,
        nationalId: req.body.nationalId,
        city: req.body.city,
        birthDate: req.body.birthDate,
        position: req.body.position,
        qualification: req.body.qualification,
        specialization: req.body.specialization,
        customSpecialization: req.body.customSpecialization,
        experience: req.body.experience,
        gradeType: req.body.gradeType,
        grade: req.body.grade,
        hasProfessionalLicense: req.body.hasProfessionalLicense,
        gender: req.body.gender,
        // Keep local filenames for backward compatibility (optional)
        cvFilename: files.cv?.[0]?.originalname,
        cvOriginalName: files.cv?.[0]?.originalname,
        cvCloudinaryId,
        cvCloudinaryUrl,
        educationCertFilename: files.educationCert?.[0]?.originalname,
        educationCertOriginalName: files.educationCert?.[0]?.originalname,
        educationCertCloudinaryId,
        educationCertCloudinaryUrl,
        workExperienceFilenames: files.workExperience?.map(f => f.originalname).join(','),
        workExperienceOriginalNames: files.workExperience?.map(f => f.originalname).join(','),
        workExperienceCloudinaryIds,
        workExperienceCloudinaryUrls,
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
      const { position, qualification, experienceRange, search, specialization, hasProfessionalLicense, gender } = req.query;
      
      const applications = await storage.getApplicationsByFilter({
        position: position as string,
        qualification: qualification as string, 
        experienceRange: experienceRange as string,
        search: search as string,
        specialization: specialization as string,
        hasProfessionalLicense: hasProfessionalLicense as string,
        gender: gender as string,
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
      
      if (!application) {
        return res.status(404).json({ message: "الطلب غير موجود" });
      }

      // Check if we have Cloudinary URL (priority)
      if (application.cvCloudinaryUrl) {
        // Add appropriate Cloudinary transformations for PDF handling
        let cloudinaryUrl = application.cvCloudinaryUrl;
        
        if (req.query.download === 'true') {
          // Force download
          cloudinaryUrl = cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');
        } else {
          // Preview mode - add PDF viewer friendly parameters
          cloudinaryUrl = cloudinaryUrl.replace('/upload/', '/upload/fl_inline/');
        }
        
        return res.redirect(cloudinaryUrl);
      }
      
      // Fallback to local file if no Cloudinary URL (for backward compatibility)
      if (!application.cvFilename) {
        return res.status(404).json({ 
          message: "لم يتم رفع ملف السيرة الذاتية بعد.",
          fileNotFound: true 
        });
      }

      const filePath = path.join(uploadsDir, application.cvFilename);
      
      if (!fs.existsSync(filePath)) {
        console.log(`CV file not found: ${filePath} for application ID: ${id}`);
        return res.status(404).json({ 
          message: "الملف غير متاح حالياً. يرجى المحاولة لاحقاً أو الاتصال بالدعم الفني.",
          fileNotFound: true
        });
      }

      // Improve file naming for Arabic files
      let downloadName = application.cvOriginalName || application.cvFilename;
      
      if (downloadName && /[^\x20-\x7E\u0600-\u06FF\u0750-\u077F]/.test(downloadName) && !downloadName.includes('.pdf')) {
        downloadName = `سيرة_ذاتية_${application.fullName || id}.pdf`;
      } else if (!downloadName.endsWith('.pdf')) {
        downloadName = downloadName + '.pdf';
      }

      res.setHeader('Content-Type', 'application/pdf');
      
      const isDownload = req.query.download === 'true';
      
      if (isDownload) {
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`);
      } else {
        res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(downloadName)}`);
      }
      
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
      
      if (!application) {
        return res.status(404).json({ message: "الطلب غير موجود" });
      }

      // Check if we have Cloudinary URL (priority)
      if (application.educationCertCloudinaryUrl) {
        let cloudinaryUrl = application.educationCertCloudinaryUrl;
        
        if (req.query.download === 'true') {
          cloudinaryUrl = cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');
        } else {
          cloudinaryUrl = cloudinaryUrl.replace('/upload/', '/upload/fl_inline/');
        }
        
        return res.redirect(cloudinaryUrl);
      }
      
      // Fallback to local file
      if (!application.educationCertFilename) {
        return res.status(404).json({ 
          message: "لم يتم رفع شهادة التعليم بعد.",
          fileNotFound: true 
        });
      }

      const filePath = path.join(uploadsDir, application.educationCertFilename);
      
      if (!fs.existsSync(filePath)) {
        console.log(`Education cert file not found: ${filePath} for application ID: ${id}`);
        return res.status(404).json({ 
          message: "الملف غير متاح حالياً. يرجى المحاولة لاحقاً أو الاتصال بالدعم الفني.",
          fileNotFound: true
        });
      }

      let downloadName = application.educationCertOriginalName || application.educationCertFilename;
      
      if (downloadName && /[^\x20-\x7E\u0600-\u06FF\u0750-\u077F]/.test(downloadName) && !downloadName.includes('.pdf')) {
        downloadName = `شهادة_تعليمية_${application.fullName || id}.pdf`;
      } else if (!downloadName.endsWith('.pdf')) {
        downloadName = downloadName + '.pdf';
      }

      res.setHeader('Content-Type', 'application/pdf');
      
      const isDownload = req.query.download === 'true';
      
      if (isDownload) {
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`);
      } else {
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
      
      if (!application) {
        return res.status(404).json({ message: "الطلب غير موجود" });
      }

      // Check if we have Cloudinary URLs
      if (application.workExperienceCloudinaryUrls) {
        const cloudinaryUrls = application.workExperienceCloudinaryUrls.split(',');
        if (fileIndex < cloudinaryUrls.length && fileIndex >= 0) {
          let cloudinaryUrl = cloudinaryUrls[fileIndex].trim();
          if (cloudinaryUrl) {
            if (req.query.download === 'true') {
              cloudinaryUrl = cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');
            } else {
              cloudinaryUrl = cloudinaryUrl.replace('/upload/', '/upload/fl_inline/');
            }
            return res.redirect(cloudinaryUrl);
          }
        }
      }

      // Fallback to local files
      if (!application.workExperienceFilenames) {
        return res.status(404).json({ 
          message: "لم يتم رفع ملفات الخبرة العملية بعد.",
          fileNotFound: true 
        });
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
        return res.status(404).json({ 
          message: "الملف غير متاح حالياً. يرجى المحاولة لاحقاً أو الاتصال بالدعم الفني.",
          fileNotFound: true
        });
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
      
      // Get application first to delete files from Cloudinary
      const application = await storage.getApplicationById(id);
      if (application) {
        // Delete files from Cloudinary
        const filesToDelete: Promise<void>[] = [];
        
        if (application.cvCloudinaryId) {
          filesToDelete.push(deleteFromCloudinary(application.cvCloudinaryId));
        }
        
        if (application.educationCertCloudinaryId) {
          filesToDelete.push(deleteFromCloudinary(application.educationCertCloudinaryId));
        }
        
        if (application.workExperienceCloudinaryIds) {
          const workExpIds = application.workExperienceCloudinaryIds.split(',');
          workExpIds.forEach(id => {
            if (id.trim()) {
              filesToDelete.push(deleteFromCloudinary(id.trim()));
            }
          });
        }
        
        // Delete files from Cloudinary (don't wait for completion to avoid blocking)
        if (filesToDelete.length > 0) {
          Promise.all(filesToDelete).catch(error => {
            console.error('Error deleting files from Cloudinary:', error);
          });
        }
      }
      
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
      // Get all applications first to delete files from Cloudinary
      const applications = await storage.getAllApplications();
      
      const filesToDelete: Promise<void>[] = [];
      
      applications.forEach(app => {
        if (app.cvCloudinaryId) {
          filesToDelete.push(deleteFromCloudinary(app.cvCloudinaryId));
        }
        
        if (app.educationCertCloudinaryId) {
          filesToDelete.push(deleteFromCloudinary(app.educationCertCloudinaryId));
        }
        
        if (app.workExperienceCloudinaryIds) {
          const workExpIds = app.workExperienceCloudinaryIds.split(',');
          workExpIds.forEach(id => {
            if (id.trim()) {
              filesToDelete.push(deleteFromCloudinary(id.trim()));
            }
          });
        }
      });
      
      // Delete files from Cloudinary (don't wait for completion to avoid blocking)
      if (filesToDelete.length > 0) {
        Promise.all(filesToDelete).catch(error => {
          console.error('Error deleting files from Cloudinary:', error);
        });
      }
      
      await storage.deleteAllApplications();
      res.json({ message: "تم حذف جميع الطلبات بنجاح" });
    } catch (error) {
      console.error('Error deleting all applications:', error);
      res.status(500).json({ message: "فشل في حذف الطلبات" });
    }
  });

  // Delete selected applications (bulk delete)
  app.delete("/api/applications/bulk", async (req, res) => {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "معرفات الطلبات مطلوبة" });
      }
      
      // Get applications first to delete files from Cloudinary
      const applications = await Promise.all(
        ids.map(id => storage.getApplicationById(parseInt(id)))
      );
      
      const filesToDelete: Promise<void>[] = [];
      
      applications.forEach(app => {
        if (app) {
          if (app.cvCloudinaryId) {
            filesToDelete.push(deleteFromCloudinary(app.cvCloudinaryId));
          }
          
          if (app.educationCertCloudinaryId) {
            filesToDelete.push(deleteFromCloudinary(app.educationCertCloudinaryId));
          }
          
          if (app.workExperienceCloudinaryIds) {
            const workExpIds = app.workExperienceCloudinaryIds.split(',');
            workExpIds.forEach(id => {
              if (id.trim()) {
                filesToDelete.push(deleteFromCloudinary(id.trim()));
              }
            });
          }
        }
      });
      
      // Delete files from Cloudinary (don't wait for completion to avoid blocking)
      if (filesToDelete.length > 0) {
        Promise.all(filesToDelete).catch(error => {
          console.error('Error deleting files from Cloudinary:', error);
        });
      }
      
      // Delete applications from database
      await Promise.all(
        ids.map(id => storage.deleteApplication(parseInt(id)))
      );
      
      res.json({ message: `تم حذف ${ids.length} طلب بنجاح` });
    } catch (error) {
      console.error('Error deleting selected applications:', error);
      res.status(500).json({ message: "فشل في حذف الطلبات المحددة" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
