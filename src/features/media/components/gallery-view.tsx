"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AlbumSummary, MediaItem } from "../types";

interface GalleryViewProps {
  albums: AlbumSummary[];
  media: MediaItem[];
}

export function GalleryView({ albums, media }: GalleryViewProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedYear, setSelectedYear] = React.useState<string>("all");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [selectedAlbumId, setSelectedAlbumId] = React.useState<string>("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 9;

  // Extract distinct years and categories
  const years = React.useMemo(() => {
    const set = new Set<number>();
    for (const a of albums) {
      if (a.year) set.add(a.year);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [albums]);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    for (const a of albums) {
      if (a.category) set.add(a.category);
    }
    return Array.from(set).sort();
  }, [albums]);

  // Featured Album (top / first album with cover)
  const featuredAlbum = React.useMemo(() => {
    return albums.find((a) => a.coverImage) || albums[0] || null;
  }, [albums]);

  // Filtered albums for Archive Grid
  const filteredAlbums = React.useMemo(() => {
    return albums.filter((album) => {
      if (selectedAlbumId !== "all" && album.id !== selectedAlbumId) {
        return false;
      }
      if (selectedYear !== "all" && album.year?.toString() !== selectedYear) {
        return false;
      }
      if (selectedCategory !== "all" && album.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = album.title.toLowerCase().includes(q);
        const matchDesc = album.description?.toLowerCase().includes(q) ?? false;
        const matchCat = album.category?.toLowerCase().includes(q) ?? false;
        const matchYear = album.year?.toString().includes(q) ?? false;
        return matchTitle || matchDesc || matchCat || matchYear;
      }
      return true;
    });
  }, [albums, selectedAlbumId, selectedYear, selectedCategory, searchQuery]);

  // Pagination for albums
  const totalPages = Math.ceil(filteredAlbums.length / itemsPerPage) || 1;
  const paginatedAlbums = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAlbums.slice(start, start + itemsPerPage);
  }, [filteredAlbums, currentPage]);

  // Reset page when filters change
  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset page on filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedYear, selectedCategory, selectedAlbumId]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedYear !== "all" ||
    selectedCategory !== "all" ||
    selectedAlbumId !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedYear("all");
    setSelectedCategory("all");
    setSelectedAlbumId("all");
  };

  const totalPhotoCount = React.useMemo(() => {
    return albums.reduce((acc, curr) => acc + curr.itemCount, 0) || media.length;
  }, [albums, media]);

  return (
    <div className="space-y-10">
      {/* 1. Hero Archive Banner */}
      <div className="rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-10 backdrop-blur-xs shadow-xs relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text & Stats Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary uppercase tracking-wide">
                SDGC Gallery Archive
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
                Club Photo Gallery
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
                Event albums, coastal blooms, and society memories preserved from the
                Saugatuck-Douglas Garden Club public archive.
              </p>
            </div>

            {/* 3 Metric Stat Boxes */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-md pt-2">
              <div className="rounded-2xl border border-border/70 bg-card/80 p-4 text-center shadow-2xs">
                <div className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
                  {albums.length}
                </div>
                <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                  ALBUMS
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/80 p-4 text-center shadow-2xs">
                <div className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
                  {totalPhotoCount}+
                </div>
                <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                  PHOTOS
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/80 p-4 text-center shadow-2xs">
                <div className="font-serif text-2xl sm:text-3xl font-bold text-foreground">75</div>
                <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                  YEARS
                </div>
              </div>
            </div>
          </div>

          {/* Right Featured Album Spotlight */}
          {featuredAlbum && (
            <div className="lg:col-span-5">
              <Link
                href={`/gallery/${featuredAlbum.slug}`}
                className="group relative block aspect-16/10 sm:aspect-4/3 w-full rounded-2xl overflow-hidden border border-border/80 shadow-md transition-all duration-300 hover:shadow-xl hover:border-primary/50"
              >
                {featuredAlbum.coverImage ? (
                  <Image
                    src={featuredAlbum.coverImage.src}
                    alt={featuredAlbum.coverImage.alt || featuredAlbum.title}
                    fill
                    unoptimized={
                      featuredAlbum.coverImage.src.includes("127.0.0.1") ||
                      featuredAlbum.coverImage.src.includes("localhost")
                    }
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                    Featured Album
                  </div>
                )}
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-5 sm:p-6 text-white">
                  <div className="flex items-center gap-2 mb-1.5">
                    {featuredAlbum.year && (
                      <span className="rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-white backdrop-blur-xs">
                        {featuredAlbum.year}
                      </span>
                    )}
                    {featuredAlbum.category && (
                      <span className="rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-white backdrop-blur-xs">
                        {featuredAlbum.category}
                      </span>
                    )}
                  </div>
                  <h2 className="font-serif text-lg sm:text-xl font-bold leading-tight group-hover:text-primary-foreground transition-colors">
                    {featuredAlbum.title}
                  </h2>
                  <p className="text-xs text-white/80 line-clamp-1 mt-1 font-light">
                    {featuredAlbum.description || "Click to browse all photos and memories"}
                  </p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 2. Search & Filter Bar with Album Quick-Tabs */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Input
              type="text"
              placeholder="Search by event, caption, category, or year..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 text-sm bg-background"
            />
          </div>

          {/* Year Dropdown */}
          <div className="md:col-span-3">
            <select
              aria-label="Filter albums by year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="all">All years</option>
              {years.map((y) => (
                <option key={y} value={y.toString()}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              aria-label="Filter albums by category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Album Quick Tabs (tablist) */}
        <div
          className="flex overflow-x-auto no-scrollbar items-center gap-2 pt-2 border-t border-border/60 whitespace-nowrap"
          role="tablist"
          aria-label="Photo Albums"
        >
          <button
            id="tab-all"
            type="button"
            role="tab"
            aria-selected={selectedAlbumId === "all"}
            aria-controls="gallery-albums-grid"
            onClick={() => {
              setSelectedAlbumId("all");
            }}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              selectedAlbumId === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All Photos ({totalPhotoCount})
          </button>
          {albums.map((album) => {
            const isSelected = selectedAlbumId === album.id;
            return (
              <button
                key={album.id}
                id={`tab-${album.id}`}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls="gallery-albums-grid"
                onClick={() => {
                  setSelectedAlbumId(album.id);
                }}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {album.title} ({album.itemCount})
              </button>
            );
          })}
        </div>

        {/* Active Filter Pill & Reset */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">
              FILTERS ACTIVE
            </span>
            <button
              type="button"
              onClick={clearFilters}
              className="hover:text-foreground underline underline-offset-4 cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* 3. Albums Archive Grid */}
      <div
        id="gallery-albums-grid"
        role="tabpanel"
        aria-label="Photo albums collection"
        className="space-y-6"
      >
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            ALBUMS
          </span>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
              Browse the Archive
            </h2>
            <span className="text-xs text-muted-foreground">
              Showing {filteredAlbums.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, filteredAlbums.length)} of{" "}
              {filteredAlbums.length} albums
            </span>
          </div>
        </div>

        {filteredAlbums.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center space-y-3">
            <p className="font-serif text-lg font-bold text-foreground">
              No albums match your filter
            </p>
            <p className="text-sm text-muted-foreground">
              Try selecting &quot;All years&quot; or clearing your search term.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {paginatedAlbums.map((album) => (
              <Link
                key={album.id}
                href={`/gallery/${album.slug}`}
                className="group flex flex-col rounded-2xl border border-border/80 bg-card overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/40 hover:-translate-y-1"
              >
                {/* Cover Image Container */}
                <div className="relative aspect-16/10 w-full overflow-hidden bg-muted">
                  {album.coverImage ? (
                    <Image
                      src={album.coverImage.src}
                      alt={album.coverImage.alt || album.title}
                      fill
                      unoptimized={
                        album.coverImage.src.includes("127.0.0.1") ||
                        album.coverImage.src.includes("localhost")
                      }
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      No cover photograph
                    </div>
                  )}
                </div>

                {/* Body Content */}
                <div className="p-5 flex flex-col flex-1 space-y-3">
                  {/* Meta Badge Row */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {album.year && (
                      <Badge variant="outline" className="text-[11px] font-semibold px-2 py-0.5">
                        {album.year}
                      </Badge>
                    )}
                    {album.category && (
                      <Badge variant="secondary" className="text-[11px] font-medium px-2 py-0.5">
                        {album.category}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="text-[11px] text-muted-foreground px-2 py-0.5"
                    >
                      {album.itemCount} {album.itemCount === 1 ? "photo" : "photos"}
                    </Badge>
                  </div>

                  <div className="space-y-1 flex-1">
                    <h3 className="font-serif text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {album.title}
                    </h3>
                    {album.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {album.description}
                      </p>
                    )}
                  </div>

                  {/* Card Link Footer */}
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-primary font-semibold">
                    <span>Explore Album</span>
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "primary" : "outline"}
                  size="sm"
                  className="w-9 p-0"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
