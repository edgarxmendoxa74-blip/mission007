import React, { memo } from 'react';
import { Clock, MapPin, Phone, Facebook } from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';
import EnvStatus from './EnvStatus';
import { BRAND, brandedLogo, brandedText } from '../brand';

const Footer: React.FC = () => {
  const { siteSettings } = useSiteSettings();
  const name = brandedText(siteSettings?.site_name, BRAND.name);
  const description = brandedText(siteSettings?.site_description, BRAND.description);
  const logo = brandedLogo(siteSettings?.site_logo);

  return (
    <footer className="bg-black border-t border-teamax-gold/30 text-teamax-primary py-16 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <img src={logo} alt={name} className="w-24 h-24 object-contain mb-4" />
            <h3 className="text-xl font-display font-bold text-teamax-gold tracking-[0.25em] mb-2">MISSION</h3>
            <p className="font-script italic text-teamax-gold tracking-[0.3em] mb-4">007</p>
            <p className="text-teamax-secondary leading-relaxed mb-6 max-w-xs text-sm">
              {description}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-teamax-gold uppercase tracking-widest mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Operating Hours
            </h4>
            <div className="space-y-3 text-teamax-primary text-sm">
              <div className="flex justify-between items-center py-2 border-b border-teamax-gold/20">
                <span className="font-medium">Store Hours</span>
                <span>{siteSettings?.store_hours || '06:00 AM - 10:00 PM'}</span>
              </div>
              <div className="flex items-center gap-2 mt-4 text-teamax-gold">
                <div className="w-1.5 h-1.5 bg-teamax-gold rounded-full"></div>
                <span className="font-bold text-xs uppercase tracking-wider">Open Daily</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-teamax-gold uppercase tracking-widest mb-6">Contact Us</h4>
            <div className="space-y-4 text-teamax-secondary text-sm">
              <div className="flex items-start gap-4">
                <MapPin className="h-4 w-4 text-teamax-gold flex-shrink-0 mt-0.5" />
                <span>{siteSettings?.address || 'Purok 3 Barangay Trenchera, Tayug Pangasinan'}</span>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="h-4 w-4 text-teamax-gold flex-shrink-0 mt-0.5" />
                <a href={`tel:${siteSettings?.contact_number?.replace(/\s/g, '') || '09452106254'}`} className="hover:text-teamax-gold transition-colors font-medium">
                  {siteSettings?.contact_number || '0945 210 6254'}
                </a>
              </div>
              <div className="flex items-start gap-4">
                <Facebook className="h-4 w-4 text-teamax-gold flex-shrink-0 mt-0.5" />
                <a
                  href={siteSettings?.facebook_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-teamax-gold transition-colors font-medium"
                >
                  {siteSettings?.facebook_handle && !/teamax/i.test(siteSettings.facebook_handle)
                    ? siteSettings.facebook_handle
                    : '@mission007'}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-teamax-gold/20 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-teamax-secondary/80 text-xs font-medium uppercase tracking-widest">
            © {new Date().getFullYear()} {name}
          </p>
          <div className="w-full md:w-auto">
            <EnvStatus />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default memo(Footer);
