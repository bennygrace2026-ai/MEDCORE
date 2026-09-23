/**
 * Asset preloading and decoding utilities to guarantee synchronized display.
 * Prevents staggered pop-ins, layout shifts, or late image renders.
 */

export function preloadImage(url: string | null | undefined): Promise<boolean> {
  if (!url) return Promise.resolve(false);
  return new Promise((resolve) => {
    // Defensive timeout so image preloading can never stall the app
    const timeoutId = setTimeout(() => resolve(false), 2500);

    const img = new Image();
    img.src = url;

    const handleSuccess = async () => {
      clearTimeout(timeoutId);
      try {
        if ('decode' in img) {
          await img.decode();
        }
      } catch {
        // Fallback gracefully if decode fails
      }
      resolve(true);
    };

    if (img.complete) {
      handleSuccess();
      return;
    }

    img.onload = handleSuccess;
    img.onerror = () => {
      clearTimeout(timeoutId);
      resolve(false);
    };
  });
}

/**
 * Preload multiple assets simultaneously and wait until all are ready.
 */
export async function preloadAllAssets(urls: (string | null | undefined)[]): Promise<boolean[]> {
  const validUrls = urls.filter((u): u is string => Boolean(u));
  return Promise.all(validUrls.map(preloadImage));
}
