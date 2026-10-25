import type { Metadata } from "next";
import { GalleryView } from "@/features/media/components/gallery-view";
import { listGalleryMedia, listMediaAlbums } from "@/features/media/queries";

export const metadata: Metadata = {
  title: "Photo Gallery Archive",
  description:
    "Explore photo albums of Saugatuck Douglas Garden Club community beautification projects, civic plantings, workshops, and annual Garden Walks.",
  openGraph: {
    title: "Photo Gallery Archive | Saugatuck-Douglas Garden Club",
    description:
      "Explore photo albums of Saugatuck Douglas Garden Club community beautification projects, civic plantings, workshops, and annual Garden Walks.",
    type: "website",
  },
};

export default async function GalleryPage() {
  const albums = await listMediaAlbums();
  const media = await listGalleryMedia();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <GalleryView albums={albums} media={media} />
    </div>
  );
}
