'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, Button, Input, LoadingSpinner } from '@/components/ui';
import { updateUserProfile } from '@/lib/firebase/firestore';

function getPasswordErrorMessage(error) {
  const code = error?.code || '';
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'Current password is incorrect.';
  }
  if (code === 'auth/weak-password') {
    return 'New password must be at least 6 characters.';
  }
  if (code === 'auth/requires-recent-login') {
    return 'Please sign out and sign in again, then retry changing your password.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Please wait a few minutes and try again.';
  }
  return error?.message || 'Something went wrong. Please try again.';
}

export default function SettingsPage() {
  const { user, userData, changePassword, sendPasswordResetToAccountEmail } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [resetEmailLoading, setResetEmailLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetEmailError, setResetEmailError] = useState('');

  useEffect(() => {
    if (userData) {
      setForm({
        name: userData.name || '',
        email: userData.email || user?.email || '',
        phone: userData.phone || '',
      });
    }
  }, [userData, user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    setProfileLoading(true);
    setProfileSaved(false);
    try {
      await updateUserProfile(user.uid, { name: form.name, phone: form.phone });
      setProfileSaved(true);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError('New password must be different from your current password.');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSuccess('Your password has been updated successfully.');
    } catch (err) {
      setPasswordError(getPasswordErrorMessage(err));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    setResetEmailError('');
    setResetEmailSent(false);
    setResetEmailLoading(true);
    try {
      await sendPasswordResetToAccountEmail();
      setResetEmailSent(true);
    } catch (err) {
      setResetEmailError(getPasswordErrorMessage(err));
    } finally {
      setResetEmailLoading(false);
    }
  };

  if (!userData && user) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Account Settings" description="Manage your profile, password, and account preferences." />

      <Card className="max-w-lg">
        <h2 className="text-lg font-semibold text-white mb-4">Profile</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input label="Email" type="email" value={form.email} disabled className="opacity-60" />
          <p className="text-xs text-neutral-500 -mt-2">Email cannot be changed here. Contact support if needed.</p>
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          {profileSaved && <p className="text-sm text-neutral-300">Profile saved successfully.</p>}
          <Button type="submit" disabled={profileLoading}>
            {profileLoading ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      </Card>

      <Card className="max-w-lg">
        <h2 className="text-lg font-semibold text-white mb-1">Change password</h2>
        <p className="text-sm text-neutral-400 mb-6">
          Update your password by entering your current password and a new one.
        </p>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordError && <p className="text-red-400 text-sm">{passwordError}</p>}
          {passwordSuccess && <p className="text-sm text-neutral-300">{passwordSuccess}</p>}
          <Input
            label="Current password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            autoComplete="current-password"
            required
          />
          <Input
            label="New password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            autoComplete="new-password"
            required
          />
          <Input
            label="Confirm new password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            autoComplete="new-password"
            required
          />
          <Button type="submit" disabled={passwordLoading}>
            {passwordLoading ? 'Updating password...' : 'Update password'}
          </Button>
        </form>
      </Card>

      <Card className="max-w-lg">
        <h2 className="text-lg font-semibold text-white mb-1">Reset password via email</h2>
        <p className="text-sm text-neutral-400 mb-4">
          Prefer a reset link? We will send a password reset email to{' '}
          <span className="text-white">{form.email || user?.email}</span>.
        </p>
        {resetEmailError && <p className="text-red-400 text-sm mb-4">{resetEmailError}</p>}
        {resetEmailSent ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <p className="text-sm text-neutral-300">
              Password reset email sent. Check your inbox and follow the link to set a new password.
            </p>
          </div>
        ) : (
          <Button
            type="button"
            variant="secondary"
            onClick={handleSendResetEmail}
            disabled={resetEmailLoading}
          >
            {resetEmailLoading ? 'Sending...' : 'Send password reset email'}
          </Button>
        )}
      </Card>
    </div>
  );
}
