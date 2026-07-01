import { Loader2 } from "lucide-react";
import { isUuid } from "@/lib/marketplaceTypes";
import { useStripeConnect } from "@/hooks/useStripeConnect";
import { useChefTransfers } from "@/hooks/useTransfers";
import {
  ConnectedBankAccount,
  PayoutHealthCard,
  PayoutTransparencyCard,
} from "@/components/chef/payout/PayoutDashboardCards";
import {
  PaymentHistoryTable,
  TransferTimeline,
  UpcomingPayoutCard,
} from "@/components/chef/payout/PayoutHistory";

interface PayoutLogsProps {
  chefProfileId?: string;
}

export function PayoutLogs({ chefProfileId }: PayoutLogsProps) {
  const stripeChefId = chefProfileId && isUuid(chefProfileId) ? chefProfileId : undefined;
  const {
    status,
    startOnboarding,
    openDashboard,
    syncConnect,
    isOnboarding,
    isSyncing,
    isLoading,
  } = useStripeConnect(stripeChefId);
  const { data: transfers = [], isLoading: transfersLoading } =
    useChefTransfers(stripeChefId);

  const loading = isLoading || transfersLoading;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <PayoutHealthCard status={status} transfers={transfers} />
          {status && (
            <ConnectedBankAccount
              status={status}
              onConnect={() => startOnboarding()}
              onOpenDashboard={() => openDashboard()}
              onRefresh={() => syncConnect()}
              isOnboarding={isOnboarding}
              isSyncing={isSyncing}
            />
          )}
          <UpcomingPayoutCard transfers={transfers} connectStatus={status} />
          <PayoutTransparencyCard />
        </div>

        <div className="velvet-card p-6 space-y-4">
          <h3 className="text-lg font-bold text-white font-serif">Payout Timelines</h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-[#FF7A59]" size={24} />
            </div>
          ) : transfers.length === 0 ? (
            <p className="text-xs text-[#A8A8A8] text-center py-6">
              Complete your first booking to start earning.
            </p>
          ) : (
            transfers.slice(0, 5).map((transfer) => (
              <TransferTimeline
                key={transfer.id}
                transfer={transfer}
                connectStatus={status}
              />
            ))
          )}
        </div>
      </div>

      <div className="velvet-card p-8 space-y-4">
        <h3 className="text-xl font-bold text-white font-serif">Payment History</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-[#FF7A59]" size={24} />
          </div>
        ) : (
          <PaymentHistoryTable transfers={transfers} connectStatus={status} />
        )}
      </div>
    </div>
  );
}
