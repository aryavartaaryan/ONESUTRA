export const INITIAL_MOCK_PRODUCTS = [
   {
      id: "mock1", name: "Premium Ayurvedic Oil", description: "100% Pure authentic Ayurvedic Hair Oil.", price: 499,
      imageUrl: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&q=80&w=800",
      category: "Ayurvedic", seller: { name: "Patanjali Authorized Dealer" }
   },
   {
      id: "mock2", name: "Organic Honey", description: "Raw, pure, unfiltered organic forest honey.", price: 299,
      imageUrl: "https://images.unsplash.com/photo-1587049352847-8d4e89415510?auto=format&fit=crop&q=80&w=800",
      category: "Organic Food", seller: { name: "Swadeshi Farms" }
   },
   {
      id: "mock3", name: "Handwoven Khadi Kurta", description: "Traditional Khadi cotton kurta for daily wear.", price: 899,
      imageUrl: "https://images.unsplash.com/photo-1583391733958-d6526e843e9a?auto=format&fit=crop&q=80&w=800",
      category: "Khadi", seller: { name: "Indic Weavers" }
   }
];

export const getMockProducts = () => {
   if (!(global as any).mockProducts) {
       (global as any).mockProducts = [...INITIAL_MOCK_PRODUCTS];
   }
   return (global as any).mockProducts;
};

export const addMockProduct = (product: any) => {
   const products = getMockProducts();
   // Add to the beginning of the array so it shows up first
   products.unshift({
      ...product,
      id: "mock_" + Date.now(),
      seller: { name: "You (Seller)" }
   });
};

export const updateMockProduct = (id: string, updatedData: any) => {
   const products = getMockProducts();
   const index = products.findIndex((p: any) => p.id === id);
   if (index !== -1) {
       products[index] = { ...products[index], ...updatedData };
   }
};

export const deleteMockProduct = (id: string) => {
   const products = getMockProducts();
   (global as any).mockProducts = products.filter((p: any) => p.id !== id);
};

export const getMockOrders = () => {
   if (!(global as any).mockOrders) {
       (global as any).mockOrders = [];
   }
   return (global as any).mockOrders;
};

export const addMockOrder = (order: any) => {
   const orders = getMockOrders();
   orders.unshift({
      ...order,
      orderId: "ORD_" + Date.now() + Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString()
   });
};

export const getMockSellerApps = () => {
   if (!(global as any).mockSellerApps) {
      (global as any).mockSellerApps = [];
   }
   return (global as any).mockSellerApps;
};

export const addMockSellerApp = (app: any) => {
   const apps = getMockSellerApps();
   apps.unshift({
      ...app,
      id: "app_" + Date.now(),
      status: "pending",
      createdAt: new Date().toISOString()
   });
};

export const approveMockSellerApp = (id: string, adminEmail: string) => {
   const apps = getMockSellerApps();
   const appIndex = apps.findIndex((a: any) => a.id === id);
   if (appIndex !== -1) {
      apps[appIndex].status = "approved";
      apps[appIndex].approvedBy = adminEmail;
      return true;
   }
   return false;
};

// DONATIONS MOCK STORE
const donations: any[] = [];

export const getMockDonations = () => {
  return [...donations];
};

export const addMockDonation = (amount: number, message: string, user: string) => {
  const newDonation = {
    id: Date.now().toString(),
    amount,
    message,
    user,
    date: new Date().toISOString()
  };
  donations.push(newDonation);
  return newDonation;
};

// PRO USERS & APP USERS MOCK STORE
const proUsers: any[] = [
    { email: "aryasumant@oneshutra.in", name: "Arya Sumant", date: new Date().toISOString() }
];

export const getMockProUsers = () => {
   return [...proUsers];
};

export const addMockProUser = (email: string, name: string) => {
   const newPro = { email, name, date: new Date().toISOString() };
   proUsers.push(newPro);
   return newPro;
};

export const getTotalAppUsersCount = () => {
   // Fake dynamic count for demo purposes until real DB is active
   return 1428 + proUsers.length + donations.length;
};
