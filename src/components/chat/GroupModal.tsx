"use client";

import React, { useState, useEffect } from "react";
import { X, Users, Check, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getFallbackAvatar } from "@/lib/avatars";

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts?: Array<{ userId: string; name: string; email: string; avatar?: string }>;
  onOpenContacts?: () => void;
  onCreateGroup: (name: string, selectedUserIds: string[]) => void;
}

export default function GroupModal({
  isOpen,
  onClose,
  contacts = [],
  onOpenContacts,
  onCreateGroup,
}: GroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [contactsList, setContactsList] = useState<any[]>(contacts);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  const loadContacts = async () => {
    try {
      setLoadingContacts(true);
      const res = await fetch("/api/chat/contacts");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.contacts) && data.contacts.length > 0) {
          setContactsList(data.contacts);
          return;
        }
      }
      // Fallback to prop if API contacts array is empty
      if (contacts && contacts.length > 0) {
        setContactsList(contacts);
      }
    } catch (err) {
      console.error("Error loading contacts in GroupModal:", err);
      if (contacts && contacts.length > 0) {
        setContactsList(contacts);
      }
    } finally {
      setLoadingContacts(false);
    }
  };

  if (!isOpen) return null;

  const toggleSelect = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedIds.length === 0) return;
    setLoading(true);
    await onCreateGroup(groupName.trim(), selectedIds);
    setLoading(false);
    setGroupName("");
    setSelectedIds([]);
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        style={{
          paddingTop: "max(16px, calc(env(safe-area-inset-top, 0px) + 12px))",
          paddingBottom: "max(16px, calc(env(safe-area-inset-bottom, 0px) + 12px))",
        }}
        className="safe-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg max-h-[85dvh] flex flex-col bg-neutral-900/95 border border-white/15 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-2xl my-auto"
        >
          {/* Header Bar */}
          <div className="px-6 py-4 sm:py-5 flex items-center justify-between border-b border-white/10 bg-[#16161c] flex-shrink-0 z-20 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shadow-inner">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">New Group Conversation</h2>
                <p className="text-xs text-neutral-400">Add multiple friends to a shared room</p>
              </div>
            </div>

            {/* High-Contrast Circular Close Button */}
            <button
              onClick={onClose}
              type="button"
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all border border-white/20 shadow-md flex-shrink-0 cursor-pointer"
              title="Close"
            >
              <X className="w-4.5 h-4.5 text-white stroke-[2.5]" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 flex flex-col p-6 space-y-5 overflow-y-auto">
            {/* Group Name Field */}
            <div>
              <label className="text-xs font-semibold text-neutral-200 block mb-1.5">
                Group Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Project Alpha, Family & Friends"
                className="w-full bg-neutral-800/80 hover:bg-neutral-800 focus:bg-neutral-800 border border-white/15 rounded-2xl px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all font-medium shadow-inner"
                autoFocus
              />
            </div>

            {/* Select Members Section */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-semibold text-neutral-200">
                  Select Members
                </label>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-semibold font-mono">
                  {selectedIds.length} chosen
                </span>
              </div>

              {contactsList.length === 0 ? (
                /* Rich Empty State when no friends are connected */
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-center flex flex-col items-center justify-center gap-2.5 shadow-inner my-1">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/15 text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-inner">
                    <Users className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">No Friends in Contact List Yet</p>
                    <p className="text-xs text-neutral-400 max-w-xs mt-0.5">
                      You need at least one connected friend to create a group conversation.
                    </p>
                  </div>

                  {onOpenContacts && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenContacts();
                      }}
                      className="mt-2 relative px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-white/20 shadow-xl shadow-blue-500/25 transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-95 group/btn"
                    >
                      <UserPlus className="w-4 h-4 text-white group-hover/btn:rotate-12 transition-transform duration-200" />
                      <span>Find & Add Friends</span>
                    </button>
                  )}
                </div>
              ) : (
                /* Contact Selection List */
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {contactsList.map((contact) => {
                    const isSelected = selectedIds.includes(contact.userId);
                    return (
                      <button
                        key={contact.userId}
                        type="button"
                        onClick={() => toggleSelect(contact.userId)}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer shadow-sm ${
                          isSelected
                            ? "bg-blue-600/25 border border-blue-500/50 shadow-md shadow-blue-500/15"
                            : "bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-white/15"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={contact.avatar || getFallbackAvatar(contact.name, "user")}
                            alt={contact.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 flex-shrink-0"
                          />
                          <div className="text-left min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-white truncate">{contact.name}</div>
                            <div className="text-[11px] text-neutral-400 truncate font-mono mt-0.5">{contact.email}</div>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all flex-shrink-0 ml-2 ${
                            isSelected
                              ? "bg-blue-600 border-blue-400 text-white shadow-md"
                              : "border-neutral-600 text-transparent"
                          }`}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions - Dedicated Fixed Bottom Bar */}
          <div className="px-6 py-4 border-t border-white/10 bg-neutral-900/90 backdrop-blur-xl flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-red-400 hover:bg-red-500/10 active:bg-red-500/20 active:text-red-300 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={loading || !groupName.trim() || selectedIds.length === 0}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer active:scale-95 flex items-center gap-2"
            >
              {loading ? "Creating..." : `Create Group ${selectedIds.length > 0 ? `(${selectedIds.length})` : ""}`}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
