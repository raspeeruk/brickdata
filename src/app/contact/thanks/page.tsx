import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Message Sent",
};

export default function ThanksPage() {
  return (
    <div className="grid-pattern min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-black text-bd-text mb-2">
          Message Sent
        </h1>
        <p className="text-bd-text-secondary mb-6">
          Thanks for getting in touch. We&apos;ll reply shortly.
        </p>
        <Link
          href="/"
          className="bg-bd-orange text-white px-6 py-2.5 font-body font-medium hover:bg-bd-orange-light transition-colors inline-block"
        >
          Back to BrickData
        </Link>
      </div>
    </div>
  );
}
