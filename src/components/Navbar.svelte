<script lang="ts">
    import { authClient, signIn, signOut } from "$lib/auth-client";
    import { SpatialMenu } from "melt/builders";

    let { session, auth, user } = $props();
    let isLoading = $state(false);

    let isSigningIn = $state(false);
    let isSigningOut = $state(false);
    let error = $state<string | null>(null);
    // --- Auth ----------------------------------------------------------------

    async function loginWithGoogle() {
        if (isSigningIn || isSigningOut) return;
        try {
            isSigningIn = true;
            error = null;
            await signIn({
                callbackURL: window.location.origin + "/",
                errorCallbackURL: window.location.origin + "/login-error",
                newUserCallbackURL: window.location.origin + "/welcome",
            });
        } catch (err) {
            console.error(err);
            error = "Login failed. Please try again.";
        } finally {
            isSigningIn = false;
        }
    }

    async function logout() {
        if (isSigningIn || isSigningOut) return;
        try {
            isSigningOut = true;
            error = null;
            await signOut({ redirectTo: "/" });
        } catch (err) {
            console.error(err);
            error = "Logout failed. Please try again.";
            window.location.href = "/";
        } finally {
            isSigningOut = false;
        }
    }
    // --- Admin SpatialMenu in navbar ----------------------------------------

    type AdminItemId =
        | "users"
        | "sessions"
        | "settings"
        | "billing"
        | "reports"
        | "logs"
        | "roles";

    const ADMIN_ITEMS = [
        {
            id: "users",
            label: "User Admin",
            emoji: "👥",
            href: "/admin/users",
        },
        {
            id: "sessions",
            label: "Sessions",
            emoji: "🕒",
            href: "/admin/sessions",
        },
        {
            id: "settings",
            label: "Settings",
            emoji: "⚙️",
            href: "/admin/settings",
        },
        {
            id: "billing",
            label: "Billing",
            emoji: "💳",
            href: "/admin/billing",
        },
        {
            id: "reports",
            label: "Reports",
            emoji: "📊",
            href: "/admin/reports",
        },
        {
            id: "logs",
            label: "Logs",
            emoji: "📜",
            href: "/admin/logs",
        },
        {
            id: "roles",
            label: "Roles",
            emoji: "🔐",
            href: "/admin/roles",
        },
    ];

    let adminMenuOpen = $state(false);

    function handleAdminSelect(id: AdminItemId) {
        const item = ADMIN_ITEMS.find((i) => i.id === id);
        if (!item) return;
        window.location.href = item.href;
    }

    const adminMenu = new SpatialMenu<AdminItemId>({
        onSelect: (value) => {
            handleAdminSelect(value);
            adminMenuOpen = false;
        },
        wrap: true,
    });

    const isAdmin =
        user && (user.role === "admin" || user.role === "super_admin");
</script>

<nav class="bg-gray-200 dark:bg-gray-800 p-4">
    <div class="container mx-auto flex justify-between items-center">
        <div class="left-side">
            <a href="/" class="text-xl font-bold text-gray-900 dark:text-white">
                Adi Q
            </a>
        </div>

        <div class="right-side flex items-center gap-4">
            {#if error}
                <div
                    class="bg-red-100 border border-red-400 text-red-700 px-3 py-1 rounded text-sm"
                >
                    {error}
                </div>
            {/if}

            {#if session}
                <div class="flex items-center gap-3">
                    <div class="flex items-center gap-2">
                        {#if user?.image}
                            <img
                                src={user.image}
                                alt="Profile"
                                class="w-10 h-10 rounded-full object-cover"
                                referrerpolicy="no-referrer"
                            />
                        {:else}
                            <div
                                class="w-10 h-10 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center"
                            >
                                <svg
                                    class="w-6 h-6 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z"
                                    />
                                </svg>
                            </div>
                        {/if}
                        <span class="text-gray-900 dark:text-white">
                            {user?.name || user?.email || "User"}
                        </span>
                    </div>

                    {#if isAdmin}
                        <div class="relative">
                            <!-- Admin launcher button -->
                            <button
                                class="inline-flex items-center gap-2 px-3 py-2 rounded-lg
                                       bg-gray-900 dark:bg-gray-700
                                       text-gray-100 text-sm font-medium
                                       border border-gray-700 dark:border-gray-600
                                       hover:bg-gray-800 hover:dark:bg-gray-600
                                       transition-colors"
                                onclick={() => (adminMenuOpen = !adminMenuOpen)}
                            >
                                <span aria-hidden="true">🛠️</span>
                                <span>Admin</span>
                            </button>

                            {#if adminMenuOpen}
                                <div
                                    {...adminMenu.root}
                                    class="absolute right-0 mt-3
                                           rounded-2xl
                                           bg-gray-950/95 dark:bg-gray-950/95
                                           border border-gray-700 dark:border-gray-700
                                           shadow-2xl backdrop-blur-md
                                           text-xs z-50
                                           px-6 py-5
                                           min-w-[24rem]"
                                >
                                    <div
                                        class="grid grid-cols-4 gap-x-5 gap-y-4"
                                    >
                                        {#each ADMIN_ITEMS as item}
                                            <button
                                                {...adminMenu.getItem(item.id)}
                                                title={item.label}
                                                onclick={() => {
                                                    handleAdminSelect(item.id);
                                                    adminMenuOpen = false;
                                                }}
                                                class="w-20 h-20 p-2
                                                       flex flex-col items-center justify-center
                                                       rounded-2xl
                                                       bg-gradient-to-br from-cyan-400/20 via-fuchsia-400/10 to-emerald-400/20
                                                       border border-cyan-400/30
                                                       hover:border-cyan-300
                                                       hover:shadow-lg hover:shadow-cyan-400/40
                                                       data-[highlighted]:border-fuchsia-400
                                                       data-[selected]:ring-2 data-[selected]:ring-cyan-400
                                                       text-gray-50 text-xl
                                                       transition-all duration-150
                                                       hover:scale-105"
                                            >
                                                <span class="text-2xl"
                                                    >{item.emoji}</span
                                                >

                                                <span
                                                    class="text-[0.65rem] leading-tight text-center mt-1 text-cyan-100 break-words"
                                                >
                                                    {item.label}
                                                </span>
                                            </button>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>

                <button
                    onclick={logout}
                    disabled={isSigningOut}
                    class="bg-red-500 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded flex items-center gap-2"
                >
                    {#if isSigningOut}
                        <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle
                                class="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                stroke-width="4"
                                fill="none"
                            ></circle>
                            <path
                                class="opacity-75"
                                fill="currentColor"
                                d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                        Signing Out...
                    {:else}
                        Sign Out
                    {/if}
                </button>
            {:else}
                <button
                    onclick={loginWithGoogle}
                    disabled={isLoading}
                    class="bg-blue-500 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded flex items-center gap-2"
                >
                    {#if isLoading}
                        <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle
                                class="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                stroke-width="4"
                                fill="none"
                            ></circle>
                            <path
                                class="opacity-75"
                                fill="currentColor"
                                d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                        Signing In...
                    {:else}
                        <svg class="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Sign In with Google
                    {/if}
                </button>
            {/if}
        </div>
    </div>
</nav>
