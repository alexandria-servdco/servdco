import DOMPurify from "dompurify";

const privacyPolicyHTML = `
  <div class="space-y-12">
    
    <section id="information-collection" class="scroll-mt-24">
      <h2 class="text-2xl font-bold font-serif text-white mb-4 border-b border-white/5 pb-2">1. Information Collection</h2>
      <p class="text-[#A8A8A8] text-sm leading-relaxed mb-4">
        Servd Co. connects busy families with trusted, vetted local cooks for personalized meal preparation services. To facilitate this marketplace, we collect information that helps us deliver a high-quality experience. We only collect the minimum amount of data required to operate the platform.
      </p>
      <h3 class="text-lg font-bold text-white mb-2">A. Information You Provide directly</h3>
      <p class="text-[#A8A8A8] text-sm leading-relaxed mb-3">
        When registering an account as a family client or cook, or interacting with our waitlist, we collect:
      </p>
      <ul class="list-disc pl-6 space-y-2 text-[#A8A8A8] text-sm mb-4">
        <li><strong>Account Profile Data:</strong> Name, email address, password hash, physical address (city, state, ZIP code), and telephone number.</li>
        <li><strong>Cook Profiles:</strong> Experience, cuisine specialties, profile descriptions, location boundaries, and weekly scheduling availability.</li>
        <li><strong>Onboarding Credentials:</strong> Food handler certifications (e.g., ServSafe certificates), liability insurance documentation, and standard identification verification documents (for background audit logs).</li>
      </ul>
      <h3 class="text-lg font-bold text-white mb-2">B. Information Collected Automatically</h3>
      <p class="text-[#A8A8A8] text-sm leading-relaxed mb-4">
        To support platform integrity and performance, we automatically capture metadata regarding your browser type, device information, network parameters, operating system, and IP address.
      </p>
    </section>

    <section id="process-data" class="scroll-mt-24">
      <h2 class="text-2xl font-bold font-serif text-white mb-4 border-b border-white/5 pb-2">2. How We Process Data</h2>
      <p class="text-[#A8A8A8] text-sm leading-relaxed mb-3">
        Your data is processed in a secure environment and only for verified functional purposes. We process information to:
      </p>
      <ul class="list-disc pl-6 space-y-2 text-[#A8A8A8] text-sm mb-4">
        <li>Create and maintain your client or cook account on Servd Co.</li>
        <li>Match families with independent cooks operating in their local ZIP codes.</li>
        <li>Authorize secure payment processes and coordinate booking schedules.</li>
        <li>Monitor regional waitlists and calculate threshold counters to trigger rollout notices.</li>
        <li>Provide responsive customer support and resolve scheduling disputes.</li>
      </ul>
      <p class="text-[#A8A8A8] text-sm leading-relaxed">
        <strong>Important Note:</strong> We do not engage in automated individual decision-making, profiling, or behavioral classification.
      </p>
    </section>

    <section id="cookies" class="scroll-mt-24">
      <h2 class="text-2xl font-bold font-serif text-white mb-4 border-b border-white/5 pb-2">3. Cookies & Session Management</h2>
      <p class="text-[#A8A8A8] text-sm leading-relaxed mb-3">
        Cookies are small text files stored locally on your device by your web browser. Servd Co. uses essential functional cookies and session persistence to ensure secure, uninterrupted navigation:
      </p>
      <ul class="list-disc pl-6 space-y-2 text-[#A8A8A8] text-sm mb-4">
        <li><strong>Authentication & Security:</strong> Used to identify your browser session, keep you logged into your account, and prevent unauthorized actions.</li>
        <li><strong>Platform Functionality:</strong> Used to cache user preferences (such as dashboard layout preferences) and support the interactive UI state.</li>
        <li><strong>Persistence:</strong> Local storage is utilized to maintain guest parameters and waitlist status before full registration is finalized.</li>
      </ul>
      <p class="text-[#A8A8A8] text-sm leading-relaxed">
        You can choose to disable cookies through your individual browser settings; however, disabling essential session cookies will prevent the platform from functioning correctly and you will not be able to log in or book cooks.
      </p>
    </section>

    <section id="analytics" class="scroll-mt-24">
      <h2 class="text-2xl font-bold font-serif text-white mb-4 border-b border-white/5 pb-2">4. Platform Analytics & Usage Metrics</h2>
      <p class="text-[#A8A8A8] text-sm leading-relaxed mb-3">
        We utilize Google Analytics to understand how users interact with our platform, analyze traffic patterns, improve performance, and enhance the overall user experience.
      </p>
      <p class="text-[#A8A8A8] text-sm leading-relaxed mb-3">
        The analytics data captured is strictly aggregated and non-identifiable. This data includes:
      </p>
      <ul class="list-disc pl-6 space-y-2 text-[#A8A8A8] text-sm mb-4">
        <li>Page visits, bounce rates, and navigation paths.</li>
        <li>Aggregated browser and device types.</li>
        <li>Regional usage trends (limited to state/city scales).</li>
        <li>Referral links and traffic sources.</li>
      </ul>
      <p class="text-[#A8A8A8] text-sm leading-relaxed">
        This performance data is purely diagnostic and is not combined with personal identifying credentials.
      </p>
    </section>

    <section id="payment-info" class="scroll-mt-24">
      <h2 class="text-2xl font-bold font-serif text-white mb-4 border-b border-white/5 pb-2">5. Payment Information</h2>
      <p class="text-[#A8A8A8] text-sm leading-relaxed mb-4">
        Payment processing is handled securely and directly through <strong>Stripe</strong>. Servd Co. does not store, process, or transmit your credit card credentials on our servers.
      </p>
      <p class="text-[#A8A8A8] text-sm leading-relaxed mb-4">
        All sensitive transaction details are handled under the strict security standards of the Payment Card Industry Data Security Standard (PCI-DSS). Stripe processes your payment details in accordance with their privacy policy, which can be reviewed on their website.
      </p>
    </section>

    <section id="data-sharing" class="scroll-mt-24">
      <h2 class="text-2xl font-bold font-serif text-white mb-4 border-b border-white/5 pb-2">6. Data Sharing & Third-Party Disclosure</h2>
      <p class="text-[#A8A8A8] text-sm leading-relaxed mb-3">
        We do not sell, rent, trade, or distribute your personal identifying information to advertising networks, brokers, or data brokers. Data sharing is limited strictly to the following scenarios:
      </p>
      <ul class="list-disc pl-6 space-y-2 text-[#A8A8A8] text-sm mb-4">
        <li><strong>Marketplace Coordination:</strong> Sharing names, booking addresses, menu selections, and contact telephone lines between the assigned cook and family client.</li>
        <li><strong>Functional Partners:</strong> Secure transactions with payment processors (Stripe) and server infrastructure partners.</li>
        <li><strong>Compliance & Protection:</strong> When legally mandated to comply with subpoena requests, court mandates, or regulatory directives.</li>
      </ul>
    </section>

    <section id="data-retention" class="scroll-mt-24">
      <h2 class="text-2xl font-bold font-serif text-white mb-4 border-b border-white/5 pb-2">7. Data Retention</h2>
      <p class="text-[#A8A8A8] text-sm leading-relaxed mb-4">
        We retain your personal details only for as long as your account remains active or as required to deliver our service. If you cancel your membership or request data deletion, we will purge your identification markers from active database directories within 30 days, except for data we are required to retain to meet legal, accounting, tax, or transaction auditing mandates.
      </p>
    </section>

    <section id="security" class="scroll-mt-24">
      <h2 class="text-2xl font-bold font-serif text-white mb-4 border-b border-white/5 pb-2">8. Security</h2>
      <p class="text-[#A8A8A8] text-sm leading-relaxed mb-4">
        We implement rigorous technical and administrative safeguards to secure your database credentials. All communication is routed over encrypted Transport Layer Security (TLS/HTTPS) channels. Access privileges are restricted internally to authorized administrative support teams on a strict need-to-know basis.
      </p>
      <p class="text-[#A8A8A8] text-sm leading-relaxed">
        While we enforce robust database standards, no transmission channel or storage node is perfectly secure. We encourage users to use unique, strong passwords and protect their credentials.
      </p>
    </section>

    <section id="minors" class="scroll-mt-24">
      <h2 class="text-2xl font-bold font-serif text-white mb-4 border-b border-white/5 pb-2">9. Protecting Minors' Privacy</h2>
      <p class="text-[#A8A8A8] text-sm leading-relaxed mb-4">
        Servd Co. connects adult households with local cooks. Our platforms are strictly directed to individuals aged 18 and older. We do not knowingly compile or archive identification records from children under the age of 13. If you believe a child has submitted personal details to our waitlist, please contact us immediately so we can purge the information.
      </p>
    </section>

    <section id="privacy-rights" class="scroll-mt-24">
      <h2 class="text-2xl font-bold font-serif text-white mb-4 border-b border-white/5 pb-2">10. Your Privacy Rights</h2>
      <p class="text-[#A8A8A8] text-sm leading-relaxed mb-3">
        Depending on your legal jurisdiction (such as California or other US states), you may possess specific rights regarding your personal information, including:
      </p>
      <ul class="list-disc pl-6 space-y-2 text-[#A8A8A8] text-sm mb-4">
        <li><strong>Right of Access:</strong> The right to request copies of the personal details we have saved about your profile.</li>
        <li><strong>Right to Rectification:</strong> The right to update or correct invalid or incomplete records (available directly inside your profile settings dashboard).</li>
        <li><strong>Right to Deletion:</strong> The right to request that we purge all personal data files from our storage nodes.</li>
        <li><strong>Right to Non-Discrimination:</strong> We do not limit services or charge differing rates if you exercise your legal privacy choices.</li>
      </ul>
      <p class="text-[#A8A8A8] text-sm leading-relaxed">
        To exercise any of these privileges, please submit a formal request to our privacy desk at the contact parameters provided below.
      </p>
    </section>

    <section id="contact" class="scroll-mt-24">
      <h2 class="text-2xl font-bold font-serif text-white mb-4 border-b border-white/5 pb-2">11. Contacting Us</h2>
      <p class="text-[#A8A8A8] text-sm leading-relaxed mb-4">
        For inquiries regarding our storage practices, compliance steps, or to request record modifications, please contact our team at:
      </p>
      <div class="bg-[#1C1C1F] border border-white/5 rounded-2xl p-6 space-y-2 text-sm text-[#A8A8A8]">
        <p class="text-white font-bold font-serif">Servd Co. Privacy Team</p>
        <p>1121 Worthington Woods Blvd, #6041</p>
        <p>Columbus, OH 43085, United States</p>
        <p>Email: <a href="mailto:alexandria@servdco.com" class="text-[#FF7A59] hover:underline font-semibold">alexandria@servdco.com</a></p>
      </div>
    </section>

  </div>
`;

export default function PrivacyPolicyContent() {
  // Sanitize HTML safely before outputting
  const cleanHTML = DOMPurify.sanitize(privacyPolicyHTML);

  return (
    <div
      className="prose prose-invert max-w-none text-[#A8A8A8] prose-headings:font-serif prose-headings:text-white prose-a:text-[#FF7A59] hover:prose-a:underline focus:prose-a:underline"
      dangerouslySetInnerHTML={{ __html: cleanHTML }}
    />
  );
}
