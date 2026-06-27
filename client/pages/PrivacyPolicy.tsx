import LegalLayout from "@/components/legal/LegalLayout";
import LegalSidebar from "@/components/legal/LegalSidebar";
import LegalTOC from "@/components/legal/LegalTOC";
import PrivacyPolicyContent from "@/components/legal/PrivacyPolicyContent";

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="We value transparency and are committed to protecting your information and privacy."
      lastUpdated="June 12, 2026"
      activeDocName="Privacy Policy"
      sidebarContent={<LegalSidebar />}
    >
      {/* Table of Contents / High Level Summary Cards */}
      <LegalTOC />

      {/* Main Sanitized Legal Clauses */}
      <PrivacyPolicyContent />
    </LegalLayout>
  );
}
