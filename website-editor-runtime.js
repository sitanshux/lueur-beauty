/* ============================================================
   LUEUR BEAUTY — website-editor-runtime.js
   ============================================================ */

(function () {
  // Default values matching original premium design
  const defaultSettings = {
    content: {
      heroTitle: "Elevated Essentials<br /><em>for Healthy Skin</em>",
      heroSubtitle: "Thoughtfully crafted skincare with clean, botanical ingredients. Designed for visible radiance that feels completely natural.",
      aboutText: "Founded in 2020, Lueur was born from a simple belief: your skin deserves ingredients you can trust. We source botanical extracts, cold-pressed oils, and plant actives to create formulas that are gentle and effective.",
      aboutTextSecondary: "Every product is dermatologist-tested, cruelty-free, and packaged in eco-conscious materials.",
      contactEmail: "hello@lueurbeauty.com",
      contactPhone: "+1 (800) 583-7829",
      contactAddress: "123 Rose Lane, Beverly Hills, CA 90210",
      contactHours: "Mon–Fri: 9am – 6pm PST",
      footerText: "Clean, botanical skincare crafted with care. Designed for radiance that feels natural.",
      promoBannerTag: "Seasonal Edit",
      promoBannerTitle: "Spring Collection<br /><strong>Up to 40% Off</strong>",
      promoBannerSubtitle: "Light textures and fresh botanicals for the warmer months ahead."
    },
    images: {
      heroImage: "images/hero_banner_luxury.png",
      bannerImage: "images/promo_banner_sale.png",
      aboutImage: "images/about_model_photo.png",
      logoText: "Lueur <em>Beauty</em>"
    },
    theme: {
      primaryColor: "#b8848c",
      secondaryColor: "#ddd0c4",
      accentColor: "#d4aeb5",
      textColor: "#4a3830",
      backgroundColor: "#faf8f5",
      buttonColor: "#2c1f17"
    },
    typography: {
      headingFontSize: "3.2rem",
      paragraphFontSize: "0.95rem",
      buttonFontSize: "0.82rem",
      fontFamily: "Cormorant Garamond"
    },
    layout: {
      heroHeight: "92vh",
      gridColumns: "4",
      cardBorderRadius: "6px",
      cardSpacing: "28px",
      sectionPadding: "110px",
      containerWidth: "1260px"
    },
    visibility: {
      hero: true,
      about: true,
      featured: true,
      reviews: true,
      contact: true
    },
    sectionOrder: ["hero", "featured", "about", "reviews", "contact"]
  };

  // ---------------------------------------------------------
  // Helper: Apply Dynamic Styling Overrides (CSS variables)
  // ---------------------------------------------------------
  function applyStyles(settings) {
    let styleEl = document.getElementById('website-editor-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'website-editor-styles';
      document.head.appendChild(styleEl);
    }

    const theme = settings.theme || {};
    const typography = settings.typography || {};
    const layout = settings.layout || {};

    let fontHeading = "'Cormorant Garamond', Georgia, serif";
    let fontBody = "'DM Sans', system-ui, sans-serif";

    if (typography.fontFamily === 'Playfair Display') {
      fontHeading = "'Playfair Display', Georgia, serif";
      fontBody = "'Inter', system-ui, sans-serif";
      ensureFontLoaded('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');
    } else if (typography.fontFamily === 'Montserrat') {
      fontHeading = "'Montserrat', sans-serif";
      fontBody = "'Roboto', sans-serif";
      ensureFontLoaded('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&family=Roboto:wght@300;400;500;700&display=swap');
    } else if (typography.fontFamily === 'Georgia') {
      fontHeading = "Georgia, serif";
      fontBody = "system-ui, sans-serif";
    } else if (typography.fontFamily === 'Inter') {
      fontHeading = "'Inter', sans-serif";
      fontBody = "'Inter', sans-serif";
      ensureFontLoaded('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    }

    const primaryColor = theme.primaryColor || '#b8848c';
    const secondaryColor = theme.secondaryColor || '#ddd0c4';
    const accentColor = theme.accentColor || '#d4aeb5';
    const textColor = theme.textColor || '#4a3830';
    const backgroundColor = theme.backgroundColor || '#faf8f5';
    const buttonColor = theme.buttonColor || '#2c1f17';

    const cardRadius = layout.cardBorderRadius || '6px';
    const cardSpacing = layout.cardSpacing || '28px';
    const sectionPadding = layout.sectionPadding || '110px';
    const containerWidth = layout.containerWidth || '1260px';
    const heroHeight = layout.heroHeight || '92vh';
    const gridColumns = layout.gridColumns || '4';

    const headingFontSize = typography.headingFontSize || '3.2rem';
    const paragraphFontSize = typography.paragraphFontSize || '0.95rem';
    const buttonFontSize = typography.buttonFontSize || '0.82rem';

    // Build the stylesheet override content
    styleEl.innerHTML = `
      :root {
        --rose: ${primaryColor} !important;
        --cream: ${secondaryColor} !important;
        --rose-light: ${accentColor} !important;
        --text-body: ${textColor} !important;
        --warm-white: ${backgroundColor} !important;
        --text-primary: ${buttonColor} !important;
        
        --font-heading: ${fontHeading} !important;
        --font-body: ${fontBody} !important;
        
        --radius-md: ${cardRadius} !important;
        --radius-sm: calc(${cardRadius} / 2) !important;
        --radius-lg: calc(${cardRadius} * 1.5) !important;
        --radius-xl: calc(${cardRadius} * 2.5) !important;
      }
      
      body {
        background: var(--warm-white) !important;
        color: var(--text-body) !important;
        font-size: ${paragraphFontSize} !important;
      }
      
      .hero {
        min-height: ${heroHeight} !important;
      }
      
      .container {
        max-width: ${containerWidth} !important;
      }
      
      .featured, .about, .reviews, .contact, .products-section {
        padding-top: ${sectionPadding} !important;
        padding-bottom: ${sectionPadding} !important;
      }
      
      .featured-grid, .products-grid, #all-products-grid, #products-page-grid {
        grid-template-columns: repeat(${gridColumns}, 1fr) !important;
        gap: ${cardSpacing} !important;
      }
      
      .btn, .add-to-cart, .btn-promo, .btn-hero-primary, .btn-hero-outline, .btn-outline-dark {
        font-size: ${buttonFontSize} !important;
      }
      
      .btn-primary, .add-to-cart, .btn-promo {
        background: ${buttonColor} !important;
      }
      
      .btn-primary:hover, .add-to-cart:hover, .btn-promo:hover {
        opacity: 0.9 !important;
      }
      
      .section-title {
        font-size: ${headingFontSize} !important;
      }
      .hero-content h1 {
        font-size: calc(${headingFontSize} * 1.25) !important;
      }
    `;
  }

  function ensureFontLoaded(url) {
    if (!document.querySelector(`link[href="${url}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
    }
  }

  // ---------------------------------------------------------
  // Helper: Apply DOM Content & Visibility Updates
  // ---------------------------------------------------------
  function applyDOMUpdates(settings) {
    const content = settings.content || {};
    const images = settings.images || {};
    const visibility = settings.visibility || {};
    const sectionOrder = settings.sectionOrder || ["hero", "featured", "about", "reviews", "contact"];

    // 1. Content Overrides
    const updateElText = (id, text) => {
      const el = document.getElementById(id);
      if (el && typeof text !== 'undefined') {
        el.textContent = text;
      }
    };

    const updateElHTML = (id, html) => {
      const el = document.getElementById(id);
      if (el && typeof html !== 'undefined') {
        el.innerHTML = html;
      }
    };

    updateElHTML('hero-title', content.heroTitle);
    updateElText('hero-subtitle', content.heroSubtitle);
    updateElText('about-text-primary', content.aboutText);
    updateElText('about-text-secondary', content.aboutTextSecondary);
    updateElText('contact-info-email', content.contactEmail);
    updateElText('contact-info-phone', content.contactPhone);
    updateElText('contact-info-address', content.contactAddress);
    updateElText('contact-info-hours', content.contactHours);
    updateElText('footer-about-text', content.footerText);
    updateElText('promo-banner-tag', content.promoBannerTag);
    updateElHTML('promo-banner-title', content.promoBannerTitle);
    updateElText('promo-banner-subtitle', content.promoBannerSubtitle);

    // Logos text
    if (images.logoText) {
      updateElHTML('nav-logo-text', images.logoText);
      updateElHTML('footer-logo-text', images.logoText);
    }

    // 2. Images Overrides
    const updateImgSrc = (id, src) => {
      const el = document.getElementById(id);
      if (el && src) {
        el.src = src;
      }
    };

    updateImgSrc('hero-bg-img', images.heroImage);
    updateImgSrc('promo-banner-img', images.bannerImage);
    updateImgSrc('about-section-img', images.aboutImage);

    // 3. Section Visibility
    const sectionMap = {
      hero: document.getElementById('home'),
      featured: document.getElementById('featured'),
      about: document.getElementById('about'),
      reviews: document.getElementById('reviews'),
      contact: document.getElementById('contact')
    };

    const brandStrip = document.querySelector('.brand-strip');
    const promoBanner = document.getElementById('promo-banner') || document.querySelector('.promo-banner');
    const allProductsSection = document.getElementById('products') || document.querySelector('.products-section');

    for (const [key, el] of Object.entries(sectionMap)) {
      if (el) {
        if (visibility[key] === false) {
          el.style.setProperty('display', 'none', 'important');
        } else {
          el.style.display = ''; // Restore default
        }
      }
    }

    // Sub-elements visibility mapping
    if (brandStrip) {
      brandStrip.style.setProperty('display', visibility.hero === false ? 'none' : '', visibility.hero === false ? 'important' : '');
    }
    if (promoBanner) {
      // Keep promotional banner tied to featured visibility
      promoBanner.style.setProperty('display', visibility.featured === false ? 'none' : '', visibility.featured === false ? 'important' : '');
    }
    if (allProductsSection) {
      // Keep products section visibility matching featured
      allProductsSection.style.setProperty('display', visibility.featured === false ? 'none' : '', visibility.featured === false ? 'important' : '');
    }

    // 4. Section Reordering
    const footer = document.querySelector('footer');
    if (footer && document.body) {
      sectionOrder.forEach(key => {
        const el = sectionMap[key];
        if (el) {
          document.body.insertBefore(el, footer);
          
          // Carry child sections along
          if (key === 'hero' && brandStrip) {
            document.body.insertBefore(brandStrip, el.nextSibling);
          }
          if (key === 'featured') {
            let lastEl = el;
            if (promoBanner) {
              document.body.insertBefore(promoBanner, lastEl.nextSibling);
              lastEl = promoBanner;
            }
            if (allProductsSection) {
              document.body.insertBefore(allProductsSection, lastEl.nextSibling);
            }
          }
        }
      });
    }
  }

  // ---------------------------------------------------------
  // Main Execution
  // ---------------------------------------------------------
  // Synchronous Load (from cache to prevent visual flash)
  let cachedSettings = null;
  try {
    const raw = localStorage.getItem('lueur_website_settings');
    if (raw) {
      cachedSettings = JSON.parse(raw);
    }
  } catch (e) {}

  const activeSettings = cachedSettings || defaultSettings;
  applyStyles(activeSettings);

  // Apply DOM elements on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyDOMUpdates(activeSettings));
  } else {
    applyDOMUpdates(activeSettings);
  }

  // ---------------------------------------------------------
  // Preview Mode Handling (iframe postMessage / sessionStorage)
  // ---------------------------------------------------------
  const isPreviewMode = window.location.search.includes('preview=true');

  if (isPreviewMode) {
    // Read sessionStorage settings on startup if they exist
    try {
      const sessRaw = sessionStorage.getItem('lueur_preview_settings');
      if (sessRaw) {
        const previewSettings = JSON.parse(sessRaw);
        applyStyles(previewSettings);
        document.addEventListener('DOMContentLoaded', () => applyDOMUpdates(previewSettings));
      }
    } catch (e) {}

    // Listen to real-time changes sent by editor
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'LUEUR_PREVIEW_SETTINGS') {
        const newSettings = event.data.settings;
        applyStyles(newSettings);
        applyDOMUpdates(newSettings);
      } else if (event.data && event.data.type === 'LUEUR_PREVIEW_RELOAD') {
        window.location.reload();
      }
    });
  } else {
    // ---------------------------------------------------------
    // Firestore Async Sync (Stale-While-Revalidate)
    // ---------------------------------------------------------
    async function syncFromFirestore() {
      // Check if Firestore helper is loaded
      if (typeof window.firestoreGetDoc !== 'function') {
        setTimeout(syncFromFirestore, 100);
        return;
      }

      try {
        const docSnap = await window.firestoreGetDoc('settings', 'website_settings');
        if (docSnap.exists()) {
          const freshSettings = docSnap.data();
          
          // Compare with cached settings to avoid redundant DOM manipulations
          const cachedStr = localStorage.getItem('lueur_website_settings');
          const freshStr = JSON.stringify(freshSettings);
          
          if (cachedStr !== freshStr) {
            localStorage.setItem('lueur_website_settings', freshStr);
            applyStyles(freshSettings);
            applyDOMUpdates(freshSettings);
          }
        } else {
          // If Firestore is empty, initialize it with default settings
          if (typeof window.firestoreSetDoc === 'function') {
            await window.firestoreSetDoc('settings', 'website_settings', defaultSettings);
          }
        }
      } catch (err) {
        console.warn('Firestore website settings sync failed:', err);
      }
    }

    // Start background sync
    if (document.readyState === 'loading') {
      window.addEventListener('load', syncFromFirestore);
    } else {
      syncFromFirestore();
    }
  }
})();
