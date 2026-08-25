/**
 * vCard Generation and Safe Sharing Utility
 * Generates standard vCard 3.0 specifications for digital contact exchange,
 * and provides platform-safe sharing, downloading, and URL opening.
 */

import { Share, Linking, Platform } from 'react-native';
import { BusinessCard } from '../models/card';

/**
 * Generates a clean vCard 3.0 string representation of a BusinessCard
 */
export function generateVCard(card: BusinessCard): string {
  const firstName = card.contact.firstName || '';
  const lastName = card.contact.lastName || '';
  const fullName =
    [firstName, lastName].filter(Boolean).join(' ').trim() || card.name || 'Digital Business Card';

  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};;;`,
    `FN:${fullName}`,
  ];

  if (card.contact.company?.trim()) {
    lines.push(`ORG:${card.contact.company.trim()}`);
  }

  if (card.contact.title?.trim()) {
    lines.push(`TITLE:${card.contact.title.trim()}`);
  }

  if (card.contact.phoneMobile?.trim()) {
    lines.push(`TEL;TYPE=CELL,VOICE:${card.contact.phoneMobile.trim()}`);
  }

  if (card.contact.phoneWork?.trim()) {
    lines.push(`TEL;TYPE=WORK,VOICE:${card.contact.phoneWork.trim()}`);
  }

  if (card.contact.email?.trim()) {
    lines.push(`EMAIL;TYPE=INTERNET,PREF:${card.contact.email.trim()}`);
  }

  if (card.contact.website?.trim()) {
    const site = /^https?:\/\//i.test(card.contact.website.trim())
      ? card.contact.website.trim()
      : `https://${card.contact.website.trim()}`;
    lines.push(`URL:${site}`);
  }

  if (card.contact.bio?.trim()) {
    lines.push(`NOTE:${card.contact.bio.trim()}`);
  }

  const publicUrl =
    card.cloud?.publicUrl ||
    (card.cloud?.displayId ? `https://qrtrac.link/${card.cloud.displayId}` : undefined);

  if (publicUrl) {
    lines.push(`URL;TYPE=QRTRAC:${publicUrl}`);
  }

  // Append social profile links
  if (card.socialLinks && card.socialLinks.length > 0) {
    card.socialLinks.forEach((link) => {
      if (link.url?.trim()) {
        lines.push(`X-SOCIALPROFILE;TYPE=${link.platform.toUpperCase()}:${link.url.trim()}`);
      }
    });
  }

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

/**
 * Downloads / exports a vCard file on Web or triggers native file export
 */
export async function downloadVCard(
  card: BusinessCard
): Promise<{ success: boolean; message?: string }> {
  try {
    const vcardString = generateVCard(card);
    const firstName = card.contact.firstName || '';
    const lastName = card.contact.lastName || '';
    const rawFileName =
      [firstName, lastName].filter(Boolean).join('_') || card.name || 'business_card';
    const safeFileName = `${rawFileName.replace(/[^\w.-]/g, '_')}.vcf`;

    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
      const blob = new Blob([vcardString], { type: 'text/vcard;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = safeFileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
      return { success: true, message: 'vCard file downloaded successfully.' };
    } else {
      // On mobile native, trigger native share with vCard text
      const shareResult = await Share.share({
        title: safeFileName,
        message: vcardString,
      });
      return {
        success: shareResult.action !== Share.dismissedAction,
        message: 'vCard contact shared successfully.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to download or export vCard.',
    };
  }
}

/**
 * Platform-safe sharing of the Digital Business Card link
 */
export async function shareBusinessCard(
  card: BusinessCard
): Promise<{ success: boolean; message?: string }> {
  try {
    const fullName =
      [card.contact.firstName, card.contact.lastName].filter(Boolean).join(' ') ||
      card.name ||
      'Digital Business Card';

    const publicUrl =
      card.cloud?.publicUrl ||
      (card.cloud?.displayId
        ? `https://qrtrac.link/${card.cloud.displayId}`
        : undefined);

    const shareUrl = publicUrl || (card.id ? `https://qrtrac.me/${card.id}` : 'https://qrtrac.link');
    const shareMessage = `Connect with ${fullName} via Digital Business Card: ${shareUrl}`;

    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({
          title: fullName,
          text: shareMessage,
          url: shareUrl,
        });
        return { success: true, message: 'Card link shared successfully.' };
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        return { success: true, message: 'Public card link copied to clipboard.' };
      }
    }

    const res = await Share.share({
      title: `${fullName} • Digital Business Card`,
      message: shareMessage,
      url: shareUrl,
    });

    return {
      success: res.action !== Share.dismissedAction,
      message: 'Card link shared successfully.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to share card link.',
    };
  }
}

/**
 * Platform-safe URL opening for contact actions (phone, email, website, social)
 */
export async function openContactUrl(
  type: 'call' | 'email' | 'website' | 'social',
  target?: string
): Promise<boolean> {
  if (!target || !target.trim()) return false;

  let urlToOpen = target.trim();

  switch (type) {
    case 'call': {
      const cleanPhone = urlToOpen.replace(/[^\d+]/g, '');
      urlToOpen = `tel:${cleanPhone}`;
      break;
    }
    case 'email': {
      urlToOpen = `mailto:${urlToOpen}`;
      break;
    }
    case 'website':
    case 'social': {
      if (!/^https?:\/\//i.test(urlToOpen)) {
        urlToOpen = `https://${urlToOpen}`;
      }
      break;
    }
  }

  try {
    const supported = await Linking.canOpenURL(urlToOpen).catch(() => true);
    if (supported) {
      await Linking.openURL(urlToOpen).catch(() => {});
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
