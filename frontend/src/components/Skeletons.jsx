const SkeletonLine = ({ className = '' }) => (
    <div className={`animate-pulse rounded-full bg-gray-200 dark:bg-gray-700 ${className}`}></div>
);

export const AppSkeleton = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="sticky top-0 z-40 border-b border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <SkeletonLine className="h-8 w-32" />
                <div className="flex items-center gap-3">
                    <SkeletonLine className="h-9 w-24 rounded-md" />
                    <SkeletonLine className="h-9 w-9 rounded-full" />
                </div>
            </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <section className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 space-y-4">
                    <SkeletonLine className="h-6 w-40" />
                    <div className="space-y-3">
                        <SkeletonLine className="h-4 w-28" />
                        <SkeletonLine className="h-10 w-full rounded-md" />
                        <SkeletonLine className="h-4 w-24" />
                        <SkeletonLine className="h-10 w-full rounded-md" />
                        <SkeletonLine className="h-4 w-20" />
                        <SkeletonLine className="h-10 w-full rounded-md" />
                    </div>
                </section>

                <section className="lg:col-span-9 space-y-5">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 space-y-4">
                        <SkeletonLine className="h-5 w-56" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <SkeletonLine className="h-10 w-full rounded-md md:col-span-2" />
                            <SkeletonLine className="h-10 w-full rounded-md" />
                        </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                                <SkeletonLine className="h-56 w-full rounded-none" />
                                <div className="p-4 space-y-4">
                                    <SkeletonLine className="h-5 w-3/4" />
                                    <SkeletonLine className="h-4 w-1/2" />
                                    <SkeletonLine className="h-4 w-5/6" />
                                    <div className="flex items-center justify-between">
                                        <SkeletonLine className="h-4 w-20" />
                                        <SkeletonLine className="h-4 w-16" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    </div>
);

export const PageSkeleton = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 space-y-4">
                <SkeletonLine className="h-6 w-32" />
                <div className="space-y-3">
                    <SkeletonLine className="h-4 w-full" />
                    <SkeletonLine className="h-4 w-5/6" />
                    <SkeletonLine className="h-4 w-2/3" />
                </div>
            </div>
            <div className="lg:col-span-9 space-y-5">
                <SkeletonLine className="h-8 w-1/3" />
                <SkeletonLine className="h-4 w-2/5" />
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                            <SkeletonLine className="h-56 w-full rounded-none" />
                            <div className="p-4 space-y-4">
                                <SkeletonLine className="h-5 w-3/4" />
                                <SkeletonLine className="h-4 w-1/2" />
                                <SkeletonLine className="h-4 w-5/6" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

export const DashboardSkeleton = () => (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center justify-between">
            <SkeletonLine className="h-9 w-64" />
            <SkeletonLine className="h-10 w-40 rounded-md" />
        </div>

        {Array.from({ length: 2 }).map((_, sectionIndex) => (
            <section key={sectionIndex} className="space-y-4">
                <SkeletonLine className="h-6 w-48" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((__, cardIndex) => (
                        <div key={cardIndex} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                            <SkeletonLine className="h-56 w-full rounded-none" />
                            <div className="p-4 space-y-4">
                                <SkeletonLine className="h-5 w-3/4" />
                                <SkeletonLine className="h-4 w-1/2" />
                                <SkeletonLine className="h-4 w-5/6" />
                                <div className="flex items-center justify-end gap-3">
                                    <SkeletonLine className="h-4 w-16" />
                                    <SkeletonLine className="h-4 w-16" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        ))}
    </main>
);

export const FormSkeleton = () => (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 space-y-6">
            <SkeletonLine className="h-8 w-56 mx-auto" />
            <SkeletonLine className="h-4 w-64 mx-auto" />
            <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <SkeletonLine className="h-10 w-full rounded-md" />
                <SkeletonLine className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-4">
                <SkeletonLine className="h-4 w-24" />
                <SkeletonLine className="h-11 w-full rounded-md" />
                <SkeletonLine className="h-4 w-20" />
                <SkeletonLine className="h-11 w-full rounded-md" />
                <SkeletonLine className="h-11 w-full rounded-md" />
            </div>
        </div>
    </main>
);

export const ProfileSkeleton = () => (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-4">
                <div className="flex flex-col items-center gap-4">
                    <SkeletonLine className="h-14 w-14 rounded-full" />
                    <SkeletonLine className="h-7 w-40" />
                    <SkeletonLine className="h-4 w-52" />
                    <SkeletonLine className="h-6 w-36 rounded-full" />
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                    <SkeletonLine className="h-4 w-32" />
                    <SkeletonLine className="h-4 w-24" />
                    <SkeletonLine className="h-4 w-36" />
                    <SkeletonLine className="h-4 w-24" />
                </div>
            </section>

            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 lg:col-span-2 space-y-5">
                <SkeletonLine className="h-7 w-40" />
                <SkeletonLine className="h-4 w-72" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SkeletonLine className="h-11 w-full rounded-md" />
                    <SkeletonLine className="h-11 w-full rounded-md" />
                </div>
                <SkeletonLine className="h-11 w-full rounded-md" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SkeletonLine className="h-11 w-full rounded-md" />
                    <SkeletonLine className="h-11 w-full rounded-md" />
                </div>
                <SkeletonLine className="h-10 w-32 rounded-md" />
            </section>
        </div>
    </main>
);
