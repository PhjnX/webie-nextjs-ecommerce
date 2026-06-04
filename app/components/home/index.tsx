// components/home/index.tsx
import Hero from "./Hero";
import OurServices from "./OurServices";
import AboutUs from "./AboutUs";
import Workflow from "./Workflow";
import ContactSection from "@/app/components/contact/ContactSection";

export default function HomeContent() {
  return (
    <div className="min-h-screen bg-white">
      {/* 1. Banner chính */}
      <Hero />
      {/*/!* 2. Giá trị cốt lõi *!/*/}
      {/*<ValueProp />*/}

      {/* 3. Danh mục sản phẩm */}
      <OurServices />
      <AboutUs />

      {/*/!* 4. Bộ sưu tập vCard thực tế *!/*/}
      {/*<PremiumCollection products={products} />*/}

      {/* 5. Quy trình làm việc */}
      <Workflow />
      <ContactSection />
    </div>
  );
}
