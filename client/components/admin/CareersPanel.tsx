import { useMemo, useState } from "react";
import {
  Briefcase,
  FileUser,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Download,
  X,
  Save,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CareersSupabaseService,
  careersQueryKeys,
} from "@/services/supabase/careers.service";
import type { CareerApplication, CareerJob, CareerJobStatus } from "@shared/careers";
import {
  careerApplicationStatusLabels,
  careerApplicationStatuses,
  careerJobStatuses,
} from "@shared/careers";
import { BrandSelect } from "@/components/ui/BrandSelect";
import { cn } from "@/lib/utils";

type PanelTab = "jobs" | "applications";

const JOB_STATUS_LABELS: Record<CareerJobStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

const JOB_STATUS_STYLES: Record<CareerJobStatus, string> = {
  draft: "bg-white/5 text-[#A8A8A8]",
  published: "bg-[#2E7D66]/10 text-[#2E7D66]",
  archived: "bg-[#FF7A59]/10 text-[#FF7A59]",
};

const EMPTY_JOB_FORM = {
  title: "",
  department: "",
  location: "",
  employment_type: "Full-time",
  salary_range: "",
  description: "",
  requirements: "",
  benefits: "",
  status: "draft" as CareerJobStatus,
};

type JobFormState = typeof EMPTY_JOB_FORM;

const inputClass =
  "w-full px-3 py-2.5 bg-[#161616] border border-white/10 rounded-xl text-xs text-white placeholder:text-[#A8A8A8]/60 focus:outline-none focus:ring-1 focus:ring-[#FF7A59]/40";

const textareaClass =
  "w-full px-3 py-2.5 bg-[#161616] border border-white/10 rounded-xl text-xs text-white placeholder:text-[#A8A8A8]/60 focus:outline-none focus:ring-1 focus:ring-[#FF7A59]/40 resize-y min-h-[80px]";

const TAB_CONFIG: { id: PanelTab; label: string; icon: typeof Briefcase }[] = [
  { id: "jobs", label: "Job Postings", icon: Briefcase },
  { id: "applications", label: "Applications", icon: FileUser },
];

function jobToForm(job: CareerJob): JobFormState {
  return {
    title: job.title,
    department: job.department,
    location: job.location,
    employment_type: job.employment_type,
    salary_range: job.salary_range ?? "",
    description: job.description,
    requirements: job.requirements ?? "",
    benefits: job.benefits ?? "",
    status: job.status,
  };
}

export function CareersPanel() {
  const [activeTab, setActiveTab] = useState<PanelTab>("jobs");
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: careersQueryKeys.jobs(),
    queryFn: () => CareersSupabaseService.listAllJobs(),
  });

  const { data: applications = [], isLoading: applicationsLoading } = useQuery({
    queryKey: careersQueryKeys.applications(),
    queryFn: () => CareersSupabaseService.listApplications(),
  });

  const invalidateJobs = () =>
    queryClient.invalidateQueries({ queryKey: careersQueryKeys.all });

  const upsertJobMutation = useMutation({
    mutationFn: (input: Parameters<typeof CareersSupabaseService.upsertJob>[0]) =>
      CareersSupabaseService.upsertJob(input),
    onSuccess: () => {
      invalidateJobs();
      toast.success("Job saved");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save job"),
  });

  const setJobStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CareerJobStatus }) =>
      CareersSupabaseService.setJobStatus(id, status),
    onSuccess: () => {
      invalidateJobs();
      toast.success("Job status updated");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update status"),
  });

  const deleteJobMutation = useMutation({
    mutationFn: (id: string) => CareersSupabaseService.deleteJob(id),
    onSuccess: () => {
      invalidateJobs();
      toast.success("Job deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete job"),
  });

  const updateApplicationMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<CareerApplication, "status" | "notes">>;
    }) => CareersSupabaseService.updateApplication(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: careersQueryKeys.applications() });
      toast.success("Application updated");
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to update application"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white font-serif">Careers</h2>
          <p className="text-xs text-[#A8A8A8] mt-1">
            Manage job postings and review candidate applications.
          </p>
        </div>
        <p className="text-xs text-[#A8A8A8]">
          {jobs.length} job{jobs.length === 1 ? "" : "s"} · {applications.length}{" "}
          application{applications.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors",
              activeTab === id
                ? "bg-[#FF7A59] text-white"
                : "bg-white/5 text-[#A8A8A8] hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "jobs" ? (
        <JobsSection
          jobs={jobs}
          isLoading={jobsLoading}
          onUpsert={(input) => upsertJobMutation.mutate(input)}
          onSetStatus={(id, status) => setJobStatusMutation.mutate({ id, status })}
          onDelete={(id) => deleteJobMutation.mutate(id)}
          isSaving={upsertJobMutation.isPending}
          isStatusPending={setJobStatusMutation.isPending}
          isDeletePending={deleteJobMutation.isPending}
        />
      ) : (
        <ApplicationsSection
          applications={applications}
          isLoading={applicationsLoading}
          onUpdate={(id, updates) => updateApplicationMutation.mutate({ id, updates })}
          isUpdating={updateApplicationMutation.isPending}
        />
      )}
    </div>
  );
}

function JobsSection({
  jobs,
  isLoading,
  onUpsert,
  onSetStatus,
  onDelete,
  isSaving,
  isStatusPending,
  isDeletePending,
}: {
  jobs: CareerJob[];
  isLoading: boolean;
  onUpsert: (input: Parameters<typeof CareersSupabaseService.upsertJob>[0]) => void;
  onSetStatus: (id: string, status: CareerJobStatus) => void;
  onDelete: (id: string) => void;
  isSaving: boolean;
  isStatusPending: boolean;
  isDeletePending: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<JobFormState>(EMPTY_JOB_FORM);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_JOB_FORM);
    setShowForm(true);
  };

  const openEdit = (job: CareerJob) => {
    setEditingId(job.id);
    setForm(jobToForm(job));
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_JOB_FORM);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    onUpsert({
      id: editingId ?? crypto.randomUUID(),
      title: form.title.trim(),
      department: form.department.trim(),
      location: form.location.trim(),
      employment_type: form.employment_type.trim(),
      salary_range: form.salary_range.trim() || null,
      description: form.description.trim(),
      requirements: form.requirements.trim() || null,
      benefits: form.benefits.trim() || null,
      status: form.status,
    });
    closeForm();
  };

  const setField = <K extends keyof JobFormState>(key: K, value: JobFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={showForm && !editingId ? closeForm : openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF7A59] text-xs font-bold text-white hover:bg-[#FF7A59]/90"
        >
          {showForm && !editingId ? (
            <>
              <X size={14} /> Cancel
            </>
          ) : (
            <>
              <Plus size={14} /> New Job
            </>
          )}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="velvet-card p-5 border border-white/5 space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-white">
              {editingId ? "Edit Job Posting" : "Create Job Posting"}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={closeForm}
                className="text-[#A8A8A8] hover:text-white"
                aria-label="Close form"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-[10px] uppercase font-bold text-[#A8A8A8]">
                Title *
              </span>
              <input
                className={inputClass}
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="e.g. Private Chef — NYC"
                required
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-[#A8A8A8]">
                Department
              </span>
              <input
                className={inputClass}
                value={form.department}
                onChange={(e) => setField("department", e.target.value)}
                placeholder="Operations"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-[#A8A8A8]">
                Location
              </span>
              <input
                className={inputClass}
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
                placeholder="Remote / New York, NY"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-[#A8A8A8]">
                Employment Type
              </span>
              <input
                className={inputClass}
                value={form.employment_type}
                onChange={(e) => setField("employment_type", e.target.value)}
                placeholder="Full-time"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-[#A8A8A8]">
                Salary Range
              </span>
              <input
                className={inputClass}
                value={form.salary_range}
                onChange={(e) => setField("salary_range", e.target.value)}
                placeholder="$80k – $100k"
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-[10px] uppercase font-bold text-[#A8A8A8]">
                Status
              </span>
              <BrandSelect
                value={form.status}
                onValueChange={(v) => setField("status", v as CareerJobStatus)}
                options={careerJobStatuses.map((s) => ({
                  value: s,
                  label: JOB_STATUS_LABELS[s],
                }))}
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-[10px] uppercase font-bold text-[#A8A8A8]">
                Description *
              </span>
              <textarea
                className={textareaClass}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                rows={4}
                placeholder="Role overview and responsibilities…"
                required
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-[10px] uppercase font-bold text-[#A8A8A8]">
                Requirements
              </span>
              <textarea
                className={textareaClass}
                value={form.requirements}
                onChange={(e) => setField("requirements", e.target.value)}
                rows={3}
                placeholder="Qualifications, certifications…"
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-[10px] uppercase font-bold text-[#A8A8A8]">
                Benefits
              </span>
              <textarea
                className={textareaClass}
                value={form.benefits}
                onChange={(e) => setField("benefits", e.target.value)}
                rows={3}
                placeholder="Health, PTO, perks…"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FF7A59] text-xs font-bold text-white hover:bg-[#FF7A59]/90 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {editingId ? "Save Changes" : "Create Job"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 text-xs font-bold text-white hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-[#FF7A59]" />
        </div>
      ) : jobs.length === 0 ? (
        <p className="text-xs text-[#A8A8A8] text-center py-8">
          No job postings yet. Create your first role to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <article
              key={job.id}
              className="velvet-card p-5 border border-white/5 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#FF7A59]/10 text-[#FF7A59] flex items-center justify-center shrink-0">
                    <Briefcase size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{job.title}</p>
                    <p className="text-xs text-[#A8A8A8] mt-0.5">
                      {job.department} · {job.location} · {job.employment_type}
                    </p>
                    {job.salary_range && (
                      <p className="text-xs text-[#A8A8A8] mt-0.5">{job.salary_range}</p>
                    )}
                  </div>
                </div>
                <span
                  className={cn(
                    "text-[10px] uppercase font-bold px-2 py-1 rounded-full",
                    JOB_STATUS_STYLES[job.status],
                  )}
                >
                  {JOB_STATUS_LABELS[job.status]}
                </span>
              </div>

              <p className="text-xs text-[#A8A8A8] leading-relaxed line-clamp-2">
                {job.description}
              </p>

              <p className="text-[10px] text-[#A8A8A8]/70">
                Updated {new Date(job.updated_at).toLocaleString()}
                {job.published_at &&
                  ` · Published ${new Date(job.published_at).toLocaleDateString()}`}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => openEdit(job)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-xs font-bold text-white hover:bg-white/10"
                >
                  <Pencil size={12} /> Edit
                </button>

                {job.status !== "published" && (
                  <button
                    type="button"
                    disabled={isStatusPending}
                    onClick={() => onSetStatus(job.id, "published")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E7D66]/20 text-xs font-bold text-[#2E7D66] hover:bg-[#2E7D66]/30 disabled:opacity-50"
                  >
                    Publish
                  </button>
                )}

                {job.status === "published" && (
                  <button
                    type="button"
                    disabled={isStatusPending}
                    onClick={() => onSetStatus(job.id, "draft")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-50"
                  >
                    Unpublish
                  </button>
                )}

                {job.status !== "archived" && (
                  <button
                    type="button"
                    disabled={isStatusPending}
                    onClick={() => onSetStatus(job.id, "archived")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF7A59]/10 text-xs font-bold text-[#FF7A59] hover:bg-[#FF7A59]/20 disabled:opacity-50"
                  >
                    Archive
                  </button>
                )}

                {job.status === "archived" && (
                  <button
                    type="button"
                    disabled={isStatusPending}
                    onClick={() => onSetStatus(job.id, "draft")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-50"
                  >
                    Restore to Draft
                  </button>
                )}

                <button
                  type="button"
                  disabled={isDeletePending}
                  onClick={() => {
                    if (window.confirm(`Delete "${job.title}"? This cannot be undone.`)) {
                      onDelete(job.id);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-xs font-bold text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationsSection({
  applications,
  isLoading,
  onUpdate,
  isUpdating,
}: {
  applications: CareerApplication[];
  isLoading: boolean;
  onUpdate: (
    id: string,
    updates: Partial<Pick<CareerApplication, "status" | "notes">>,
  ) => void;
  isUpdating: boolean;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return applications.filter((app) => {
      const matchesSearch =
        !q ||
        app.name.toLowerCase().includes(q) ||
        app.email.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  const getNotesValue = (app: CareerApplication) =>
    notesDraft[app.id] ?? app.notes ?? "";

  const handleNotesChange = (id: string, value: string) => {
    setNotesDraft((prev) => ({ ...prev, [id]: value }));
  };

  const handleSaveNotes = (app: CareerApplication) => {
    const notes = getNotesValue(app).trim() || null;
    if (notes === (app.notes ?? null)) {
      toast.message("No changes to save");
      return;
    }
    onUpdate(app.id, { notes });
    setNotesDraft((prev) => {
      const next = { ...prev };
      delete next[app.id];
      return next;
    });
  };

  const handleStatusChange = (app: CareerApplication, status: string) => {
    if (status === app.status) return;
    onUpdate(app.id, { status: status as CareerApplication["status"] });
  };

  const handleDownloadResume = async (app: CareerApplication) => {
    if (!app.resume_storage_path) {
      toast.error("No resume on file");
      return;
    }
    setDownloadingId(app.id);
    try {
      const url = await CareersSupabaseService.getResumeSignedUrl(
        app.resume_storage_path,
      );
      if (!url) {
        toast.error("Could not generate download link");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  const statusFilterOptions = [
    { value: "all", label: "All statuses" },
    ...careerApplicationStatuses.map((s) => ({
      value: s,
      label: careerApplicationStatusLabels[s],
    })),
  ];

  const pipelineOptions = careerApplicationStatuses.map((s) => ({
    value: s,
    label: careerApplicationStatusLabels[s],
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A8A8]"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-3 py-2.5 bg-[#161616] border border-white/10 rounded-xl text-xs text-white"
          />
        </div>
        <div className="w-full sm:w-48">
          <BrandSelect
            value={statusFilter}
            onValueChange={setStatusFilter}
            options={statusFilterOptions}
            placeholder="Filter status"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-[#FF7A59]" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-[#A8A8A8] text-center py-8">
          {applications.length === 0
            ? "No applications received yet."
            : "No applications match your search."}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <article
              key={app.id}
              className="velvet-card p-5 border border-white/5 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#FF7A59]/10 text-[#FF7A59] flex items-center justify-center shrink-0">
                    <FileUser size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{app.name}</p>
                    <p className="text-xs text-[#A8A8A8]">{app.email}</p>
                    {app.phone && (
                      <p className="text-xs text-[#A8A8A8] mt-0.5">{app.phone}</p>
                    )}
                    <p className="text-xs text-white mt-1 font-medium">
                      {app.job_title ?? "General application"}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-[#A8A8A8]/70 shrink-0">
                  {new Date(app.created_at).toLocaleString()}
                </p>
              </div>

              {(app.linkedin || app.portfolio || app.cover_letter) && (
                <div className="text-xs text-[#A8A8A8] space-y-1">
                  {app.linkedin && (
                    <p>
                      LinkedIn:{" "}
                      <a
                        href={app.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#FF7A59] hover:underline"
                      >
                        {app.linkedin}
                      </a>
                    </p>
                  )}
                  {app.portfolio && (
                    <p>
                      Portfolio:{" "}
                      <a
                        href={app.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#FF7A59] hover:underline"
                      >
                        {app.portfolio}
                      </a>
                    </p>
                  )}
                  {app.cover_letter && (
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {app.cover_letter}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-[#A8A8A8]">
                    Pipeline Status
                  </span>
                  <BrandSelect
                    value={app.status}
                    onValueChange={(v) => handleStatusChange(app, v)}
                    options={pipelineOptions}
                    disabled={isUpdating}
                  />
                </label>
                <div className="flex items-end">
                  {app.resume_storage_path && (
                    <button
                      type="button"
                      disabled={downloadingId === app.id}
                      onClick={() => handleDownloadResume(app)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-50"
                    >
                      {downloadingId === app.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Download size={12} />
                      )}
                      Download Resume
                    </button>
                  )}
                </div>
              </div>

              <label className="block space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-[#A8A8A8]">
                  Internal Notes
                </span>
                <textarea
                  className={textareaClass}
                  value={getNotesValue(app)}
                  onChange={(e) => handleNotesChange(app.id, e.target.value)}
                  rows={3}
                  placeholder="Interview notes, follow-ups…"
                />
              </label>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleSaveNotes(app)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF7A59] text-xs font-bold text-white hover:bg-[#FF7A59]/90 disabled:opacity-50"
                >
                  <Save size={12} /> Save Notes
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
