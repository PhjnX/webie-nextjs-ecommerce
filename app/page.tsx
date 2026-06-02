import { getVCardProducts } from "../services/product";
import HomeContent from "./components/home";

export default async function HomePage() {
  const products = await getVCardProducts();

  return <HomeContent products={products} />;
}
