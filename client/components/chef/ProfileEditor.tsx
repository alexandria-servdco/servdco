import { useState } from "react";
import { FormInput } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/upload/ImageUpload";
import { MultiImageUploader } from "@/components/upload/MultiImageUploader";
import { UploadGallery } from "@/components/upload/UploadGallery";
import { UploadResponse } from "@/types/upload.types";

interface ProfileData {
  name: string;
  specialty: string;
  bio: string;
  experience: string;
  cuisines: string[];
  newCuisine?: string;
  avatarUrl: string;
  portfolioImages: UploadResponse[];
}

interface ProfileEditorProps {
  profileData: ProfileData;
  profileProgress: number;
  profileSuccess: boolean;
  onSave: (e: React.FormEvent) => void;
  onUpdate: (data: Partial<ProfileData>) => void;
}

export function ProfileEditor({
  profileData,
  profileProgress,
  profileSuccess,
  onSave,
  onUpdate,
}: ProfileEditorProps) {
  const [newCuisine, setNewCuisine] = useState("");

  const handleAddCuisine = () => {
    if (newCuisine && !profileData.cuisines.includes(newCuisine)) {
      onUpdate({ cuisines: [...profileData.cuisines, newCuisine] });
      setNewCuisine("");
    }
  };

  return (
    <form
      onSubmit={onSave}
      className="max-w-2xl velvet-card p-8 space-y-6"
    >
      <h3 className="text-xl font-bold text-white font-serif">
        Chef Biography Profile
      </h3>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-2.5">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-[#A8A8A8]">Profile Strength</span>
          <span className="text-[#FF7A59]">{profileProgress}%</span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FF8F73] to-[#FF7A59] transition-all duration-500"
            style={{ width: `${profileProgress}%` }}
          />
        </div>
      </div>

      {profileSuccess && (
        <div className="p-3 bg-green-950/20 border border-green-500/20 rounded-xl text-xs text-green-400 font-semibold">
          Chef profile parameters updated successfully!
        </div>
      )}

      <div className="space-y-4">
        <FormInput
          type="text"
          label="Display Headline / Tagline"
          id="specialty"
          value={profileData.specialty}
          onChange={(e) => onUpdate({ specialty: e.target.value })}
          required
        />

        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider">
            Chef Bio
          </label>
          <textarea
            rows={4}
            value={profileData.bio}
            onChange={(e) => onUpdate({ bio: e.target.value })}
            className="w-full p-4 bg-[#161616] border border-white/5 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#FF7A59]"
          />
        </div>

        <FormInput
          type="text"
          label="Experience Years Details"
          id="experience"
          value={profileData.experience}
          onChange={(e) => onUpdate({ experience: e.target.value })}
          required
        />

        <div className="space-y-3">
          <label className="block text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider">
            Cuisine Specialties
          </label>
          <div className="flex flex-wrap gap-2">
            {profileData.cuisines.map((cuisine) => (
              <span
                key={cuisine}
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-[#A8A8A8] flex items-center gap-1.5"
              >
                {cuisine}
                <button
                  type="button"
                  onClick={() =>
                    onUpdate({
                      cuisines: profileData.cuisines.filter(
                        (c) => c !== cuisine,
                      ),
                    })
                  }
                  className="text-red-400 hover:text-red-300 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add another cuisine (e.g. Vegetarian)"
              value={newCuisine}
              onChange={(e) => setNewCuisine(e.target.value)}
              className="px-4 py-2 bg-[#161616] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59] w-full"
            />
            <button
              type="button"
              onClick={handleAddCuisine}
              className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-[#FF7A59] hover:border-transparent text-white font-bold rounded-xl text-xs transition-all whitespace-nowrap"
            >
              + Add
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-white/5">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
          Profile Avatar
        </h4>
        <ImageUpload
          variant="avatar"
          initialUrl={profileData.avatarUrl}
          onUploadSuccess={(res) => onUpdate({ avatarUrl: res.url })}
        />
      </div>

      <div className="space-y-6 pt-4 border-t border-white/5">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
          Portfolio Gallery
        </h4>
        <MultiImageUploader
          maxFiles={12}
          onImagesUploaded={(responses) => 
            onUpdate({ portfolioImages: [...profileData.portfolioImages, ...responses] })
          }
        />
        <div className="mt-4">
          <UploadGallery 
            images={profileData.portfolioImages}
            onRemoveImage={(publicId) => 
              onUpdate({ 
                portfolioImages: profileData.portfolioImages.filter((img) => img.publicId !== publicId)
              })
            }
          />
        </div>
      </div>

      <div className="pt-4 border-t border-white/5">
        <Button type="submit" className="text-xs font-bold">
          Save Biography Details
        </Button>
      </div>
    </form>
  );
}
