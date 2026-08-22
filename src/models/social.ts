/**
 * Social Media & Online Profile Models
 */

export type SocialPlatform =
  | 'linkedin'
  | 'twitter'
  | 'github'
  | 'instagram'
  | 'youtube'
  | 'website'
  | 'whatsapp'
  | 'other';

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
  label?: string;
  username?: string;
}

export interface SocialPlatformConfig {
  platform: SocialPlatform;
  name: string;
  iconName: string;
  prefixUrl: string;
  placeholder: string;
  color: string;
}

export const SOCIAL_PLATFORMS: SocialPlatformConfig[] = [
  {
    platform: 'linkedin',
    name: 'LinkedIn',
    iconName: 'logo-linkedin',
    prefixUrl: 'https://linkedin.com/in/',
    placeholder: 'username or profile URL',
    color: '#0A66C2',
  },
  {
    platform: 'twitter',
    name: 'Twitter / X',
    iconName: 'logo-twitter',
    prefixUrl: 'https://twitter.com/',
    placeholder: 'handle (without @)',
    color: '#1DA1F2',
  },
  {
    platform: 'github',
    name: 'GitHub',
    iconName: 'logo-github',
    prefixUrl: 'https://github.com/',
    placeholder: 'username',
    color: '#333333',
  },
  {
    platform: 'instagram',
    name: 'Instagram',
    iconName: 'logo-instagram',
    prefixUrl: 'https://instagram.com/',
    placeholder: 'username',
    color: '#E4405F',
  },
  {
    platform: 'youtube',
    name: 'YouTube',
    iconName: 'logo-youtube',
    prefixUrl: 'https://youtube.com/@',
    placeholder: 'channel or handle',
    color: '#FF0000',
  },
  {
    platform: 'whatsapp',
    name: 'WhatsApp',
    iconName: 'logo-whatsapp',
    prefixUrl: 'https://wa.me/',
    placeholder: 'phone number with country code',
    color: '#25D366',
  },
  {
    platform: 'website',
    name: 'Portfolio / Website',
    iconName: 'globe-outline',
    prefixUrl: 'https://',
    placeholder: 'https://yourdomain.com',
    color: '#6366F1',
  },
];
