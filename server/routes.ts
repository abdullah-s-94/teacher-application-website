import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertApplicationSchema } from "@shared/schema";
import { nafathService } from "./nafath";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadToCloudinary, deleteFromCloudinary } from "./cloudinary";

import https from "https";
import crypto from "crypto";

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

// Secure credential storage with proper hashing
const SECURE_USERS = {
  "Admin": {
    // Password: Abu0555700769@@
    passwordHash: "5d88cded2bddb40f9d6a7cc1c7bbffc4c0179cccfdac70c9d6e6c7a3d870148f", 
    type: "super_admin",
    name: "مدير المجمع",
    permissions: { canSwitchGender: true, gender: null }
  },
  "AdminB": {
    // Password: Abu0555700769@@B
    passwordHash: "2276943c9c04f3c0b91d63bde99999e3bd6a4ca9b38f76c86724473dd0d53558",
    type: "boys_admin", 
    name: "مدير مجمع البنين",
    permissions: { canSwitchGender: false, gender: "male" }
  },
  "AdminG": {
    // Password: Abu0555700769@@G
    passwordHash: "a27d40a15446dc14a78258a42852e53b83a0f0870bb875f4fb7eba700624fa0a",
    type: "girls_admin",
    name: "مدير مجمع البنات", 
    permissions: { canSwitchGender: false, gender: "female" }
  }
};

// Secure password hashing function
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'ANJAL_SCHOOLS_SALT_2025').digest('hex');
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Secure authentication endpoint
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "اسم المستخدم وكلمة المرور مطلوبان" 
      });
    }

    const user = SECURE_USERS[username as keyof typeof SECURE_USERS];
    const hashedPassword = hashPassword(password);
    
    if (user && user.passwordHash === hashedPassword) {
      // Successful authentication
      res.json({
        success: true,
        user: {
          username,
          type: user.type,
          name: user.name,
          permissions: user.permissions
        }
      });
    } else {
      // Failed authentication
      res.status(401).json({
        success: false,
        message: "اسم المستخدم أو كلمة المرور غير صحيحة"
      });
    }
  });

  // Secure recovery endpoint
  app.post("/api/auth/recovery", (req, res) => {
    const { recoveryCode } = req.body;
    
    if (recoveryCode !== "ANJAL2025RECOVERY#") {
      return res.status(401).json({ 
        success: false, 
        message: "رمز الاستعادة غير صحيح" 
      });
    }

    // Only provide credentials on valid recovery code
    const credentials = [
      {
        username: "Admin",
        password: "Abu0555700769@@",
        role: "مدير المجمع - صلاحيات كاملة",
        description: "يمكنه الوصول لجميع المجمعات والتبديل بينها"
      },
      {
        username: "AdminB",
        password: "Abu0555700769@@B",
        role: "مدير مجمع البنين",
        description: "يمكنه الوصول لمجمع البنين فقط"
      },
      {
        username: "AdminG",
        password: "Abu0555700769@@G",
        role: "مدير مجمع البنات",
        description: "يمكنه الوصول لمجمع البنات فقط"
      }
    ];

    res.json({
      success: true,
      credentials
    });
  });

  // Check for duplicate national ID
  app.get("/api/applications/check-duplicate/:nationalId/:gender", async (req, res) => {
    try {
      const { nationalId, gender } = req.params;
      
      const existingApplication = await storage.getApplicationByNationalId(nationalId, gender);
      
      if (existingApplication) {
        res.json({ 
          exists: true, 
          message: "يوجد طلب مسجل مسبقاً بنفس رقم الهوية الوطنية" 
        });
      } else {
        res.json({ 
          exists: false 
        });
      }
    } catch (error) {
      console.error('Error checking duplicate national ID:', error);
      res.status(500).json({ 
        message: "خطأ في التحقق من رقم الهوية" 
      });
    }
  });

  // Submit application - support multiple files
  app.post("/api/applications", upload.fields([
    { name: 'cv', maxCount: 1 },
    { name: 'educationCert', maxCount: 1 },
    { name: 'workExperience', maxCount: 3 }
  ]), async (req, res) => {
    try {
      // Check if applications are open for this gender
      const gender = req.body.gender;
      if (gender) {
        const settings = await storage.getApplicationSettings(gender);
        const isOpen = settings?.isOpen || 'yes';
        
        if (isOpen === 'no') {
          return res.status(403).json({ 
            message: `نعتذر، تم إغلاق استقبال الطلبات لـ${gender === 'male' ? 'مجمع البنين' : 'مجمع البنات'} حالياً. نتمنى لك التوفيق.`,
            applicationsClosed: true
          });
        }
      }
      
      // Check for duplicate national ID before processing
      const nationalId = req.body.nationalId;
      if (nationalId && gender) {
        const existingApplication = await storage.getApplicationByNationalId(nationalId, gender);
        if (existingApplication) {
          return res.status(409).json({ 
            message: "يوجد طلب مسجل مسبقاً بنفس رقم الهوية الوطنية. إذا كنت تشعر أنك قدمت بمعلومات خاطئة أو لم تقم برفع الملفات المطلوبة، يرجى التواصل مع إدارة المجمع لحذف طلبك السابق",
            duplicateApplication: true
          });
        }
      }
      
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
        // نفاذ verification data
        nafathVerified: req.body.nafathVerified === 'true',
        nafathTransactionId: req.body.nafathTransactionId || null,
        nafathVerificationTime: req.body.nafathVerified === 'true' ? new Date() : null,
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
        const isDownload = req.query.download === 'true';
        const isPreview = req.query.preview === 'true';
        const originalName = application.cvOriginalName || 'cv.pdf';
        
        if (isDownload) {
          // For download, fetch the file from Cloudinary and serve it with proper headers
          try {
            const fileResponse = await fetch(application.cvCloudinaryUrl);
            if (!fileResponse.ok) {
              throw new Error('Failed to fetch file from Cloudinary');
            }
            
            const fileBuffer = await fileResponse.arrayBuffer();
            
            // Set proper headers for PDF download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`);
            res.setHeader('Content-Length', fileBuffer.byteLength.toString());
            
            // Send the file buffer
            res.send(Buffer.from(fileBuffer));
            return;
          } catch (error) {
            console.error('Error fetching file from Cloudinary:', error);
            return res.status(500).json({ message: "فشل في تحميل الملف من السحابة" });
          }
        } else if (isPreview) {
          // For preview, return JSON with file info for mobile-friendly handling
          return res.json({
            url: application.cvCloudinaryUrl,
            filename: originalName,
            type: 'pdf',
            action: 'preview'
          });
        } else {
          // Default behavior (neither download nor preview) - redirect to file
          return res.redirect(302, application.cvCloudinaryUrl);
        }
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
        const isDownload = req.query.download === 'true';
        const isPreview = req.query.preview === 'true';
        const originalName = application.educationCertOriginalName || 'education-cert.pdf';
        
        if (isDownload) {
          // For download, fetch the file from Cloudinary and serve it with proper headers
          try {
            const fileResponse = await fetch(application.educationCertCloudinaryUrl);
            if (!fileResponse.ok) {
              throw new Error('Failed to fetch file from Cloudinary');
            }
            
            const fileBuffer = await fileResponse.arrayBuffer();
            
            // Set proper headers for PDF download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`);
            res.setHeader('Content-Length', fileBuffer.byteLength.toString());
            
            // Send the file buffer
            res.send(Buffer.from(fileBuffer));
            return;
          } catch (error) {
            console.error('Error fetching file from Cloudinary:', error);
            return res.status(500).json({ message: "فشل في تحميل الملف من السحابة" });
          }
        } else if (isPreview) {
          // For preview, return JSON with file info for mobile-friendly handling
          return res.json({
            url: application.educationCertCloudinaryUrl,
            filename: originalName,
            type: 'pdf',
            action: 'preview'
          });
        } else {
          // Default behavior - redirect to file
          return res.redirect(302, application.educationCertCloudinaryUrl);
        }
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
        const originalNames = application.workExperienceOriginalNames?.split(',') || [];
        
        if (fileIndex < cloudinaryUrls.length && fileIndex >= 0) {
          let cloudinaryUrl = cloudinaryUrls[fileIndex].trim();
          const originalName = originalNames[fileIndex]?.trim() || `work-experience-${fileIndex + 1}.pdf`;
          
          if (cloudinaryUrl) {
            const isDownload = req.query.download === 'true';
            
            if (isDownload) {
              // For download, fetch the file from Cloudinary and serve it with proper headers
              try {
                const fileResponse = await fetch(cloudinaryUrl);
                if (!fileResponse.ok) {
                  throw new Error('Failed to fetch file from Cloudinary');
                }
                
                const fileBuffer = await fileResponse.arrayBuffer();
                
                // Set proper headers for PDF download
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`);
                res.setHeader('Content-Length', fileBuffer.byteLength.toString());
                
                // Send the file buffer
                res.send(Buffer.from(fileBuffer));
                return;
              } catch (error) {
                console.error('Error fetching file from Cloudinary:', error);
                return res.status(500).json({ message: "فشل في تحميل الملف من السحابة" });
              }
            } else if (req.query.preview === 'true') {
              // For preview, return JSON with file info for mobile-friendly handling
              return res.json({
                url: cloudinaryUrl,
                filename: originalName,
                type: 'pdf',
                action: 'preview'
              });
            }
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
      const { gender } = req.query;
      
      // Get all applications or filter by gender
      let applications;
      if (gender) {
        applications = await storage.getApplicationsByFilter({ gender: gender as string });
      } else {
        applications = await storage.getAllApplications();
      }
      
      const specializationStats = await storage.getSpecializationStats(gender as string);
      
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

      // Get application details before updating status
      const application = await storage.getApplicationById(id);
      if (!application) {
        return res.status(404).json({ message: "الطلب غير موجود" });
      }

      // Update status in database
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

  // Application settings routes
  app.get("/api/application-settings/:gender", async (req, res) => {
    try {
      const { gender } = req.params;
      
      if (gender !== 'male' && gender !== 'female') {
        return res.status(400).json({ message: "Gender must be 'male' or 'female'" });
      }
      
      const settings = await storage.getApplicationSettings(gender);
      
      // If no settings exist, default to open
      const isOpen = settings?.isOpen || 'yes';
      
      res.json({ 
        gender, 
        isOpen,
        lastUpdated: settings?.lastUpdated || new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching application settings:', error);
      res.status(500).json({ message: "فشل في جلب إعدادات التطبيق" });
    }
  });

  app.put("/api/application-settings/:gender", async (req, res) => {
    try {
      const { gender } = req.params;
      const { isOpen } = req.body;
      
      if (gender !== 'male' && gender !== 'female') {
        return res.status(400).json({ message: "Gender must be 'male' or 'female'" });
      }
      
      if (isOpen !== 'yes' && isOpen !== 'no') {
        return res.status(400).json({ message: "isOpen must be 'yes' or 'no'" });
      }
      
      await storage.updateApplicationSettings(gender, isOpen);
      
      res.json({ 
        message: `تم تحديث إعدادات التطبيق لـ${gender === 'male' ? 'مجمع البنين' : 'مجمع البنات'}`,
        gender,
        isOpen
      });
    } catch (error) {
      console.error('Error updating application settings:', error);
      res.status(500).json({ message: "فشل في تحديث إعدادات التطبيق" });
    }
  });

  // نفاذ (Nafath) Integration Routes
  
  // Check نفاذ service configuration
  app.get("/api/nafath/status", (req, res) => {
    const isConfigured = nafathService.isConfigured();
    res.json({
      configured: isConfigured,
      message: isConfigured ? "نفاذ مكون ومتاح للاستخدام" : "نفاذ غير مكون. يرجى إضافة بيانات API."
    });
  });

  // Initiate نفاذ OAuth flow
  app.post("/api/nafath/initiate", async (req, res) => {
    try {
      const { gender } = req.body;
      
      if (!gender || (gender !== 'male' && gender !== 'female')) {
        return res.status(400).json({ message: "يجب تحديد الجنس (male أو female)" });
      }

      if (!nafathService.isConfigured()) {
        return res.status(503).json({ 
          message: "خدمة نفاذ غير متاحة حالياً. يرجى المحاولة لاحقاً أو استخدام الإدخال اليدوي." 
        });
      }

      const { authUrl, sessionToken } = await nafathService.initiateAuth(gender);
      
      res.json({
        authUrl,
        sessionToken,
        message: "تم إنشاء رابط المصادقة بنجاح"
      });

    } catch (error) {
      console.error('Error initiating نفاذ auth:', error);
      res.status(500).json({ 
        message: "خطأ في بدء عملية المصادقة عبر نفاذ" 
      });
    }
  });

  // Handle نفاذ OAuth callback
  app.get("/api/nafath/callback", async (req, res) => {
    try {
      const { code, state, error } = req.query;

      // Handle OAuth errors
      if (error) {
        console.error('نفاذ OAuth error:', error);
        return res.redirect(`/?nafath_error=${encodeURIComponent('تم إلغاء المصادقة أو حدث خطأ')}`);
      }

      if (!code || !state) {
        return res.redirect(`/?nafath_error=${encodeURIComponent('بيانات مصادقة غير صالحة')}`);
      }

      const { sessionToken, success } = await nafathService.handleCallback(
        code as string, 
        state as string
      );

      if (success) {
        // Redirect to application form with session token
        res.redirect(`/?nafath_session=${sessionToken}&nafath_success=true`);
      } else {
        res.redirect(`/?nafath_error=${encodeURIComponent('فشل في التحقق من نفاذ')}`);
      }

    } catch (error) {
      console.error('Error handling نفاذ callback:', error);
      res.redirect(`/?nafath_error=${encodeURIComponent('خطأ في عملية المصادقة')}`);
    }
  });

  // Get نفاذ session data
  app.get("/api/nafath/session/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ message: "مطلوب رمز الجلسة" });
      }

      const sessionData = await nafathService.getSessionData(token);
      
      if (!sessionData) {
        return res.status(404).json({ 
          message: "جلسة غير موجودة أو منتهية الصلاحية" 
        });
      }

      res.json({
        data: sessionData,
        message: "تم جلب بيانات نفاذ بنجاح"
      });

    } catch (error) {
      console.error('Error fetching نفاذ session:', error);
      res.status(500).json({ 
        message: "خطأ في جلب بيانات الجلسة" 
      });
    }
  });

  // Clean up نفاذ session (optional)
  app.delete("/api/nafath/session/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ message: "مطلوب رمز الجلسة" });
      }

      await nafathService.cleanupSession(token);
      
      res.json({ message: "تم حذف الجلسة بنجاح" });

    } catch (error) {
      console.error('Error cleaning up نفاذ session:', error);
      res.status(500).json({ 
        message: "خطأ في حذف الجلسة" 
      });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize application settings on server start
  storage.initializeApplicationSettings().catch(error => {
    console.error('Error initializing application settings:', error);
  });
  
  return httpServer;
}
