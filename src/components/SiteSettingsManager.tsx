import React, { useState } from 'react';
import { Save, Upload, X, Edit, Plus, Trash2, MessageCircle, ExternalLink } from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useImageUpload } from '../hooks/useImageUpload';
import { normalizeMessengerPageId, buildMessengerUrl } from '../utils/messenger';

const SiteSettingsManager: React.FC = () => {
  const { siteSettings, loading, updateSiteSettings } = useSiteSettings();
  const { uploadImage, uploading } = useImageUpload();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    site_name: '',
    site_description: '',
    currency: '',
    currency_code: '',
    hero_title: '',
    hero_subtitle: '',
    hero_description: '',
    store_hours: '',
    contact_number: '',
    address: '',
    facebook_url: '',
    facebook_handle: '',
    messenger_page_id: '',
    site_tagline: ''
  });
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [heroSlides, setHeroSlides] = useState<Array<{
    url: string;
  }>>([]);
  const [slideFiles, setSlideFiles] = useState<Map<number, File>>(new Map());

  React.useEffect(() => {
    if (siteSettings) {
      setFormData({
        site_name: siteSettings.site_name,
        site_description: siteSettings.site_description,
        currency: siteSettings.currency,
        currency_code: siteSettings.currency_code,
        hero_title: siteSettings.hero_title,
        hero_subtitle: siteSettings.hero_subtitle,
        hero_description: siteSettings.hero_description,
        store_hours: siteSettings.store_hours,
        contact_number: siteSettings.contact_number,
        address: siteSettings.address,
        facebook_url: siteSettings.facebook_url,
        facebook_handle: siteSettings.facebook_handle,
        messenger_page_id: siteSettings.messenger_page_id,
        site_tagline: siteSettings.site_tagline
      });
      setLogoPreview(siteSettings.site_logo);
      setLogoPreview(siteSettings.site_logo);
      if (siteSettings.hero_slides && siteSettings.hero_slides.length > 0) {
        setHeroSlides(siteSettings.hero_slides);
      } else {
        // Initialize with single hero settings if no slides exist
        setHeroSlides([{
          url: siteSettings.hero_image
        }]);
      }
    }
  }, [siteSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSlide = () => {
    setHeroSlides(prev => [
      ...prev,
      {
        url: 'https://images.unsplash.com/photo-1544787210-22dbdc1763f6?q=80&w=2070&auto=format&fit=crop'
      }
    ]);
  };

  const handleRemoveSlide = (index: number) => {
    setHeroSlides(prev => prev.filter((_, i) => i !== index));
    const newFiles = new Map(slideFiles);
    newFiles.delete(index);
    setSlideFiles(newFiles);
  };

  const handleSlideImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setHeroSlides(prev => prev.map((slide, i) =>
          i === index ? { ...slide, url: e.target?.result as string } : slide
        ));
      };
      reader.readAsDataURL(file);

      const newFiles = new Map(slideFiles);
      newFiles.set(index, file);
      setSlideFiles(newFiles);
    }
  };

  const handleSave = async () => {
    try {
      let logoUrl = logoPreview;
      // Upload slide images if any
      const updatedSlides = await Promise.all(heroSlides.map(async (slide, index) => {
        const file = slideFiles.get(index);
        if (file) {
          const uploadedUrl = await uploadImage(file, `hero-slide-${index}-${Date.now()}`);
          return { ...slide, url: uploadedUrl };
        }
        return slide;
      }));

      // Update all settings
      await updateSiteSettings({
        site_name: formData.site_name,
        site_description: formData.site_description,
        currency: formData.currency,
        currency_code: formData.currency_code,
        site_logo: logoUrl,
        hero_slides: updatedSlides as any,
        store_hours: formData.store_hours,
        contact_number: formData.contact_number,
        address: formData.address,
        facebook_url: formData.facebook_url,
        facebook_handle: formData.facebook_handle,
        messenger_page_id: normalizeMessengerPageId(formData.messenger_page_id),
        site_tagline: formData.site_tagline
      });

      setIsEditing(false);
      // Show success notification
      const successPopup = document.createElement('div');
      successPopup.className = 'fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-bounce-gentle';
      successPopup.innerHTML = `
        <div class="bg-teamax-surface text-teamax-primary px-8 py-4 rounded-2xl shadow-gold flex items-center gap-3 border border-teamax-gold/30 backdrop-blur-md">
          <div class="bg-teamax-gold rounded-full p-1">
            <svg class="h-4 w-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <span class="font-display font-bold uppercase tracking-widest text-xs text-teamax-gold">Settings Saved Successfully!</span>
        </div>
      `;
      document.body.appendChild(successPopup);
      setTimeout(() => successPopup.remove(), 3000);
    } catch (error) {
      console.error('Error saving site settings:', error);
      alert('Failed to save settings. The database may be rejecting changes from the admin dashboard (check Supabase RLS policies for site_settings).');
    }
  };

  const handleCancel = () => {
    if (siteSettings) {
      setFormData({
        site_name: siteSettings.site_name,
        site_description: siteSettings.site_description,
        currency: siteSettings.currency,
        currency_code: siteSettings.currency_code,
        hero_title: siteSettings.hero_title,
        hero_subtitle: siteSettings.hero_subtitle,
        hero_description: siteSettings.hero_description,
        store_hours: siteSettings.store_hours,
        contact_number: siteSettings.contact_number,
        address: siteSettings.address,
        facebook_url: siteSettings.facebook_url,
        facebook_handle: siteSettings.facebook_handle,
        messenger_page_id: siteSettings.messenger_page_id,
        site_tagline: siteSettings.site_tagline
      });
      setLogoPreview(siteSettings.site_logo);
      setLogoPreview(siteSettings.site_logo);
      if (siteSettings.hero_slides && siteSettings.hero_slides.length > 0) {
        setHeroSlides(siteSettings.hero_slides);
      }
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="mission-card rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-teamax-gold/20 rounded-xl w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-teamax-gold/20 rounded-xl w-3/4"></div>
            <div className="h-4 bg-teamax-gold/20 rounded-xl w-1/2"></div>
            <div className="h-4 bg-teamax-gold/20 rounded-xl w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mission-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold text-teamax-gold tracking-[0.08em]">Site Settings</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="mission-btn rounded-xl flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Settings</span>
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleCancel}
              className="mission-btn-outline rounded-xl flex items-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSave}
              disabled={uploading}
              className="mission-btn rounded-xl flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{uploading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Site Logo */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-teamax-gold mb-2">
            Site Logo
          </label>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-black border border-teamax-gold/30 flex items-center justify-center">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Site Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-2xl text-teamax-secondary">☕</div>
              )}
            </div>
            {isEditing && (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="mission-btn-outline rounded-xl flex items-center space-x-2 cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload Logo</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Site Name & Tagline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-teamax-gold mb-2">
              Site Name
            </label>
            {isEditing ? (
              <input
                type="text"
                name="site_name"
                value={formData.site_name}
                onChange={handleInputChange}
                className="mission-input"
                placeholder="Enter site name"
              />
            ) : (
              <p className="text-lg font-medium text-teamax-primary">{siteSettings?.site_name}</p>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-teamax-gold mb-2">
              Site Tagline
            </label>
            {isEditing ? (
              <input
                type="text"
                name="site_tagline"
                value={formData.site_tagline}
                onChange={handleInputChange}
                className="mission-input"
                placeholder="e.g., Milk Tea Hub"
              />
            ) : (
              <p className="text-lg font-medium text-teamax-primary">{siteSettings?.site_tagline}</p>
            )}
          </div>
        </div>

        {/* Site Description (About) */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-teamax-gold mb-2">
            About Section / Description
          </label>
          {isEditing ? (
            <textarea
              name="site_description"
              value={formData.site_description}
              onChange={handleInputChange}
              rows={3}
              className="mission-input"
              placeholder="Enter about section text"
            />
          ) : (
            <p className="text-teamax-primary">{siteSettings?.site_description}</p>
          )}
        </div>

        {/* Hero Slides Management */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display font-bold text-teamax-gold tracking-[0.08em]">Hero Slides</h3>
            {isEditing && (
              <button
                onClick={handleAddSlide}
                className="mission-btn-outline rounded-xl flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Slide
              </button>
            )}
          </div>

          <div className="space-y-6">
            {heroSlides.map((slide, index) => (
              <div key={index} className="bg-black border border-teamax-gold/20 rounded-xl p-4 relative">
                {isEditing && heroSlides.length > 1 && (
                  <button
                    onClick={() => handleRemoveSlide(index)}
                    className="absolute top-4 right-4 text-teamax-gold hover:text-teamax-gold/70 p-1 hover:bg-teamax-gold/10 rounded-xl transition-colors"
                    title="Remove slide"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Image Preview & Upload */}
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-teamax-gold mb-2">Slide Image</label>
                    <div className="w-full h-32 rounded-xl overflow-hidden bg-black border border-teamax-gold/30 relative group">
                      <img
                        src={slide.url}
                        alt={`Slide ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {isEditing && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <label
                            htmlFor={`slide-upload-${index}`}
                            className="cursor-pointer p-2 bg-teamax-surface border border-teamax-gold/30 rounded-xl shadow-gold hover:bg-teamax-gold/10"
                            title="Update slide image"
                          >
                            <Upload className="w-4 h-4 text-teamax-gold" />
                          </label>
                          <input
                            id={`slide-upload-${index}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleSlideImageChange(index, e)}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Slide Content - Removed fields as requested */}
                  <div className="col-span-1 md:col-span-2 flex items-center">
                    <p className="text-sm text-teamax-secondary italic">This slide will display as a background image in the hero section.</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Store Hours & Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-teamax-gold mb-2">
              Store Hours
            </label>
            {isEditing ? (
              <input
                type="text"
                name="store_hours"
                value={formData.store_hours}
                onChange={handleInputChange}
                className="mission-input"
                placeholder="e.g., 06:00 AM - 10:00 PM"
              />
            ) : (
              <p className="text-lg font-medium text-teamax-primary">{siteSettings?.store_hours}</p>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-teamax-gold mb-2">
              Contact Number
            </label>
            {isEditing ? (
              <input
                type="text"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleInputChange}
                className="mission-input"
                placeholder="e.g., 0945 210 6254"
              />
            ) : (
              <p className="text-lg font-medium text-teamax-primary">{siteSettings?.contact_number}</p>
            )}
          </div>
        </div>

        {/* Physical Address */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-teamax-gold mb-2">
            Physical Address
          </label>
          {isEditing ? (
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="mission-input"
              placeholder="Enter full address"
            />
          ) : (
            <p className="text-teamax-primary">{siteSettings?.address}</p>
          )}
        </div>

        {/* Facebook Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-teamax-gold mb-2">
              Facebook Page URL
            </label>
            {isEditing ? (
              <input
                type="text"
                name="facebook_url"
                value={formData.facebook_url}
                onChange={handleInputChange}
                className="mission-input"
                placeholder="https://facebook.com/yourpage"
              />
            ) : (
              <p className="text-teamax-primary text-sm">{siteSettings?.facebook_url}</p>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-teamax-gold mb-2">
              Facebook Handle
            </label>
            {isEditing ? (
              <input
                type="text"
                name="facebook_handle"
                value={formData.facebook_handle}
                onChange={handleInputChange}
                className="mission-input"
                placeholder="@yourhandle"
              />
            ) : (
              <p className="text-teamax-primary">{siteSettings?.facebook_handle}</p>
            )}
          </div>
        </div>

        {/* Facebook Messenger Orders */}
        <div className="rounded-xl border border-teamax-gold/30 bg-black/40 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-teamax-gold" />
            <div>
              <h3 className="text-lg font-display font-bold text-teamax-gold tracking-[0.08em]">Facebook Messenger Orders</h3>
              <p className="text-xs text-teamax-secondary">
                After checkout, customers send their order to this Facebook Page via Messenger.
              </p>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-teamax-gold mb-2">
              Facebook Page Username or Page ID
            </label>
            {isEditing ? (
              <>
                <input
                  type="text"
                  name="messenger_page_id"
                  value={formData.messenger_page_id}
                  onChange={handleInputChange}
                  className="mission-input"
                  placeholder="e.g., mission007cafe or 61550000000000"
                />
                <p className="text-[11px] text-teamax-secondary mt-2">
                  You can paste the page link (facebook.com/yourpage or m.me/yourpage). Leave blank to turn off Messenger ordering.
                </p>
              </>
            ) : (
              <p className="text-teamax-primary">
                {siteSettings?.messenger_page_id || <span className="text-teamax-secondary italic">Not set — Messenger ordering is off</span>}
              </p>
            )}
          </div>
          {(() => {
            const previewId = isEditing ? formData.messenger_page_id : siteSettings?.messenger_page_id || '';
            const url = buildMessengerUrl(previewId);
            return url ? (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-teamax-secondary">Orders go to:</span>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-teamax-gold font-bold hover:underline"
                >
                  {url.replace('https://', '')}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <span className="text-[11px] text-teamax-secondary">(click to test)</span>
              </div>
            ) : null;
          })()}
        </div>

        {/* Currency Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-teamax-gold mb-2">
              Currency Symbol
            </label>
            {isEditing ? (
              <input
                type="text"
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="mission-input"
                placeholder="e.g., ₱, $, €"
              />
            ) : (
              <p className="text-lg font-medium text-teamax-primary">{siteSettings?.currency}</p>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-teamax-gold mb-2">
              Currency Code
            </label>
            {isEditing ? (
              <input
                type="text"
                name="currency_code"
                value={formData.currency_code}
                onChange={handleInputChange}
                className="mission-input"
                placeholder="e.g., PHP, USD, EUR"
              />
            ) : (
              <p className="text-lg font-medium text-teamax-primary">{siteSettings?.currency_code}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteSettingsManager;
