'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  RiUserLine,
  RiMailLine,
  RiPhoneLine,
  RiEditLine,
  RiSaveLine,
  RiCloseLine,
  RiShieldCheckLine,
  RiShoppingBagLine,
  RiHeartLine,
  RiMapPinLine,
  RiCameraLine,
  RiEyeLine,
  RiEyeOffLine,
  RiDeleteBinLine,
  RiArrowLeftLine
} from 'react-icons/ri';
import axios from '../../../../utils/axios';
import { Loading } from '../../../components/ui/Loading';
import { useLoader } from '@/context/LoaderContext';

import { fetchThemes } from "../../../../utils/theme";

// Validation schemas
const profileSchema = yup.object({
  name: yup
    .string()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters")
    .matches(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email address")
    .max(100, "Email must not exceed 100 characters"),
  phone_number: yup
    .string()
    .optional()
    .required('Phone number is required')
    .transform((value) => value === '' ? undefined : value)
    .matches(/^[0-9+\-\s()]*$/, "Please enter a valid phone number")
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must not exceed 15 digits"),
  address: yup
    .string()
    .optional()
    .required("Address is required")
    .transform((value) => value === '' ? undefined : value)
    .max(200, "Address must not exceed 200 characters"),
}).required();

const passwordSchema = yup.object({
  current_password: yup
    .string()
    .required("Current password is required")
    .min(1, "Current password is required"),
  new_password: yup
    .string()
    .required("New password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
  new_password_confirmation: yup
    .string()
    .required("Password confirmation is required")
    .oneOf([yup.ref('new_password')], "Passwords must match"),
}).required();

type ProfileFormData = yup.InferType<typeof profileSchema>;
type PasswordFormData = yup.InferType<typeof passwordSchema>;

type Themes = {
  id: number;
  background_color: string;
  text_color: string;
  primary_color: string;
  gradient_start?: string | null;
  gradient_end?: string | null;
  gradient_direction: string;
};
interface ProfileData {
  name: string;
  email: string;
  phone_number?: string;
  address?: string;
}

interface PasswordData {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

const ProfilePage = () => {
  const { user, loading, refetchUser } = useAuth();
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const [themes, setThemes] = useState<Themes | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [apiErrors, setApiErrors] = useState<any>({});

  // Profile form setup
  const profileForm = useForm<any>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      phone_number: '',
      address: ''
    }
  });

  // Password form setup
  const passwordForm = useForm<PasswordFormData>({
    resolver: yupResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      new_password_confirmation: ''
    }
  });
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const data = await fetchThemes();
      if (Array.isArray(data) && data.length > 0) {
        // Pick the latest theme
        const latest = data[data.length - 1];
        setThemes(latest);
      } else {
        setErrorMessage("No themes available");
      }
    } catch {
      setErrorMessage("Failed to fetch theme. Please try again.");
    }
  };

  // Redirect if not authenticated (but wait for auth to load)
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    // Initialize profile form with user data (only if user exists)
    if (user) {
      profileForm.reset({
        name: user.name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        address: user.address || ''
      });

      // Initialize profile picture URL if exists
      if (user.profile_picture) {
        const baseUrl = process.env.NEXT_PUBLIC_UPLOAD_BASE || 'https://api.zelton.co.in';
        setProfilePictureUrl(`${baseUrl}/storage/${user.profile_picture}`);
      }
    }
  }, [user, loading, router, profileForm]);

  // Clear API errors when user starts typing
  const clearApiError = (fieldName: string) => {
    if (apiErrors[fieldName]) {
      setApiErrors((prev: any) => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setApiErrors({ profile_picture: 'File size must be less than 2MB.' });
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/gif'].includes(file.type)) {
      setApiErrors({ profile_picture: 'File must be an image (JPEG, PNG, JPG, GIF).' });
      return;
    }

    setUploadingPicture(true);
    setApiErrors({});

    try {
      const formData = new FormData();
      formData.append('profile_picture', file);

      const response = await axios.post('/api/profile/upload-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setProfilePictureUrl(response.data.data.profile_picture_url);
        setSuccessMessage('Profile picture updated successfully!');
        await refetchUser();
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error: any) {
      console.error('Profile picture upload error:', error);
      if (error.response?.data?.errors) {
        setApiErrors(error.response.data.errors);
      } else {
        setApiErrors({ profile_picture: 'Failed to upload profile picture. Please try again.' });
      }
    } finally {
      setUploadingPicture(false);
      hideLoader();
      // Reset file input
      e.target.value = '';
    }
  };

  const handleProfilePictureDelete = async () => {
    setUploadingPicture(true);
    setApiErrors({}); try {
      const response = await axios.delete('/api/profile/delete-picture');

      if (response.data.success) {
        setProfilePictureUrl(null);
        setSuccessMessage('Profile picture deleted successfully!');
        await refetchUser();
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error: any) {
      console.error('Profile picture delete error:', error);
      setApiErrors({ profile_picture: 'Failed to delete profile picture. Please try again.' });
    } finally {
      setUploadingPicture(false);
      hideLoader();
    }
  };

  const handleProfileUpdate = async (data: ProfileFormData) => {
    setSubmitting(true);
    setApiErrors({});
    setSuccessMessage('');

    try {
      const response = await axios.put('/api/profile', data);

      if (response.data.success || response.data.res === 'success') {
        setSuccessMessage('Profile updated successfully!');
        setIsEditing(false);
        await refetchUser(); // Refresh user data

        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      if (error.response?.data?.errors) {
        setApiErrors(error.response.data.errors);
      } else {
        setApiErrors({ general: 'Failed to update profile. Please try again.' });
      }
    } finally {
      setSubmitting(false);
      hideLoader();
    }
  };

  const handlePasswordUpdate = async (data: PasswordFormData) => {
    setSubmitting(true);
    setApiErrors({});
    setSuccessMessage('');

    try {
      const response = await axios.put('/api/change-password', data);

      if (response.data.success || response.data.res === 'success') {
        setSuccessMessage('Password updated successfully!');
        setIsChangingPassword(false);
        passwordForm.reset({
          current_password: '',
          new_password: '',
          new_password_confirmation: ''
        });

        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error: any) {
      console.error('Password update error:', error);
      if (error.response?.data?.errors) {
        setApiErrors(error.response.data.errors);
      } else {
        setApiErrors({ general: 'Failed to update password. Please try again.' });
      }
    } finally {
      setSubmitting(false);
      hideLoader();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-md hover:shadow-lg transition-all text-gray-700 hover:text-gray-900"
          >
            <RiArrowLeftLine className="text-lg" />
            <span className="font-medium">Back</span>
          </button>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div style={{
            background: themes
              ? `linear-gradient(${themes.gradient_direction}, ${themes.gradient_start || themes.primary_color}, ${themes.gradient_end || themes.primary_color})`
              : "linear-gradient(to right, #f97316, #facc15)",
            color: themes?.text_color || "#fff",
          }} className=" px-8 py-12  relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden backdrop-blur-sm border-4 border-white/20">
                  {profilePictureUrl || user?.profile_picture ? (
                    <img
                      src={profilePictureUrl || `${process.env.NEXT_PUBLIC_UPLOAD_BASE || 'https://api.zelton.co.in'}/storage/${user?.profile_picture}`}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/20 flex items-center justify-center text-4xl font-bold">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>

                {/* Profile Picture Upload Overlay */}
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex gap-2">
                    <input
                      type="file"
                      id="profile-picture-upload"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                      disabled={uploadingPicture}
                    />
                    <label
                      htmlFor="profile-picture-upload"
                      className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors cursor-pointer"
                      title="Upload new picture"
                    >
                      {uploadingPicture ? (
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      ) : (
                        <RiCameraLine className="text-sm" />
                      )}
                    </label>

                    {(profilePictureUrl || user?.profile_picture) && (
                      <button
                        onClick={handleProfilePictureDelete}
                        disabled={uploadingPicture}
                        className="w-8 h-8 bg-red-500/70 rounded-full flex items-center justify-center text-white hover:bg-red-600/70 transition-colors"
                        title="Delete picture"
                      >
                        <RiDeleteBinLine className="text-sm" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h1>
                <p className="text-white/90 text-lg">Manage your account settings and preferences</p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm">
                    <RiShieldCheckLine />
                    <span>Verified Account</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm">
                    <RiUserLine />
                    <span>Member since {new Date(user.created_at || '').getFullYear()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-6">
            {successMessage}
          </div>
        )}

        {apiErrors.general && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
            {apiErrors.general}
          </div>
        )}

        {apiErrors.profile_picture && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
            {apiErrors.profile_picture}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  style={{
                    background: themes
                      ? `linear-gradient(${themes.gradient_direction}, ${themes.gradient_start || themes.primary_color}, ${themes.gradient_end || themes.primary_color})`
                      : "linear-gradient(to right, #f97316, #facc15)",
                    color: themes?.text_color || "#fff",
                  }}
                  className="flex items-center gap-2 px-4 py-2  rounded-xl hover:from-orange-600 hover:to-yellow-600 transition-all"
                >
                  {isEditing ? (
                    <>
                      <RiCloseLine />
                      Cancel
                    </>
                  ) : (
                    <>
                      <RiEditLine />
                      Edit Profile
                    </>
                  )}
                </button>
              </div>

              <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <RiUserLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        {...profileForm.register('name')}
                        disabled={!isEditing}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors ${!isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                          } ${profileForm.formState.errors.name ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder="Enter your full name"
                        onChange={(e) => {
                          profileForm.register('name').onChange(e);
                          clearApiError('name');
                        }}
                      />
                    </div>
                    {profileForm.formState.errors.name && (
                      <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.name.message as string}</p>
                    )}
                    {apiErrors.name && <p className="text-red-500 text-xs mt-1">{apiErrors.name}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        {...profileForm.register('email')}
                        disabled={!isEditing}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors ${!isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                          } ${profileForm.formState.errors.email ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder="Enter your email"
                        onChange={(e) => {
                          profileForm.register('email').onChange(e);
                          clearApiError('email');
                        }}
                      />
                    </div>
                    {profileForm.formState.errors.email && (
                      <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.email.message as string}</p>
                    )}
                    {apiErrors.email && <p className="text-red-500 text-xs mt-1">{apiErrors.email}</p>}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <RiPhoneLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        {...profileForm.register('phone_number')}
                        disabled={!isEditing}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors ${!isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                          } ${profileForm.formState.errors.phone_number ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder="Enter your phone number"
                        onChange={(e) => {
                          profileForm.register('phone_number').onChange(e);
                          clearApiError('phone_number');
                        }}
                      />
                    </div>
                    {profileForm.formState.errors.phone_number && (
                      <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.phone_number.message as string}</p>
                    )}
                    {apiErrors.phone_number && <p className="text-red-500 text-xs mt-1">{apiErrors.phone_number}</p>}
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Address
                    </label>
                    <div className="relative">
                      <RiMapPinLine className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        {...profileForm.register('address')}
                        disabled={!isEditing}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors ${!isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                          } ${profileForm.formState.errors.address ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder="Enter your address"
                        onChange={(e) => {
                          profileForm.register('address').onChange(e);
                          clearApiError('address');
                        }}
                      />
                    </div>
                    {profileForm.formState.errors.address && (
                      <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.address.message as string}</p>
                    )}
                    {apiErrors.address && <p className="text-red-500 text-xs mt-1">{apiErrors.address}</p>}
                  </div>
                </div>

                {/* Save Button */}
                {isEditing && (
                  <div className="mt-8 flex gap-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <RiSaveLine />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Password Change Section */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
                <button
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all"
                >
                  {isChangingPassword ? (
                    <>
                      <RiCloseLine />
                      Cancel
                    </>
                  ) : (
                    <>
                      <RiEditLine />
                      Change Password
                    </>
                  )}
                </button>
              </div>

              {isChangingPassword && (
                <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)}>
                  <div className="space-y-6">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Current Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          {...passwordForm.register('current_password')}
                          className={`w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${passwordForm.formState.errors.current_password ? 'border-red-500' : 'border-gray-200'
                            }`}
                          placeholder="Enter your current password"
                          onChange={(e) => {
                            passwordForm.register('current_password').onChange(e);
                            clearApiError('current_password');
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? <RiEyeOffLine /> : <RiEyeLine />}
                        </button>
                      </div>
                      {passwordForm.formState.errors.current_password && (
                        <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.current_password.message}</p>
                      )}
                      {apiErrors.current_password && <p className="text-red-500 text-xs mt-1">{apiErrors.current_password}</p>}
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        New Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          {...passwordForm.register('new_password')}
                          className={`w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${passwordForm.formState.errors.new_password ? 'border-red-500' : 'border-gray-200'
                            }`}
                          placeholder="Enter your new password"
                          onChange={(e) => {
                            passwordForm.register('new_password').onChange(e);
                            clearApiError('new_password');
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <RiEyeOffLine /> : <RiEyeLine />}
                        </button>
                      </div>
                      {passwordForm.formState.errors.new_password && (
                        <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.new_password.message}</p>
                      )}
                      {apiErrors.new_password && <p className="text-red-500 text-xs mt-1">{apiErrors.new_password}</p>}
                      <p className="text-xs text-gray-500 mt-1">Password must contain at least one uppercase, lowercase, and number.</p>
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Confirm New Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          {...passwordForm.register('new_password_confirmation')}
                          className={`w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${passwordForm.formState.errors.new_password_confirmation ? 'border-red-500' : 'border-gray-200'
                            }`}
                          placeholder="Confirm your new password"
                          onChange={(e) => {
                            passwordForm.register('new_password_confirmation').onChange(e);
                            clearApiError('new_password_confirmation');
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <RiEyeOffLine /> : <RiEyeLine />}
                        </button>
                      </div>
                      {passwordForm.formState.errors.new_password_confirmation && (
                        <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.new_password_confirmation.message}</p>
                      )}
                      {apiErrors.new_password_confirmation && <p className="text-red-500 text-xs mt-1">{apiErrors.new_password_confirmation}</p>}
                    </div>

                    {/* Save Password Button */}
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50"
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <RiSaveLine />
                            Update Password
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Stats */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Account Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <RiShoppingBagLine className="text-xl text-orange-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Orders</div>
                    <div className="text-sm text-gray-500">View order history</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-pink-50 to-red-50 rounded-xl">
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                    <RiHeartLine className="text-xl text-pink-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Wishlist</div>
                    <div className="text-sm text-gray-500">Saved items</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <RiShieldCheckLine className="text-xl text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Security</div>
                    <div className="text-sm text-gray-500">Account secure</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/orders')}
                  className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <RiShoppingBagLine className="text-gray-600" />
                  <span>View Orders</span>
                </button>

                <button
                  onClick={() => router.push('/wishlist')}
                  className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <RiHeartLine className="text-gray-600" />
                  <span>Wishlist</span>
                </button>

                <button
                  onClick={() => router.push('/addresses')}
                  className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <RiMapPinLine className="text-gray-600" />
                  <span>Manage Addresses</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;