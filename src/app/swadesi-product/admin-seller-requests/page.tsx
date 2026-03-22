import prisma from "@/lib/prisma";
import AdminApprovalTable from "@/components/tables/AdminApprovalTable";

export default async function AdminSellerApplicationsPage() {
  // TEMPORARY MOCK DATA
  let requests: any[] = [
    {
      id: "req1", proposal: "I produce organic raw forest honey directly from farms.", status: "PENDING", createdAt: new Date(),
      user: { email: "local.maker@example.com", name: "Ravi Farmer" }
    },
    {
      id: "req2", proposal: "Selling authentic Ayurvedic herbal oils and masks.", status: "APPROVED", createdAt: new Date(),
      user: { email: "vedic.oils@example.com", name: "Vedic Botanicals" }
    }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">Admin Dashboard: Seller Requests</h1>
      <p className="text-gray-600 mb-8">Review proposals from customers wanting to become sellers.</p>
      <AdminApprovalTable requests={requests} />
    </div>
  );
}
