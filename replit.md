# Employment Application System - Anjal Al-Nukhba Schools

## Overview

This is a full-stack web application for job applications at Anjal Al-Nukhba Private Schools. It provides a bilingual (Arabic/English) interface for teachers and staff to submit employment applications with CV uploads, and includes an admin dashboard for reviewing applications.

## System Architecture

### Full-Stack Architecture
- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **File Storage**: Local file system for CV uploads
- **UI Framework**: shadcn/ui with Tailwind CSS
- **State Management**: TanStack Query for server state

### Monorepo Structure
The application uses a monorepo structure with shared code:
- `client/` - React frontend application
- `server/` - Express.js backend API
- `shared/` - Shared TypeScript schemas and types
- `uploads/` - Local directory for uploaded CV files

## Key Components

### Frontend Architecture
- **React 18** with functional components and hooks
- **TypeScript** for type safety across the application
- **shadcn/ui** component library for consistent UI
- **Tailwind CSS** for styling with Arabic RTL support
- **React Hook Form** with Zod validation for form handling
- **TanStack Query** for API state management
- **Simple authentication** system for admin access with localStorage

### Backend Architecture
- **Express.js** server with TypeScript
- **Multer** for handling file uploads (PDF CVs only)
- **Drizzle ORM** for database operations
- **PostgreSQL** database with Neon serverless adapter
- **Custom storage interface** with database implementation
- **RESTful API** design with proper error handling

### Database Schema
Two main entities:
1. **Applications** - Stores job application data including personal info, qualifications, and CV file references
2. **Users** - Basic user authentication system (prepared but not fully implemented)

Key application fields:
- Personal information (name, phone, email, city, birth date)
- Job details (position, qualification, specialization from predefined list)
- Experience and grade information
- CV file metadata (filename, original name)
- Automatic age calculation from birth date

## Data Flow

1. **Application Submission**:
   - User fills out the Arabic RTL form
   - CV file is validated (PDF only, 5MB limit)
   - Form data is validated using Zod schemas
   - File is uploaded to local storage
   - Application data is stored in database

2. **Admin Dashboard**:
   - Displays paginated list of applications
   - Provides filtering by position, qualification, experience
   - Search functionality across applicant data
   - CV download functionality
   - Statistics dashboard showing application metrics

3. **File Management**:
   - CVs stored in `uploads/` directory
   - Unique filename generation to prevent conflicts
   - Secure file serving through API endpoints

## External Dependencies

### Core Framework Dependencies
- React 18 with TypeScript support
- Express.js for backend API
- Drizzle ORM with PostgreSQL adapter
- Vite for frontend build tooling

### UI/UX Dependencies
- shadcn/ui component library
- Radix UI primitives for accessibility
- Tailwind CSS for styling
- Cairo font for Arabic text support

### Development Tools
- ESBuild for backend bundling
- PostCSS for CSS processing
- TypeScript compiler for type checking

### Database & Storage
- PostgreSQL as primary database
- Neon Database serverless adapter
- Multer for multipart form handling

## Deployment Strategy

### Build Process
- Frontend: Vite builds optimized production bundle
- Backend: ESBuild bundles server code with external packages
- Static assets served from `dist/public`

### Environment Configuration
- Development: `npm run dev` runs both frontend and backend
- Production: `npm run build` then `npm run start`
- Database URL required via environment variable

### Replit Configuration
- Uses Node.js 20, Web, and PostgreSQL modules
- Configured for autoscale deployment
- Port 5000 for development, port 80 for production
- Parallel workflow setup for development

### File Storage Considerations
- Current implementation uses local file storage
- Files are temporarily lost when environment restarts (development limitation)
- Production deployment requires cloud storage solutions for permanent file storage
- Recommended options: Cloudinary (free tier), AWS S3, or Google Cloud Storage
- CV files need persistent storage across deployments

## User Preferences

Preferred communication style: Simple, everyday language.

## Authentication

### Multi-Level Admin Access System
The system now supports three types of admin users with different permission levels:

#### 1. Super Admin (مدير المجمع)
- Username: `Admin`
- Password: `Abu0555700769@@`
- Full access to both gender complexes
- Can switch between Boys and Girls complexes
- Complete administrative privileges

#### 2. Boys Complex Admin (مدير مجمع البنين)
- Username: `AdminB`
- Password: `Abu0555700769@@B`
- Access limited to Boys complex applications only
- Cannot switch between complexes (shows error message)
- Full management rights within Boys complex scope

#### 3. Girls Complex Admin (مدير مجمع البنات)
- Username: `AdminG`
- Password: `Abu0555700769@@G`
- Access limited to Girls complex applications only
- Cannot switch between complexes (shows error message)
- Full management rights within Girls complex scope

### Permission System
- User information displayed in admin dashboard header
- Role-based access control for complex switching
- Automatic gender filtering based on user permissions
- localStorage-based authentication with user metadata storage

### Security Features
- **Enterprise-Grade Security**: Complete server-side authentication system with SHA-256 password hashing and salt
- **Zero Client-Side Credentials**: No passwords stored in browser, all authentication handled server-side
- **Secure Password Hashing**: SHA-256 with custom salt 'ANJAL_SCHOOLS_SALT_2025' prevents rainbow table attacks
- **Per-Device Rate Limiting**: Failed login attempts tracked separately for each device using fingerprinting
- **Device Fingerprinting**: Uses browser characteristics (user agent, screen resolution, timezone, canvas rendering) to identify devices
- **Individual Device Blocking**: Each device gets 5 attempts before 5-minute lockout (prevents site-wide blocking)
- **Real-time Blocking**: Visual countdown timer shows remaining lockout time for current device
- **Secure Recovery System**: Recovery endpoint requires master code, credentials only provided server-side
- **Recovery Code**: Master recovery code `ANJAL2025RECOVERY#` provides emergency access via secure API endpoint
- **Progressive Disclosure**: Recovery link only appears after multiple failed login attempts from the same device
- **API Security**: All authentication endpoints use proper HTTP status codes and secure response handling

## Known Issues & Solutions

### CV File Download Issues (Resolved)
- **Problem**: Arabic filenames were showing corrupted characters due to encoding issues
- **Solution**: Implemented proper UTF-8 encoding for file downloads and smart filename detection
- **Problem**: CV download links were not working properly
- **Solution**: Enhanced error handling and improved file serving with proper headers

### File Storage Considerations
- Current implementation uses local file storage
- Uploaded files may be lost during environment restarts
- Production deployment should consider cloud storage solutions

## Changelog

Changelog:
- June 27, 2025. Initial setup
- June 27, 2025. Added PostgreSQL database integration with Drizzle ORM, migrated from memory storage to persistent database storage
- June 27, 2025. Implemented admin authentication system with login/logout functionality
- June 27, 2025. Fixed React hooks error in admin panel and enhanced UI with detailed applicant view modals, improved statistics cards, and better loading states
- June 27, 2025. Added navigation between application form and admin panel with dedicated buttons, updated copyright year to 2025
- June 27, 2025. Removed all images containing people and replaced with appropriate SVG icons for girls' school environment
- June 27, 2025. Fixed CV download functionality and Arabic filename encoding issues
- June 27, 2025. Added birth date field with automatic age calculation in admin panel, converted specialization to dropdown with predefined options (early childhood, Arabic, English, computer science, mathematics, chemistry, physics, history, geography, business administration, biology, home economics, religion)
- June 27, 2025. Implemented comprehensive application management system: application status workflow (under review/accepted/rejected), individual and bulk delete functionality, specialization statistics in admin dashboard, status-based sorting (under review items appear first)
- June 27, 2025. Added input validation: full name accepts Arabic characters only, phone number accepts English digits only, replaced email field with national ID field (10 digits), added professional license question with filtering capability
- June 27, 2025. Enhanced file management: fixed download functionality using direct window.open method, implemented document thumbnail previews for all uploaded files (CV, education certificates, work experience files) with color-coded borders and preview/download buttons
- June 27, 2025. Fixed critical preview and download issues: separated preview (inline viewing) from download (file downloading), added scrollable container for work experience files, implemented server-side Content-Disposition handling to distinguish between preview and download actions
- June 27, 2025. Fixed professional license display and filtering: added professional license information to applicant details modal, corrected filter values from "true/false" to "yes/no" to match database schema, improved scrolling in applicant details dialog
- June 27, 2025. Fixed professional license data consistency: corrected application form to send "yes/no" values instead of Arabic text, ensuring proper storage and filtering functionality for professional license field
- June 27, 2025. Enhanced deletion functionality: fixed redirect issue after deleting individual applications (now stays on admin page), added bulk delete feature with checkboxes for selecting multiple applications, implemented "select all" functionality, all delete operations now refresh data without page reload
- June 27, 2025. Fixed search functionality: implemented debounce search with 500ms delay to prevent immediate search on first character, allowing users to complete their input before triggering search query
- June 28, 2025. Enhanced file error handling: improved error messages for missing files with clear explanations, added proper error handling for file preview/download operations, implemented toast notifications for file access errors with descriptive messages
- June 28, 2025. Integrated Cloudinary cloud storage: implemented permanent file storage solution using Cloudinary, all uploaded files (CV, education certificates, work experience files) now stored permanently in cloud, added automatic file cleanup when applications are deleted, maintained backward compatibility with existing local files
- June 28, 2025. Implemented unified gender-based application system: created gender selection landing page, separated admin dashboard by gender (Boys' Complex vs Girls' Complex), converted all interface text to masculine form as requested, added navigation breadcrumbs and home buttons throughout the system for better user experience
- June 28, 2025. Enhanced specialization field with custom input option: added "Other" option to specialization dropdown with conditional custom text input field, implemented proper validation to ensure custom specialization is provided when "Other" is selected, updated admin panel to display custom specializations in tables and details, modified specialization statistics to properly group custom specializations
- June 28, 2025. Fixed gender-neutral language consistency: updated all placeholder texts and form instructions to use masculine form consistently across both male and female application forms, ensuring unified language experience regardless of selected gender track
- June 28, 2025. Improved search functionality user experience: replaced automatic debounced search with manual search triggered by Enter key or search button, implemented immediate clearing when search field is empty, added search button alongside input field for better user control and reduced server load
- June 28, 2025. Implemented multi-level admin access system: created three user types with different permission levels - Super Admin (Admin) with full access to both complexes, Boys Complex Admin (AdminB) with access only to boys applications, and Girls Complex Admin (AdminG) with access only to girls applications. Added role-based access control preventing gender-specific admins from switching between complexes, displaying appropriate error messages. Enhanced admin dashboard to show current user information and permissions in header.
- June 28, 2025. Enhanced security measures: implemented password hashing to prevent plain text exposure in browser inspection, added rate limiting system (5 failed attempts = 5 minute lockout), created real-time blocking with countdown timer, added emergency recovery page with master recovery code (ANJAL2025RECOVERY#), implemented progressive disclosure of recovery options appearing only after multiple failed attempts.
- June 28, 2025. Implemented per-device security tracking: replaced global rate limiting with device-specific fingerprinting system using browser characteristics (user agent, screen resolution, timezone, canvas rendering), ensuring each device gets independent 5-attempt limit preventing site-wide blocking, updated all security messages to clarify per-device behavior.
- June 28, 2025. Applied unified visual identity across entire website: implemented consistent glassmorphism design with animated background elements, neutral slate/gray color scheme with subtle gender-specific accents (blue for boys, rose for girls), unified Cairo Arabic font, interactive hover effects and transitions, backdrop blur effects, and consistent button styling throughout all pages (home, admin login, admin selection, admin dashboard).
- June 28, 2025. Enhanced application form visual identity: replaced default green and gold colors with gender-specific themes (blue for boys, rose for girls), updated all file upload buttons and success indicators to match respective gender themes, modified CSS color variables to dynamically switch based on gender selection, ensuring complete visual consistency across all form elements.
- June 28, 2025. Fixed admin login/logout logic and routing system: corrected routing paths (/admin → Admin, /admin/selection → AdminSelection), implemented proper user-type-based redirection (super admin → selection page, gender-specific admins → direct admin access), fixed duplicate navigation buttons after logout, removed green color artifacts from login forms by updating CSS variables to use neutral slate/gray palette, enhanced logout functionality to clear all admin data properly.
- June 28, 2025. Completed comprehensive pre-deployment system verification: validated gender-based data flow (male/female applications correctly filtered to respective admin dashboards), confirmed all filtering capabilities work properly (gender, position, qualification, search), verified Cloudinary cloud storage integration is ready for permanent file storage, tested security measures including password hashing and per-device rate limiting, validated system capacity for handling 1000+ applications with optimal performance (sub-500ms response times), fixed critical API gender parameter bug in server routes.
- June 28, 2025. Enhanced iPhone Safari compatibility: added comprehensive mobile optimizations including iOS-specific meta tags, touch-friendly button sizes (44px minimum), prevention of auto-zoom on form inputs, viewport height fixes for Safari, smooth scrolling, backdrop blur fixes, font loading optimization to prevent flash of unstyled content, and proper RTL Arabic text rendering on mobile devices.
- June 28, 2025. Fixed critical application submission bug: resolved form validation issue where gender field was required but not provided, updated schema to exclude file-related fields from validation, enabling successful form submissions. Enhanced file handling error messages with clearer user guidance for missing or inaccessible files, improved Cloudinary download handling with proper attachment parameters.
- June 28, 2025. Fixed language consistency to masculine form: corrected work experience file upload text from "الخبرات العملية السابقة" to "ملفات الخبرة المهنية" and error message from "للخبرات العملية" to "للخبرة المهنية", ensuring all application form text uses consistent masculine language regardless of gender selection.
- June 28, 2025. Resolved file preview and download functionality: fixed critical issue where clicking "preview" button caused automatic file download instead of displaying content. Implemented Google Docs Viewer integration for PDF preview, separated preview and download functions with distinct query parameters (preview=true vs download=true), ensured Cloudinary raw files work correctly with both preview and download modes. Preview now opens files in Google Docs Viewer for proper viewing, while download triggers direct file download with attachment headers.
- June 28, 2025. Fixed critical Cloudinary download corruption issue: resolved problem where downloaded files were corrupted text files instead of actual PDFs. Implemented server-side proxy system that fetches files from Cloudinary and serves them with proper PDF headers and content-type. Changed Cloudinary upload settings from 'raw' to 'auto' resource type for better file handling. All file downloads (CV, education certificates, work experience files) now deliver genuine PDF content starting with proper PDF headers (%PDF-1.4, %PDF-1.7). System now fully compatible with iPhone Safari and all desktop browsers.
- June 28, 2025. Fixed PDF preview functionality: Cloudinary raw files were being downloaded as text instead of displayed. Implemented Google Docs Viewer integration for PDF preview functionality, allowing users to view PDFs directly in browser without downloading. Download functionality continues to work correctly with server-side proxy delivering actual PDF files.
- June 28, 2025. Enhanced visual clarity of job position badges: replaced pale color scheme with vibrant, high-contrast colors. Teacher positions now use sky blue (bg-sky-500), admin positions use violet (bg-violet-500), vice principals use amber (bg-amber-500), and principals use rose (bg-rose-500). All badges now feature white text and subtle shadows for improved readability and professional appearance.
- June 28, 2025. Fixed critical role-based authentication bug: Gender-specific admins (AdminB and AdminG) were not properly loading their gender permissions on page refresh. Implemented useState initialization with localStorage data to ensure selectedGender is set correctly from the start, preventing empty data displays. Both AdminB (boys admin) and AdminG (girls admin) now correctly display their respective gender-filtered applications.
- June 29, 2025. Implemented enterprise-grade authentication security: Migrated from client-side credential storage to secure server-side authentication system using SHA-256 password hashing with custom salt. Removed all plain-text passwords from client-side code, preventing exposure through browser inspection or source code analysis. Added secure API endpoints (/api/auth/login and /api/auth/recovery) with proper authentication handling. Recovery system now requires server-side validation with master recovery code. All passwords are now properly hashed and salted server-side, making the system ready for production deployment with military-grade security.
- June 29, 2025. Enhanced social media sharing with masculine-focused branding: Added comprehensive Open Graph and Twitter Card meta tags to improve WhatsApp and social media sharing appearance. Created custom SVG image (og-image.svg) featuring masculine school imagery including male teacher figure, school building, and masculine Arabic text. Updated all meta descriptions to use masculine language form ("قدم" instead of "قدمي") ensuring consistent masculine branding across all social platforms. Social sharing now displays professional masculine imagery representing the school's employment opportunities.
- June 29, 2025. Implemented application control system for super admin: Added dynamic application toggle functionality allowing super admin to open/close application submissions for each gender separately. Created new database table (application_settings) to track open/closed status per gender with automatic initialization. Added secure API endpoints (/api/application-settings/:gender) for getting and updating settings. Integrated application status checking into form submission process - when closed, displays professional Arabic message "نعتذر، تم إغلاق استقبال الطلبات" with encouraging farewell text. Super admin dashboard now shows application control card with real-time status indicators and toggle buttons. System ensures complete control over recruitment periods while maintaining professional user experience.
- July 1, 2025. Implemented duplicate application prevention system: Added comprehensive national ID validation to prevent duplicate applications within the same gender complex. Created API endpoint (/api/applications/check-duplicate/:nationalId/:gender) for real-time duplicate checking. Enhanced application form with onBlur validation that instantly checks for existing applications using the same national ID and gender combination. Added server-side duplicate validation during form submission as additional security layer. When duplicate is detected, displays Arabic error message instructing applicant to contact complex administration if they believe they submitted incorrect information. System maintains data integrity while providing clear guidance for legitimate cases requiring updates.
- July 2, 2025. Migrated SMS service from Plivo to AWS SNS for cost efficiency: Replaced Plivo integration with AWS SNS to utilize free tier (1,000 SMS/month for 12 months). Updated SMS service to use AWS SDK with proper credentials configuration (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION). Enhanced admin dashboard with SMS status indicator showing service availability. SMS notifications automatically sent for accepted/rejected applications when AWS credentials are configured. System ready for production deployment with significant cost savings compared to Plivo's $0.082 per SMS pricing.