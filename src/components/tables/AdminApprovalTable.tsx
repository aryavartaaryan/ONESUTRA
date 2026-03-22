"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminApprovalTable({ requests }: { requests: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleStatusChange = async (requestId: string, userId: string, status: "APPROVED" | "REJECTED") => {
    setLoading(requestId);
    try {
      const res = await fetch(`/api/admin/approve-seller`, { 
         method: 'PUT', 
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ requestId, status, userId }) 
      });
      
      if (!res.ok) throw new Error("Failed update");
      
      alert(`Request has been ${status}.`);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error updating request");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 font-medium text-left text-gray-900">User Email</th>
            <th className="px-4 py-3 font-medium text-left text-gray-900">Product Proposal Description</th>
            <th className="px-4 py-3 font-medium text-left text-gray-900">Status</th>
            <th className="px-4 py-3 font-medium text-left text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {requests.map((req) => (
            <tr key={req.id}>
              <td className="px-4 py-3 font-medium text-gray-900">{req.user?.email || "N/A"}</td>
              <td className="px-4 py-3 text-gray-700 whitespace-pre-line">{req.description}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  req.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {req.status}
                </span>
              </td>
              <td className="px-4 py-3 flex gap-2">
                {req.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(req.id, req.userId, "APPROVED")}
                      disabled={loading === req.id}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusChange(req.id, req.userId, "REJECTED")}
                      disabled={loading === req.id}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                No incoming seller requests found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
