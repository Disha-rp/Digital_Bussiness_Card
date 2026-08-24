/**
 * Profile Image Picker Service
 * Wraps expo-image-picker for photo library and camera access with safe permission checks.
 * Produces cross-platform data URIs when base64 is available.
 * On Web, downsamples raw image files to max 400x400 JPEG (quality 0.7) via HTML5 canvas
 * to keep payload sizes bounded (~20KB-40KB) and prevent network socket resets.
 */

import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export interface ImagePickerResult {
  success: boolean;
  uri?: string;
  cancelled?: boolean;
  error?: string;
}

/**
 * Downscales an image on Web using an offscreen HTML5 canvas.
 * Preserves aspect ratio, caps dimensions at maxDim x maxDim, and converts to JPEG at target quality.
 */
async function downscaleImageWeb(
  sourceUri: string,
  maxDim = 400,
  quality = 0.7
): Promise<string> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return sourceUri;
  }

  return new Promise((resolve) => {
    try {
      const img = new (window as any).Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          let width = img.width || maxDim;
          let height = img.height || maxDim;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(sourceUri);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch {
          resolve(sourceUri);
        }
      };

      img.onerror = () => {
        resolve(sourceUri);
      };

      img.src = sourceUri;
    } catch {
      resolve(sourceUri);
    }
  });
}

export const ImageService = {
  /**
   * Downscale utility exposed for image transformations
   */
  downscaleImageWeb,

  /**
   * Pick an image from device photo library
   */
  async pickFromLibrary(): Promise<ImagePickerResult> {
    try {
      // On Web, requesting permissions is unnecessary and awaiting it can lose browser user activation
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Photo Access Required',
            'Please allow access to your photos in device settings to select a profile image.',
            [{ text: 'OK' }]
          );
          return { success: false, error: 'Permission denied' };
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return { success: false, cancelled: true };
      }

      const asset = result.assets[0];
      const rawUri = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;

      let resolvedUri = rawUri;
      if (Platform.OS === 'web' && rawUri) {
        resolvedUri = await downscaleImageWeb(rawUri, 400, 0.7);
      }

      return {
        success: true,
        uri: resolvedUri,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to select image from library',
      };
    }
  },

  /**
   * Take a photo using device camera
   */
  async takePhoto(): Promise<ImagePickerResult> {
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Camera Access Required',
            'Please allow camera access in device settings to take a profile photo.',
            [{ text: 'OK' }]
          );
          return { success: false, error: 'Permission denied' };
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return { success: false, cancelled: true };
      }

      const asset = result.assets[0];
      const rawUri = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;

      let resolvedUri = rawUri;
      if (Platform.OS === 'web' && rawUri) {
        resolvedUri = await downscaleImageWeb(rawUri, 400, 0.7);
      }

      return {
        success: true,
        uri: resolvedUri,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to capture photo with camera',
      };
    }
  },
};
