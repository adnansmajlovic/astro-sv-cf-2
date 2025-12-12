<script lang="ts">
    import { signOut } from "$lib/auth-client";

    let isLoading = $state(false);
    let error = $state<string | null>(null);

    async function logout() {
        console.log({ isLoading });
        if (isLoading) return;
        isLoading = true;
        error = null;

        try {
            console.log("Logging out...");
            await signOut();

            // Better Auth typically redirects; if not, force a safe location:
            window.location.href = "/";
        } catch (e) {
            console.error(e);
            error = "Sign out failed. Please try again.";
        } finally {
            isLoading = false;
        }
    }
</script>

<main class="min-h-[70vh] flex items-center justify-center px-6">
    <div
        class="max-w-md w-full rounded-xl border border-slate-800 bg-slate-950 p-6 text-center space-y-4"
    >
        <h1 class="text-xl font-semibold text-slate-100">Account Disabled</h1>

        <p class="text-sm text-slate-400">
            Your account has been disabled by an administrator.
        </p>

        {#if error}
            <p class="text-xs text-red-400">{error}</p>
        {/if}

        <button
            class="inline-flex items-center justify-center px-4 py-2 rounded-lg
             bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-sm text-slate-100"
            onclick={logout}
            disabled={isLoading}
        >
            {isLoading ? "Signing out…" : "Sign out"}
        </button>
    </div>
</main>
