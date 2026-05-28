import { create } from 'zustand';

export interface Document {
  id: string;
  chef_id: string;
  chef_name: string;
  type: string;
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
}

export interface Region {
  id: string;
  name: string;
  status: 'active' | 'launching' | 'waitlist';
  chefs_count: number;
  families_count: number;
  auto_launch?: boolean;
}

interface AdminState {
  documents: Document[];
  regions: Region[];
  isLoading: boolean;
  setDocuments: (docs: Document[]) => void;
  updateDocumentStatus: (id: string, status: Document['status']) => void;
  setRegions: (regions: Region[]) => void;
  updateRegion: (id: string, region: Partial<Region>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  documents: [],
  regions: [],
  isLoading: false,
  setDocuments: (docs) => set({ documents: docs }),
  updateDocumentStatus: (id, status) =>
    set((state) => ({
      documents: state.documents.map((d) => (d.id === id ? { ...d, status } : d)),
    })),
  setRegions: (regions) => set({ regions }),
  updateRegion: (id, regionUpdates) =>
    set((state) => ({
      regions: state.regions.map((r) => (r.id === id ? { ...r, ...regionUpdates } : r)),
    })),
  setLoading: (loading) => set({ isLoading: loading }),
}));
