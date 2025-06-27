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
- Production deployment should consider cloud storage solutions
- CV files need persistent storage across deployments

## User Preferences

Preferred communication style: Simple, everyday language.

## Authentication

### Admin Access
- Username: `Admin`
- Password: `Abu0555700769@@`
- Simple localStorage-based authentication
- Admin panel access protected by login form
- Logout functionality available in admin dashboard

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