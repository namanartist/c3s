// src/hooks/usePageMeta.ts
import { useEffect } from 'react';

/**
 * Reusable hook that updates document title, description, and social sharing meta tags per page dynamically.
 */
export function usePageMeta(title: string, description?: string): void {
  useEffect(() => {
    const finalTitle = title.includes('UniMap') ? title : `${title} | UniMap`;
    const previousTitle = document.title;
    document.title = finalTitle;

    const metaDescription = document.querySelector('meta[name="description"]');
    const previousDescription = metaDescription ? metaDescription.getAttribute('content') : null;

    if (description && metaDescription) {
      metaDescription.setAttribute('content', description);
    }

    // Open Graph Tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const previousOgTitle = ogTitle ? ogTitle.getAttribute('content') : null;
    if (ogTitle) {
      ogTitle.setAttribute('content', finalTitle);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    const previousOgDescription = ogDescription ? ogDescription.getAttribute('content') : null;
    if (description && ogDescription) {
      ogDescription.setAttribute('content', description);
    }

    // Twitter Tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    const previousTwitterTitle = twitterTitle ? twitterTitle.getAttribute('content') : null;
    if (twitterTitle) {
      twitterTitle.setAttribute('content', finalTitle);
    }

    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    const previousTwitterDescription = twitterDescription ? twitterDescription.getAttribute('content') : null;
    if (description && twitterDescription) {
      twitterDescription.setAttribute('content', description);
    }

    return () => {
      // Clean up on unmount: restore to default meta values
      document.title = previousTitle;
      
      if (description && metaDescription && previousDescription !== null) {
        metaDescription.setAttribute('content', previousDescription);
      }
      if (ogTitle && previousOgTitle !== null) {
        ogTitle.setAttribute('content', previousOgTitle);
      }
      if (description && ogDescription && previousOgDescription !== null) {
        ogDescription.setAttribute('content', previousOgDescription);
      }
      if (twitterTitle && previousTwitterTitle !== null) {
        twitterTitle.setAttribute('content', previousTwitterTitle);
      }
      if (description && twitterDescription && previousTwitterDescription !== null) {
        twitterDescription.setAttribute('content', previousTwitterDescription);
      }
    };
  }, [title, description]);
}
