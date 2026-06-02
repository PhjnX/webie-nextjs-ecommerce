// components/home/Workflow.tsx
export default function Workflow() {
  const steps = [
    {
      num: "01",
      title: "Lựa chọn mẫu",
      desc: "Lọc và trải nghiệm trực tiếp các giao diện demo sẵn có trên hệ thống để chọn ra bộ khung phù hợp nhất.",
    },
    {
      num: "02",
      title: "Cung cấp thông tin",
      desc: "Gửi thông tin cá nhân hóa (Logo, liên kết MXH, thông tin liên hệ, màu sắc mong muốn) cho chúng tôi.",
    },
    {
      num: "03",
      title: "Bàn giao & Vận hành",
      desc: "Webie thực hiện cấu hình lên Server, tối ưu SEO, xuất mã QR cao cấp và bàn giao hệ thống trong vòng 24 giờ.",
    },
  ];

  return (
    <section className="bg-white py-16 md:py-24 border-b border-stone-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-stone-400 text-[10px] tracking-[0.2em] uppercase block mb-3">
            Quy trình tinh gọn
          </span>
          <h2 className="font-serif text-2xl md:text-3xl font-light text-stone-900">
            Sở hữu vCard dễ dàng
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, idx) => (
            <div key={idx} className="relative">
              <span className="font-serif italic text-4xl text-stone-200 block mb-4">
                {step.num}
              </span>
              <h3 className="font-serif text-base font-medium text-stone-900 mb-2">
                {step.title}
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed font-light">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
