<script lang="ts">
  import { page } from "$app/state";
  import XIcon from "$lib/assets/XIcon.svelte";
  import Modal from "$lib/components/Modal.svelte";
  import type { Database } from "$lib/supabase";
  import { formatGermanDateTime } from "$lib/utils/concerts";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";

  let { supabase } = page.data;
  let showNotAdminNote = $state(true);
  let users = $state<AllowedUser[]>([]);
  let loading = $state(true);
  const newUserData = $state<{
    modalOpen: boolean;
    user: Database["public"]["Tables"]["allowed_users"]["Insert"] | null;
  }>({
    modalOpen: false,
    user: null,
  });
  const selectUser = $state<{
    modalOpen: boolean;
    user: AllowedUser | null;
  }>({
    modalOpen: false,
    user: null,
  });
  let error = $state<string | null>(null);

  function openCreateUserModal() {
    newUserData.modalOpen = true;
    newUserData.user = {
      email: "",
      role: "user",
      notes: "",
    };
  }

  async function updateUser(
    user: Database["public"]["Tables"]["allowed_users"]["Update"] & { email: string },
  ) {
    error = null;
    loading = true;
    const { data: upUser, error: updateError } = await supabase
      .rpc("update_allowed_user", {
        p_target_email: user.email,
        p_new_role: user.role,
        p_new_notes: user.notes ?? undefined,
      })
      .single();

    if (updateError || !upUser) {
      error = updateError?.message || "You do not have permission to update this user.";
      console.error("Error updating user:", updateError, upUser);
      return;
    }

    console.log("User updated successfully:", upUser);
    users = users.map((u) => (u.email === user.email ? upUser : u));
  }

  async function deleteUser(email: string) {
    error = null;
    const { error: deleteError } = await supabase.rpc("delete_allowed_user", {
      p_target_email: email,
    });

    if (deleteError) {
      error = deleteError.message || "You do not have permission to delete this user.";
      console.error("Error deleting user:", deleteError);
      return;
    }

    users = users.filter((user) => user.email !== email);
    console.log("User deleted successfully:", email);
  }

  async function createUser() {
    if (!newUserData.user || !newUserData.user.email) return;
    newUserData.modalOpen = false;
    error = null;
    loading = true;
    const { data: newUser, error: createError } = await supabase
      .rpc("insert_allowed_user", {
        p_email: newUserData.user.email,
        p_role: newUserData.user.role ?? "user",
        p_notes: newUserData.user.notes ?? undefined,
      })
      .single();

    if (createError) {
      error = createError.message || "Failed to create user.";
      console.error("Error creating user:", createError);
      loading = false;
      return;
    }

    users.push(newUser);
    console.log("User created successfully:", newUser);
    newUserData.user = null;
    loading = false;
  }

  onMount(async () => {
    const { data, error: fetchError } = await supabase
      .from("allowed_users")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching users:", fetchError);
      error = "Failed to load users.";
    } else {
      users = data || [];
    }
    loading = false;
  });
</script>

{#if !page.data.isAdmin && showNotAdminNote}
  <div class="dy-alert dy-alert-warning mb-4" transition:fade={{ duration: 150 }}>
    <span class="dy-alert-message">You do not have permission to manage users.</span>
    <button
      class="dy-btn dy-btn-square dy-btn-outline ml-auto size-7"
      onclick={() => (showNotAdminNote = false)}
    >
      <XIcon class="size-5" />
    </button>
  </div>
{/if}

<div class="mx-auto flex flex-row">
  <h1 class="mb-4 text-2xl font-bold">User Management</h1>
  <button
    class="dy-btn dy-btn-secondary ml-auto"
    class:hidden={!page.data.isAdmin}
    onclick={openCreateUserModal}>Add User</button
  >
</div>

<div class="mx-auto overflow-x-auto">
  {#if error}
    <div class="dy-alert dy-alert-error">
      <span class="dy-alert-message">{error}</span>
    </div>
  {/if}
  <table class="dy-table">
    <thead>
      <tr>
        <th class="w-1/4">E-Mail</th>
        <th>Role</th>
        <th>Created</th>
        <th>Notes</th>
        <th class:hidden={!page.data.isAdmin}>Actions</th>
      </tr>
    </thead>
    <tbody>
      {#if !loading && users.length === 0}
        <tr>
          <td colspan="5" class="text-center">No users found.</td>
        </tr>
      {:else if loading}
        <tr>
          <td colspan="5" class="text-center">Loading...</td>
        </tr>
      {:else if users.length > 0}
        {#each users as user}
          <tr class="transition duration-75 hover:bg-(--color-light-base-100)">
            <td>{user.email}</td>
            <td><pre>{user.role}</pre></td>
            <td>{formatGermanDateTime(user.created_at)}</td>
            <td>{@html (user.notes || "No notes").replace(/\n/g, "<br />")}</td>
            <td class:hidden={!page.data.isAdmin}>
              <button
                class="dy-btn dy-btn-sm dy-btn-primary"
                onclick={() => {
                  selectUser.user = $state.snapshot(user);
                  selectUser.modalOpen = true;
                }}
              >
                Edit
              </button>
              <button
                class="dy-btn dy-btn-sm dy-btn-error"
                onclick={async () => {
                  if (confirm(`Are you sure you want to delete this user?\nE-Mail: ${user.email}`)) {
                    await deleteUser(user.email);
                  }
                }}
              >
                Delete
              </button>
            </td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<Modal
  bind:open={newUserData.modalOpen}
  title="Add User"
  onClose={() => {
    newUserData.user = null;
  }}
>
  <div class="flex flex-col items-center gap-4">
    {#if newUserData.user}
      <fieldset class="dy-fieldset w-full max-w-xs">
        <legend class="dy-fieldset-legend">User E-Mail</legend>
        <label class="dy-input dy-validator dy-join-item">
          <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <g
              stroke-linejoin="round"
              stroke-linecap="round"
              stroke-width="2.5"
              fill="none"
              stroke="currentColor"
            >
              <rect width="20" height="16" x="2" y="4" rx="2"></rect>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
            </g>
          </svg>
          <input
            bind:value={newUserData.user.email}
            type="email"
            name="email"
            placeholder="user@gmail.com"
            required
            autocomplete="email"
          />
        </label>
        <div class="dy-validator-hint hidden">Enter valid email address</div>
      </fieldset>
      <fieldset class="dy-fieldset w-full max-w-xs">
        <legend class="dy-fieldset-legend">Role</legend>
        <select name="role" class="dy-select" bind:value={newUserData.user.role}>
          <option value="user">User</option>
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>
        <ul class="list-inside list-disc text-xs opacity-70">
          <li>An <strong>Editor</strong> can only manage concerts, venues and songs.</li>
          <li><strong>Users</strong> have no purpose at the moment.</li>
        </ul>
      </fieldset>
      <fieldset class="dy-fieldset w-full max-w-xs">
        <legend class="dy-fieldset-legend">Notes</legend>
        <textarea name="notes" class="dy-textarea max-h-32" placeholder="Optional notes about the user"
        ></textarea>
      </fieldset>
    {/if}
    <div class="flex w-full justify-center">
      <button class="dy-btn dy-btn-primary w-1/2" onclick={createUser}>Create User</button>
    </div>
  </div>
</Modal>

<Modal
  bind:open={selectUser.modalOpen}
  title="Edit User"
  onClose={() => {
    if (!selectUser.modalOpen) {
      selectUser.user = null;
    }
  }}
>
  {#if selectUser.user}
    <div class="flex flex-col items-center gap-4">
      <fieldset class="dy-fieldset w-full max-w-xs">
        <legend class="dy-fieldset-legend">Edit User</legend>
        <label class="dy-floating-label">
          <div class="dy-input">{selectUser.user.email}</div>
          <input type="hidden" name="email" value={selectUser.user.email} />
        </label>
      </fieldset>

      <fieldset class="dy-fieldset w-full max-w-xs">
        <legend class="dy-fieldset-legend">Role</legend>
        <select name="role" bind:value={selectUser.user.role} class="dy-select">
          <option value="user">User</option>
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>
        <ul class="list-inside list-disc text-xs opacity-70">
          <li>An <strong>Editor</strong> can only manage concerts, venues and songs.</li>
          <li><strong>Users</strong> have no purpose at the moment.</li>
        </ul>
      </fieldset>

      <fieldset class="dy-fieldset w-full max-w-xs">
        <legend class="dy-fieldset-legend">Notes</legend>
        <textarea
          name="notes"
          bind:value={selectUser.user.notes}
          class="dy-textarea h-24 resize-none"
          placeholder="Optional notes about the user"
        ></textarea>
      </fieldset>

      <button
        class="dy-btn dy-btn-sm dy-btn-secondary"
        onclick={async () => {
          if (!selectUser.user) return;
          await updateUser($state.snapshot(selectUser.user));
          selectUser.modalOpen = false;
          selectUser.user = null;
          loading = false;
        }}
      >
        Save
      </button>
    </div>
  {/if}
</Modal>
