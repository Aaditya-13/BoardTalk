import { useState, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Upload, Loader2, User as UserIcon } from "lucide-react";
import { useCurrentUser, useUpdateProfile } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { data: user } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  
  const [name, setName] = useState(user?.name || "");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (name.trim() && name !== user?.name) {
      updateProfile.mutate({ name: name.trim() });
    }
    onOpenChange(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Maximum size is 5MB.");
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      // We don't have a specific hook for this yet, so we can use fetch directly or create a hook.
      // For now, we'll use a direct fetch with the auth token.
      const token = localStorage.getItem("accessToken");
      const response = await fetch("http://localhost:5000/users/avatar", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error("Failed to upload avatar");
      }
      
      const result = await response.json();
      
      // Update the local cache with the new avatarUrl
      updateProfile.mutate({ avatarUrl: result.data.avatarUrl });
      
    } catch (error) {
      console.error("Avatar upload error:", error);
      alert("Failed to upload avatar");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border-[3px] border-black/10 dark:border-white/10 bg-white dark:bg-[#1A1A1A] p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-3xl">
          
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <Dialog.Title className="text-2xl font-extrabold tracking-tight text-black dark:text-white">
              Profile Settings
            </Dialog.Title>
            <Dialog.Description className="text-sm font-semibold text-black/50 dark:text-white/50">
              Manage your account details and appearance.
            </Dialog.Description>
          </div>
          
          <Dialog.Close className="absolute right-4 top-4 rounded-full p-2 opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-opacity focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20">
            <X className="h-5 w-5 text-black dark:text-white" />
            <span className="sr-only">Close</span>
          </Dialog.Close>

          <div className="py-6 flex flex-col gap-6">
            
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="h-24 w-24 rounded-full overflow-hidden border-[3px] border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-center">
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-[#00D1FF]" />
                  ) : user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-10 w-10 text-black/40 dark:text-white/40" />
                  )}
                </div>
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 h-8 w-8 bg-[#00D1FF] hover:bg-[#00B8E6] text-black rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-[#1A1A1A] transition-colors"
                >
                  <Upload className="h-4 w-4" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/png, image/jpeg, image/webp" 
                  className="hidden" 
                />
              </div>
              <span className="text-xs font-bold text-black/40 dark:text-white/40">
                Click the icon to upload a new avatar
              </span>
            </div>

            {/* Name Input */}
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-bold text-black dark:text-white">
                Display Name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex h-12 w-full rounded-2xl border-[3px] border-black/10 dark:border-white/10 bg-transparent px-4 py-2 text-sm font-bold text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:border-[#00D1FF] transition-colors"
                placeholder="Your name"
              />
            </div>
            
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="h-12 px-6 rounded-2xl font-extrabold text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!name.trim() || isUploading}
              className="bg-[#00D1FF] hover:bg-[#00B8E6] text-black h-12 px-6 rounded-2xl font-extrabold shadow-[0_4px_0_0_#00A3CC] active:shadow-[0_0px_0_0_#00A3CC] active:translate-y-1 transition-all"
            >
              Save Changes
            </Button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
