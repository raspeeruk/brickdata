import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with BrickData.",
};

export default function ContactPage() {
  return (
    <div className="grid-pattern min-h-screen">
      <div className="mx-auto max-w-[600px] px-4 py-12">
        <h1 className="font-heading text-3xl font-black text-bd-text tracking-tight mb-2">
          Contact
        </h1>
        <p className="text-bd-text-secondary mb-8">
          Questions, feedback, or data corrections? Get in touch.
        </p>

        <form action="/api/contact" method="POST" className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-body font-medium text-bd-text mb-1"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full border border-bd-grid bg-bd-surface px-4 py-2.5 font-body text-bd-text focus:outline-none focus:border-bd-orange"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-body font-medium text-bd-text mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full border border-bd-grid bg-bd-surface px-4 py-2.5 font-body text-bd-text focus:outline-none focus:border-bd-orange"
            />
          </div>
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-body font-medium text-bd-text mb-1"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              required
              className="w-full border border-bd-grid bg-bd-surface px-4 py-2.5 font-body text-bd-text focus:outline-none focus:border-bd-orange resize-y"
            />
          </div>
          <button
            type="submit"
            className="bg-bd-orange text-white px-6 py-2.5 font-body font-medium hover:bg-bd-orange-light transition-colors"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
