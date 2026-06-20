import React, { useState, useMemo } from "react";
import { Search, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { BrandSelect } from "@/components/ui/BrandSelect";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { formatIsoDate } from "@/lib/formatDate";
import {
  AdminTableShell,
  DesktopTableView,
  MobileCardStack,
  MobileDataCard,
  MobileFieldRow,
} from "@/components/ui/ResponsiveDataTable";

const PAGE_SIZE = 15;

interface UserManagementTableProps {
  users: any[];
  handleSuspendUser: (id: string, currentStatus: string) => void;
  handleDeleteUser: (id: string) => void;
}

export function UserManagementTable({
  users,
  handleSuspendUser,
  handleDeleteUser,
}: UserManagementTableProps) {
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [userPage, setUserPage] = useState(1);

  const filtered = useMemo(
    () =>
      users.filter((usr) => {
        const matchSearch =
          usr.name.toLowerCase().includes(userSearch.toLowerCase()) ||
          usr.email.toLowerCase().includes(userSearch.toLowerCase());
        const matchRole =
          userRoleFilter === "all" || usr.role === userRoleFilter;
        const matchStatus =
          userStatusFilter === "all" || usr.status === userStatusFilter;
        return matchSearch && matchRole && matchStatus;
      }),
    [users, userSearch, userRoleFilter, userStatusFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(
    (userPage - 1) * PAGE_SIZE,
    userPage * PAGE_SIZE,
  );

  return (
    <AdminTableShell>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-5">
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "700",
            color: "#F5F5F5",
            margin: 0,
          }}
        >
          All Registered Users
        </h3>

        {/* Filters */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 12px",
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
            }}
          >
            <Search size={13} style={{ color: "#A8A8A8" }} />
            <input
              type="text"
              placeholder="Search name/email..."
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setUserPage(1);
              }}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: "12px",
                color: "#F5F5F5",
                width: "160px",
              }}
            />
          </div>

          <BrandSelect
            value={userRoleFilter}
            onValueChange={(v) => {
              setUserRoleFilter(v);
              setUserPage(1);
            }}
            options={[
              { value: "all", label: "All Roles" },
              { value: "family", label: "Family" },
              { value: "chef", label: "Cook" },
            ]}
            className="w-[120px]"
          />

          <BrandSelect
            value={userStatusFilter}
            onValueChange={(v) => {
              setUserStatusFilter(v);
              setUserPage(1);
            }}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "active", label: "Active" },
              { value: "suspended", label: "Suspended" },
            ]}
            className="w-[130px]"
          />
        </div>
      </div>

      <DesktopTableView>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {[
                "Profile",
                "Name",
                "Email",
                "Role",
                "State/City",
                "Status",
                "Joined Date",
                "Actions",
              ].map((col, idx) => (
                <th
                  key={idx}
                  style={{
                    textAlign: "left",
                    padding: "8px 12px",
                    fontSize: "10.5px",
                    fontWeight: "600",
                    color: "#A8A8A8",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "24px 12px", textAlign: "center" }}>
                  <EmptyState message="No users match your criteria." />
                </td>
              </tr>
            ) : (
              paginated.map((usr) => (
                    <tr
                      key={usr.id}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <td style={{ padding: "12px" }}>
                        <UserAvatar
                          name={usr.name}
                          imageUrl={usr.avatar}
                          size="sm"
                          className="w-9 h-9 border-[1.5px] border-white/10"
                        />
                      </td>
                      <td
                        style={{
                          padding: "14px 12px",
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#F5F5F5",
                        }}
                      >
                        {usr.name}
                      </td>
                      <td
                        style={{
                          padding: "14px 12px",
                          fontSize: "13px",
                          color: "#A8A8A8",
                        }}
                      >
                        {usr.email}
                      </td>
                      <td
                        style={{
                          padding: "14px 12px",
                          textTransform: "capitalize",
                          fontSize: "13px",
                        }}
                      >
                        <span
                          style={{
                            color:
                              usr.role === "chef" ? "#FF7A59" : "#2E7D66",
                            fontWeight: "600",
                          }}
                        >
                          {usr.role === "chef" ? "Cook" : usr.role}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "14px 12px",
                          fontSize: "13px",
                          color: "#CFCFCF",
                        }}
                      >
                        {usr.city}, {usr.state}
                      </td>
                      <td style={{ padding: "14px 12px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "3px 9px",
                            borderRadius: "99px",
                            fontSize: "11px",
                            fontWeight: "600",
                            background:
                              usr.status === "active"
                                ? "rgba(46,125,102,0.15)"
                                : "rgba(239, 68, 68, 0.15)",
                            color:
                              usr.status === "active" ? "#34D399" : "#EF4444",
                          }}
                        >
                          {usr.status}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "14px 12px",
                          fontSize: "12.5px",
                          color: "#A8A8A8",
                        }}
                      >
                        {formatIsoDate(usr.created_at)}
                      </td>
                      <td style={{ padding: "14px 12px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() =>
                              handleSuspendUser(usr.id, usr.status)
                            }
                            style={{
                              padding: "6px 12px",
                              borderRadius: "8px",
                              fontSize: "11.5px",
                              fontWeight: "600",
                              background:
                                usr.status === "suspended"
                                  ? "rgba(46,125,102,0.15)"
                                  : "rgba(245,158,11,0.15)",
                              color:
                                usr.status === "suspended"
                                  ? "#34D399"
                                  : "#F59E0B",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            {usr.status === "suspended"
                              ? "Unsuspend"
                              : "Suspend"}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(usr.id)}
                            style={{
                              padding: "6px",
                              borderRadius: "8px",
                              background: "rgba(239, 68, 68, 0.15)",
                              color: "#EF4444",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
              ))
            )}
          </tbody>
        </table>
      </DesktopTableView>

      <MobileCardStack>
        {paginated.length === 0 ? (
          <EmptyState message="No users match your criteria." />
        ) : (
          paginated.map((usr) => (
            <MobileDataCard
              key={usr.id}
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => handleSuspendUser(usr.id, usr.status)}
                    className="flex-1 min-w-[120px] py-2.5 px-3 rounded-lg text-xs font-semibold touch-target"
                    style={{
                      background:
                        usr.status === "suspended"
                          ? "rgba(46,125,102,0.15)"
                          : "rgba(245,158,11,0.15)",
                      color: usr.status === "suspended" ? "#34D399" : "#F59E0B",
                    }}
                  >
                    {usr.status === "suspended" ? "Unsuspend" : "Suspend"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(usr.id)}
                    className="py-2.5 px-3 rounded-lg bg-red-500/15 text-red-400 touch-target"
                    aria-label="Delete user"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              }
            >
              <div className="flex items-center gap-3 pb-2">
                <UserAvatar
                  name={usr.name}
                  imageUrl={usr.avatar}
                  size="sm"
                  className="w-9 h-9 border-[1.5px] border-white/10"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white m-0 truncate">{usr.name}</p>
                  <p className="text-xs text-[#A8A8A8] m-0 truncate">{usr.email}</p>
                </div>
              </div>
              <MobileFieldRow label="Role">
                <span className={usr.role === "chef" ? "text-[#FF7A59]" : "text-[#2E7D66]"}>
                  {usr.role === "chef" ? "Cook" : usr.role}
                </span>
              </MobileFieldRow>
              <MobileFieldRow label="Location">
                {usr.city}, {usr.state}
              </MobileFieldRow>
              <MobileFieldRow label="Status">
                <span className={usr.status === "active" ? "text-emerald-400" : "text-red-400"}>
                  {usr.status}
                </span>
              </MobileFieldRow>
              <MobileFieldRow label="Joined">{formatIsoDate(usr.created_at)}</MobileFieldRow>
            </MobileDataCard>
          ))
        )}
      </MobileCardStack>

      <PaginationBar
        page={userPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setUserPage}
        itemLabel="users"
        className="mt-4 border-t-0 pt-2"
      />
    </AdminTableShell>
  );
}
