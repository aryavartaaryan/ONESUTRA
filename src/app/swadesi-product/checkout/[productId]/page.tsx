import { notFound } from "next/navigation";
import { getMockProducts } from "@/lib/mockStore";
import CheckoutClientForm from "@/components/product/CheckoutClientForm";

export default async function CheckoutPage(props: { params: Promise<{ productId: string }> }) {
  const { productId } = await props.params;
  const products = getMockProducts();
  const product = products.find((p: any) => p.id === productId);

  if (!product) {
    notFound();
  }

  return <CheckoutClientForm product={product} />;
}
