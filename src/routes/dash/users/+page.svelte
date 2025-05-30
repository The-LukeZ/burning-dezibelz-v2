<script lang="ts">
  import { enhance } from "$app/forms";
  import Modal from "$lib/components/Modal.svelte";
  import { formatGermanDateTime } from "$lib/utils/concerts";
  import { onMount } from "svelte";

  let users = $state<AllowedUser[]>([]);
  let loading = $state(true);
  let addModalOpen = $state(false);
  let selectUser = $state<{
    modalOpen: boolean;
    user: AllowedUser | null;
  }>({
    modalOpen: false,
    user: null,
  });
  let error = $state<string | null>(null);

  onMount(async () => {
    const response = await fetch("/api/users");
    if (response.ok) {
      const data = await response.json();
      users = [...data];
      loading = false;
      console.log("Users loaded successfully:", $state.snapshot(users));
    } else {
      console.error("Failed to load users");
    }
    loading = false;
  });
</script>

<div class="container mx-auto flex flex-row">
  <h1 class="mb-4 text-2xl font-bold">User Management</h1>
  <button
    class="dy-btn dy-btn-secondary ml-auto"
    onclick={() => {
      addModalOpen = true;
    }}
  >
    Add User
  </button>
</div>

<div class="container mx-auto overflow-x-auto">
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
        <th>Actions</th>
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
            <td>
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
                onclick={() => {
                  if (confirm(`Are you sure you want to delete this user?\nE-Mail: ${user.email}`)) {
                    fetch(`/api/users/${encodeURIComponent(user.email)}`, { method: "DELETE" }).then(
                      (response) => {
                        if (response.ok) {
                          users = users.filter((u) => u.email !== user.email);
                        } else {
                          alert("Failed to delete user.");
                        }
                      },
                    );
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

<Modal bind:open={addModalOpen} title="Add User">
  <form
    method="POST"
    action="?/create"
    class="flex flex-col items-center gap-4"
    use:enhance={() => {
      addModalOpen = false;
      loading = true;
      return async ({ result, update }) => {
        await update({ reset: true, invalidateAll: false });
        if (result.type === "success") {
          const newUser = result.data?.user as AllowedUser;
          users = [...users, newUser];
          loading = false;
          console.log("New user added:", newUser);
        } else if (result.type === "failure") {
          console.error("Error adding user:", result.data?.error);
          error = (result.data?.error || "Failed to add user.") as string;
          loading = false;
        }
      };
    }}
  >
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
        <input type="email" name="email" placeholder="user@gmail.com" required autocomplete="email" />
      </label>
      <div class="dy-validator-hint hidden">Enter valid email address</div>
    </fieldset>
    <fieldset class="dy-fieldset w-full max-w-xs">
      <legend class="dy-fieldset-legend">Role</legend>
      <select name="role" class="dy-select">
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
    <div class="flex w-full justify-center">
      <button type="submit" class="dy-btn dy-btn-primary w-1/2">Create User</button>
    </div>
  </form>
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
    <form
      method="POST"
      action="?/edit"
      class="flex flex-col items-center gap-4"
      use:enhance={() => {
        selectUser.modalOpen = false;
        loading = true;
        return ({ result, update }) => {
          if (result.type === "success") {
            const updatedUser = result.data?.user as AllowedUser;
            users = users.map((u) => (u.email === updatedUser.email ? updatedUser : u));
            loading = false;
            console.log("User updated successfully:", updatedUser);
          } else if (result.type === "failure") {
            console.error("Error updating user:", result.data?.error);
            error = (result.data?.error || "Failed to update user.") as string;
            loading = false;
          }
        };
      }}
    >
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

      <button class="dy-btn dy-btn-sm dy-btn-secondary">Save</button>
    </form>
  {/if}
</Modal>
