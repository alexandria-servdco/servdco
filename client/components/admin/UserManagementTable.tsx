import React, { useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

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

  return (
    <div
      style={{
        background: "#1A1A1A",
        borderRadius: "24px",
        padding: "28px",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
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

          <select
            value={userRoleFilter}
            onChange={(e) => {
              setUserRoleFilter(e.target.value);
              setUserPage(1);
            }}
            style={{
              padding: "6px 10px",
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              fontSize: "12px",
              color: "#F5F5F5",
              outline: "none",
            }}
          >
            <option value="all">All Roles</option>
            <option value="family">Family</option>
            <option value="chef">Chef</option>
          </select>

          <select
            value={userStatusFilter}
            onChange={(e) => {
              setUserStatusFilter(e.target.value);
              setUserPage(1);
            }}
            style={{
              padding: "6px 10px",
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              fontSize: "12px",
              color: "#F5F5F5",
              outline: "none",
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
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
            {(() => {
              const filtered = users.filter((usr) => {
                const matchSearch =
                  usr.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                  usr.email.toLowerCase().includes(userSearch.toLowerCase());
                const matchRole =
                  userRoleFilter === "all" || usr.role === userRoleFilter;
                const matchStatus =
                  userStatusFilter === "all" || usr.status === userStatusFilter;
                return matchSearch && matchRole && matchStatus;
              });

              const perPage = 5;
              const totalPages = Math.ceil(filtered.length / perPage);
              const paginated = filtered.slice(
                (userPage - 1) * perPage,
                userPage * perPage,
              );

              if (paginated.length === 0) {
                return (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding: "24px 12px",
                        textAlign: "center",
                      }}
                    >
                      <EmptyState message="No users match your criteria." />
                    </td>
                  </tr>
                );
              }

              return (
                <>
                  {paginated.map((usr) => (
                    <tr
                      key={usr.id}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <td style={{ padding: "12px" }}>
                        <img
                          src={
                            usr.avatar ||
                            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop"
                          }
                          alt={usr.name}
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "1.5px solid rgba(255,255,255,0.1)",
                          }}
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
                          {usr.role}
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
                        {new Date(usr.created_at).toLocaleDateString()}
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
                  ))}
                  {/* Pagination indicators */}
                  {totalPages > 1 && (
                    <tr>
                      <td
                        colSpan={8}
                        style={{
                          padding: "16px 12px",
                          textAlign: "right",
                        }}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            gap: "6px",
                          }}
                        >
                          {Array.from({ length: totalPages }).map((_, pIdx) => (
                            <button
                              key={pIdx}
                              onClick={() => setUserPage(pIdx + 1)}
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "6px",
                                border: "none",
                                background:
                                  userPage === pIdx + 1
                                    ? "#FF7A59"
                                    : "rgba(255,255,255,0.05)",
                                color: "white",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: "pointer",
                              }}
                            >
                              {pIdx + 1}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
