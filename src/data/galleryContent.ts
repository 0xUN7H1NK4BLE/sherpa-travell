// Managed gallery content: scenes (photos) and films (videos).
// Stored in src/data/galleryContent.json, committed to Git like treks.
// These are the parts of the gallery not auto-derived from trek data.

export interface GalleryScene {
  id: string;
  src: string;
  title: string;
  subtitle: string;
  alt: string;
  credit: string;
}

export interface GalleryFilm {
  id: string;
  src: string;
  poster?: string;
  title: string;
  subtitle?: string;
  trekSlug?: string;
  trekName?: string;
  alt: string;
  credit: string;
}

export interface GalleryContent {
  scenes: GalleryScene[];
  videos: GalleryFilm[];
}

export const emptyGalleryContent: GalleryContent = {
  scenes: [],
  videos: [],
};

export const GALLERY_FILE_REPO_PATH = "src/data/galleryContent.json";