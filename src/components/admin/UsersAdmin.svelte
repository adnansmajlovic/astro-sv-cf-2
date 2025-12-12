<script lang="ts">
    import { Select as MeltSelect, Toggle } from "melt/builders";

    const { csrfToken } = $props<{ csrfToken: string | null }>();

    type UserRole = "user" | "admin" | "super_admin";
    type User = {
        id: string;
        name: string | null;
        email: string;
        role: UserRole;
        disabled: boolean; // ✅ NEW
        createdAt: Date | number;
        updatedAt: Date | number;
    };

    const PAGE_SIZE_OPTIONS = [15, 50, 100] as const;
    type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

    // ---- State ---------------------------------------------------------------

    let users = $state<User[]>([]);
    let selectedUserId = $state<string | null>(null);

    let isLoading = $state(false);
    let isSaving = $state(false);
    let errorMsg = $state<string | null>(null);
    let successMsg = $state<string | null>(null);

    // pagination (cursor)
    let pageSize = $state<PageSize>(15);
    let nextCursor = $state<string | null>(null);
    let cursor = $state<string>(""); // current page cursor ("" = first page)
    let prevStack = $state<string[]>([]);

    // filters
    let q = $state("");
    let roleFilter = $state<UserRole | "all">("all");

    const ROLE_OPTIONS: { label: string; value: UserRole }[] = [
        { label: "User", value: "user" },
        { label: "Admin", value: "admin" },
        { label: "Super Admin", value: "super_admin" },
    ];

    const ROLE_FILTER_OPTIONS: { label: string; value: UserRole | "all" }[] = [
        { label: "All roles", value: "all" },
        ...ROLE_OPTIONS,
    ];

    let selectedUser = $derived(
        users.find((u) => u.id === selectedUserId) ?? null,
    );
    let isFirstPage = $derived(prevStack.length === 0);
    let isLastPage = $derived(nextCursor == null);

    // ---- Helpers -------------------------------------------------------------

    function labelForRole(role: UserRole | null | undefined): string {
        if (!role) return "Select role";
        return ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role;
    }

    function buildUsersURL(cursorValue: string) {
        const url = new URL("/api/users", window.location.origin);
        url.searchParams.set("limit", String(pageSize));

        const qq = q.trim();
        if (qq) url.searchParams.set("q", qq);

        if (roleFilter !== "all") url.searchParams.set("role", roleFilter);

        if (cursorValue) url.searchParams.set("cursor", cursorValue);

        return url.toString();
    }

    async function fetchPage(cursorValue: string) {
        isLoading = true;
        errorMsg = null;
        successMsg = null;

        try {
            const res = await fetch(buildUsersURL(cursorValue), {
                method: "GET",
                headers: {
                    ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
                },
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Failed to fetch users");
            }

            const data = (await res.json()) as {
                users: User[];
                nextCursor: string | null;
                pageCursor: string;
            };

            users = data.users;
            nextCursor = data.nextCursor;
            cursor = data.pageCursor || "";

            selectedUserId = data.users[0]?.id ?? null;
        } catch (err) {
            console.error(err);
            errorMsg = (err as Error).message || "Unable to load users.";
        } finally {
            isLoading = false;
        }
    }

    async function loadFirstPage() {
        prevStack = [];
        await fetchPage("");
    }

    async function nextPage() {
        if (!nextCursor || isLoading) return;
        prevStack = [...prevStack, cursor];
        await fetchPage(nextCursor);
    }

    async function prevPage() {
        if (prevStack.length === 0 || isLoading) return;
        const prev = prevStack[prevStack.length - 1];
        prevStack = prevStack.slice(0, -1);
        await fetchPage(prev);
    }

    // initial load
    $effect.root(() => {
        void loadFirstPage();
    });

    // reload on filters/pageSize (debounce typing)
    let filterTimer: number | null = null;
    $effect(() => {
        q;
        roleFilter;
        pageSize;

        if (filterTimer) window.clearTimeout(filterTimer);
        filterTimer = window.setTimeout(() => {
            void loadFirstPage();
        }, 200);
    });

    async function patchUser(id: string, body: Record<string, unknown>) {
        if (!csrfToken) {
            errorMsg = "Missing CSRF token.";
            return { ok: false as const, error: "Missing CSRF token." };
        }

        const res = await fetch(`/api/users/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken,
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            return {
                ok: false as const,
                error: data?.error || "Update failed",
            };
        }

        return { ok: true as const };
    }

    async function updateRole(newRole: UserRole) {
        if (!selectedUser) return;

        isSaving = true;
        errorMsg = null;
        successMsg = null;

        const prevRole = selectedUser.role;

        users = users.map((u) =>
            u.id === selectedUser.id ? { ...u, role: newRole } : u,
        );

        try {
            const result = await patchUser(selectedUser.id, { role: newRole });
            if (!result.ok) {
                users = users.map((u) =>
                    u.id === selectedUser.id ? { ...u, role: prevRole } : u,
                );
                throw new Error(result.error);
            }

            successMsg = "Role updated successfully.";
        } catch (err) {
            console.error(err);
            errorMsg = (err as Error).message || "Failed to update role.";
        } finally {
            isSaving = false;
        }
    }

    async function updateDisabled(disabled: boolean) {
        if (!selectedUser) return;

        isSaving = true;
        errorMsg = null;
        successMsg = null;

        const prevDisabled = selectedUser.disabled;

        users = users.map((u) =>
            u.id === selectedUser.id ? { ...u, disabled } : u,
        );

        try {
            const result = await patchUser(selectedUser.id, { disabled });
            if (!result.ok) {
                users = users.map((u) =>
                    u.id === selectedUser.id
                        ? { ...u, disabled: prevDisabled }
                        : u,
                );
                throw new Error(result.error);
            }

            successMsg = disabled ? "User disabled." : "User re-enabled.";
        } catch (err) {
            console.error(err);
            errorMsg = (err as Error).message || "Failed to update user.";
        } finally {
            isSaving = false;
        }
    }

    const select = new MeltSelect<UserRole>({
        value: () => (selectedUser ? selectedUser.role : null),
        onValueChange: (value) => {
            if (!selectedUser || value == null) return;
            if (value !== selectedUser.role) void updateRole(value);
        },
    });

    const disableToggle = new Toggle({
        value: () => (selectedUser ? selectedUser.disabled : false),
        onValueChange: (v) => {
            if (!selectedUser) return;
            if (v !== selectedUser.disabled) void updateDisabled(v);
        },
        disabled: () => isSaving || !selectedUser,
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
                onclick={loadFirstPage}
                disabled={isLoading}
            >
                {isLoading ? "Refreshing…" : "Refresh"}
            </button>
        </div>

        <!-- Controls -->
        <div class="space-y-2">
            <label for="users-search" class="sr-only">Search users</label>
            <input
                id="users-search"
                class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm placeholder:text-slate-500"
                placeholder="Search name or email…"
                value={q}
                oninput={(e) =>
                    (q = (e.currentTarget as HTMLInputElement).value)}
            />

            <label for="users-role-filter" class="sr-only">Filter by role</label
            >
            <select
                id="users-role-filter"
                class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm"
                value={roleFilter}
                onchange={(e) =>
                    (roleFilter = (e.currentTarget as HTMLSelectElement)
                        .value as UserRole | "all")}
            >
                {#each ROLE_FILTER_OPTIONS as opt}
                    <option value={opt.value}>{opt.label}</option>
                {/each}
            </select>

            <div class="flex items-center gap-2">
                <label for="per-page" class="text-xs text-slate-400 shrink-0"
                    >Per page</label
                >
                <select
                    id="per-page"
                    class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm"
                    value={String(pageSize)}
                    onchange={(e) => {
                        const v = Number(
                            (e.currentTarget as HTMLSelectElement).value,
                        ) as PageSize;
                        pageSize = PAGE_SIZE_OPTIONS.includes(v) ? v : 15;
                    }}
                >
                    {#each PAGE_SIZE_OPTIONS as s}
                        <option value={String(s)}>{s}</option>
                    {/each}
                </select>
            </div>

            <div class="flex items-center gap-2">
                <button
                    class="text-xs px-2 py-1 rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
                    onclick={prevPage}
                    disabled={isLoading || isFirstPage}
                    title={isFirstPage ? "No previous page" : "Previous page"}
                >
                    ← Prev
                </button>

                <button
                    class="text-xs px-2 py-1 rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
                    onclick={nextPage}
                    disabled={isLoading || !nextCursor}
                    title={!nextCursor ? "No more pages" : "Next page"}
                >
                    Next →
                </button>

                <span class="ml-auto text-xs text-slate-400">
                    Page {prevStack.length + 1} • Showing {users.length} / {pageSize}
                </span>
            </div>

            {#if !isLoading && users.length > 0 && isLastPage}
                <p class="text-xs text-slate-500">End of results.</p>
            {/if}
        </div>

        {#if errorMsg}
            <p class="text-xs text-red-400">{errorMsg}</p>
        {/if}

        <!-- List area -->
        {#if isLoading && users.length === 0}
            <ul class="space-y-2 max-h-[50vh] overflow-y-auto">
                {#each Array(8) as _}
                    <li
                        class="px-3 py-3 rounded-lg border border-slate-800 bg-slate-900/40"
                    >
                        <div
                            class="h-4 w-2/3 rounded bg-slate-800 animate-pulse"
                        ></div>
                        <div
                            class="mt-2 h-3 w-5/6 rounded bg-slate-800 animate-pulse"
                        ></div>
                        <div
                            class="mt-3 h-3 w-16 rounded bg-slate-800 animate-pulse"
                        ></div>
                    </li>
                {/each}
            </ul>
        {:else}
            {#if users.length === 0 && !isLoading}
                <p class="text-sm text-slate-400">No users found.</p>
            {/if}

            <div class="relative">
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
                                <div
                                    class="flex items-center justify-between gap-2"
                                >
                                    <div class="font-medium text-slate-100">
                                        {u.name ?? u.email}
                                    </div>

                                    {#if u.disabled}
                                        <span
                                            class="text-[10px] px-2 py-0.5 rounded-full border border-red-800 bg-red-950 text-red-200"
                                        >
                                            Disabled
                                        </span>
                                    {/if}
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

                {#if isLoading && users.length > 0}
                    <div
                        class="pointer-events-none absolute inset-0 rounded-lg bg-slate-950/35 backdrop-blur-[1px]"
                    ></div>
                    <div
                        class="pointer-events-none absolute top-2 right-2 text-xs text-slate-200"
                    >
                        Loading…
                    </div>
                {/if}
            </div>
        {/if}
    </aside>

    <!-- Details -->
    <section class="md:flex-1 pl-0 md:pl-4 space-y-4">
        {#if selectedUser}
            <header class="space-y-1">
                <div class="flex items-center justify-between gap-3">
                    <div>
                        <h2
                            class="text-xl font-semibold tracking-tight text-slate-50"
                        >
                            {selectedUser.name ?? selectedUser.email}
                        </h2>
                        <p class="text-sm text-slate-400">
                            {selectedUser.email}
                        </p>
                    </div>

                    {#if selectedUser.disabled}
                        <span
                            class="text-xs px-2 py-1 rounded-full border border-red-800 bg-red-950 text-red-200"
                        >
                            Disabled
                        </span>
                    {/if}
                </div>
            </header>

            <div class="h-px bg-slate-800 my-2"></div>

            <div class="space-y-4">
                <!-- Disable access switch -->
                <div class="flex items-center justify-between max-w-md">
                    <div class="space-y-0.5">
                        <div class="text-sm text-slate-200 font-medium">
                            Disable access
                        </div>
                        <div class="text-xs text-slate-400">
                            Prevent this user from signing in and accessing
                            protected routes.
                        </div>
                    </div>

                    <button
                        {...disableToggle.trigger}
                        aria-label="Disable access"
                        class="group relative inline-flex h-6 w-11 items-center rounded-full transition
                             border border-slate-700 bg-slate-900
                             aria-pressed:bg-red-900/60 aria-pressed:border-red-700
                             disabled:opacity-60"
                        disabled={isSaving || !selectedUser}
                    >
                        <span
                            class="inline-block h-5 w-5 transform rounded-full bg-slate-200
                                 transition-transform duration-200 ease-out
                                 translate-x-0.5 group-aria-pressed:translate-x-5"
                        />
                    </button>
                </div>

                <!-- Role select -->
                <div class="space-y-3">
                    <label {...select.label} class="text-sm text-slate-300"
                        >Role</label
                    >

                    <button
                        {...select.trigger}
                        class="w-56 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm flex items-center justify-between data-[placeholder]:text-slate-500"
                        disabled={isSaving}
                    >
                        <span>
                            {labelForRole(
                                select.value ??
                                    (selectedUser ? selectedUser.role : null),
                            )}
                        </span>
                        <span class="text-xs text-slate-500">▾</span>
                    </button>

                    <div
                        {...select.content}
                        class="mt-1 w-56 rounded-lg
                         bg-slate-800/90
                         border border-slate-700
                         shadow-2xl
                         transition duration-150 ease-out
                         text-sm max-h-60 overflow-auto z-50
                         backdrop-blur-sm
                         text-white"
                    >
                        {#each ROLE_OPTIONS as opt}
                            <div
                                {...select.getOption(opt.value, opt.label)}
                                class="px-3 py-1.5 cursor-pointer
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
