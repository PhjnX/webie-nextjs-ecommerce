// components/home/Workflow.tsx
import {
  FilePenLine,
  QrCode,
  Rocket,
  type LucideIcon,
} from "lucide-react";

interface WorkflowStep {
  num: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  iconClassName: string;
}

const steps: WorkflowStep[] = [
  {
    num: "01",
    title: "Choose a template",
    desc: "Browse our curated library of professional layouts designed for various industries. From minimalist portfolios to bold corporate profiles, find the style that resonates with your brand.",
    icon: QrCode,
    iconClassName: "bg-black text-white",
  },
  {
    num: "02",
    title: "Provide details",
    desc: "Fill in your professional narrative. Input contact information, social links, and biographical highlights. Our intuitive editor guides you through every step to ensure no detail is missed.",
    icon: FilePenLine,
    iconClassName: "bg-[#56647d] text-white",
  },
  {
    num: "03",
    title: "Delivery & Launch",
    desc: "Our experts review your configuration for optimal performance. Final delivery is completed within 24 hours, giving you a live, high-performance vCard ready to share with the world.",
    icon: Rocket,
    iconClassName: "bg-black text-white",
  },
];

export default function Workflow() {
  return (
      <section className="overflow-hidden bg-[#f8f8fd] py-8 md:py-12 lg:py-14">
        <div className="mx-auto max-w-[1130px] px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#53617d]">
            Streamlined process
          </p>

          <h2 className="mt-6 text-4xl font-bold leading-tight text-black md:text-5xl">
            Get your digital product easily
          </h2>

          <p className="mx-auto mt-7 max-w-[1060px] text-xl font-light leading-relaxed text-[#273142] md:text-2xl">
            Follow our professional workflow to launch your digital identity in
            minutes. We&apos;ve simplified the process to ensure every detail of
            your brand is captured perfectly.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-[1280px] grid-cols-1 gap-8 px-4 md:grid-cols-3 md:gap-8 lg:px-6">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
                <article
                    key={step.num}
                    className="relative min-h-[360px] overflow-hidden rounded-xl border border-[#c9ccd6] bg-white p-8 shadow-sm md:p-10"
                >
                  {/* Step number */}
                  <div className="absolute right-8 top-6 text-[72px] font-bold leading-none text-[#eef1f7] md:text-[88px]">
                    {step.num}
                  </div>

                  {/* Icon */}
                  <div
                      className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-md ${step.iconClassName}`}
                  >
                    <Icon size={30} strokeWidth={2.4} aria-hidden="true" />
                  </div>

                  <div className="relative z-10 mt-10">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#53617d]">
                      Step {step.num}
                    </p>

                    <h3 className="text-2xl font-bold leading-tight text-black md:text-[22px]">
                      {step.title}
                    </h3>

                    <p className="mt-5 text-base font-light leading-relaxed text-[#252d3a] md:text-[17px]">
                      {step.desc}
                    </p>
                  </div>
                </article>
            );
          })}
        </div>
      </section>
  );
}