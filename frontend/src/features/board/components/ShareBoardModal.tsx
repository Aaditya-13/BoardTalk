import * as Dialog from "@radix-ui/react-dialog";
import { X, Copy, QrCode, Plus, Link, Clock, Trash2, CheckCircle2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { useInvites, useCreateInvite, useRevokeInvite } from "../hooks/useInvites";
import { useCollaborators, useUpdateCollaborator, useRemoveCollaborator } from "../hooks/useCollaborators";
import { useCurrentUser } from "@/features/auth/hooks/useAuth";
import { useBoard } from "../hooks/useBoards";
import { formatDistanceToNow } from "date-fns";
import * as Tabs from "@radix-ui/react-tabs";

interface ShareBoardModalProps {
  boardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareBoardModal({ boardId, open, onOpenChange }: ShareBoardModalProps) {
  const { data: invites, isLoading } = useInvites(boardId);
  const { data: collaborators } = useCollaborators(boardId);
  const { data: board } = useBoard(boardId);
  const { data: user } = useCurrentUser();
  
  const createInvite = useCreateInvite();
  const revokeInvite = useRevokeInvite();
  const updateCollaborator = useUpdateCollaborator();
  const removeCollaborator = useRemoveCollaborator();
  
  const [showQR, setShowQR] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'EDITOR' | 'VIEWER' | 'COMMENTER'>('EDITOR');

  const isOwner = user && board && board.ownerId === user.id;

  const links = invites?.filter(i => i.type === 'LINK' && i.isActive) || [];
  const shortCodes = invites?.filter(i => i.type === 'SHORT_CODE' && i.isActive) || [];

  const defaultLink = links.length > 0 ? links[0] : null;

  const handleGenerateLink = () => {
    createInvite.mutate({
      boardId,
      payload: { role: selectedRole, type: "LINK" }
    });
  };

  const handleGenerateShortCode = (hours: number) => {
    createInvite.mutate({
      boardId,
      payload: { 
        role: selectedRole, 
        type: "SHORT_CODE",
        expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
      }
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const inviteUrl = defaultLink ? `${window.location.origin}/invite/${defaultLink.token}` : "";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-[#1A1A1A] rounded-[2rem] border-[3px] border-black/10 dark:border-white/10 shadow-2xl p-6 outline-none">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-2xl font-extrabold text-black dark:text-white flex items-center">
              Share Workspace
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors">
                <X className="h-6 w-6 text-black dark:text-white" />
              </button>
            </Dialog.Close>
          </div>

          <Tabs.Root defaultValue="share">
            <Tabs.List className="flex border-b-[3px] border-black/5 dark:border-white/5 mb-6">
              <Tabs.Trigger 
                value="share"
                className="flex-1 pb-3 font-bold text-black/50 dark:text-white/50 data-[state=active]:text-black dark:data-[state=active]:text-white data-[state=active]:border-b-[3px] data-[state=active]:border-black dark:data-[state=active]:border-white outline-none transition-colors"
              >
                Share
              </Tabs.Trigger>
              <Tabs.Trigger 
                value="members"
                className="flex-1 pb-3 font-bold text-black/50 dark:text-white/50 data-[state=active]:text-black dark:data-[state=active]:text-white data-[state=active]:border-b-[3px] data-[state=active]:border-black dark:data-[state=active]:border-white outline-none transition-colors"
              >
                Members
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="share" className="space-y-8 outline-none">
              <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-3 rounded-xl">
                <span className="font-bold text-sm text-black/70 dark:text-white/70">Invited users can:</span>
                <select 
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className="bg-transparent font-extrabold text-sm text-black dark:text-white outline-none focus:ring-0"
                >
                  <option value="EDITOR">Edit</option>
                  <option value="COMMENTER">Comment</option>
                  <option value="VIEWER">View</option>
                </select>
              </div>

              {/* Permanent Link Section */}
              <div>
                <h3 className="text-lg font-bold text-black dark:text-white mb-3 flex items-center">
                  <Link className="h-5 w-5 mr-2 text-[#00D1FF]" />
                  Permanent Link
                </h3>
                
                {!defaultLink && !isLoading ? (
                  <button
                    onClick={handleGenerateLink}
                    disabled={createInvite.isPending}
                    className="w-full h-12 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white rounded-xl font-bold transition-colors flex items-center justify-center"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Generate Invite Link
                  </button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={inviteUrl}
                        className="flex-1 h-12 px-4 rounded-xl border-[2px] border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-black dark:text-white font-medium outline-none focus:border-[#00D1FF]"
                      />
                      <button
                        onClick={() => handleCopy(inviteUrl)}
                        className="shrink-0 h-12 px-4 bg-[#00D1FF] hover:bg-[#00B8E6] text-black font-bold rounded-xl shadow-[0_4px_0_0_#00A3CC] active:shadow-[0_0px_0_0_#00A3CC] active:translate-y-1 transition-all flex items-center"
                      >
                        {copiedToken === inviteUrl ? <CheckCircle2 className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => setShowQR(!showQR)}
                        className={`shrink-0 h-12 px-4 font-bold rounded-xl shadow-[0_4px_0_0_#CC3700] active:shadow-[0_0px_0_0_#CC3700] active:translate-y-1 transition-all flex items-center ${showQR ? 'bg-[#FF4500] text-white' : 'bg-[#FF4500]/10 text-[#FF4500] hover:bg-[#FF4500]/20'}`}
                      >
                        <QrCode className="h-5 w-5" />
                      </button>
                    </div>
                    
                    {showQR && inviteUrl && (
                      <div className="flex justify-center p-6 bg-white border-[2px] border-black/10 rounded-2xl animate-in fade-in slide-in-from-top-2">
                        <QRCodeSVG value={inviteUrl} size={200} level="H" includeMargin={true} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Temporary Join Codes Section */}
              <div>
                <h3 className="text-lg font-bold text-black dark:text-white mb-3 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-[#FFC700]" />
                  Temporary Join Codes
                </h3>
                
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => handleGenerateShortCode(0.25)} // 15 mins
                    className="flex-1 h-10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white font-bold rounded-xl transition-colors text-sm"
                  >
                    + 15 Min
                  </button>
                  <button
                    onClick={() => handleGenerateShortCode(1)}
                    className="flex-1 h-10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white font-bold rounded-xl transition-colors text-sm"
                  >
                    + 1 Hour
                  </button>
                  <button
                    onClick={() => handleGenerateShortCode(3)}
                    className="flex-1 h-10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white font-bold rounded-xl transition-colors text-sm"
                  >
                    + 3 Hours
                  </button>
                </div>

                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                  {shortCodes.length === 0 ? (
                    <p className="text-center text-black/50 dark:text-white/50 py-4 font-semibold text-sm">
                      No active temporary codes.
                    </p>
                  ) : (
                    shortCodes.map((code) => (
                      <div key={code.id} className="flex items-center justify-between p-3 rounded-xl border-[2px] border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-xl font-bold tracking-widest text-[#FF4500]">
                            {code.token}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-black/50 dark:text-white/50">
                              Expires {code.expiresAt ? formatDistanceToNow(new Date(code.expiresAt), { addSuffix: true }) : 'Never'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopy(code.token)}
                            className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-black dark:text-white transition-colors"
                          >
                            {copiedToken === code.token ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => revokeInvite.mutate({ boardId, inviteId: code.id })}
                            className="p-2 hover:bg-[#FF5F56]/20 rounded-lg text-[#FF5F56] transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Tabs.Content>

            <Tabs.Content value="members" className="outline-none">
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {collaborators?.map((collab) => (
                  <div key={collab.id} className="flex items-center justify-between p-3 rounded-xl border-[2px] border-black/5 dark:border-white/5 bg-white dark:bg-[#121212]">
                    <div className="flex items-center gap-3 min-w-0">
                      {collab.user?.avatarUrl ? (
                        <img src={collab.user.avatarUrl} alt={collab.user.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-[#00D1FF] to-[#0055FF] flex items-center justify-center text-sm font-bold text-white uppercase">
                          {collab.user?.name?.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-black dark:text-white truncate">
                          {collab.user?.name} {collab.user?.id === user?.id && "(You)"}
                        </p>
                        <p className="text-xs font-semibold text-black/50 dark:text-white/50 truncate">
                          {collab.user?.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <select 
                        value={collab.role}
                        disabled={!isOwner || collab.role === 'OWNER'}
                        onChange={(e) => updateCollaborator.mutate({ boardId, collaboratorId: collab.id, role: e.target.value })}
                        className="bg-black/5 dark:bg-white/5 p-2 rounded-lg font-bold text-xs text-black dark:text-white outline-none disabled:opacity-50"
                      >
                        <option value="OWNER">Owner</option>
                        <option value="EDITOR">Editor</option>
                        <option value="COMMENTER">Commenter</option>
                        <option value="VIEWER">Viewer</option>
                      </select>

                      {isOwner && collab.role !== 'OWNER' && (
                        <button
                          onClick={() => removeCollaborator.mutate({ boardId, collaboratorId: collab.id })}
                          className="p-2 hover:bg-[#FF5F56]/10 rounded-lg text-[#FF5F56] transition-colors"
                          title="Remove user"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Tabs.Content>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
