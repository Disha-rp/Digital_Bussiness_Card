/**
 * Profile Image Picker Service
 * Wraps expo-image-picker for photo library and camera access with safe permission checks.
 */

import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

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
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Photo Access Required',
          'Please allow access to your photos in device settings to select a profile image.',
          [{ text: 'OK' }]
        );
        return { success: false, error: 'Permission denied' };
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return { success: false, cancelled: true };
      }

      return {
        success: true,
        uri: result.assets[0].uri,
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
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera Access Required',
          'Please allow camera access in device settings to take a profile photo.',
          [{ text: 'OK' }]
        );
        return { success: false, error: 'Permission denied' };
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return { success: false, cancelled: true };
      }

      return {
        success: true,
        uri: result.assets[0].uri,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to capture photo with camera',
      };
    }
  },
};
