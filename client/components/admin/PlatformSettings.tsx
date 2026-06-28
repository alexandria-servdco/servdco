import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { usePlatformStore } from "@/store/usePlatformStore";
import { useUpdatePlatformSettings } from "@/hooks/usePlatformSettings";
import { AdminAccountSettings } from "@/components/admin/AdminAccountSettings";

export function PlatformSettings({ adminEmail }: { adminEmail?: string }) {
  const { platformFeePercentage, chefPremiumPrice, familyPlatformFeeDollars } =
    usePlatformStore();
  const updateSettings = useUpdatePlatformSettings();

  const [localFee, setLocalFee] = useState(platformFeePercentage);
  const [localPremium, setLocalPremium] = useState(chefPremiumPrice);
  const [localFamilyFee, setLocalFamilyFee] = useState(familyPlatformFeeDollars);

  useEffect(() => {
    setLocalFee(platformFeePercentage);
    setLocalPremium(chefPremiumPrice);
    setLocalFamilyFee(familyPlatformFeeDollars);
  }, [platformFeePercentage, chefPremiumPrice, familyPlatformFeeDollars]);

  const handleSaveFee = () => {
    updateSettings.mutate(
      { platformFeePercentage: localFee },
      {
        onSuccess: () => {
          toast.success("Platform fee updated", {
            description: `${localFee}% applied globally.`,
          });
        },
        onError: () => {
          toast.error("Failed to save platform fee.");
        },
      },
    );
  };

  const handleSavePremium = () => {
    updateSettings.mutate(
      { chefPremiumPriceMonthly: localPremium },
      {
        onSuccess: () => {
          toast.success("Cook Premium Price updated", {
            description: `$${localPremium}/mo applied globally.`,
          });
        },
        onError: () => {
          toast.error("Failed to save premium price.");
        },
      },
    );
  };

  const handleSaveFamilyFee = () => {
    updateSettings.mutate(
      { familyPlatformFeeDollars: localFamilyFee },
      {
        onSuccess: () => {
          toast.success("Family platform fee updated", {
            description: `$${localFamilyFee} added to family checkout totals.`,
          });
        },
        onError: () => {
          toast.error("Failed to save family platform fee.");
        },
      },
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#FFF",
            margin: 0,
          }}
        >
          Platform Economics
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Platform Fee Config */}
        <div
          style={{
            background: "rgba(25,25,25,0.4)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
            padding: "24px",
          }}
        >
          <h3
            style={{
              fontSize: "15px",
              fontWeight: "600",
              color: "#FFF",
              margin: "0 0 4px 0",
            }}
          >
            Global Platform Fee
          </h3>
          <p
            style={{
              fontSize: "13px",
              color: "#A8A8A8",
              margin: "0 0 20px 0",
            }}
          >
            The % cut taken from all bookings to sustain operations.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <input
              type="number"
              value={localFee}
              onChange={(e) => setLocalFee(Number(e.target.value))}
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "10px 14px",
                borderRadius: "8px",
                color: "#FFF",
                fontSize: "14px",
                width: "100px",
                outline: "none",
              }}
            />
            <span style={{ color: "#A8A8A8", fontSize: "16px" }}>%</span>
          </div>

          <button
            onClick={handleSaveFee}
            disabled={updateSettings.isPending}
            style={{
              marginTop: "20px",
              padding: "8px 16px",
              background: "rgba(255, 255, 255, 0.05)",
              color: "#FFF",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            Save Fee Layout
          </button>
        </div>

        {/* Premium Price Config */}
        <div
          style={{
            background: "rgba(25,25,25,0.4)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
            padding: "24px",
          }}
        >
          <h3
            style={{
              fontSize: "15px",
              fontWeight: "600",
              color: "#FFF",
              margin: "0 0 4px 0",
            }}
          >
            Cook Premium Price
          </h3>
          <p
            style={{
              fontSize: "13px",
              color: "#A8A8A8",
              margin: "0 0 20px 0",
            }}
          >
            The monthly subscription cost for Cook Premium accounts.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <span style={{ color: "#A8A8A8", fontSize: "16px" }}>$</span>
            <input
              type="number"
              value={localPremium}
              onChange={(e) => setLocalPremium(Number(e.target.value))}
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "10px 14px",
                borderRadius: "8px",
                color: "#FFF",
                fontSize: "14px",
                width: "100px",
                outline: "none",
              }}
            />
            <span style={{ color: "#A8A8A8", fontSize: "14px" }}>/ mo</span>
          </div>

          <button
            onClick={handleSavePremium}
            disabled={updateSettings.isPending}
            style={{
              marginTop: "20px",
              padding: "8px 16px",
              background: "rgba(255, 255, 255, 0.05)",
              color: "#FFF",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            Save Subscription Config
          </button>
        </div>

        {/* Family Platform Fee */}
        <div
          style={{
            background: "rgba(25,25,25,0.4)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
            padding: "24px",
          }}
        >
          <h3
            style={{
              fontSize: "15px",
              fontWeight: "600",
              color: "#FFF",
              margin: "0 0 4px 0",
            }}
          >
            Family Platform Fee
          </h3>
          <p
            style={{
              fontSize: "13px",
              color: "#A8A8A8",
              margin: "0 0 20px 0",
            }}
          >
            Fixed fee added to the family checkout total. Cook payout is unaffected.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <span style={{ color: "#A8A8A8", fontSize: "16px" }}>$</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={localFamilyFee}
              onChange={(e) => setLocalFamilyFee(Number(e.target.value))}
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "10px 14px",
                borderRadius: "8px",
                color: "#FFF",
                fontSize: "14px",
                width: "100px",
                outline: "none",
              }}
            />
            <span style={{ color: "#A8A8A8", fontSize: "14px" }}>per booking</span>
          </div>

          <button
            onClick={handleSaveFamilyFee}
            disabled={updateSettings.isPending}
            style={{
              marginTop: "20px",
              padding: "8px 16px",
              background: "rgba(255, 255, 255, 0.05)",
              color: "#FFF",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            Save Family Fee
          </button>
        </div>
      </div>

      {adminEmail ? <AdminAccountSettings email={adminEmail} /> : null}
    </div>
  );
}
