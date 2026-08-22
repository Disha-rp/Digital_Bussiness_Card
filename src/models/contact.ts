/**
 * Contact & Address Domain Models
 */

export interface AddressInfo {
  street?: string;
  suite?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  formattedAddress?: string;
}

export interface CardContact {
  firstName?: string;
  lastName?: string;
  displayName: string;
  title?: string;
  company?: string;
  department?: string;
  email?: string;
  phoneMobile?: string;
  phoneWork?: string;
  phoneFax?: string;
  website?: string;
  address?: AddressInfo;
  bio?: string;
  notes?: string;
}
