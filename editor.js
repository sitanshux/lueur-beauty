/* ============================================================
   LUEUR BEAUTY — editor.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  // Check if firebase functions are loaded; poll if not yet available
  await waitForFirebase();

  // Settings state
  let settings = null;
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

  const sectionNameMap = {
    hero: "Hero Section",
    featured: "Featured & Products",
    about: "About Section",
    reviews: "Reviews Section",
    contact: "Contact Section"
  };

  // UI elements
  const iframe = document.getElementById('preview-iframe');
  const saveBtn = document.getElementById('save-publish-btn');
  const mobileToggle = document.getElementById('mobile-view-toggle');
  const fileUploaders = document.querySelectorAll('.file-uploader');

  // Accordion toggle behavior
  document.querySelectorAll('.editor-section-header').forEach(header => {
    header.addEventListener('click', () => {
      const section = header.parentElement;
      section.classList.toggle('collapsed');
    });
  });

  // Collapse sections by default except the first one
  document.querySelectorAll('.editor-section').forEach((section, index) => {
    if (index > 0) {
      section.classList.add('collapsed');
    }
  });

  // Mobile layout switch view
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      document.body.classList.toggle('preview-active');
      if (document.body.classList.contains('preview-active')) {
        mobileToggle.textContent = 'Switch to Controls';
      } else {
        mobileToggle.textContent = 'Switch to Live Preview';
      }
    });
  }

  // Load configuration
  await loadSettings();

  // Populate controls and bind listeners
  populateForm();
  initFormListeners();
  renderSectionOrder();

  // ---------------------------------------------------------
  // Functions
  // ---------------------------------------------------------

  async function waitForFirebase() {
    if (window.firestoreGetDoc) return;
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (window.firestoreGetDoc) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }

  async function loadSettings() {
    try {
      if (typeof window.firestoreGetDoc === 'function') {
        const docSnap = await window.firestoreGetDoc('settings', 'website_settings');
        if (docSnap.exists()) {
          settings = docSnap.data();
          // Merge to ensure missing fields from defaults are populated
          settings = mergeDeep({ ...defaultSettings }, settings);
        } else {
          settings = { ...defaultSettings };
        }
      } else {
        settings = { ...defaultSettings };
      }
    } catch (e) {
      console.warn('Failed loading website settings, using defaults:', e);
      settings = { ...defaultSettings };
    }
  }

  function mergeDeep(target, source) {
    if (!source) return target;
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        mergeDeep(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  function populateForm() {
    // 1. Content
    setInputVal('logoText', settings.images.logoText);
    setInputVal('heroTitle', settings.content.heroTitle);
    setInputVal('heroSubtitle', settings.content.heroSubtitle);
    setInputVal('heroImage', settings.images.heroImage);

    setInputVal('aboutText', settings.content.aboutText);
    setInputVal('aboutTextSecondary', settings.content.aboutTextSecondary);
    setInputVal('aboutImage', settings.images.aboutImage);

    setInputVal('promoBannerTag', settings.content.promoBannerTag);
    setInputVal('promoBannerTitle', settings.content.promoBannerTitle);
    setInputVal('promoBannerSubtitle', settings.content.promoBannerSubtitle);
    setInputVal('promoBannerImage', settings.images.bannerImage);

    setInputVal('contactEmail', settings.content.contactEmail);
    setInputVal('contactPhone', settings.content.contactPhone);
    setInputVal('contactAddress', settings.content.contactAddress);
    setInputVal('contactHours', settings.content.contactHours);

    setInputVal('footerText', settings.content.footerText);

    // 2. Themes
    setInputVal('theme_primaryColor', settings.theme.primaryColor);
    setInputVal('theme_secondaryColor', settings.theme.secondaryColor);
    setInputVal('theme_accentColor', settings.theme.accentColor);
    setInputVal('theme_textColor', settings.theme.textColor);
    setInputVal('theme_backgroundColor', settings.theme.backgroundColor);
    setInputVal('theme_buttonColor', settings.theme.buttonColor);

    // 3. Typography
    setInputVal('typo_fontFamily', settings.typography.fontFamily);
    setInputVal('typo_headingFontSize', settings.typography.headingFontSize);
    setInputVal('typo_paragraphFontSize', settings.typography.paragraphFontSize);
    setInputVal('typo_buttonFontSize', settings.typography.buttonFontSize);

    // 4. Layout
    setInputVal('layout_heroHeight', settings.layout.heroHeight);
    setInputVal('layout_gridColumns', settings.layout.gridColumns);
    setInputVal('layout_cardBorderRadius', settings.layout.cardBorderRadius);
    setInputVal('layout_cardSpacing', settings.layout.cardSpacing);
    setInputVal('layout_sectionPadding', settings.layout.sectionPadding);
    setInputVal('layout_containerWidth', settings.layout.containerWidth);

    // 5. Visibility
    setCheckboxVal('vis_hero', settings.visibility.hero);
    setCheckboxVal('vis_about', settings.visibility.about);
    setCheckboxVal('vis_featured', settings.visibility.featured);
    setCheckboxVal('vis_reviews', settings.visibility.reviews);
    setCheckboxVal('vis_contact', settings.visibility.contact);
  }

  function setInputVal(id, val) {
    const el = document.getElementById(id);
    if (el && typeof val !== 'undefined') el.value = val;
  }

  function setCheckboxVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.checked = val !== false;
  }

  function getInputValue(id) {
    return document.getElementById(id)?.value || '';
  }

  function getCheckboxValue(id) {
    return document.getElementById(id)?.checked || false;
  }

  function readSettingsFromForm() {
    return {
      content: {
        heroTitle: getInputValue('heroTitle'),
        heroSubtitle: getInputValue('heroSubtitle'),
        aboutText: getInputValue('aboutText'),
        aboutTextSecondary: getInputValue('aboutTextSecondary'),
        promoBannerTag: getInputValue('promoBannerTag'),
        promoBannerTitle: getInputValue('promoBannerTitle'),
        promoBannerSubtitle: getInputValue('promoBannerSubtitle'),
        contactEmail: getInputValue('contactEmail'),
        contactPhone: getInputValue('contactPhone'),
        contactAddress: getInputValue('contactAddress'),
        contactHours: getInputValue('contactHours'),
        footerText: getInputValue('footerText')
      },
      images: {
        logoText: getInputValue('logoText'),
        heroImage: getInputValue('heroImage'),
        aboutImage: getInputValue('aboutImage'),
        bannerImage: getInputValue('promoBannerImage')
      },
      theme: {
        primaryColor: getInputValue('theme_primaryColor'),
        secondaryColor: getInputValue('theme_secondaryColor'),
        accentColor: getInputValue('theme_accentColor'),
        textColor: getInputValue('theme_textColor'),
        backgroundColor: getInputValue('theme_backgroundColor'),
        buttonColor: getInputValue('theme_buttonColor')
      },
      typography: {
        fontFamily: getInputValue('typo_fontFamily'),
        headingFontSize: getInputValue('typo_headingFontSize'),
        paragraphFontSize: getInputValue('typo_paragraphFontSize'),
        buttonFontSize: getInputValue('typo_buttonFontSize')
      },
      layout: {
        heroHeight: getInputValue('layout_heroHeight'),
        gridColumns: getInputValue('layout_gridColumns'),
        cardBorderRadius: getInputValue('layout_cardBorderRadius'),
        cardSpacing: getInputValue('layout_cardSpacing'),
        sectionPadding: getInputValue('layout_sectionPadding'),
        containerWidth: getInputValue('layout_containerWidth')
      },
      visibility: {
        hero: getCheckboxValue('vis_hero'),
        about: getCheckboxValue('vis_about'),
        featured: getCheckboxValue('vis_featured'),
        reviews: getCheckboxValue('vis_reviews'),
        contact: getCheckboxValue('vis_contact')
      },
      sectionOrder: settings.sectionOrder || ["hero", "featured", "about", "reviews", "contact"]
    };
  }

  function sendPreviewSettings() {
    const current = readSettingsFromForm();
    settings = current; // update in-memory state
    
    // Save to sessionStorage so that reloads preserve preview state
    try {
      sessionStorage.setItem('lueur_preview_settings', JSON.stringify(current));
    } catch (e) {}

    // Post to iframe
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'LUEUR_PREVIEW_SETTINGS',
        settings: current
      }, '*');
    }
  }

  function initFormListeners() {
    const selector = 'input[type="text"], input[type="color"], textarea, select, input[type="checkbox"]';
    document.querySelectorAll(selector).forEach(input => {
      input.addEventListener('input', sendPreviewSettings);
      input.addEventListener('change', sendPreviewSettings);
    });

    // Cloudinary Image uploaders
    fileUploaders.forEach(uploader => {
      uploader.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const targetInputId = uploader.getAttribute('data-target');
        const targetInput = document.getElementById(targetInputId);
        
        const label = uploader.previousElementSibling;
        const originalText = label ? label.textContent : 'Upload';
        
        if (label) {
          label.disabled = true;
          label.textContent = 'Uploading...';
        }

        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', 'lueur_products');

          const response = await fetch(
            'https://api.cloudinary.com/v1_1/dgsuollyy/image/upload',
            {
              method: 'POST',
              body: formData
            }
          );

          const result = await response.json();
          if (result.secure_url) {
            if (targetInput) {
              targetInput.value = result.secure_url;
              // Trigger input events to notify listeners
              targetInput.dispatchEvent(new Event('input', { bubbles: true }));
              targetInput.dispatchEvent(new Event('change', { bubbles: true }));
              showToast('Image uploaded successfully!', 'success');
            }
          } else {
            throw new Error(result.error?.message || 'Upload failed');
          }
        } catch (err) {
          console.error('Image upload failed:', err);
          showToast('Image upload failed. Please try again.', 'error');
        } finally {
          if (label) {
            label.disabled = false;
            label.textContent = originalText;
          }
          // Clear file value so they can select same file again
          uploader.value = '';
        }
      });
    });

    // Handle "Save and Publish" persistence
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Publishing...';

        const finalSettings = readSettingsFromForm();

        try {
          if (typeof window.firestoreSetDoc !== 'function') {
            throw new Error('Firestore helper firestoreSetDoc not found.');
          }

          // Save to Firestore settings/website_settings
          await window.firestoreSetDoc('settings', 'website_settings', finalSettings);
          
          // Re-update local cache
          localStorage.setItem('lueur_website_settings', JSON.stringify(finalSettings));
          settings = finalSettings;

          showToast('✅ Website settings published successfully!', 'success');

          // Notify iframe to reload and sync freshly saved state
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'LUEUR_PREVIEW_RELOAD' }, '*');
          }

        } catch (err) {
          console.error('Failed publishing website settings:', err);
          showToast('❌ Failed to publish settings. Please check console.', 'error');
        } finally {
          saveBtn.disabled = false;
          saveBtn.textContent = originalText;
        }
      });
    }
  }

  function renderSectionOrder() {
    const container = document.getElementById('order-list-container');
    if (!container) return;

    const list = settings.sectionOrder || ["hero", "featured", "about", "reviews", "contact"];

    container.innerHTML = list.map((key, i) => `
      <div class="order-item" data-key="${key}">
        <span>${sectionNameMap[key] || key}</span>
        <div class="order-item-actions">
          <button class="order-btn" type="button" onclick="moveSection(${i}, -1)" ${i === 0 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}>▲</button>
          <button class="order-btn" type="button" onclick="moveSection(${i}, 1)" ${i === list.length - 1 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}>▼</button>
        </div>
      </div>
    `).join('');
  }

  // Expose global moveSection function for arrow button clicks
  window.moveSection = function (index, direction) {
    const list = settings.sectionOrder || ["hero", "featured", "about", "reviews", "contact"];
    const targetIndex = index + direction;
    
    if (targetIndex < 0 || targetIndex >= list.length) return;

    // Swap elements
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    settings.sectionOrder = list;
    renderSectionOrder();
    sendPreviewSettings();
  };

  // Toast System
  function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.style.background = type === 'error' ? '#f44336' : 'var(--text-primary)';
    toast.style.color = '#ffffff';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = 'var(--radius-md)';
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.boxShadow = 'var(--shadow-lg)';
    toast.style.zIndex = '9999';
    toast.style.fontSize = '0.85rem';
    toast.style.fontFamily = 'var(--font-body)';
    toast.style.display = 'block';

    setTimeout(() => {
      toast.style.display = 'none';
    }, 3000);
  }
});
