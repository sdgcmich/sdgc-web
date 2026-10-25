"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import type { MediaItem, AlbumSummary } from "@/features/media/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  createMediaAssetAction,
  updateMediaAssetAction,
  deleteMediaAssetAction,
  uploadMediaAssetAction,
  createAlbumAction,
  updateAlbumAction,
  deleteAlbumAction,
  addMediaToAlbumAction,
  removeMediaFromAlbumAction,
  setAlbumCoverAction,
} from "../actions";

interface AdminMediaProps {
  initialMedia?: MediaItem[];
  initialAlbums?: AlbumSummary[];
}

function sanitizeAlbumSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, "");
}

export function AdminMedia({ initialMedia = [], initialAlbums = [] }: AdminMediaProps) {
  const [activeTab, setActiveTab] = React.useState<"albums" | "media">("albums");
  const [mediaList, setMediaList] = React.useState<MediaItem[]>(initialMedia);
  const [albumsList, setAlbumsList] = React.useState<AlbumSummary[]>(initialAlbums);

  const [notice, setNotice] = React.useState<string | null>(null);
  const [isError, setIsError] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // ALBUM MODALS
  const [isCreateAlbumOpen, setIsCreateAlbumOpen] = React.useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = React.useState("");
  const [newAlbumSlug, setNewAlbumSlug] = React.useState("");
  const [newAlbumCategory, setNewAlbumCategory] = React.useState("Garden Walk");
  const [newAlbumYear, setNewAlbumYear] = React.useState(new Date().getFullYear());
  const [newAlbumDesc, setNewAlbumDesc] = React.useState("");
  const [newAlbumIsPublic, setNewAlbumIsPublic] = React.useState(true);

  const [editingAlbum, setEditingAlbum] = React.useState<AlbumSummary | null>(null);
  const [editAlbumTitle, setEditAlbumTitle] = React.useState("");
  const [editAlbumSlug, setEditAlbumSlug] = React.useState("");
  const [editAlbumCategory, setEditAlbumCategory] = React.useState("Garden Walk");
  const [editAlbumYear, setEditAlbumYear] = React.useState(new Date().getFullYear());
  const [editAlbumDesc, setEditAlbumDesc] = React.useState("");
  const [editAlbumIsPublic, setEditAlbumIsPublic] = React.useState(true);

  const [managingAlbum, setManagingAlbum] = React.useState<AlbumSummary | null>(null);
  const [isAddFromLibraryOpen, setIsAddFromLibraryOpen] = React.useState(false);
  const [selectedLibraryMediaIds, setSelectedLibraryMediaIds] = React.useState<string[]>([]);

  const [isDirectUploadOpen, setIsDirectUploadOpen] = React.useState(false);
  const [directFile, setDirectFile] = React.useState<File | null>(null);
  const [directFilePreview, setDirectFilePreview] = React.useState<string | null>(null);
  const [directAltText, setDirectAltText] = React.useState("");
  const [directCaption, setDirectCaption] = React.useState("");
  const [directIsPublic, setDirectIsPublic] = React.useState(true);

  // MEDIA ASSET MODALS
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [filePreview, setFilePreview] = React.useState<string | null>(null);
  const [newStoragePath, setNewStoragePath] = React.useState("");
  const [newAltText, setNewAltText] = React.useState("");
  const [newCaption, setNewCaption] = React.useState("");
  const [newIsPublic, setNewIsPublic] = React.useState(true);

  const [editingItem, setEditingItem] = React.useState<MediaItem | null>(null);
  const [editAltText, setEditAltText] = React.useState("");
  const [editCaption, setEditCaption] = React.useState("");
  const [editIsPublic, setEditIsPublic] = React.useState(true);

  React.useEffect(() => {
    setMediaList(initialMedia);
  }, [initialMedia]);

  React.useEffect(() => {
    setAlbumsList(initialAlbums);
  }, [initialAlbums]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isCreateAlbumOpen) setIsCreateAlbumOpen(false);
        if (editingAlbum) setEditingAlbum(null);
        if (isAddFromLibraryOpen) setIsAddFromLibraryOpen(false);
        if (isDirectUploadOpen) setIsDirectUploadOpen(false);
        if (managingAlbum && !isAddFromLibraryOpen && !isDirectUploadOpen) setManagingAlbum(null);
        if (isUploadOpen) setIsUploadOpen(false);
        if (editingItem) setEditingItem(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isCreateAlbumOpen,
    editingAlbum,
    managingAlbum,
    isAddFromLibraryOpen,
    isDirectUploadOpen,
    isUploadOpen,
    editingItem,
  ]);

  React.useEffect(() => {
    if (managingAlbum) {
      const refreshed = albumsList.find((a) => a.id === managingAlbum.id);
      if (refreshed) setManagingAlbum(refreshed);
    }
  }, [albumsList, managingAlbum]);

  const handleNewTitleChange = (val: string) => {
    setNewAlbumTitle(val);
    const derived = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setNewAlbumSlug(derived);
  };
  // ALBUM HANDLERS
  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumTitle.trim()) return;
    setIsSubmitting(true);
    setIsError(false);
    try {
      const res = await createAlbumAction({
        title: newAlbumTitle.trim(),
        slug: sanitizeAlbumSlug(newAlbumSlug),
        category: newAlbumCategory.trim(),
        year: Number(newAlbumYear),
        description: newAlbumDesc.trim() || undefined,
        isPublic: newAlbumIsPublic,
      });

      if (res.success && res.data) {
        const created: AlbumSummary = {
          id: res.data.id,
          slug: res.data.slug,
          title: newAlbumTitle.trim(),
          category: newAlbumCategory.trim(),
          year: Number(newAlbumYear),
          description: newAlbumDesc.trim() || undefined,
          isPublic: newAlbumIsPublic,
          itemCount: 0,
          items: [],
        };
        setAlbumsList((prev) => [created, ...prev]);
        setNotice(`Album "${newAlbumTitle}" created successfully.`);
        setIsCreateAlbumOpen(false);
        setNewAlbumTitle("");
        setNewAlbumSlug("");
        setNewAlbumDesc("");
      } else {
        setIsError(true);
        setNotice(`Failed to create album: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "Error creating album");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditAlbum = (album: AlbumSummary) => {
    setEditingAlbum(album);
    setEditAlbumTitle(album.title);
    setEditAlbumSlug(album.slug);
    setEditAlbumCategory(album.category || "Garden Walk");
    setEditAlbumYear(album.year || new Date().getFullYear());
    setEditAlbumDesc(album.description || "");
    setEditAlbumIsPublic(album.isPublic ?? true);
  };

  const handleUpdateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlbum || !editAlbumTitle.trim()) return;
    setIsSubmitting(true);
    setIsError(false);
    try {
      const res = await updateAlbumAction({
        id: editingAlbum.id,
        title: editAlbumTitle.trim(),
        slug: sanitizeAlbumSlug(editAlbumSlug),
        category: editAlbumCategory.trim(),
        year: Number(editAlbumYear),
        description: editAlbumDesc.trim() || undefined,
        isPublic: editAlbumIsPublic,
        coverAssetId: editingAlbum.coverAssetId,
      });

      if (res.success) {
        setAlbumsList((prev) =>
          prev.map((a) =>
            a.id === editingAlbum.id
              ? {
                  ...a,
                  title: editAlbumTitle.trim(),
                  slug: sanitizeAlbumSlug(editAlbumSlug),
                  category: editAlbumCategory.trim(),
                  year: Number(editAlbumYear),
                  description: editAlbumDesc.trim() || undefined,
                  isPublic: editAlbumIsPublic,
                }
              : a,
          ),
        );
        setNotice(`Album "${editAlbumTitle}" updated successfully.`);
        setEditingAlbum(null);
      } else {
        setIsError(true);
        setNotice(`Failed to update album: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "Error updating album");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAlbum = async (album: AlbumSummary) => {
    if (
      !confirm(
        `Are you sure you want to delete album "${album.title}"? Media library photos will be preserved.`,
      )
    ) {
      return;
    }
    setIsSubmitting(true);
    setIsError(false);
    try {
      const res = await deleteAlbumAction(album.id);
      if (res.success) {
        setAlbumsList((prev) => prev.filter((a) => a.id !== album.id));
        setNotice(`Album "${album.title}" deleted.`);
        if (managingAlbum?.id === album.id) setManagingAlbum(null);
      } else {
        setIsError(true);
        setNotice(`Failed to delete album: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "Error deleting album");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetCover = async (albumId: string, mediaId: string) => {
    setIsSubmitting(true);
    setIsError(false);
    try {
      const res = await setAlbumCoverAction(albumId, mediaId);
      if (res.success) {
        const coverItem = mediaList.find((m) => m.id === mediaId);
        setAlbumsList((prev) =>
          prev.map((a) =>
            a.id === albumId
              ? { ...a, coverAssetId: mediaId, coverImage: coverItem || a.coverImage }
              : a,
          ),
        );
        setNotice("Album cover photo updated.");
      } else {
        setIsError(true);
        setNotice(`Failed to set cover photo: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "Error setting cover");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemovePhotoFromAlbum = async (albumId: string, mediaId: string) => {
    setIsSubmitting(true);
    setIsError(false);
    try {
      const res = await removeMediaFromAlbumAction(albumId, mediaId);
      if (res.success) {
        setAlbumsList((prev) =>
          prev.map((a) => {
            if (a.id !== albumId) return a;
            const updatedItems = (a.items || []).filter((i) => i.id !== mediaId);
            const isCover = a.coverAssetId === mediaId;
            return {
              ...a,
              items: updatedItems,
              itemCount: updatedItems.length,
              coverAssetId: isCover ? updatedItems[0]?.id : a.coverAssetId,
              coverImage: isCover ? updatedItems[0] : a.coverImage,
            };
          }),
        );
        setNotice("Photo removed from album.");
      } else {
        setIsError(true);
        setNotice(`Failed to remove photo: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "Error removing photo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSelectedFromLibrary = async () => {
    if (!managingAlbum || selectedLibraryMediaIds.length === 0) return;
    setIsSubmitting(true);
    setIsError(false);
    try {
      const res = await addMediaToAlbumAction(managingAlbum.id, selectedLibraryMediaIds);
      if (res.success) {
        const addedItems = mediaList.filter((m) => selectedLibraryMediaIds.includes(m.id));
        setAlbumsList((prev) =>
          prev.map((a) => {
            if (a.id !== managingAlbum.id) return a;
            const existingIds = new Set((a.items || []).map((i) => i.id));
            const newItems = [...(a.items || [])];
            for (const item of addedItems) {
              if (!existingIds.has(item.id)) {
                newItems.push({ ...item, albumId: a.id });
              }
            }
            return {
              ...a,
              items: newItems,
              itemCount: newItems.length,
              coverImage: a.coverImage || newItems[0],
              coverAssetId: a.coverAssetId || newItems[0]?.id,
            };
          }),
        );
        setNotice(`${selectedLibraryMediaIds.length} photos added to "${managingAlbum.title}".`);
        setIsAddFromLibraryOpen(false);
        setSelectedLibraryMediaIds([]);
      } else {
        setIsError(true);
        setNotice(`Failed to add photos: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "Error adding photos");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectUploadToAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingAlbum || !directFile || !directAltText.trim()) return;
    setIsSubmitting(true);
    setIsError(false);
    try {
      const formData = new FormData();
      formData.append("file", directFile);
      formData.append("altText", directAltText.trim());
      formData.append("caption", directCaption.trim());
      formData.append("isPublic", String(directIsPublic));
      formData.append("albumId", managingAlbum.id);

      const res = await uploadMediaAssetAction(formData);
      if (res.success && res.data) {
        const uploadedMedia: MediaItem = {
          id: res.data.id,
          src: res.data.url,
          width: 1200,
          height: 800,
          alt: directAltText.trim(),
          caption: directCaption.trim() || undefined,
          albumId: managingAlbum.id,
          isPublic: directIsPublic,
          storagePath: res.data.storagePath,
        };

        setMediaList((prev) => [uploadedMedia, ...prev]);
        setAlbumsList((prev) =>
          prev.map((a) => {
            if (a.id !== managingAlbum.id) return a;
            const newItems = [uploadedMedia, ...(a.items || [])];
            return {
              ...a,
              items: newItems,
              itemCount: newItems.length,
              coverImage: a.coverImage || uploadedMedia,
              coverAssetId: a.coverAssetId || uploadedMedia.id,
            };
          }),
        );

        setNotice(`Photograph uploaded and added to "${managingAlbum.title}".`);
        setIsDirectUploadOpen(false);
        setDirectFile(null);
        setDirectFilePreview(null);
        setDirectAltText("");
        setDirectCaption("");
      } else {
        setIsError(true);
        setNotice(`Failed to upload photo: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "Error uploading photo");
    } finally {
      setIsSubmitting(false);
    }
  };
  // MEDIA ASSET HANDLERS
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
      if (!newAltText) {
        setNewAltText(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
      }
    } else {
      setFilePreview(null);
    }
  };

  const handleCreateMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !newStoragePath.trim()) return;
    if (!newAltText.trim()) return;
    setIsSubmitting(true);
    setIsError(false);
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("altText", newAltText.trim());
        formData.append("caption", newCaption.trim());
        formData.append("isPublic", String(newIsPublic));

        const res = await uploadMediaAssetAction(formData);
        if (res.success && res.data) {
          const uploaded = res.data;
          setMediaList((prev) => [
            {
              id: uploaded.id,
              src: uploaded.url,
              width: 1200,
              height: 800,
              alt: newAltText.trim(),
              caption: newCaption.trim() || undefined,
              isPublic: newIsPublic,
              storagePath: uploaded.storagePath,
            },
            ...prev,
          ]);
          setNotice(`Media asset "${newAltText}" uploaded successfully.`);
          setIsUploadOpen(false);
          setSelectedFile(null);
          setFilePreview(null);
          setNewStoragePath("");
          setNewAltText("");
          setNewCaption("");
        } else {
          setIsError(true);
          setNotice(`Failed to upload media asset: ${res.error}`);
        }
      } else {
        const res = await createMediaAssetAction({
          storagePath: newStoragePath.trim(),
          altText: newAltText.trim(),
          caption: newCaption.trim() || undefined,
          isPublic: newIsPublic,
        });

        if (res.success) {
          setNotice(`Media asset "${newAltText}" registered successfully.`);
          setIsUploadOpen(false);
          setNewStoragePath("");
          setNewAltText("");
          setNewCaption("");
        } else {
          setIsError(true);
          setNotice(`Failed to create asset: ${res.error}`);
        }
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "Error saving asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditMedia = (item: MediaItem) => {
    setEditingItem(item);
    setEditAltText(item.alt);
    setEditCaption(item.caption || "");
    setEditIsPublic(item.isPublic ?? true);
  };

  const handleUpdateMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSubmitting(true);
    setIsError(false);
    try {
      const res = await updateMediaAssetAction({
        id: editingItem.id,
        altText: editAltText.trim(),
        caption: editCaption.trim() || undefined,
        isPublic: editIsPublic,
      });

      if (res.success) {
        setMediaList((prev) =>
          prev.map((item) =>
            item.id === editingItem.id
              ? {
                  ...item,
                  alt: editAltText.trim(),
                  caption: editCaption.trim() || undefined,
                  isPublic: editIsPublic,
                }
              : item,
          ),
        );
        setNotice("Media asset metadata updated successfully.");
        setEditingItem(null);
      } else {
        setIsError(true);
        setNotice(`Failed to update media: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "Error updating media");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMedia = async (item: MediaItem) => {
    if (!confirm(`Are you sure you want to delete "${item.alt}"? This action cannot be undone.`)) {
      return;
    }
    setIsSubmitting(true);
    setIsError(false);
    try {
      const res = await deleteMediaAssetAction(item.id);
      if (res.success) {
        setMediaList((prev) => prev.filter((m) => m.id !== item.id));
        setNotice("Media asset deleted successfully.");
      } else {
        setIsError(true);
        setNotice(`Failed to delete media: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "Error deleting media");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div
          role="status"
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-xs font-semibold ${
            isError
              ? "bg-destructive/15 text-destructive border border-destructive/20"
              : "bg-primary/10 text-primary border border-primary/20"
          }`}
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-muted-foreground hover:text-foreground ml-4"
            aria-label="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Media Library & Gallery Curation
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Create public albums, upload high-resolution photography, manage photo assignments, and
            curate gallery archives.
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-border/60 p-1 bg-muted/40 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("albums")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "albums"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            📁 Albums Studio ({albumsList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("media")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "media"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🖼️ All Media Library ({mediaList.length})
          </button>
        </div>
      </div>
      {/* TAB 1: ALBUMS STUDIO */}
      {activeTab === "albums" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-lg font-bold text-foreground">Curated Photo Albums</h2>
              <p className="text-xs text-muted-foreground">
                Each album provides a dedicated shareable public link with full-screen lightbox.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => {
                setNewAlbumTitle("");
                setNewAlbumSlug("");
                setNewAlbumDesc("");
                setNewAlbumYear(new Date().getFullYear());
                setNewAlbumCategory("Garden Walk");
                setNewAlbumIsPublic(true);
                setIsCreateAlbumOpen(true);
              }}
              className="gap-2 shadow-xs"
            >
              + Create New Album
            </Button>
          </div>

          {albumsList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
              <p className="font-serif text-lg font-bold text-foreground">No albums created yet</p>
              <p className="text-xs text-muted-foreground">
                Click &quot;Create New Album&quot; to build your first garden walk or event
                collection.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {albumsList.map((album) => (
                <div
                  key={album.id}
                  className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="relative aspect-16/10 w-full bg-muted overflow-hidden">
                    {album.coverImage ? (
                      <Image
                        src={album.coverImage.src}
                        alt={album.coverImage.alt || album.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-xs p-4 text-center">
                        No cover photograph
                      </div>
                    )}
                    <div className="absolute top-2.5 right-2.5">
                      <Badge
                        variant={album.isPublic ? "secondary" : "outline"}
                        className="text-[10px] backdrop-blur-xs"
                      >
                        {album.isPublic ? "Public" : "Draft / Private"}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {album.year && (
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {album.year}
                        </Badge>
                      )}
                      {album.category && (
                        <Badge variant="secondary" className="text-[10px] font-medium">
                          {album.category}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        {album.itemCount} photos
                      </Badge>
                    </div>

                    <div className="space-y-1 flex-1">
                      <h3 className="font-serif text-base font-bold text-foreground line-clamp-1">
                        {album.title}
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono">
                        /gallery/{album.slug}
                      </p>
                      {album.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-1">
                          {album.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setManagingAlbum(album)}
                        className="gap-1.5 text-xs shadow-2xs"
                      >
                        Manage Photos ({album.itemCount})
                      </Button>

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditAlbum(album)}
                          className="text-xs px-2.5"
                        >
                          Edit
                        </Button>
                        <Link
                          href={`/gallery/${encodeURIComponent(album.slug)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-md border border-border p-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="View Live Public Album"
                        >
                          ↗
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAlbum(album)}
                          className="text-xs text-destructive hover:text-destructive px-2"
                          title="Delete Album"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL MEDIA LIBRARY */}
      {activeTab === "media" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-lg font-bold text-foreground">Media Asset Library</h2>
              <p className="text-xs text-muted-foreground">
                All uploaded garden club images, civic documentation, and event graphics.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setFilePreview(null);
                setNewStoragePath("");
                setNewAltText("");
                setNewCaption("");
                setNewIsPublic(true);
                setIsUploadOpen(true);
              }}
              className="gap-2 shadow-xs"
            >
              + Upload Media Asset
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold uppercase tracking-wider text-muted-foreground">
                    <th scope="col" className="p-3">
                      Preview
                    </th>
                    <th scope="col" className="p-3">
                      Details & Alt Text
                    </th>
                    <th scope="col" className="p-3">
                      Dimensions
                    </th>
                    <th scope="col" className="p-3">
                      Status
                    </th>
                    <th scope="col" className="p-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mediaList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        No media assets found. Upload photos above.
                      </td>
                    </tr>
                  ) : (
                    mediaList.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 w-20">
                          <div className="relative h-14 w-14 rounded-lg overflow-hidden border border-border bg-muted">
                            <Image src={item.src} alt={item.alt} fill className="object-cover" />
                          </div>
                        </td>
                        <td className="p-3 max-w-xs">
                          <p className="font-semibold text-foreground line-clamp-1">{item.alt}</p>
                          {item.caption && (
                            <p className="text-muted-foreground line-clamp-1 text-[11px] mt-0.5">
                              {item.caption}
                            </p>
                          )}
                          <p className="text-muted-foreground/70 font-mono text-[10px] mt-0.5 line-clamp-1">
                            {item.storagePath || item.src}
                          </p>
                        </td>
                        <td className="p-3 text-muted-foreground whitespace-nowrap">
                          {item.width && item.height ? `${item.width} × ${item.height}` : "Unknown"}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={item.isPublic ? "secondary" : "outline"}
                            className="text-[10px]"
                          >
                            {item.isPublic ? "Public" : "Private"}
                          </Badge>
                        </td>
                        <td className="p-3 text-right space-x-2 whitespace-nowrap">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditMedia(item)}
                            className="text-xs px-2.5"
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteMedia(item)}
                            className="text-xs px-2.5"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 1: CREATE ALBUM */}
      {isCreateAlbumOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="fixed inset-0 bg-black/60 backdrop-blur-xs border-0 p-0 cursor-default"
            onClick={() => setIsCreateAlbumOpen(false)}
            aria-label="Close dialog overlay"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-album-title"
            className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 id="create-album-title" className="font-serif text-xl font-bold text-foreground">
                Create New Album
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateAlbumOpen(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAlbum} className="space-y-4 pt-1">
              <div>
                <label
                  htmlFor="new-album-title-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Album Title *
                </label>
                <Input
                  id="new-album-title-input"
                  required
                  placeholder="e.g. Garden Walk 2026: Cottage Elegance"
                  value={newAlbumTitle}
                  onChange={(e) => handleNewTitleChange(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="new-album-slug-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Slug *
                  </label>
                  <Input
                    id="new-album-slug-input"
                    required
                    placeholder="garden-walk-2026"
                    value={newAlbumSlug}
                    onChange={(e) => setNewAlbumSlug(sanitizeAlbumSlug(e.target.value))}
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-album-year-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Year *
                  </label>
                  <Input
                    id="new-album-year-input"
                    type="number"
                    required
                    value={newAlbumYear}
                    onChange={(e) => setNewAlbumYear(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="new-album-category-select"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Category
                </label>
                <select
                  id="new-album-category-select"
                  value={newAlbumCategory}
                  onChange={(e) => setNewAlbumCategory(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                  <option value="Garden Walk">Garden Walk</option>
                  <option value="Civic Beautification">Civic Beautification</option>
                  <option value="Workshops & Education">Workshops & Education</option>
                  <option value="Plant Sales">Plant Sales</option>
                  <option value="Member Gatherings">Member Gatherings</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="new-album-desc-textarea"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Description
                </label>
                <textarea
                  id="new-album-desc-textarea"
                  rows={3}
                  placeholder="A short narrative describing this event, tour, or volunteer project..."
                  value={newAlbumDesc}
                  onChange={(e) => setNewAlbumDesc(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="new-album-is-public"
                  type="checkbox"
                  checked={newAlbumIsPublic}
                  onChange={(e) => setNewAlbumIsPublic(e.target.checked)}
                  className="rounded border border-input"
                />
                <label
                  htmlFor="new-album-is-public"
                  className="text-xs text-foreground font-medium"
                >
                  Visible to public gallery visitors
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateAlbumOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Album"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT ALBUM */}
      {editingAlbum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="fixed inset-0 bg-black/60 backdrop-blur-xs border-0 p-0 cursor-default"
            onClick={() => setEditingAlbum(null)}
            aria-label="Close dialog overlay"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-album-title"
            className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 id="edit-album-title" className="font-serif text-xl font-bold text-foreground">
                Edit Album Details
              </h2>
              <button
                type="button"
                onClick={() => setEditingAlbum(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateAlbum} className="space-y-4 pt-1">
              <div>
                <label
                  htmlFor="edit-album-title-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Album Title *
                </label>
                <Input
                  id="edit-album-title-input"
                  required
                  value={editAlbumTitle}
                  onChange={(e) => setEditAlbumTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="edit-album-slug-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Slug *
                  </label>
                  <Input
                    id="edit-album-slug-input"
                    required
                    value={editAlbumSlug}
                    onChange={(e) => setEditAlbumSlug(sanitizeAlbumSlug(e.target.value))}
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-album-year-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Year *
                  </label>
                  <Input
                    id="edit-album-year-input"
                    type="number"
                    required
                    value={editAlbumYear}
                    onChange={(e) => setEditAlbumYear(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="edit-album-category-select"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Category
                </label>
                <select
                  id="edit-album-category-select"
                  value={editAlbumCategory}
                  onChange={(e) => setEditAlbumCategory(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                  <option value="Garden Walk">Garden Walk</option>
                  <option value="Civic Beautification">Civic Beautification</option>
                  <option value="Workshops & Education">Workshops & Education</option>
                  <option value="Plant Sales">Plant Sales</option>
                  <option value="Member Gatherings">Member Gatherings</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="edit-album-desc-textarea"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Description
                </label>
                <textarea
                  id="edit-album-desc-textarea"
                  rows={3}
                  value={editAlbumDesc}
                  onChange={(e) => setEditAlbumDesc(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="edit-album-is-public"
                  type="checkbox"
                  checked={editAlbumIsPublic}
                  onChange={(e) => setEditAlbumIsPublic(e.target.checked)}
                  className="rounded border border-input"
                />
                <label
                  htmlFor="edit-album-is-public"
                  className="text-xs text-foreground font-medium"
                >
                  Visible to public gallery visitors
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingAlbum(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL 3: MANAGE ALBUM PHOTOS */}
      {managingAlbum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="fixed inset-0 bg-black/60 backdrop-blur-xs border-0 p-0 cursor-default"
            onClick={() => setManagingAlbum(null)}
            aria-label="Close dialog overlay"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-album-title"
            className="relative w-full max-w-4xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
              <div>
                <h2
                  id="manage-album-title"
                  className="font-serif text-xl font-bold text-foreground"
                >
                  Manage Photos: {managingAlbum.title}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(managingAlbum.items || []).length} photos currently in this collection.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedLibraryMediaIds([]);
                    setIsAddFromLibraryOpen(true);
                  }}
                  className="gap-1.5 text-xs shadow-2xs"
                >
                  + Add from Library
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setDirectFile(null);
                    setDirectFilePreview(null);
                    setDirectAltText("");
                    setDirectCaption("");
                    setDirectIsPublic(true);
                    setIsDirectUploadOpen(true);
                  }}
                  className="gap-1.5 text-xs shadow-2xs"
                >
                  + Upload to Album
                </Button>
                <button
                  type="button"
                  onClick={() => setManagingAlbum(null)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted ml-2"
                  aria-label="Close dialog"
                >
                  ✕
                </button>
              </div>
            </div>

            {(managingAlbum.items || []).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
                <p className="font-serif text-base font-bold text-foreground">
                  No photos in this album
                </p>
                <p className="text-xs text-muted-foreground">
                  Add photos from your media library or upload new photos directly above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {(managingAlbum.items || []).map((photo) => {
                  const isCover = managingAlbum.coverAssetId === photo.id;
                  return (
                    <div
                      key={photo.id}
                      className={`relative flex flex-col rounded-xl border overflow-hidden bg-card transition-all ${
                        isCover ? "border-primary ring-2 ring-primary/20" : "border-border"
                      }`}
                    >
                      <div className="relative aspect-4/3 w-full bg-muted">
                        <Image src={photo.src} alt={photo.alt} fill className="object-cover" />
                        {isCover && (
                          <span className="absolute top-2 left-2 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-xs">
                            ⭐ Cover
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 flex flex-col flex-1 space-y-2">
                        <p className="text-[11px] font-semibold text-foreground line-clamp-1">
                          {photo.alt}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-border/60">
                          {!isCover ? (
                            <button
                              type="button"
                              onClick={() => handleSetCover(managingAlbum.id, photo.id)}
                              className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                            >
                              Set cover
                            </button>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">Cover photo</span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemovePhotoFromAlbum(managingAlbum.id, photo.id)}
                            className="text-[11px] text-destructive hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-MODAL: ADD FROM LIBRARY TO ALBUM */}
      {isAddFromLibraryOpen && managingAlbum && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <button
            type="button"
            className="fixed inset-0 bg-black/70 backdrop-blur-xs border-0 p-0 cursor-default"
            onClick={() => setIsAddFromLibraryOpen(false)}
            aria-label="Close dialog overlay"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="library-picker-title"
            className="relative w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3
                  id="library-picker-title"
                  className="font-serif text-lg font-bold text-foreground"
                >
                  Select Photos from Media Library
                </h3>
                <p className="text-xs text-muted-foreground">
                  Choose photos to add to &quot;{managingAlbum.title}&quot;.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddFromLibraryOpen(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {(() => {
              const albumPhotoIds = new Set((managingAlbum.items || []).map((i) => i.id));
              const availableMedia = mediaList.filter((m) => !albumPhotoIds.has(m.id));

              if (availableMedia.length === 0) {
                return (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                    All photos in your library are already in this album, or your library is empty.
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto p-1">
                  {availableMedia.map((media) => {
                    const isSelected = selectedLibraryMediaIds.includes(media.id);
                    return (
                      <button
                        key={media.id}
                        type="button"
                        onClick={() => {
                          setSelectedLibraryMediaIds((prev) =>
                            isSelected ? prev.filter((id) => id !== media.id) : [...prev, media.id],
                          );
                        }}
                        className={`relative rounded-xl overflow-hidden border text-left cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="relative aspect-4/3 w-full bg-muted">
                          <Image src={media.src} alt={media.alt} fill className="object-cover" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <span className="rounded-full bg-primary p-1 text-white shadow-xs">
                                ✓
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-[11px] font-semibold text-foreground line-clamp-1">
                            {media.alt}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            <div className="flex justify-between items-center pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {selectedLibraryMediaIds.length} photo(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddFromLibraryOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={selectedLibraryMediaIds.length === 0 || isSubmitting}
                  onClick={handleAddSelectedFromLibrary}
                >
                  {isSubmitting ? "Adding..." : `Add to Album (${selectedLibraryMediaIds.length})`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: DIRECT UPLOAD TO ALBUM */}
      {isDirectUploadOpen && managingAlbum && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <button
            type="button"
            className="fixed inset-0 bg-black/70 backdrop-blur-xs border-0 p-0 cursor-default"
            onClick={() => setIsDirectUploadOpen(false)}
            aria-label="Close dialog overlay"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="direct-upload-title"
            className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3
                  id="direct-upload-title"
                  className="font-serif text-lg font-bold text-foreground"
                >
                  Upload Photo to Album
                </h3>
                <p className="text-xs text-muted-foreground">
                  Upload directly to &quot;{managingAlbum.title}&quot;.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDirectUploadOpen(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDirectUploadToAlbum} className="space-y-4 pt-1">
              <div>
                <label
                  htmlFor="direct-file-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Select Image File *
                </label>
                <input
                  id="direct-file-input"
                  type="file"
                  required
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setDirectFile(file);
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setDirectFilePreview(url);
                      if (!directAltText) {
                        setDirectAltText(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
                      }
                    } else {
                      setDirectFilePreview(null);
                    }
                  }}
                  className="w-full text-xs text-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                />
              </div>

              {directFilePreview && (
                <div className="relative h-36 w-full rounded-lg overflow-hidden border border-border bg-muted">
                  <Image
                    src={directFilePreview}
                    alt="Selected preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="direct-alt-text-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Accessibility Alt Text *
                </label>
                <Input
                  id="direct-alt-text-input"
                  required
                  placeholder="Descriptive label for screen readers"
                  value={directAltText}
                  onChange={(e) => setDirectAltText(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="direct-caption-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Caption (Optional)
                </label>
                <Input
                  id="direct-caption-input"
                  placeholder="Public display caption"
                  value={directCaption}
                  onChange={(e) => setDirectCaption(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="direct-is-public"
                  type="checkbox"
                  checked={directIsPublic}
                  onChange={(e) => setDirectIsPublic(e.target.checked)}
                  className="rounded border border-input"
                />
                <label htmlFor="direct-is-public" className="text-xs text-foreground font-medium">
                  Visible to public gallery visitors
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDirectUploadOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Uploading..." : "Upload & Add to Album"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: UPLOAD ASSET TO MEDIA LIBRARY */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-media-modal-title"
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4"
          >
            <h2
              id="upload-media-modal-title"
              className="font-serif text-xl font-bold text-foreground"
            >
              Add New Media Asset
            </h2>
            <p className="text-xs text-muted-foreground">
              Register a photo stored in the club storage bucket or upload directly.
            </p>

            <form onSubmit={handleCreateMedia} className="space-y-4 pt-2">
              <div>
                <label
                  htmlFor="new-file-upload"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Upload Image File
                </label>
                <input
                  id="new-file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                />
              </div>

              {filePreview && (
                <div className="relative h-36 w-full rounded-lg overflow-hidden border border-border bg-muted">
                  <Image src={filePreview} alt="Selected preview" fill className="object-cover" />
                </div>
              )}

              <div>
                <label
                  htmlFor="new-storage-path"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Storage Path {!selectedFile && "*"}
                </label>
                <Input
                  id="new-storage-path"
                  required={!selectedFile}
                  placeholder={
                    selectedFile
                      ? "Auto-assigned in club-media bucket"
                      : "e.g. gallery/rose-garden-2026.jpg"
                  }
                  value={newStoragePath}
                  disabled={Boolean(selectedFile)}
                  onChange={(e) => setNewStoragePath(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="new-alt-text"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Accessibility Alt Text *
                </label>
                <Input
                  id="new-alt-text"
                  required
                  placeholder="Descriptive label for screen readers"
                  value={newAltText}
                  onChange={(e) => setNewAltText(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="new-caption"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Caption (Optional)
                </label>
                <Input
                  id="new-caption"
                  placeholder="Public display caption"
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="new-is-public"
                  type="checkbox"
                  checked={newIsPublic}
                  onChange={(e) => setNewIsPublic(e.target.checked)}
                  className="rounded border border-input"
                />
                <label htmlFor="new-is-public" className="text-xs text-foreground font-medium">
                  Visible to public gallery visitors
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUploadOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  Save Asset
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT MEDIA ASSET */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-media-modal-title"
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4"
          >
            <h2
              id="edit-media-modal-title"
              className="font-serif text-xl font-bold text-foreground"
            >
              Edit Media Asset
            </h2>
            <p className="text-xs text-muted-foreground">
              Update accessibility alt text, public caption, and visibility status.
            </p>

            {editingItem.src && (
              <div className="relative h-40 w-full rounded-lg overflow-hidden border border-border bg-muted">
                <Image
                  src={editingItem.src}
                  alt={editingItem.alt || "Preview"}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <form onSubmit={handleUpdateMedia} className="space-y-4 pt-2">
              <div>
                <label
                  htmlFor="edit-alt-text"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Accessibility Alt Text *
                </label>
                <Input
                  id="edit-alt-text"
                  required
                  value={editAltText}
                  onChange={(e) => setEditAltText(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="edit-caption"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Caption
                </label>
                <Input
                  id="edit-caption"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="edit-is-public"
                  type="checkbox"
                  checked={editIsPublic}
                  onChange={(e) => setEditIsPublic(e.target.checked)}
                  className="rounded border border-input"
                />
                <label htmlFor="edit-is-public" className="text-xs text-foreground font-medium">
                  Visible to public gallery visitors
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingItem(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
