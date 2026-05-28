# ServdCo Private Chef Platform

A premium, React-based Single Page Application (SPA) marketplace that connects verified private chefs with customers looking for bespoke in-home dining experiences.

## Architecture Overview

The ServdCo platform utilizes a modern frontend-heavy SPA architecture to ensure extremely fast page loads, snappy interactions, and stateful dashboard management without full page refreshes. 

### Tech Stack
- **Frontend Framework**: React 18
- **Routing**: React Router 6 (SPA mode)
- **State Management**: Zustand (for lightweight global UI and session state)
- **Styling**: TailwindCSS 3 + Radix UI primitives + Custom Glassmorphism tokens
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Uploads**: Cloudinary Unsigned (MVP stage)

## Local Development Setup

To run the application locally, you must use `pnpm`.

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory and ensure the following keys are populated:
   ```env
   # Cloudinary configuration for chef verification uploads and portfolio galleries
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
   ```

3. **Start Development Server**
   ```bash
   pnpm dev
   ```
   The Vite dev server will typically start on `http://localhost:8080`.

## Cloudinary Upload Integration

For the MVP, file and image uploads bypass a traditional backend and upload directly from the browser to Cloudinary via unsigned presets.

**To configure your Cloudinary account:**
1. Go to your Cloudinary Console -> Settings -> Upload.
2. Scroll to **Upload presets** and click "Add upload preset".
3. Change the **Signing Mode** to **Unsigned**.
4. Set the preset name and paste it into `VITE_CLOUDINARY_UPLOAD_PRESET`.
5. (Optional) Set up incoming transformation rules to automatically compress images and generate `f_auto,q_auto` optimized thumbnails.

*See `client/services/upload.service.ts` and `useFileUpload.ts` for implementation details.*

## Future PHP Backend Integration Approach

Currently, the application relies on mock services (e.g., `BookingService`, `AuthService`, `ChefService`) returning simulated static data or interacting with `localStorage`. 

To integrate this frontend with the planned PHP backend:
1. **Update API Layers**: Navigate to `client/services/` and swap out the mocked Promises with standard `fetch()` or `axios` calls pointing to your PHP REST endpoints.
2. **Remove LocalStorage Sync**: Modules like `useAdminStore.ts` and `usePlatformStore.ts` currently persist to `localStorage`. Update these Zustand stores to fetch initial state from a `/api/settings` PHP route instead.
3. **Secure Uploads**: Transition Cloudinary uploads from *unsigned* to *signed*. The frontend should request a signature payload from the PHP backend before submitting files to Cloudinary, ensuring users cannot upload malicious files or bypass quota limits.

## Project Structure & Conventions

- `client/pages/`: Contains monolithic route entry points (e.g., `AdminDashboard.tsx`, `ChefDashboard.tsx`). 
- `client/components/`: Modular, reusable UI chunks. Highly segmented for performance.
  - `admin/`: Extracted lazy-loaded components for the Admin Dashboard.
  - `chef/`: Extracted components for the Chef dashboard.
  - `ui/`: Core design system elements (buttons, inputs, empty states, skeletons).
- `client/store/`: Zustand global stores. Only used when prop-drilling becomes excessive (e.g., notifications, platform fees).
- `client/services/`: The API abstraction layer. This is where you will inject PHP backend hooks.

## Deployment Flow

The project is built for static deployment or serverless deployment (Vercel/Netlify) alongside the Express proxy.

```bash
# Generate the production build
pnpm build
```

The output will be placed in the `dist/` directory, ready to be served by Nginx, Apache, or any static hosting provider.
