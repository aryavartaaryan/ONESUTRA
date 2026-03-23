import ProductForm from "@/components/product/ProductForm";
import { notFound } from "next/navigation";
import { getMockProducts } from "@/lib/mockStore";
import prisma from "@/lib/prisma";

export default async function AdminEditProductPage(props: { params: Promise<{ id: string }> }) {
  // Access control is handled at the dashboard level.
  // Admins reach this page by clicking Edit from the admin dashboard.
  const { id } = await props.params;

  // Try real DB first, fall back to mock store
  let product: any = null;
  try {
    product = await prisma.product.findUnique({ where: { id } });
  } catch {
    // Prisma not available or product not found there — check mock store
  }
  if (!product) {
    const mockProducts = getMockProducts();
    product = mockProducts.find((p: any) => p.id === id) || null;
  }

  if (!product) notFound();

  const initialData = { ...product, isAdmin: true };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8" style={{ color: "var(--accent-gold)" }}>
        ✏️ Admin: Edit Product
      </h1>
      <ProductForm initialData={initialData} />
    </div>
  );
}
