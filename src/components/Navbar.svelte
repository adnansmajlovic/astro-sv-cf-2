<script>
    let { session } = $props();
</script>

<nav class="bg-gray-200 dark:bg-gray-800 p-4">
    <div class="container mx-auto flex justify-between items-center">
        <div class="left-side">
            <a href="/" class="text-xl font-bold text-gray-900 dark:text-white"
                >AstroAuth</a
            >
        </div>
        <div class="right-side flex items-center">
            {#if session}
                <a
                    href="/api/auth/signout"
                    class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-4"
                >
                    Sign Out
                </a>
                <img
                    src={session.user.image}
                    alt="Profile"
                    class="w-10 h-10 rounded-full"
                />
            {:else}
                <a
                    href="/api/auth/signin/google"
                    class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                    Sign In with Google
                </a>
            {/if}
        </div>
    </div>
</nav>
