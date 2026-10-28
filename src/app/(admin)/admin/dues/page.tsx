import { AdminDues } from "@/features/admin/components/admin-dues";
import {
  getAdminDuesRecords,
  getAdminTerms,
  getFinancialLedgerSummary,
} from "@/features/admin/queries";
import { requireCapability } from "@/features/auth/authorization";

export const metadata = {
  title: "Accounting & Financial Management | SDGC Admin",
};

interface AdminDuesPageProps {
  searchParams?: Promise<{ status?: string }>;
}

export default async function AdminDuesPage({ searchParams }: AdminDuesPageProps) {
  await requireCapability("dues.reconcile", "/admin/dues");
  const params = await searchParams;
  const [records, terms, ledgerSummary] = await Promise.all([
    getAdminDuesRecords(),
    getAdminTerms(),
    getFinancialLedgerSummary(),
  ]);
  return (
    <AdminDues
      initialRecords={records}
      initialTerms={terms}
      initialSummary={ledgerSummary}
      initialStatusFilter={params?.status}
    />
  );
}
