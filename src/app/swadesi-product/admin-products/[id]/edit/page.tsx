import prisma from "@/lib/prisma";
import ProductForm from "@/components/product/ProductForm";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function AdminEditProductPage(props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  
  if ((session?.user as any)?.role !== "SUPER_ADMIN") {
      return <div>Access Denied</div>;
  }

  const { id } = await props.params;
  const product = await prisma.product.findUnique({
    where: { id: id },
  });

  if (!product) {
     notFound();
  }

  const initialData = {
     ...product,
     isAdmin: true
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin: Edit Product Master Control</h1>
      <ProductForm initialData={initialData} />
    </div>
  );
}
