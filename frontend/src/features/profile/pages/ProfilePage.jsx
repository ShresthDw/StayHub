import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentUser, setTheme } from '../../../store/appSlice.js';
import {
    useUpdateProfileMutation,
    useBecomeOwnerMutation
} from '../../../api/apiSlice.js';
import { ProfileSkeleton } from '../../../components/Skeletons.jsx';
import BackButton from '../../../components/BackButton.jsx';

const ProfilePage = ({ onLogout, theme: propTheme, toggleTheme: propToggleTheme }) => {
    const dispatch = useDispatch();
    const { currentUser, theme: reduxTheme } = useSelector((state) => state.app);
    const theme = propTheme || reduxTheme;

    // Form state for inline editing
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null); // { text, type: 'success' | 'error' }

    // Mutations
    const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
    const [becomeOwner, { isLoading: isUpgradingHost }] = useBecomeOwnerMutation();

    useEffect(() => {
        if (currentUser) {
            setFormData({
                name: currentUser.name || '',
                phone: currentUser.phone || '',
                newPassword: '',
                confirmPassword: ''
            });
        }
    }, [currentUser]);

    if (!currentUser) {
        return <ProfileSkeleton />;
    }

    const isDirty =
        formData.name !== (currentUser.name || '') ||
        formData.phone !== (currentUser.phone || '') ||
        formData.newPassword.length > 0 ||
        formData.confirmPassword.length > 0;

    const showNotification = (text, type = 'success') => {
        setStatusMessage({ text, type });
        setTimeout(() => {
            setStatusMessage(null);
        }, 4000);
    };

    const handleThemeToggle = () => {
        if (propToggleTheme) {
            propToggleTheme();
        } else {
            const nextTheme = theme === 'dark' ? 'light' : 'dark';
            dispatch(setTheme(nextTheme));
        }
    };

    const handleBecomeHost = async () => {
        try {
            const updatedUser = await becomeOwner().unwrap();
            dispatch(setCurrentUser(updatedUser));
            showNotification('Congratulations! You are now registered as a Host.', 'success');
        } catch (err) {
            showNotification(err?.data?.msg || err?.message || 'Failed to upgrade to host role.', 'error');
        }
    };

    const handleResetForm = () => {
        setFormData({
            name: currentUser.name || '',
            phone: currentUser.phone || '',
            newPassword: '',
            confirmPassword: ''
        });
        setStatusMessage(null);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            showNotification('Name cannot be empty.', 'error');
            return;
        }

        if (formData.newPassword) {
            if (formData.newPassword.length < 6) {
                showNotification('New password must be at least 6 characters.', 'error');
                return;
            }
            if (formData.newPassword !== formData.confirmPassword) {
                showNotification('Password confirmation does not match.', 'error');
                return;
            }
        }

        try {
            const payload = {
                name: formData.name.trim(),
                phone: formData.phone.trim()
            };

            if (formData.newPassword) {
                payload.newPassword = formData.newPassword;
            }

            const updatedUser = await updateProfile(payload).unwrap();
            dispatch(setCurrentUser(updatedUser));
            setFormData((prev) => ({ ...prev, newPassword: '', confirmPassword: '' }));
            showNotification('Profile updated successfully!', 'success');
        } catch (err) {
            showNotification(err?.data?.msg || err?.message || 'Failed to update profile.', 'error');
        }
    };

    const userInitial = (currentUser?.name || 'U').charAt(0).toUpperCase();

    return (
        <main className="min-h-screen bg-slate-50/60 dark:bg-gray-900 pt-4 pb-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-4xl mx-auto space-y-5">

                {/* Status Toast Alert */}
                {statusMessage && (
                    <div
                        className={`flex items-center justify-between p-4 rounded-2xl shadow-lg border transition-all animate-fade-in ${
                            statusMessage.type === 'success'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800'
                                : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/80 dark:text-red-200 dark:border-red-800'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            {statusMessage.type === 'success' ? (
                                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            )}
                            <p className="text-sm font-medium">{statusMessage.text}</p>
                        </div>
                        <button
                            onClick={() => setStatusMessage(null)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* PAGE HEADER */}
                <div>
                    <BackButton to="/" label="Back to Home" className="mb-2" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                Account & Profile
                            </h1>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Manage your personal details, password security, and account preferences.
                            </p>
                        </div>
                    </div>
                </div>

                {/* MAIN UNIFIED PROFILE & EDIT CONTENT */}
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Left/Center Form Column (2 Cols) */}
                    <div className="md:col-span-2 space-y-6">
                        <form onSubmit={handleSaveProfile} className="rounded-3xl bg-white dark:bg-gray-800 p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-700/60 space-y-6">
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Personal Information</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Update your account details and password anytime.</p>
                                </div>
                                {isDirty && (
                                    <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/40 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
                                        Unsaved Changes
                                    </span>
                                )}
                            </div>

                            <div className="space-y-4">
                                {/* Full Name */}
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative rounded-2xl shadow-sm">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Alex Johnson"
                                            className="block w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-3 pl-11 pr-4 text-sm text-gray-900 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-100 dark:focus:border-teal-400 dark:focus:bg-gray-900 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Phone Number */}
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                                        Phone Number
                                    </label>
                                    <div className="relative rounded-2xl shadow-sm">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="e.g. +1 555-0199"
                                            className="block w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-3 pl-11 pr-4 text-sm text-gray-900 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-100 dark:focus:border-teal-400 dark:focus:bg-gray-900 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Email Address (Read-only) */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                                            Email Address
                                        </label>
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                            </svg>
                                            Verified
                                        </span>
                                    </div>
                                    <div className="relative rounded-2xl shadow-sm">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="email"
                                            name="email"
                                            readOnly
                                            disabled
                                            value={currentUser.email}
                                            className="block w-full rounded-2xl border border-gray-200 bg-gray-100/80 py-3 pl-11 pr-10 text-sm text-gray-500 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-400"
                                        />
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Email is tied to your account identity and cannot be edited directly.</p>
                                </div>
                            </div>

                            {/* Password Update Section */}
                            <div className="border-t border-gray-100 dark:border-gray-700/80 pt-5">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordSection(!showPasswordSection)}
                                    className="flex items-center justify-between w-full text-left py-2 group"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 group-hover:bg-teal-100 transition-colors">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Change Password</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Leave blank to keep your current password.</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                                        {showPasswordSection ? 'Hide' : 'Update'}
                                        <svg className={`w-4 h-4 transition-transform ${showPasswordSection ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </span>
                                </button>

                                {showPasswordSection && (
                                    <div className="mt-4 space-y-4 pt-2 animate-fade-in">
                                        {/* New Password */}
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                                                New Password
                                            </label>
                                            <div className="relative rounded-2xl shadow-sm">
                                                <input
                                                    type={showNewPassword ? 'text' : 'password'}
                                                    name="newPassword"
                                                    value={formData.newPassword}
                                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                                    placeholder="Enter new password (min. 6 chars)"
                                                    className="block w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-3 pl-4 pr-11 text-sm text-gray-900 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-100 dark:focus:border-teal-400 transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                                >
                                                    {showNewPassword ? (
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Confirm Password */}
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                                                Confirm New Password
                                            </label>
                                            <div className="relative rounded-2xl shadow-sm">
                                                <input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    name="confirmPassword"
                                                    value={formData.confirmPassword}
                                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                    placeholder="Re-enter new password"
                                                    className="block w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-3 pl-4 pr-11 text-sm text-gray-900 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-100 dark:focus:border-teal-400 transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                                >
                                                    {showConfirmPassword ? (
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Form Action Buttons */}
                            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/80">
                                <button
                                    type="button"
                                    onClick={handleResetForm}
                                    disabled={!isDirty || isUpdating}
                                    className="rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                                >
                                    Discard Changes
                                </button>

                                <button
                                    type="submit"
                                    disabled={!isDirty || isUpdating}
                                    className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all ${
                                        !isDirty || isUpdating
                                            ? 'bg-teal-400 dark:bg-teal-700 cursor-not-allowed opacity-60'
                                            : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-teal-600/20 active:scale-95'
                                    }`}
                                >
                                    {isUpdating ? (
                                        <>
                                            <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            <span>Saving Changes…</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>Save Profile Changes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right Side Column (1 Col) */}
                    <div className="space-y-6">
                        {/* Profile Identity & Account Overview Card */}
                        <div className="rounded-3xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-100 dark:border-gray-700/60 space-y-5">
                            {/* User Avatar & Identity */}
                            <div className="flex items-center gap-4">
                                <div className="relative shrink-0">
                                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-700 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
                                        {userInitial}
                                    </div>
                                    <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-800 ring-2 ring-emerald-500/30" title="Active Account" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate capitalize">
                                        {currentUser.name}
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                        {currentUser.email}
                                    </p>
                                    <div className="mt-1.5">
                                        {currentUser.role === 'owner' ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-2.5 py-0.5 text-[11px] font-semibold">
                                                <svg className="w-3 h-3 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                                <span>Property Host</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 px-2.5 py-0.5 text-[11px] font-semibold">
                                                <svg className="w-3 h-3 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                <span>Verified Guest</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Account Details Breakdown */}
                            <div className="border-t border-gray-100 dark:border-gray-700/80 pt-3 space-y-2.5 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Account Type</span>
                                    <span className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                                        {currentUser.role === 'owner' ? 'Property Host' : 'Guest'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Account Status</span>
                                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        Active
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Email Status</span>
                                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Verified
                                    </span>
                                </div>
                            </div>

                            {/* Actions: Theme Toggle & Logout */}
                            <div className="border-t border-gray-100 dark:border-gray-700/80 pt-3 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleThemeToggle}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 py-2.5 px-3 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-all"
                                    title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
                                >
                                    {theme === 'dark' ? (
                                        <>
                                            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                                            </svg>
                                            <span>Light Mode</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-300" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                            </svg>
                                            <span>Dark Mode</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={onLogout}
                                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 py-2.5 px-3.5 text-xs font-semibold text-red-600 dark:text-red-400 transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>

                        {/* Host Status Upgrade Card (If Guest) */}
                        {currentUser.role !== 'owner' && (
                            <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 p-6 border border-amber-200 dark:border-amber-800/60 space-y-3">
                                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span>Earn as a StayHub Host</span>
                                </div>
                                <p className="text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                                    List your properties, accept guest bookings, and unlock host analytics directly from your account.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleBecomeHost}
                                    disabled={isUpgradingHost}
                                    className="w-full mt-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-xs py-2.5 shadow-sm transition-all flex items-center justify-center gap-2"
                                >
                                    {isUpgradingHost ? 'Enabling Host Mode…' : 'Switch to Host Account'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </main>
    );
};

export default ProfilePage;
