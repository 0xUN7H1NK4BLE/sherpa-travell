const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

type GMapsLib = typeof google.maps;

let loaderPromise: Promise<GMapsLib> | null = null;

declare global {
  interface Window {
    google?: typeof google;
    __gmapsCallback?: () => void;
  }
}

// Loads the Google Maps JS API once and caches the promise. Every caller gets
// the same instance; the script is only injected into the page a single time.
export function loadGoogleMaps(): Promise<GMapsLib> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps requires a browser environment"));
  }
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }
  if (loaderPromise) return loaderPromise;
  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(
      new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured"),
    );
  }

  loaderPromise = new Promise<GMapsLib>((resolve, reject) => {
    window.__gmapsCallback = () => {
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error("Google Maps failed to initialize"));
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=__gmapsCallback&v=weekly&loading=async`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      loaderPromise = null;
      reject(new Error("Failed to load the Google Maps script"));
    };
    document.head.appendChild(script);
  });

  return loaderPromise;
}
