/**
 * Profile Image Picker Service
 * Wraps expo-image-picker for photo library and camera access with safe permission checks.
 * Produces cross-platform data URIs when base64 is available for universal Android & Web compatibility.
 */

import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export interface ImagePickerResult {
  success: boolean;
  uri?: string;
  cancelled?: boolean;
  error?: string;
}

export const ImageService = {
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
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return { success: false, cancelled: true };
      }

      const asset = result.assets[0];
      const resolvedUri = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;

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
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return { success: false, cancelled: true };
      }

      const asset = result.assets[0];
      const resolvedUri = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;

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
