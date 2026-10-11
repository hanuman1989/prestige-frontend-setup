"use client";

import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import PageBreadcrumb from "@/components/admin/common/PageBreadCrumb";
import Pagination from "@/components/admin/tables/Pagination";
import AdminUserFilters from "./AdminUserFilters";
import AdminUsersTable from "./AdminUsersTable";
import DeleteAdminUserDialog from "./DeleteAdminUserDialog";
import ChangePasswordDialog from "./ChangePasswordDialog";
import AdminUserForm from "./AdminUserForm";
import APIs from "@/lib/apis";
import { useAuth } from "@/hooks/useAuth";

const DEFAULT_FILTERS = {
  keyword: "",
  status: "",
};
const breadcrumbs = [
  { label: "Home", href: "/admin/dashboard" },
  { label: "Admin Users" },
];

export default function AdminUsers() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [deleting, setDeleting] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteRef = useRef(false);
  const [passwordUpdate, setPasswordUpdate] = useState(null);

  useEffect(() => {
    let isActive = true;
    const loadUsers = async () => {
      try {
        const params = new URLSearchParams({ page: String(page) });
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            params.append(key, value);
          }
        });
        const response = await APIs.admin.Adminusers.getUsers(params);
        if (isActive && response.data) {
          setUsers(
            response.data.map((user) => ({
              ...user,
              name: [user.first_name, user.last_name].filter(Boolean).join(" "),
              status: user.status ? "active" : "inactive",
              superUser: user.is_super_user,
              createdAt: user.created_at?.slice(0, 10) ?? "",
            })),
          );
          setPagination(response.pagination ?? null);
        }
      } catch (error) {
        if (isActive) {
          toast.error(
            error.message || "Unable to load admin users. Please try again.",
            { position: "bottom-center" },
          );
          setUsers([]);
          setPagination(null);
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    void loadUsers();

    return () => {
      isActive = false;
    };
  }, [filters, page, refreshVersion]);

  const handleSearch = (newFilters) => {
    setIsLoading(true);
    setPage(1);
    setFilters({ ...newFilters });
  };

  async function saveUser(values) {
    const response = editor.user
      ? await APIs.admin.Adminusers.updateUser(editor.user.id, values)
      : await APIs.admin.Adminusers.createUser(values);
    toast.success(response.message || "Admin user saved successfully.", {
      position: "bottom-center",
    });
    setIsLoading(true);
    if (!editor.user) setPage(1);
    setRefreshVersion((previous) => previous + 1);
    setEditor(null);
    return response;
  }

  const deleteUser = async () => {
    if (deleteRef.current || !deleting) return;
    deleteRef.current = true;
    setIsDeleting(true);
    try {
      const response = await APIs.admin.Adminusers.deleteUser(deleting.id);
      toast.success(response.message || "Admin user deleted successfully.", {
        position: "bottom-center",
      });
      setDeleting(null);
      setIsLoading(true);
      if (users.length === 1 && page > 1) setPage(page - 1);
      setRefreshVersion((previous) => previous + 1);
    } catch (error) {
      toast.error(
        error.message || "Unable to delete admin user. Please try again.",
        {
          position: "bottom-center",
        },
      );
    } finally {
      deleteRef.current = false;
      setIsDeleting(false);
    }
  };

  const changePassword = async (values) => {
    if (!passwordUpdate) return;
    let response;
    try {
      response = await APIs.admin.Adminusers.changePassword(passwordUpdate.id, {
        password: values.password,
        password_confirmation: values.password_confirmation,
      });
    } catch (error) {
      toast.error(error.message || "Unable to change the password. Please try again.", {
        position: "bottom-center",
      });
      throw error;
    }
    toast.success(response.message || "Password changed successfully.", {
      position: "bottom-center",
    });
    setPasswordUpdate(null);
    if (passwordUpdate.id === user?.id) {
      await logout();
      return response;
    }
    setIsLoading(true);
    setRefreshVersion((previous) => previous + 1);
    return response;
  };

  return (
    <div className="w-full min-w-0 space-y-6 text-[#0b164d] dark:text-gray-100">
      <PageBreadcrumb
        pageTitle="Admin Users"
        description="Manage administrator accounts and access."
        breadcrumbs={breadcrumbs}
      />
      <AdminUserFilters
        defaultFilters={DEFAULT_FILTERS}
        onSearch={handleSearch}
      />
      <AdminUsersTable
        users={users}
        logedInUser={user}
        totalUsers={pagination?.total ?? 0}
        isLoading={isLoading}
        busy={isDeleting}
        onAdd={() => setEditor({ user: null })}
        onEdit={(user) => setEditor({ user })}
        onChangePassword={setPasswordUpdate}
        onDelete={setDeleting}
      />
      {pagination && pagination.last_page > 1 && (
        <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {pagination.from}–{pagination.to} of {pagination.total}
          </p>

          <Pagination
            currentPage={pagination.current_page}
            totalPages={pagination.last_page}
            onPageChange={setPage}
          />
        </div>
      )}
      {editor && (
        <AdminUserForm
          key={editor.user?.id ?? "new"}
          user={editor.user}
          onClose={() => setEditor(null)}
          onSave={saveUser}
        />
      )}
      {deleting && (
        <DeleteAdminUserDialog
          user={deleting}
          isDeleting={isDeleting}
          onClose={() => {
            if (!deleteRef.current) setDeleting(null);
          }}
          onConfirm={deleteUser}
        />
      )}
      {passwordUpdate && (
        <ChangePasswordDialog
          key={passwordUpdate.id}
          user={passwordUpdate}
          onClose={() => {
            setPasswordUpdate(null);
          }}
          onUpdate={changePassword}
        />
      )}
    </div>
  );
}
