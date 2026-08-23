window.STORE_CONFIG={
  SUPABASE_URL:"https://eyhrzdmdnpuimzfqyith.supabase.co",
  SUPABASE_PUBLISHABLE_KEY:"sb_publishable_-mrlZiyICBjYjGWcdzx9-g_b07T45oS"
};

// The live bookstore uses the existing payment-proofs bucket for receipt uploads.
// Keep the rest of Storage unchanged; only map the receipt bucket name used by the UI.
const __storeCreateClient=window.supabase.createClient.bind(window.supabase);
window.supabase.createClient=(...args)=>{
  const c=__storeCreateClient(...args);
  const originalFrom=c.storage.from.bind(c.storage);
  c.storage.from=(bucket)=>originalFrom(bucket==='payment-receipts'?'payment-proofs':bucket);
  return c;
};
