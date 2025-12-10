<script lang="ts">
    import { Select as MeltSelect } from "melt/builders";

    const { csrfToken } = $props<{ csrfToken: string | null }>();

    type UserRole = "user" | "admin" | "super_admin";

    type User = {
        id: string;
        name: string | null;
        email: string;
        role: UserRole;
        createdAt: string | Date;
        updatedAt: string | Date;
    };

    // ---- State ---------------------------------------------------------------

    let users = $state<User[]>([]);
    let selectedUserId = $state<string | null>(null);
    let isLoading = $state(false);
    let isSaving = $state(false);
    let errorMsg = $state<string | null>(null);
    let successMsg = $state<string | null>(null);

    const ROLE_OPTIONS: { label: string; value: UserRole }[] = [
        { label: "User", value: "user" },
        { label: "Admin", value: "admin" },
        { label: "Super Admin", value: "super_admin" },
    ];

    let selectedUser = $derived(
        users.find((u) => u.id === selectedUserId) ?? null,
    );

    // ---- Helpers -------------------------------------------------------------

    function labelForRole(role: UserRole | null | undefined): string {
        if (!role) return "Select role";
        return ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role;
    }

    // ---- Data ---------------------------------------------------------------

    async function fetchUsers() {
        isLoading = true;
        errorMsg = null;
        successMsg = null;

        try {
            const res = await fetch("/api/users", {
                method: "GET",
                headers: {
                    ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
                },
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Failed to fetch users");
            }

            const data = (await res.json()) as User[];
            users = data;

            if (!selectedUserId && data.length > 0) {
                selectedUserId = data[0].id;
            }
        } catch (err) {
            console.error(err);
            errorMsg = (err as Error).message || "Unable to load users.";
        } finally {
            isLoading = false;
        }
    }

    $effect.root(() => {
        // run once on mount
        fetchUsers();
    });

    async function updateRole(newRole: UserRole) {
        if (!selectedUser) return;
        if (!csrfToken) {
            errorMsg = "Missing CSRF token.";
            return;
        }

        isSaving = true;
        errorMsg = null;
        successMsg = null;

        const prevRole = selectedUser.role;

        // optimistic update
        users = users.map((u) =>
            u.id === selectedUser.id ? { ...u, role: newRole } : u,
        );

        try {
            const res = await fetch(`/api/users/${selectedUser.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                },
                body: JSON.stringify({ role: newRole }),
            });

            if (!res.ok) {
                // revert
                users = users.map((u) =>
                    u.id === selectedUser.id ? { ...u, role: prevRole } : u,
                );
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.error || "Failed to update role");
            }

            successMsg = "Role updated successfully.";
        } catch (err) {
            console.error(err);
            errorMsg = (err as Error).message || "Failed to update role.";
        } finally {
            isSaving = false;
        }
    }

    // ---- Melt Select (Svelte 5 "next" API) -----------------------------------

    const select = new MeltSelect<UserRole>({
        // controlled: use the selected user's role as source of truth
        value: () => (selectedUser ? selectedUser.role : null),
        onValueChange: (value) => {
            if (!selectedUser || value == null) return;
            if (value !== selectedUser.role) {
                void updateRole(value);
            }
        },
    });
</script>

<div
    class="w-full min-h-[70vh] bg-slate-950 text-slate-100 flex flex-col md:flex-row gap-6 rounded-xl border border-slate-800 p-6"
>
    <!-- Sidebar: users -->
    <aside class="md:w-1/3 border-r border-slate-800 pr-4 space-y-4">
        <div class="flex items-center justify-between gap-2">
            <h2 class="text-lg font-semibold tracking-tight text-slate-100">
                Users
            </h2>
            <button
                class="text-xs px-2 py-1 rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
                onclick={fetchUsers}
                disabled={isLoading}
            >
                {isLoading ? "Refreshing…" : "Refresh"}
            </button>
        </div>

        {#if errorMsg}
            <p class="text-xs text-red-400">{errorMsg}</p>
        {/if}

        {#if users.length === 0 && !isLoading}
            <p class="text-sm text-slate-400">No users found.</p>
        {/if}

        <ul class="space-y-1 max-h-[50vh] overflow-y-auto">
            {#each users as u}
                <li>
                    <button
                        class="w-full text-left px-3 py-2 rounded-lg text-sm transition
              {selectedUserId === u.id
                            ? 'bg-slate-900 border border-slate-700'
                            : 'hover:bg-slate-900/70 border border-transparent'}"
                        onclick={() => (selectedUserId = u.id)}
                    >
                        <div class="font-medium text-slate-100">
                            {u.name ?? u.email}
                        </div>
                        <div class="text-xs text-slate-400">
                            {u.email}
                        </div>
                        <div class="text-xs mt-1">
                            <span
                                class="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-800/70 text-indigo-300 border border-slate-700"
                            >
                                {u.role}
                            </span>
                        </div>
                    </button>
                </li>
            {/each}
        </ul>
    </aside>

    <!-- Details -->
    <section class="md:flex-1 pl-0 md:pl-4 space-y-4">
        {#if selectedUser}
            <header class="space-y-1">
                <h2 class="text-xl font-semibold tracking-tight text-slate-50">
                    {selectedUser.name ?? selectedUser.email}
                </h2>
                <p class="text-sm text-slate-400">{selectedUser.email}</p>
            </header>

            <div class="h-px bg-slate-800 my-2"></div>

            <div class="space-y-3">
                <label {...select.label} class="text-sm text-slate-300">
                    Role
                </label>

                <!-- Melt Select trigger -->
                <button
                    {...select.trigger}
                    class="w-56 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm flex items-center justify-between data-[placeholder]:text-slate-500"
                >
                    <span>
                        {labelForRole(
                            select.value ??
                                (selectedUser ? selectedUser.role : null),
                        )}
                    </span>
                    <span class="text-xs text-slate-500">▾</span>
                </button>

                <!-- Melt Select content -->
                <div
                    {...select.content}
                    class="mt-1 w-56 rounded-lg
                         bg-slate-800/90
                         border border-slate-700
                         shadow-2xl
                         text-sm max-h-60 overflow-auto z-50
                         backdrop-blur-sm
                         text-white"
                >
                    {#each ROLE_OPTIONS as opt}
                        <div
                            {...select.getOption(opt.value, opt.label)}
                            class="px-3 py-1.5 cursor-pointer
                             text-white /* ensure option text is white */
                             hover:bg-slate-700/80
                             data-highlighted:bg-slate-700
                             data-[state='checked']:font-semibold
                             transition-colors"
                        >
                            {opt.label}
                        </div>
                    {/each}
                </div>

                {#if isSaving}
                    <p class="text-xs text-slate-400 mt-1">Saving…</p>
                {/if}
                {#if successMsg}
                    <p class="text-xs text-emerald-400 mt-1">
                        {successMsg}
                    </p>
                {/if}
                {#if errorMsg}
                    <p class="text-xs text-red-400 mt-1">{errorMsg}</p>
                {/if}
            </div>
        {:else}
            <div
                class="flex h-full items-center justify-center text-slate-500 text-sm"
            >
                Select a user to manage their role.
            </div>
        {/if}
    </section>
</div>
